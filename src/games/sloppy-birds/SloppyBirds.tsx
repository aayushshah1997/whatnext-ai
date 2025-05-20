import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Image,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  Animated,
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { saveGameScore, getUserHighScore, getOrCreateUser, getFriendsLeaderboard } from '../../lib/supabase/supabaseClient';
import { Easing } from 'react-native-reanimated';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gameContent: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bird: {
    position: 'absolute',
    width: 70,
    height: 70,
    left: Dimensions.get('window').width / 3 - 70 / 2,
  },
  birdImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  obstacleContainer: {
    position: 'absolute',
    overflow: 'visible',
    backgroundColor: 'transparent',
  },
  obstacleImage: {
    position: 'absolute',
    resizeMode: 'contain',
  },
  iceStackImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain', // Changed from 'stretch' to 'contain'
  },
  // Loading screen styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#FFD700', // Golden yellow
    fontSize: 24,
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  loadingSpinner: {
    marginTop: 20,
  },
  // UI layer styles
  uiLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'box-none',
  },
  // Header styles
  header: {
    position: 'absolute',
    top: Math.max(Platform.OS === 'ios' ? 50 : 20, 250 / 4),
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 100,
  },
  backButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Score display
  scoreText: {
    position: 'absolute',
    top: 250 / 2 - 35, // Position above the top boundary
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 70,
    color: '#FFD700', // Golden yellow
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  // Start screen styles
  startScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  gameTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700', // Golden yellow
    marginBottom: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  chooseVibeText: {
    fontSize: 24,
    color: '#FFD700', // Golden yellow
    marginBottom: 30,
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  birdSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    width: '100%',
  },
  arrowButton: {
    padding: 10,
  },
  birdPreviewContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  birdPreviewImage: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  birdName: {
    fontSize: 18,
    color: '#FFD700', // Golden yellow
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  startButton: {
    backgroundColor: '#3498db',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginBottom: 40,
  },
  startButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700', // Golden yellow
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  leaderboardContainer: {
    flexDirection: 'row',
    width: '80%',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leaderboardColumn: {
    flex: 1,
    alignItems: 'center',
  },
  leaderboardDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 20,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700', // Golden yellow
    marginBottom: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
    textAlign: 'center',
  },
  highScoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700', // Golden yellow
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  leaderboardEntries: {
    alignItems: 'center',
  },
  leaderboardEntry: {
    fontSize: 18,
    color: '#FFD700', // Golden yellow
    marginVertical: 2,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  currentUserEntry: {
    color: '#00FFFF', // Cyan color to highlight current user
    fontWeight: 'bold',
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  leaderboardModal: {
    width: '80%',
    maxHeight: '80%',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  leaderboardModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  leaderboardModalContent: {
    maxHeight: '70%',
  },
  leaderboardModalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  leaderboardRank: {
    width: 30,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  leaderboardModalName: {
    flex: 1,
    fontSize: 18,
    color: '#FFD700',
    paddingHorizontal: 10,
  },
  leaderboardModalScore: {
    width: 60,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'right',
  },
  leaderboardModalEmptyText: {
    fontSize: 18,
    color: '#FFD700',
    textAlign: 'center',
    padding: 20,
  },
  leaderboardModalCloseButton: {
    backgroundColor: '#3498db',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    marginTop: 20,
    alignSelf: 'center',
  },
  leaderboardModalCloseText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
  },
  // Game over styles
  messageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  gameOverText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700', // Golden yellow
    textShadowColor: '#000',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  finalScoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700', // Golden yellow
    marginTop: 10,
    textShadowColor: '#000',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  restartButton: {
    marginTop: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  restartButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700', // Golden yellow
    textAlign: 'center',
    textShadowColor: '#000',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 0,
  },
  startText: {
    position: 'absolute',
    top: Dimensions.get('window').height / 2 - 50,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700', // Golden yellow
    textShadowColor: '#000',
    textShadowOffset: { width: 4, height: 4 },
    textShadowRadius: 0,
  },
  newRecordBanner: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 12,
    elevation: 5,
    zIndex: 1000,
  },
  newRecordText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  homeNewHighScoreBanner: {
    backgroundColor: '#FFD700',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  homeNewHighScoreText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
});

// Get screen dimensions
const { width, height } = Dimensions.get('window');

// Game constants
const BIRD_WIDTH = 70;
const BIRD_HEIGHT = 70;
const PIPE_WIDTH = 120; // Pipe width increased by 20%
const POWERUP_SIZE = 60; // Size of the powerup
const MIN_PIPE_GAP = 180; // Minimum gap between pipes
const MAX_PIPE_GAP = 250; // Maximum gap between pipes
const GRAVITY = 0.8;
const JUMP_FORCE = -12;
const PIPE_SPEED = 3;
const PIPE_INTERVAL = 1800; // Time in ms between pipe spawns

// Vertical boundary constants
const TOP_BOUNDARY = 250; // Top white line position
const BOTTOM_BOUNDARY = 800; // Bottom white line position

// Ice stack height constants (approximate pixel heights)
const ICE_STACK_HEIGHTS = [120, 150, 180, 210, 240]; // Heights for 1-5 stacks

// Bottle and glass approximate heights
const BOTTLE_HEIGHT = 150; // Approximate height of bottle
const GLASS_HEIGHT = 150;  // Approximate height of glass

// Fixed connection point to ensure bottles/glasses touch ice cubes perfectly
const CONNECTION_OFFSET = -30; // Significantly increased overlap to eliminate all gaps

// Overlap percentages for each stack size (index corresponds to stack size - 1)
// Subtle 5-10% overlap for a natural sitting effect
const TOP_OVERLAP_PERCENTAGES = [0.95, 0.94, 0.93, 0.92, 0.91]; // For bottles (top obstacles) - 5-9% overlap
const BOTTOM_OVERLAP_PERCENTAGES = [0.95, 0.94, 0.93, 0.92, 0.91]; // For glasses (bottom obstacles) - 5-9% overlap

// Fixed size factor - no random scaling
const SIZE_FACTOR = 1.0;

// Obstacle size variation constants
const MIN_SIZE_FACTOR = 0.8;  // Minimum size multiplier (smaller for more variety)
const MAX_SIZE_FACTOR = 1.4;  // Maximum size multiplier (larger for more variety)

// Collision adjustment constants
const BOTTLE_COLLISION_WIDTH_FACTOR = 0.6; // Bottles are narrower than their container
const BOTTLE_COLLISION_HEIGHT_FACTOR = 0.6; // Only use 60% of the bottle height for collision
const GLASS_COLLISION_WIDTH_FACTOR = 0.7; // Glasses are narrower than their container
const GLASS_COLLISION_HEIGHT_FACTOR = 0.7; // Only use 70% of the glass height for collision

// Define powerup type
type PowerUp = {
  id: number;
  x: number;
  y: number;
  type: string;
  collected: boolean;
  floatOffset: number;
  floatDirection: number;
  floatSpeed: number;
};

// Define pipe type
interface Pipe {
  id: number;
  x: number;
  topHeight: number;
  passed: boolean;
  bottleIndex: number;
  glassIndex: number;
  bottleSizeFactor: number;
  glassSizeFactor: number;
  gapSize: number;
  topStackIndex: number;    // Index for top ice stack (1-5)
  bottomStackIndex: number; // Index for bottom ice stack (1-5)
}

// Memoized bottle images
const bottleImages = [
  require('../../../sloppy_birds assets/obstacles/bottles/champagnebottle.png'),
  require('../../../sloppy_birds assets/obstacles/bottles/ginbottle.png'),
  require('../../../sloppy_birds assets/obstacles/bottles/whiskeybottle.png'),
  require('../../../sloppy_birds assets/obstacles/bottles/winebottle.png'),
];

// Memoized glass images
const glassImages = [
  require('../../../sloppy_birds assets/obstacles/glasses/beermug.png'),
  require('../../../sloppy_birds assets/obstacles/glasses/cocktailglass.png'),
  require('../../../sloppy_birds assets/obstacles/glasses/guinessglass.png'),
  require('../../../sloppy_birds assets/obstacles/glasses/margaritaglass.png'),
  require('../../../sloppy_birds assets/obstacles/glasses/shotglasses.png'),
  require('../../../sloppy_birds assets/obstacles/glasses/wineglass.png'),
];

// Ice cube stack images
const topIceStackImages = [
  require('../../../sloppy_birds assets/ice-cubes/top/1-stack-top.png'),
  require('../../../sloppy_birds assets/ice-cubes/top/2-stack-top.png'),
  require('../../../sloppy_birds assets/ice-cubes/top/3-stack-top.png'),
  require('../../../sloppy_birds assets/ice-cubes/top/4-stack-top.png'),
  require('../../../sloppy_birds assets/ice-cubes/top/5-stack-top.png'),
];

const bottomIceStackImages = [
  require('../../../sloppy_birds assets/ice-cubes/bottom/1-stack-bottom.png'),
  require('../../../sloppy_birds assets/ice-cubes/bottom/2-stack-bottom.png'),
  require('../../../sloppy_birds assets/ice-cubes/bottom/3-stack-bottom.png'),
  require('../../../sloppy_birds assets/ice-cubes/bottom/4-stack-bottom.png'),
  require('../../../sloppy_birds assets/ice-cubes/bottom/5-stack-bottom.png'),
];

// Powerup images
const powerUpImages: Record<string, any> = {
  'Finance bird': require('../../../sloppy_birds assets/power-ups/powder-up.png'),
  'Rasta bird': require('../../../sloppy_birds assets/power-ups/weed-up.png'),
  'Artsy bird': require('../../../sloppy_birds assets/power-ups/shroom-up.png'),
};

// Bird types
interface BirdType {
  image: any;
  name: string;
}

// Available birds with their normal and powered-up states
const birds: BirdType[] = [
  {
    image: require('../../../sloppy_birds assets/birds/financebird.png'),
    name: 'Finance bird'
  },
  {
    image: require('../../../sloppy_birds assets/birds/rastabird.png'),
    name: 'Rasta bird'
  },
  {
    image: require('../../../sloppy_birds assets/birds/artsybird.png'),
    name: 'Artsy bird'
  }
];

// Powered-up bird images
const poweredUpBirdImages: Record<string, any> = {
  'Finance bird': require('../../../sloppy_birds assets/birds/financebirdcoked.png'),
  'Rasta bird': require('../../../sloppy_birds assets/birds/rastabirdhigh.png'),
  'Artsy bird': require('../../../sloppy_birds assets/birds/artsybirdtripping.png'),
};

const SloppyBirds = () => {
  const router = useRouter();
  
  // Loading state
  const [assetsLoaded, setAssetsLoaded] = useState(false);
  const [isLoadingHighScore, setIsLoadingHighScore] = useState(true);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [friendsLeaderboard, setFriendsLeaderboard] = useState<any[]>([]);
  const [showFullLeaderboard, setShowFullLeaderboard] = useState(false);
  
  // Game state
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [highScore, setHighScore] = useState(0);
  const [userId, setUserId] = useState('');
  const [isNewHighScore, setIsNewHighScore] = useState(false);
  // Track if we should show the new high score message on the home screen
  const [showNewHighScoreOnHome, setShowNewHighScoreOnHome] = useState(false);
  
  // Countdown state
  const [countdown, setCountdown] = useState(0);
  const [isCountingDown, setIsCountingDown] = useState(false);
  
  // Start text animation state
  const [showStartText, setShowStartText] = useState(false);
  const startTextOpacity = useRef(new Animated.Value(0)).current;
  
  // Bird selection state
  const [selectedBirdIndex, setSelectedBirdIndex] = useState(0);
  
  // Refs to track game state
  const gameStateRef = useRef({ gameStarted: false, gameOver: false, score: 0, highScore: 0 });
  
  // Bird state
  const birdPositionRef = useRef(new Animated.Value(height / 2 - BIRD_HEIGHT / 2));
  const birdRotation = useRef(new Animated.Value(0)).current;
  const birdVelocityRef = useRef(0);
  const [isPoweredUp, setIsPoweredUp] = useState(false);
  const powerUpTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Pipes state
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const pipesRef = useRef<Pipe[]>([]);
  const pipesPassedRef = useRef(new Set<number>());
  
  // Powerups state
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const powerUpsRef = useRef<PowerUp[]>([]);
  const powerUpTimerId = useRef<NodeJS.Timeout | null>(null);
  const lastPowerUpTime = useRef(0);
  
  // Track last used image indexes to avoid repetition
  const lastBottleIndexRef = useRef(-1);
  const lastGlassIndexRef = useRef(-1);
  
  // Animation refs
  const animationFrameId = useRef<number | null>(null);
  const pipeTimerId = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTime = useRef(Date.now());
  
  // Keep refs in sync with state
  useEffect(() => {
    gameStateRef.current.gameStarted = gameStarted;
    gameStateRef.current.gameOver = gameOver;
    gameStateRef.current.score = score;
    gameStateRef.current.highScore = highScore;
  }, [gameStarted, gameOver, score, highScore]);
  
  // Fetch user and high score
  const fetchUserAndHighScore = async () => {
    try {
      setIsLoadingHighScore(true);
      // Get or create user - using the improved function that ensures one user per device
      const user = await getOrCreateUser();
      if (user && user.id) {
        setUserId(user.id);
        // Fetch high score
        const userHighScore = await getUserHighScore(user.id);
        console.log('Fetched high score on init:', userHighScore);
        setHighScore(userHighScore);
        // Also update the game state ref
        gameStateRef.current.highScore = userHighScore;
      }
    } catch (error) {
      console.error('Error fetching user or high score:', error);
    } finally {
      setIsLoadingHighScore(false);
    }
  };
  
  // Fetch friends leaderboard
  const fetchFriendsLeaderboard = async () => {
    try {
      setIsLoadingLeaderboard(true);
      const leaderboardData = await getFriendsLeaderboard('Sloppy Birds', 10);
      console.log('Fetched friends leaderboard:', leaderboardData);
      setFriendsLeaderboard(leaderboardData || []);
    } catch (error) {
      console.error('Error fetching friends leaderboard:', error);
      setFriendsLeaderboard([]);
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  // Load assets when component mounts
  useEffect(() => {
    loadAssets();
    fetchUserAndHighScore();
    fetchFriendsLeaderboard();
  }, []);
  
  // Get a random bottle index (avoiding consecutive repeats)
  const getRandomBottleIndex = (): number => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * 4); // 4 bottle images
    } while (newIndex === lastBottleIndexRef.current);
    
    lastBottleIndexRef.current = newIndex;
    return newIndex;
  };
  
  // Get a random glass index (avoiding consecutive repeats)
  const getRandomGlassIndex = (): number => {
    let newIndex;
    do {
      newIndex = Math.floor(Math.random() * 6); // 6 glass images
    } while (newIndex === lastGlassIndexRef.current);
    
    lastGlassIndexRef.current = newIndex;
    return newIndex;
  };
  
  // Initialize game
  const startGame = () => {
    // Clear the new high score message when starting a new game
    setShowNewHighScoreOnHome(false);
    
    // Start countdown
    setIsCountingDown(true);
    setCountdown(3);
    
    // Start countdown timer
    let count = 3;
    const countdownTimer = setInterval(() => {
      count--;
      setCountdown(count);
      
      if (count === 0) {
        // Clear countdown timer
        clearInterval(countdownTimer);
        
        // Short delay before starting game
        setTimeout(() => {
          // Show and animate "Start" text
          setShowStartText(true);
          startTextOpacity.setValue(1);
          
          // Animate the opacity to create flashing/fading effect
          Animated.sequence([
            Animated.timing(startTextOpacity, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(startTextOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(startTextOpacity, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(startTextOpacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(startTextOpacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start(() => {
            // Hide start text when animation completes
            setShowStartText(false);
          });
          
          // Reset game state
          setGameStarted(true);
          setIsCountingDown(false);
          setGameOver(false);
          setScore(0);
          gameStateRef.current = { gameStarted: true, gameOver: false, score: 0, highScore };
          
          console.log('Starting game...');
          
          // Reset bird position and velocity
          birdPositionRef.current.setValue(height / 2 - BIRD_HEIGHT / 2);
          birdVelocityRef.current = 0;
          
          // Reset pipes
          setPipes([]);
          pipesRef.current = [];
          
          // Reset powerups
          setPowerUps([]);
          powerUpsRef.current = [];
          lastPowerUpTime.current = Date.now();
          
          // Start game loop
          lastUpdateTime.current = Date.now();
          animationFrameId.current = requestAnimationFrame(gameLoop);
          
          // Start pipe generator
          pipeTimerId.current = setInterval(addPipe, PIPE_INTERVAL);
          
          // Start powerup generator
          powerUpTimerId.current = setInterval(addPowerUp, 5000); // Add a powerup every 5 seconds
        }, 1000); // 1 second delay after countdown reaches 0
      }
    }, 1000);
  };
  
  // Main game loop
  const gameLoop = () => {
    // Check if game is over using ref to avoid closure issues
    if (gameStateRef.current.gameOver) {
      return;
    }
    
    updateGame();
    
    // Continue the loop
    animationFrameId.current = requestAnimationFrame(gameLoop);
  };
  
  // Generate a new pipe
  const addPipe = () => {
    // Ensure we don't add pipes if the game is over
    if (gameStateRef.current.gameOver) return;
    
    // Generate a random gap size between min and max
    const gapSize = MIN_PIPE_GAP + Math.random() * (MAX_PIPE_GAP - MIN_PIPE_GAP);
    
    // Calculate playable height (excluding top boundary)
    const playableHeight = BOTTOM_BOUNDARY - TOP_BOUNDARY;
    
    // Generate random stack sizes
    const topStackIndex = Math.floor(Math.random() * 5); // 0-4 (1-5 ice cubes)
    const bottomStackIndex = Math.floor(Math.random() * 5); // 0-4 (1-5 ice cubes)
    
    // Calculate the top pipe height
    const topHeight = TOP_BOUNDARY + Math.min(
      (playableHeight - gapSize) / 2,
      ICE_STACK_HEIGHTS[topStackIndex] + BOTTLE_HEIGHT
    );
    
    // Random bottle and glass indices
    let bottleIndex = Math.floor(Math.random() * bottleImages.length);
    let glassIndex = Math.floor(Math.random() * glassImages.length);
    
    // Avoid repeating the same bottle type consecutively
    if (pipesRef.current.length > 0) {
      const lastPipe = pipesRef.current[pipesRef.current.length - 1];
      
      // Ensure we don't get the same obstacle twice in a row
      while (bottleIndex === lastPipe.bottleIndex) {
        bottleIndex = Math.floor(Math.random() * bottleImages.length);
      }
      while (glassIndex === lastPipe.glassIndex) {
        glassIndex = Math.floor(Math.random() * glassImages.length);
      }
    }
    
    const newPipe: Pipe = {
      id: Date.now(),
      x: width,
      topHeight,
      gapSize,
      topStackIndex,
      bottomStackIndex,
      bottleIndex,
      glassIndex,
      passed: false,
      bottleSizeFactor: SIZE_FACTOR,
      glassSizeFactor: SIZE_FACTOR,
    };
    
    // Add the new pipe to the pipes array
    setPipes(currentPipes => [...currentPipes, newPipe]);
    pipesRef.current = [...pipesRef.current, newPipe];
  };
  
  // Load all game assets
  const loadAssets = async () => {
    try {
      // Use Promise.all to load all assets in parallel
      await Promise.all([
        // Preload all bird images
        ...birds.map(bird => Asset.loadAsync(bird.image)),
        // Preload all powered-up bird images
        ...Object.values(poweredUpBirdImages).map(image => Asset.loadAsync(image)),
        // Preload all bottle images
        ...bottleImages.map(image => Asset.loadAsync(image)),
        // Preload all glass images
        ...glassImages.map(image => Asset.loadAsync(image)),
        // Preload all ice stack images
        ...topIceStackImages.map(image => Asset.loadAsync(image)),
        ...bottomIceStackImages.map(image => Asset.loadAsync(image)),
        // Preload all powerup images
        ...Object.values(powerUpImages).map(image => Asset.loadAsync(image)),
        // Preload background image
        Asset.loadAsync(require('../../../assets/images/nyc-bg.png')),
      ]);
      
      console.log('All game assets loaded successfully');
      setAssetsLoaded(true);
    } catch (error) {
      console.error('Failed to load assets:', error);
      // Fallback to loaded even if there's an error
      setAssetsLoaded(true);
    }
  };
  
  // Calculate collision based on fixed size
  const calculateCollision = (size: number, factor: number) => size * factor;
  
  // Check for collision with obstacles
  const checkCollision = () => {
    if (gameStateRef.current.gameOver) return false;
    
    // Bird dimensions (smaller collision box for better gameplay)
    const birdSize = 25; 
    const birdLeft = width / 3 + 5; 
    const birdRight = birdLeft + birdSize;
    const birdTop = (birdPositionRef.current as any)._value + 5; 
    const birdBottom = birdTop + birdSize;
    
    // Check if bird hits the bottom of the screen only (not the top)
    if (birdBottom >= height) {
      return true;
    }
    
    // Check collision with pipes (bottles and glasses)
    for (const pipe of pipesRef.current) {
      const pipeX = pipe.x;
      const pipeRight = pipeX + PIPE_WIDTH;
      
      // Only check pipes that are in the vicinity of the bird
      if (pipeRight < birdLeft || pipeX > birdRight) {
        continue;
      }
      
      // Get the actual dimensions of the bottle and glass for this pipe
      // Using narrower collision boxes (60% of pipe width) for more forgiving gameplay
      const bottleWidth = PIPE_WIDTH * 0.6; 
      const glassWidth = PIPE_WIDTH * 0.6; 
      
      // Calculate the positions of the bottle and glass for collision
      const bottleX = pipeX + (PIPE_WIDTH - bottleWidth) / 2;
      
      // For top obstacle: calculate both ice cube and bottle collision
      const topIceHeight = ICE_STACK_HEIGHTS[pipe.topStackIndex];
      const bottleY = 50 + Math.max(0, topIceHeight - 80); // Account for top position at 50
      const bottleHeight = BOTTLE_HEIGHT * 0.8;
      
      // For bottom obstacle: calculate both ice cube and glass collision
      const bottomIceHeight = ICE_STACK_HEIGHTS[pipe.bottomStackIndex];
      const bottomObstacleTop = pipe.topHeight + pipe.gapSize;
      const glassY = bottomObstacleTop + Math.max(0, bottomIceHeight - 80);
      const glassHeight = GLASS_HEIGHT * 0.8;
      
      // Check for collision with top ice cubes - using smaller collision area
      if (
        birdRight > pipeX + 10 &&
        birdLeft < pipeX + PIPE_WIDTH - 10 &&
        birdTop < 50 + topIceHeight - 5 && 
        birdTop > 50 + 5
      ) {
        return true;
      }
      
      // Check for collision with bottle - using smaller collision area
      if (
        birdRight > bottleX + 5 &&
        birdLeft < bottleX + bottleWidth - 5 &&
        birdTop < bottleY + bottleHeight - 5 &&
        birdBottom > bottleY + 5
      ) {
        return true;
      }
      
      // Check for collision with bottom ice cubes - using smaller collision area
      if (
        birdRight > pipeX + 10 &&
        birdLeft < pipeX + PIPE_WIDTH - 10 &&
        birdBottom > bottomObstacleTop + 5 &&
        birdBottom < bottomObstacleTop + bottomIceHeight - 5
      ) {
        return true;
      }
      
      // Check for collision with glass - using smaller collision area
      if (
        birdRight > bottleX + 5 &&
        birdLeft < bottleX + glassWidth - 5 &&
        birdBottom > glassY + 5 &&
        birdTop < glassY + glassHeight - 5
      ) {
        return true;
      }
    }
    
    return false;
  };
  
  // Generate a new powerup
  const addPowerUp = () => {
    // Ensure we don't add powerups if the game is over
    if (gameStateRef.current.gameOver) return;
    
    // Get the current bird type
    const currentBirdType = birds[selectedBirdIndex].name;
    
    // Calculate a random position for the powerup
    // Keep it within the playable area
    const powerUpX = width + 50; // Start off screen to the right
    const powerUpY = TOP_BOUNDARY + Math.random() * (BOTTOM_BOUNDARY - TOP_BOUNDARY - POWERUP_SIZE);
    
    // Create a new powerup
    const newPowerUp: PowerUp = {
      id: Date.now(),
      x: powerUpX,
      y: powerUpY,
      type: currentBirdType,
      collected: false,
      floatOffset: 0,
      floatDirection: Math.random() > 0.5 ? 1 : -1, // Random up/down direction
      floatSpeed: 0.5 + Math.random() * 1.5, // Random float speed
    };
    
    // Add the new powerup to the powerups array
    setPowerUps(currentPowerUps => [...currentPowerUps, newPowerUp]);
    powerUpsRef.current = [...powerUpsRef.current, newPowerUp];
    
    // Update the last powerup time
    lastPowerUpTime.current = Date.now();
  };

  // Check for collision with powerups
  const checkPowerUpCollision = (powerUp: PowerUp) => {
    if (powerUp.collected) return false;
    
    // Bird dimensions (use same collision box as obstacle collision)
    const birdSize = 25;
    const birdLeft = width / 3 + 5;
    const birdRight = birdLeft + birdSize;
    const birdTop = (birdPositionRef.current as any)._value + 5;
    const birdBottom = birdTop + birdSize;
    
    // Powerup collision box (slightly smaller than visual size)
    const powerUpLeft = powerUp.x + 10;
    const powerUpRight = powerUp.x + POWERUP_SIZE - 10;
    const powerUpTop = powerUp.y + 10;
    const powerUpBottom = powerUp.y + POWERUP_SIZE - 10;
    
    // Check for collision
    if (
      birdRight > powerUpLeft &&
      birdLeft < powerUpRight &&
      birdBottom > powerUpTop &&
      birdTop < powerUpBottom
    ) {
      return true;
    }
    
    return false;
  };

  // Update game state
  const updateGame = () => {
    const now = Date.now();
    const deltaTime = (now - lastUpdateTime.current) / 16.67; // Normalize to ~60fps
    lastUpdateTime.current = now;
    
    // Update bird velocity and position
    birdVelocityRef.current += GRAVITY * deltaTime;
    
    // Get current position
    const currentBirdY = (birdPositionRef.current as any)._value;
    const newBirdY = currentBirdY + birdVelocityRef.current * deltaTime;
    
    // Check bottom of screen collision
    if (newBirdY >= height - BIRD_HEIGHT) {
      birdPositionRef.current.setValue(height - BIRD_HEIGHT);
      endGame();
      return;
    }
    
    // Update bird position
    birdPositionRef.current.setValue(newBirdY);
    
    // Update bird rotation based on velocity
    const targetRotation = Math.min(90, Math.max(-30, birdVelocityRef.current * 3));
    birdRotation.setValue(targetRotation);
    
    // Bird's horizontal position (fixed)
    const birdX = width / 3 - BIRD_WIDTH / 2;
    const birdY = newBirdY;
    
    // Update powerups
    const updatedPowerUps = powerUpsRef.current
      .map(powerUp => {
        // Skip already collected powerups
        if (powerUp.collected) return powerUp;
        
        // Move powerup to the left
        const updatedPowerUp = {
          ...powerUp,
          x: powerUp.x - PIPE_SPEED * deltaTime,
          // Add floating motion
          floatOffset: powerUp.floatOffset + (powerUp.floatDirection * powerUp.floatSpeed * deltaTime),
          y: powerUp.y + (powerUp.floatDirection * powerUp.floatSpeed * Math.sin(now / 500) * deltaTime),
        };
        
        // Reverse direction if it's gone too far up or down
        if (Math.abs(updatedPowerUp.floatOffset) > 30) {
          updatedPowerUp.floatDirection *= -1;
        }
        
        // Check for collision with bird
        if (checkPowerUpCollision(updatedPowerUp)) {
          console.log('Powerup collected!');
          updatedPowerUp.collected = true;
          
          // Add 3 points for collecting a powerup
          setScore(prevScore => {
            const newScore = prevScore + 3;
            scoreRef.current = newScore;
            if (newScore > highScore) {
              setHighScore(newScore);
            }
            return newScore;
          });
          
          // Set bird to powered-up state
          setIsPoweredUp(true);
          
          // Clear any existing powerup timer
          if (powerUpTimerRef.current) {
            clearTimeout(powerUpTimerRef.current);
          }
          
          // Set a timer to revert back to normal after 5 seconds
          powerUpTimerRef.current = setTimeout(() => {
            setIsPoweredUp(false);
            powerUpTimerRef.current = null;
          }, 5000);
        }
        
        return updatedPowerUp;
      })
      .filter(powerUp => powerUp.x > -POWERUP_SIZE || powerUp.collected); // Keep collected powerups for animation
    
    powerUpsRef.current = updatedPowerUps;
    setPowerUps(updatedPowerUps);
    
    // Update pipes and check collisions
    const updatedPipes = pipesRef.current
      .map(pipe => {
        // Move pipe to the left
        const updatedPipe = {
          ...pipe,
          x: pipe.x - PIPE_SPEED * deltaTime
        };
        
        // Check for collision if game is still active
        if (!gameStateRef.current.gameOver) {
          // Check collision using AABB method
          if (checkCollision()) {
            console.log('Collision detected!');
            endGame();
          }
        }
        
        // Check if bird has passed this pipe
        if (
          !updatedPipe.passed && 
          updatedPipe.x + PIPE_WIDTH < birdX && 
          !pipesPassedRef.current.has(updatedPipe.id)
        ) {
          console.log('Pipe passed!');
          pipesPassedRef.current.add(updatedPipe.id);
          updatedPipe.passed = true;
          setScore(prevScore => {
            const newScore = prevScore + 1;
            scoreRef.current = newScore;
            if (newScore > highScore) {
              setHighScore(newScore);
            }
            return newScore;
          });
        }
        
        return updatedPipe;
      })
      .filter(pipe => pipe.x > -PIPE_WIDTH); // Remove pipes that are off screen
    
    pipesRef.current = updatedPipes;
    setPipes(updatedPipes);
  };
  
  // Handle jump
  const handleTap = () => {
    // Only handle tap if game is started and not over
    if (gameStarted && !gameOver) {
      // Jump
      console.log('Jump!');
      birdVelocityRef.current = JUMP_FORCE;
    }
  };
  
  // Reset to start screen
  const resetToStartScreen = async () => {
    console.log('Resetting to start screen...');
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    scoreRef.current = 0;
    
    // If this was a new high score, show it on the home screen
    if (isNewHighScore) {
      setShowNewHighScoreOnHome(true);
    }
    setIsNewHighScore(false);
    
    // Reset bird position and velocity
    birdPositionRef.current.setValue(height / 2 - BIRD_HEIGHT / 2);
    birdVelocityRef.current = 0;
    birdRotation.setValue(0);
    setIsPoweredUp(false);
    
    // Clear any powerup timer
    if (powerUpTimerRef.current) {
      clearTimeout(powerUpTimerRef.current);
      powerUpTimerRef.current = null;
    }
    
    // Reset pipes
    setPipes([]);
    pipesRef.current = [];
    pipesPassedRef.current = new Set();
    
    // Reset powerups
    setPowerUps([]);
    powerUpsRef.current = [];
    
    // Clear any running animations/timers
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    if (pipeTimerId.current) {
      clearInterval(pipeTimerId.current);
      pipeTimerId.current = null;
    }
    
    if (powerUpTimerId.current) {
      clearInterval(powerUpTimerId.current);
      powerUpTimerId.current = null;
    }
    
    // Refresh high score from Supabase to ensure we have the latest
    if (userId) {
      try {
        const latestHighScore = await getUserHighScore(userId);
        console.log('Latest high score from Supabase:', latestHighScore);
        if (latestHighScore > 0) {
          setHighScore(latestHighScore);
        }
      } catch (error) {
        console.error('Error refreshing high score:', error);
      }
    }
    
    // Make sure gameStateRef is updated with current high score
    gameStateRef.current = { 
      gameStarted: false, 
      gameOver: false, 
      score: 0, 
      highScore: highScore // Preserve the high score
    };
  };
  
  // End game
  const endGame = async () => {
    const finalScore = scoreRef.current;
    console.log('Game over! Score:', finalScore);
    setGameOver(true);
    
    // Stop animations
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    // Stop pipe generator
    if (pipeTimerId.current) {
      clearInterval(pipeTimerId.current);
      pipeTimerId.current = null;
    }
    
    // Stop powerup generator
    if (powerUpTimerId.current) {
      clearInterval(powerUpTimerId.current);
      powerUpTimerId.current = null;
    }
    
    // Save score to Supabase if user exists and score is greater than 0
    if (userId && finalScore > 0) {
      try {
        console.log('Saving score to Supabase:', finalScore);
        await saveGameScore({
          user_id: userId,
          game_name: 'Sloppy Birds',
          score: finalScore,
          metadata: { bird: birds[selectedBirdIndex].name }
        });
        
        // Refresh the leaderboard to include the new score
        fetchFriendsLeaderboard();
        
        // Get the latest high score from Supabase
        const latestHighScore = await getUserHighScore(userId);
        console.log('Latest high score after save:', latestHighScore);
        
        // Update high score if current score is higher than the stored high score
        if (finalScore > latestHighScore) {
          setHighScore(finalScore);
          setIsNewHighScore(true); // trigger celebration
        } else {
          // Make sure we display the correct high score even if it wasn't just set
          setHighScore(latestHighScore);
        }
      } catch (error) {
        console.error('Error saving game score:', error);
        // Still update local high score if Supabase fails
        if (finalScore > highScore) {
          setHighScore(finalScore);
          setIsNewHighScore(true);
        }
      }
    }
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      if (pipeTimerId.current) {
        clearInterval(pipeTimerId.current);
      }
    };
  }, []);
  
  // Handle back button press
  const handleBackPress = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    
    if (pipeTimerId.current) {
      clearInterval(pipeTimerId.current);
      pipeTimerId.current = null;
    }
    
    // Navigate specifically to the tab-based games screen with the carousel
    router.push('/(tabs)/games');
  };
  
  // Bird rotation interpolation
  const birdRotateInterpolation = birdRotation.interpolate({
    inputRange: [-30, 90],
    outputRange: ['-30deg', '90deg'],
  });
  
  // Handle bird selection
  const selectPreviousBird = () => {
    setSelectedBirdIndex((prevIndex) => 
      prevIndex === 0 ? birds.length - 1 : prevIndex - 1
    );
  };
  
  const selectNextBird = () => {
    setSelectedBirdIndex((prevIndex) => 
      (prevIndex + 1) % birds.length
    );
  };
  
  // Render powerups
  const renderPowerUps = () => {
    return (
      <>
        {powerUps.map(powerUp => {
          // Skip rendering collected powerups
          if (powerUp.collected) return null;
          
          return (
            <View
              key={powerUp.id}
              style={{
                position: 'absolute',
                left: powerUp.x,
                top: powerUp.y,
                width: POWERUP_SIZE,
                height: POWERUP_SIZE,
                zIndex: 5, // Make sure powerups appear above obstacles
              }}
            >
              <Image
                source={powerUpImages[powerUp.type]}
                style={{
                  width: '100%',
                  height: '100%',
                  resizeMode: 'contain',
                }}
                fadeDuration={0}
              />
            </View>
          );
        })}
      </>
    );
  };

  // Render obstacles
  const renderObstacles = () => {
    return (
      <>
        {pipes.map(pipe => (
          <React.Fragment key={pipe.id}>
            {/* Top obstacle (ice cube with bottle below) */}
            <View
              style={[
                styles.obstacleContainer,
                {
                  top: 50, // Start at y=50 to align with back button (was 100)
                  left: pipe.x,
                  height: pipe.topHeight - 50, // Adjust height to account for new top position
                  width: PIPE_WIDTH,
                  overflow: 'visible',
                },
              ]}
            >
              {/* Render ice cubes first (in background) */}
              <Image
                source={topIceStackImages[pipe.topStackIndex]}
                style={{
                  position: 'absolute',
                  top: 0, // Position at the top of the container (which now starts at 50)
                  width: PIPE_WIDTH,
                  height: ICE_STACK_HEIGHTS[pipe.topStackIndex],
                  resizeMode: 'contain',
                }}
                fadeDuration={0}
              />
              
              {/* Then render bottle on top to create overlap effect */}
              <Image
                source={bottleImages[pipe.bottleIndex]}
                style={{
                  position: 'absolute',
                  top: Math.max(0, ICE_STACK_HEIGHTS[pipe.topStackIndex] - 80), // Keep the same overlap logic
                  width: PIPE_WIDTH,
                  height: BOTTLE_HEIGHT,
                  resizeMode: 'contain',
                  zIndex: 1, // Ensure bottle appears on top
                }}
                fadeDuration={0}
              />
            </View>
            
            {/* Bottom obstacle (ice cube with glass above) */}
            <View
              style={[
                styles.obstacleContainer,
                {
                  top: pipe.topHeight + pipe.gapSize,
                  left: pipe.x,
                  height: height - (pipe.topHeight + pipe.gapSize),
                  width: PIPE_WIDTH,
                  overflow: 'visible',
                },
              ]}
            >
              {/* Render ice cubes first (in background) */}
              <Image
                source={bottomIceStackImages[pipe.bottomStackIndex]}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: PIPE_WIDTH,
                  height: ICE_STACK_HEIGHTS[pipe.bottomStackIndex],
                  resizeMode: 'contain',
                }}
                fadeDuration={0}
              />
              
              {/* Then render glass on top to create overlap effect */}
              <Image
                source={glassImages[pipe.glassIndex]}
                style={{
                  position: 'absolute',
                  bottom: Math.max(0, ICE_STACK_HEIGHTS[pipe.bottomStackIndex] - 80), // Much more aggressive overlap
                  width: PIPE_WIDTH,
                  height: GLASS_HEIGHT,
                  resizeMode: 'contain',
                  zIndex: 1, // Ensure glass appears on top
                }}
                fadeDuration={0}
              />
            </View>
          </React.Fragment>
        ))}
      </>
    );
  };
  
  // Show loading screen if assets aren't loaded yet
  if (!assetsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
        <ActivityIndicator size="large" color="#FFD700" style={styles.loadingSpinner} />
      </View>
    );
  }
  
  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      <View style={styles.container}>
        <StatusBar hidden={false} />
        
        {/* NYC Skyline background */}
        <Image 
          source={require('../../../assets/images/nyc-bg.png')} 
          style={styles.backgroundImage}
          resizeMode="cover"
        />
        
        {/* Game content with proper z-index layering */}
        <View style={styles.gameContent}>
          {(gameStarted || isCountingDown) && (
            <>
              {/* Render obstacles */}
              {renderObstacles()}
              
              {/* Render powerups */}
              {renderPowerUps()}
              
              {/* Bird */}
              <Animated.View
                style={[
                  styles.bird,
                  {
                    transform: [
                      { translateY: birdPositionRef.current },
                      { rotate: birdRotateInterpolation }
                    ]
                  }
                ]}
              >
                <Image
                  source={isPoweredUp ? poweredUpBirdImages[birds[selectedBirdIndex].name] : birds[selectedBirdIndex].image}
                  style={styles.birdImage}
                  resizeMode="contain"
                  fadeDuration={0}
                />
              </Animated.View>
            </>
          )}
          
          {/* Score or Countdown */}
          {(gameStarted || isCountingDown) && !gameOver && (
            <Text style={styles.scoreText}>
              {isCountingDown ? countdown : score}
            </Text>
          )}
        </View>
        
        {/* UI elements that should appear on top */}
        <View style={styles.uiLayer}>
          {/* Header with Back button only */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={handleBackPress}
            >
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>
          </View>
          
          {/* Start screen */}
          {!gameStarted && !isCountingDown && !gameOver && (
            <View style={styles.startScreenContainer}>
              <Text style={styles.gameTitle}>Sloppy Birds</Text>
              <Text style={styles.chooseVibeText}>Choose a vibe...</Text>
              
              {/* Bird selector */}
              <View style={styles.birdSelectorContainer}>
                <TouchableOpacity 
                  style={styles.arrowButton} 
                  onPress={selectPreviousBird}
                >
                  <ChevronLeft size={32} color="white" />
                </TouchableOpacity>
                
                <View style={styles.birdPreviewContainer}>
                  <Image
                    source={birds[selectedBirdIndex].image}
                    style={styles.birdPreviewImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.birdName}>{birds[selectedBirdIndex].name}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.arrowButton} 
                  onPress={selectNextBird}
                >
                  <ChevronRight size={32} color="white" />
                </TouchableOpacity>
              </View>
              
              {/* Bird selection dots */}
              <View style={styles.dotsContainer}>
                {birds.map((_, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.dot, 
                      index === selectedBirdIndex && styles.activeDot
                    ]} 
                  />
                ))}
              </View>
              
              {/* New High Score Banner on Home Screen */}
              {showNewHighScoreOnHome && (
                <View style={styles.homeNewHighScoreBanner}>
                  <Text style={styles.homeNewHighScoreText}>New High Score!</Text>
                </View>
              )}
              
              {/* New High Score Banner on Home Screen */}
              {showNewHighScoreOnHome && (
                <View style={styles.homeNewHighScoreBanner}>
                  <Text style={styles.homeNewHighScoreText}>New High Score!</Text>
                </View>
              )}
              
              {/* Start button */}
              <TouchableOpacity 
                style={styles.startButton} 
                onPress={startGame}
              >
                <Text style={styles.startButtonText}>Let's Fly!</Text>
              </TouchableOpacity>
              
              {/* Leaderboard section */}
              <View style={styles.leaderboardContainer}>
                <View style={styles.leaderboardColumn}>
                  <Text style={styles.leaderboardTitle}>High-score</Text>
                  {isLoadingHighScore ? (
                    <ActivityIndicator size="small" color="#FFD700" />
                  ) : (
                    <Text style={styles.highScoreText}>{highScore}</Text>
                  )}
                </View>
                
                <View style={styles.leaderboardDivider} />
                
                <View style={styles.leaderboardColumn}>
                  <TouchableOpacity onPress={() => setShowFullLeaderboard(true)}>
                    <Text style={[styles.leaderboardTitle, { fontSize: 16 }]}>Leaderboard</Text>
                  </TouchableOpacity>
                  <View style={styles.leaderboardEntries}>
                    {isLoadingLeaderboard ? (
                      <ActivityIndicator size="small" color="#FFD700" />
                    ) : friendsLeaderboard.length > 0 ? (
                      // Show only top 3 friends in the start screen
                      friendsLeaderboard.slice(0, 3).map((entry, index) => {
                        // Get the display name - username or You for current user
                        const isCurrentUser = entry.user_id === userId;
                        const displayName = isCurrentUser ? 'You' : entry.users?.username || 'Friend';
                        
                        return (
                          <Text key={index} style={[styles.leaderboardEntry, isCurrentUser && styles.currentUserEntry]}>
                            {displayName}: {entry.score}
                          </Text>
                        );
                      })
                    ) : (
                      <>
                        <Text style={styles.leaderboardEntry}>No scores yet</Text>
                        <Text style={styles.leaderboardEntry}>Play a game or</Text>
                        <Text style={styles.leaderboardEntry}>add friends</Text>
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>
          )}
          
          {/* Game over message */}
          {gameOver && (
            <View style={styles.messageContainer}>
              {isNewHighScore && (
                <Animated.View style={styles.newRecordBanner}>
                  <Text style={styles.newRecordText}> New High Score! </Text>
                </Animated.View>
              )}
              <Text style={styles.gameOverText}>Game Over!</Text>
              <Text style={styles.finalScoreText}>Score: {score}</Text>
              <TouchableOpacity
                style={styles.restartButton}
                onPress={resetToStartScreen}
              >
                <Text style={styles.restartButtonText}>Play Again</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Start text */}
          {showStartText && (
            <Animated.Text
              style={[
                styles.startText,
                {
                  opacity: startTextOpacity,
                },
              ]}
            >
              Start!
            </Animated.Text>
          )}
        </View>
        
        {/* Full Leaderboard Modal */}
        {showFullLeaderboard && (
          <View style={styles.modalOverlay}>
            <View style={styles.leaderboardModal}>
              <Text style={styles.leaderboardModalTitle}>Friends Leaderboard</Text>
              
              <View style={styles.leaderboardModalContent}>
                {isLoadingLeaderboard ? (
                  <ActivityIndicator size="large" color="#FFD700" />
                ) : friendsLeaderboard.length > 0 ? (
                  friendsLeaderboard.map((entry, index) => {
                    const isCurrentUser = entry.user_id === userId;
                    const displayName = isCurrentUser ? 'You' : entry.users?.username || 'Friend';
                    
                    return (
                      <View key={index} style={styles.leaderboardModalRow}>
                        <Text style={styles.leaderboardRank}>{index + 1}</Text>
                        <Text style={[styles.leaderboardModalName, isCurrentUser && styles.currentUserEntry]}>
                          {displayName}
                        </Text>
                        <Text style={styles.leaderboardModalScore}>{entry.score}</Text>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.leaderboardModalEmptyText}>No friends scores found</Text>
                )}
              </View>
              
              <TouchableOpacity 
                style={styles.leaderboardModalCloseButton}
                onPress={() => setShowFullLeaderboard(false)}
              >
                <Text style={styles.leaderboardModalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

export default SloppyBirds;

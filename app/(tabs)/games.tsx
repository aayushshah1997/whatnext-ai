import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView, 
  Platform, 
  Image, 
  FlatList,
  ViewToken,
  Dimensions,
  ImageBackground,
  ActivityIndicator
} from 'react-native';
import { Asset } from 'expo-asset';
import { useRouter } from 'expo-router';
import { Gamepad2, Users2, Dice1, ChevronLeft } from 'lucide-react-native';
import ScreenLayout from '../../components/ScreenLayout';

// Constants for layout
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = 200;
const CARD_MARGIN = 8; // Reduced from 15 to 8
const ITEM_HEIGHT = CARD_HEIGHT + CARD_MARGIN * 2;

// Import game images
const sloppyBirdsLogo = require('../../assets/images/sloppy_birds_logo.png');
const splitTheGLogo = require('../../assets/images/split-the-g.png');

interface GameItem {
  name: string;
  description: string;
  icon?: React.ComponentType<any>;
  customImage?: any;
  route?: string;
}

const games: GameItem[] = [
  {
    name: 'Sloppy Birds',
    description: 'Avoid drinks and collect power-ups in this addictive mini-game',
    customImage: sloppyBirdsLogo,
    route: '/games/sloppy-birds',
  },
  {
    name: 'Split the G',
    description: 'Test your skills at splitting the perfect pint',
    customImage: splitTheGLogo,
    route: '/games/split-the-g',
  },
  {
    name: 'Telestrations',
    description: 'Draw and guess your way to hilarity',
    icon: Users2,
  },
  {
    name: 'Truth or Drink',
    description: 'Answer truthfully or take a drink',
    icon: Dice1,
  },
  {
    name: 'More Coming Soon',
    description: 'Stay tuned for more fun party games!',
    icon: Gamepad2,
  },
];

// No separate GameCard component needed - integrated into renderItem

export default function GamesScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(2); // Start with middle item
  const flatListRef = useRef<FlatList<GameItem>>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // Preload game images to prevent loading delay
  useEffect(() => {
    const preloadImages = async () => {
      try {
        const imageAssets = [
          require('../../assets/images/sloppy_birds_logo.png'),
          require('../../assets/images/split-the-g.png')
        ];
        
        // Preload all images
        await Promise.all(imageAssets.map(image => Asset.fromModule(image).downloadAsync()));
        setImagesLoaded(true);
      } catch (error) {
        console.error('Error preloading images:', error);
        // Set images as loaded even if there's an error to prevent blocking the UI
        setImagesLoaded(true);
      }
    };
    
    preloadImages();
  }, []);
  
  // Calculate visible items to show in the wheel
  const visibleItems = 5;
  const halfVisibleItems = Math.floor(visibleItems / 2);
  
  // Function to handle when an item becomes visible
  const handleViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[]; changed: ViewToken[] }) => {
    if (viewableItems.length > 0) {
      const centerItem = viewableItems.find((item) => item.isViewable);
      if (centerItem && centerItem.index !== null) {
        setActiveIndex(centerItem.index);
      }
    }
  }).current;
  
  // Viewability config for FlatList
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;
  
  // Render each game item
  const renderItem = ({ item, index }: { item: GameItem; index: number }) => {
    // Calculate distance from center (active) item
    const position = Math.abs(index - activeIndex);
    const isActive = position === 0;
    const scale = isActive ? 1 : Math.max(0.7, 1 - position * 0.15);
    const opacity = isActive ? 1 : Math.max(0.5, 1 - position * 0.25);
    
    // Check if this is Sloppy Birds or Split the G
    const isSpecialGame = ['Sloppy Birds', 'Split the G'].includes(item.name);
    
    return (
      <TouchableOpacity
        style={[styles.card, { 
          transform: [{ scale }],
          opacity,
          height: CARD_HEIGHT,
          width: CARD_WIDTH,
        }]}
        activeOpacity={0.9}
        onPress={() => item.route && router.push(item.route)}
      >
        {isSpecialGame ? (
          // Full image for Sloppy Birds and Split the G
          <Image
            source={item.customImage}
            style={styles.fullSizeImage}
            resizeMode="contain"
          />
        ) : (
          // Normal layout for other games
          <>
            <View style={styles.imageContainer}>
              {item.customImage ? (
                <Image
                  source={item.customImage}
                  style={styles.gameImage}
                  resizeMode="contain"
                />
              ) : (
                <View style={styles.iconContainer}>
                  {item.icon && <item.icon size={48} color="#fff" />}
                </View>
              )}
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.gameName}>{item.name}</Text>
              <Text style={styles.gameDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScreenLayout hideBackButton>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Games</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Choose a game to spice up your night!
          </Text>
          
          {!imagesLoaded ? (
            // Show loading indicator while images are being preloaded
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFD700" />
              <Text style={styles.loadingText}>Loading games...</Text>
            </View>
          ) : (
            // Show carousel once images are loaded
            <View style={styles.carouselContainer}>
              <FlatList
                ref={flatListRef}
                data={games}
                renderItem={renderItem}
                keyExtractor={(_, index) => `game-${index}`}
                contentContainerStyle={styles.flatListContent}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                snapToAlignment="center"
                onViewableItemsChanged={handleViewableItemsChanged}
                viewabilityConfig={viewabilityConfig}
                initialScrollIndex={Math.min(2, games.length - 1)}
                getItemLayout={(_, index) => ({
                  length: ITEM_HEIGHT,
                  offset: ITEM_HEIGHT * index,
                  index,
                })}
              />
            </View>
          )}
        </View>
      </SafeAreaView>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  
  // Carousel
  carouselContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flatListContent: {
    paddingVertical: SCREEN_HEIGHT * 0.25,
    alignItems: 'center',
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 18,
    marginTop: 10,
    fontWeight: 'bold',
  },
  
  // Card
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#222',
    marginHorizontal: 'auto',
    marginVertical: CARD_MARGIN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    backfaceVisibility: 'hidden',
    transformOrigin: 'center center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imageContainer: {
    height: '70%',
    backgroundColor: '#1a1a1a',
  },
  gameImage: {
    width: '100%',
    height: '100%',
  },
  fullSizeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#222',
  },
  fullHeightImage: {
    width: '100%',
    height: '100%',
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
  },
  textContainer: {
    height: '30%',
    padding: 12,
    backgroundColor: '#222',
  },
  gameName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameDescription: {
    color: '#aaa',
    fontSize: 12,
    lineHeight: 16,
  },
});

// End of component



import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');

export const Background = ({ gameState }: { gameState?: 'menu' | 'countdown' | 'playing' | 'gameover' }) => {
  // Animation values for parallax effect
  const farBuildingsPosition = useRef(new Animated.Value(0)).current;
  const midBuildingsPosition = useRef(new Animated.Value(0)).current;
  const nearBuildingsPosition = useRef(new Animated.Value(0)).current;
  const bridgePosition = useRef(new Animated.Value(0)).current;
  const reflectionPosition = useRef(new Animated.Value(0)).current;
  
  // Animation references to control them
  const farAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const midAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const nearAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const bridgeAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const reflectionAnimation = useRef<Animated.CompositeAnimation | null>(null);
  
  // Start or restart parallax animations based on game state
  useEffect(() => {
    // Stop any existing animations
    if (farAnimation.current) farAnimation.current.stop();
    if (midAnimation.current) midAnimation.current.stop();
    if (nearAnimation.current) nearAnimation.current.stop();
    if (bridgeAnimation.current) bridgeAnimation.current.stop();
    if (reflectionAnimation.current) reflectionAnimation.current.stop();
    
    // Only start animations if we're in menu or playing state
    // During countdown, we keep the background static
    if (gameState === 'menu' || gameState === 'playing') {
      // Animate far buildings (slowest)
      farAnimation.current = Animated.loop(
        Animated.timing(farBuildingsPosition, {
          toValue: -width * 0.5,
          duration: 60000, // 60 seconds for one full cycle
          useNativeDriver: true,
        })
      );
      farAnimation.current.start();

      // Animate mid buildings (medium speed)
      midAnimation.current = Animated.loop(
        Animated.timing(midBuildingsPosition, {
          toValue: -width * 0.7,
          duration: 45000, // 45 seconds for one full cycle
          useNativeDriver: true,
        })
      );
      midAnimation.current.start();

      // Animate near buildings (faster)
      nearAnimation.current = Animated.loop(
        Animated.timing(nearBuildingsPosition, {
          toValue: -width,
          duration: 30000, // 30 seconds for one full cycle
          useNativeDriver: true,
        })
      );
      nearAnimation.current.start();
      
      // Animate bridge (even faster)
      bridgeAnimation.current = Animated.loop(
        Animated.timing(bridgePosition, {
          toValue: -width * 1.5,
          duration: 20000, // 20 seconds for one full cycle
          useNativeDriver: true,
        })
      );
      bridgeAnimation.current.start();
      
      // Animate water reflections (fastest)
      reflectionAnimation.current = Animated.loop(
        Animated.timing(reflectionPosition, {
          toValue: -width * 2,
          duration: 15000, // 15 seconds for one full cycle
          useNativeDriver: true,
        })
      );
      reflectionAnimation.current.start();
    }
    
    // Cleanup function to stop animations when component unmounts
    return () => {
      if (farAnimation.current) farAnimation.current.stop();
      if (midAnimation.current) midAnimation.current.stop();
      if (nearAnimation.current) nearAnimation.current.stop();
      if (bridgeAnimation.current) bridgeAnimation.current.stop();
      if (reflectionAnimation.current) reflectionAnimation.current.stop();
    };
  }, [gameState]);

  return (
    <View style={styles.container}>
      {/* NYC skyline background with 3D parallax effect */}
      <View style={styles.skylineBackground}>
        {/* Deep blue sky */}
        <View style={styles.sky} />
        
        {/* Stars */}
        <View style={styles.starsContainer}>
          {Array.from({ length: 80 }).map((_, index) => (
            <View
              key={`star-${index}`}
              style={[
                styles.star,
                {
                  left: Math.random() * width,
                  top: Math.random() * (height * 0.6),
                  width: Math.random() * 2 + 1,
                  height: Math.random() * 2 + 1,
                  opacity: Math.random() * 0.8 + 0.2,
                },
              ]}
            />
          ))}
        </View>
        
        {/* Far buildings layer (slowest movement) */}
        <Animated.View
          style={[
            styles.buildingsLayer,
            {
              transform: [{ translateX: farBuildingsPosition }],
              zIndex: 1,
              opacity: 0.7,
              height: height * 0.5,
              bottom: height * 0.2,
            },
          ]}
        >
          {/* Generate far buildings */}
          {Array.from({ length: 12 }).map((_, i) => (
            <View 
              key={`far-${i}`} 
              style={[
                styles.building, 
                { 
                  left: (i * width / 6), 
                  height: 80 + Math.random() * 150,
                  width: 30 + Math.random() * 20,
                  bottom: 0,
                  opacity: 0.7,
                }
              ]}
            >
              {/* Windows for far buildings */}
              {Array.from({ length: 6 }).map((_, j) => (
                <View key={`far-w-${i}-${j}`} style={[styles.window, { 
                  top: 10 + j * 20, 
                  left: 5 + (j % 3) * 8,
                  width: 4,
                  height: 6,
                  opacity: 0.6,
                }]} />
              ))}
            </View>
          ))}
        </Animated.View>
        
        {/* Mid buildings layer (medium movement) */}
        <Animated.View
          style={[
            styles.buildingsLayer,
            {
              transform: [{ translateX: midBuildingsPosition }],
              zIndex: 2,
              opacity: 0.85,
              height: height * 0.6,
              bottom: height * 0.2,
            },
          ]}
        >
          {/* Freedom Tower */}
          <View style={[styles.building, styles.freedomTower]}>
            {Array.from({ length: 15 }).map((_, i) => (
              <View key={`ft-${i}`} style={[styles.window, { 
                top: 20 + i * 15, 
                left: i % 2 === 0 ? 5 : 15,
                opacity: 0.8,
              }]} />
            ))}
          </View>
          
          {/* Empire State Building */}
          <View style={[styles.building, styles.empireState]}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={`es-${i}`} style={[styles.window, { 
                top: 10 + i * 12, 
                left: i % 2 === 0 ? 8 : 16,
                opacity: 0.8,
              }]} />
            ))}
          </View>
          
          {/* Various mid buildings */}
          {Array.from({ length: 10 }).map((_, i) => (
            <View 
              key={`mid-${i}`} 
              style={[
                styles.building, 
                { 
                  left: (width * 0.1) + (i * width / 5), 
                  height: 120 + Math.random() * 180,
                  width: 35 + Math.random() * 25,
                  bottom: 0,
                  opacity: 0.85,
                }
              ]}
            >
              {/* Windows for mid buildings */}
              {Array.from({ length: 8 }).map((_, j) => (
                <View key={`mid-w-${i}-${j}`} style={[styles.window, { 
                  top: 15 + j * 22, 
                  left: 5 + (j % 3) * 10,
                  opacity: 0.8,
                }]} />
              ))}
            </View>
          ))}
        </Animated.View>
        
        {/* Near buildings layer (faster movement) */}
        <Animated.View
          style={[
            styles.buildingsLayer,
            {
              transform: [{ translateX: nearBuildingsPosition }],
              zIndex: 3,
              height: height * 0.7,
              bottom: height * 0.2,
            },
          ]}
        >
          {/* Various near buildings */}
          {Array.from({ length: 8 }).map((_, i) => (
            <View 
              key={`near-${i}`} 
              style={[
                styles.building, 
                { 
                  left: (width * 0.2) + (i * width / 4), 
                  height: 150 + Math.random() * 220,
                  width: 45 + Math.random() * 30,
                  bottom: 0,
                }
              ]}
            >
              {/* Windows for near buildings */}
              {Array.from({ length: 10 }).map((_, j) => (
                <View key={`near-w-${i}-${j}`} style={[styles.window, { 
                  top: 20 + j * 25, 
                  left: 8 + (j % 3) * 12,
                }]} />
              ))}
            </View>
          ))}
        </Animated.View>
        
        {/* Brooklyn Bridge (fastest building layer) */}
        <Animated.View
          style={[
            styles.bridgeContainer,
            {
              transform: [{ translateX: bridgePosition }],
              zIndex: 4,
            },
          ]}
        >
          {/* Main bridge structure */}
          <View style={styles.bridge}>
            <View style={styles.bridgeTop} />
            <View style={styles.bridgeTower1} />
            <View style={styles.bridgeTower2} />
            <View style={styles.bridgeCable1} />
            <View style={styles.bridgeCable2} />
            <View style={styles.bridgeRoad} />
            
            {/* Bridge cables */}
            {Array.from({ length: 10 }).map((_, i) => (
              <View key={`cable-${i}`} style={[styles.bridgeVerticalCable, {
                left: 50 + i * 20,
                height: 40 + (i % 2 === 0 ? 10 : 0),
              }]} />
            ))}
          </View>
        </Animated.View>
        
        {/* Water with reflections */}
        <View style={styles.water}>
          <Animated.View
            style={[
              styles.reflectionsContainer,
              {
                transform: [{ translateX: reflectionPosition }],
              },
            ]}
          >
            {/* Generate water reflections */}
            {Array.from({ length: 30 }).map((_, i) => (
              <View 
                key={`r-${i}`} 
                style={[
                  styles.reflection, 
                  { 
                    left: i * 30, 
                    width: 10 + Math.random() * 15,
                    height: 5 + Math.random() * 10,
                    opacity: 0.2 + Math.random() * 0.4,
                    bottom: Math.random() * 60,
                  }
                ]}
              />
            ))}
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: width,
    height: height,
    overflow: 'hidden',
  },
  skylineBackground: {
    width: '100%',
    height: '100%',
  },
  sky: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#0a2a43', // Deep blue for night sky
  },
  buildingsLayer: {
    position: 'absolute',
    width: width * 2, // Double width for seamless looping
    height: height * 0.7,
  },
  building: {
    position: 'absolute',
    backgroundColor: '#05192d', // Dark blue for buildings
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  freedomTower: {
    height: 300,
    width: 30,
    bottom: 0,
    left: width / 2,
    zIndex: 10,
  },
  empireState: {
    height: 250,
    width: 25,
    bottom: 0,
    left: width / 4,
    zIndex: 8,
  },
  window: {
    position: 'absolute',
    width: 6,
    height: 8,
    backgroundColor: '#f39c12', // Golden windows
    opacity: 0.9,
  },
  bridgeContainer: {
    position: 'absolute',
    width: width * 2,
    height: 100,
    bottom: height * 0.2,
  },
  bridge: {
    position: 'absolute',
    bottom: 0,
    left: width * 0.5,
    width: width * 0.8,
    height: 100,
  },
  bridgeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 2,
    backgroundColor: '#e74c3c', // Red for Brooklyn Bridge
  },
  bridgeTower1: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    width: 10,
    height: 80,
    backgroundColor: '#e74c3c',
  },
  bridgeTower2: {
    position: 'absolute',
    bottom: 0,
    left: '60%',
    width: 10,
    height: 80,
    backgroundColor: '#e74c3c',
  },
  bridgeCable1: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    backgroundColor: '#e74c3c',
    transform: [{ translateY: 10 }],
  },
  bridgeCable2: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 1,
    backgroundColor: '#e74c3c',
    transform: [{ translateY: 20 }],
  },
  bridgeVerticalCable: {
    position: 'absolute',
    top: 0,
    width: 1,
    backgroundColor: '#e74c3c',
  },
  bridgeRoad: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: 8,
    backgroundColor: '#34495e',
    borderTopWidth: 1,
    borderTopColor: '#e74c3c',
  },
  water: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: height * 0.2,
    backgroundColor: '#0a2a43', // Same as sky for water
  },
  reflectionsContainer: {
    position: 'absolute',
    width: width * 3, // Triple width for seamless looping
    height: '100%',
  },
  reflection: {
    position: 'absolute',
    backgroundColor: '#f39c12', // Golden reflection
    borderRadius: 2,
  },
  starsContainer: {
    position: 'absolute',
    width: width,
    height: height,
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 4,
  },
});

import Matter from 'matter-js';
import { Dimensions } from 'react-native';
import { GAME_CONSTANTS } from './Physics';

const { width } = Dimensions.get('window');

const MoveObjects = (entities: any, { time, dispatch }: any) => {
  // Skip if no physics world exists
  if (!entities.physics) {
    return entities;
  }
  
  // Check if we're in countdown phase
  const isInCountdownPhase = entities.player && entities.player.isInCountdownPhase;
  
  // Cap delta time to prevent physics issues
  const delta = Math.min(time.delta, GAME_CONSTANTS.MAX_DELTA);
  
  // Calculate movement scale factor based on capped delta time
  // This ensures consistent movement speed regardless of frame rate
  const deltaScale = delta / GAME_CONSTANTS.MAX_DELTA;
  
  // Move obstacles and power-ups
  Object.keys(entities).forEach(key => {
    const entity = entities[key];
    
    if (entity.body && (entity.body.label === 'obstacle' || entity.body.label === 'power-up')) {
      // Only move entities if we're not in countdown phase
      // This prevents the jumpy background during countdown
      if (!isInCountdownPhase) {
        // Move the entity left at constant speed, scaled by delta time
        Matter.Body.translate(entity.body, {
          x: -GAME_CONSTANTS.HORIZ_SPEED * deltaScale,
          y: 0
        });
        
        // Check if entity has passed the player (for scoring)
        if (
          entity.body.label === 'obstacle' && 
          !entity.scored && 
          entity.body.position.x < width / 4 - 30
        ) {
          entity.scored = true;
          dispatch({ type: 'score' });
        }
        
        // Mark entities for removal if they're off-screen
        if (entity.body.position.x < -50) {
          entity.isOffScreen = true;
        }
      }
    }
  });
  
  return entities;
};

export { MoveObjects };

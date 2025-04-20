import Matter from 'matter-js';
import { Dimensions, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');

// Game physics constants
const GAME_CONSTANTS = {
  GRAVITY_Y: 0.5,           // Gravity acceleration (px/frame²)
  JUMP_VELOCITY: -9,        // Upward impulse (px/frame on tap)
  HORIZ_SPEED: 4,           // Obstacle speed (px/frame)
  PIPE_GAP: 160,            // Vertical gap between obstacles (px)
  SPAWN_INTERVAL: 2000,     // Interval between obstacle spawns (ms)
  INVINCIBILITY_DURATION: 5000, // Power-up duration (ms) - increased to 5 seconds
  TERMINAL_VEL: 12,         // Max downward velocity (px/frame)
  MAX_DELTA: 16.667,        // Maximum delta time (ms) for physics updates
  WOBBLE_DURATION: 400,     // Duration of wobble animation (ms)
  POWER_UP_CHANCE: 0.2,     // 20% chance of spawning a power-up
  POWER_UP_INTERVAL: 4000,  // Check for power-up spawn every 4 seconds
  MAX_LIVES: 3              // Maximum number of lives
};

const Physics = (entities: any, { touches, time, dispatch }: any) => {
  // Skip physics if no player or world exists
  if (!entities.physics || !entities.player || !entities.player.body) {
    return entities;
  }
  
  const { engine, world } = entities.physics;
  const player = entities.player;
  
  // Skip physics updates if player is in wobble animation
  if (player.isWobbling) {
    return entities;
  }
  
  // Handle touch events for jumping (only if not in falling state)
  if (!player.isFalling) {
    touches
      .filter((t: any) => t.type === 'press')
      .forEach(() => {
        Matter.Body.setVelocity(player.body, {
          x: 0,
          y: GAME_CONSTANTS.JUMP_VELOCITY,
        });
      });
  }
  
  // Apply terminal velocity cap
  if (player.body.velocity.y > GAME_CONSTANTS.TERMINAL_VEL) {
    Matter.Body.setVelocity(player.body, {
      x: player.body.velocity.x,
      y: GAME_CONSTANTS.TERMINAL_VEL
    });
  }
  
  // Cap delta time to prevent Matter.js warnings and physics issues
  // This ensures delta is never greater than 16.667ms as recommended by Matter.js
  const delta = Math.min(time.delta, GAME_CONSTANTS.MAX_DELTA);
  
  // Update physics engine with capped delta
  Matter.Engine.update(engine, delta);
  
  // Skip collision detection during countdown phase
  if (player.isInCountdownPhase) {
    return entities;
  }
  
  // Check for collisions with obstacles and power-ups
  if (player.body) {
    // Get all bodies that aren't the player
    const bodies = Object.values(entities)
      .filter((entity: any) => entity.body && entity.body.label !== 'player')
      .map((entity: any) => entity.body);
    
    // Check for collisions
    const collisions = Matter.Query.collides(player.body, bodies);
    
    if (collisions.length > 0) {
      // Process each collision
      collisions.forEach((collision) => {
        const otherBody = collision.bodyA.label === 'player' ? collision.bodyB : collision.bodyA;
        
        // Handle obstacle collision
        if (otherBody.label === 'obstacle') {
          // Skip collision if player is invincible or already wobbling
          if (player.isInvincible || player.isWobbling) {
            return;
          }
          
          // Reduce lives by 1
          player.lives -= 1;
          
          // Check if game over (no lives left)
          if (player.lives <= 0) {
            // Trigger fall animation and game over
            player.isFalling = true;
            
            // Apply downward velocity for fall
            Matter.Body.setVelocity(player.body, {
              x: 0,
              y: GAME_CONSTANTS.TERMINAL_VEL * 1.5 // Faster fall on death
            });
            
            // Dispatch game over after a short delay to allow fall animation
            setTimeout(() => {
              dispatch({ type: 'game-over' });
            }, 1000);
          } else {
            // Trigger wobble animation
            player.isWobbling = true;
            
            // Reset wobble animation value
            player.wobbleAnim.setValue(1);
            
            // Create wobble animation sequence
            Animated.sequence([
              Animated.timing(player.wobbleAnim, {
                toValue: -1,
                duration: GAME_CONSTANTS.WOBBLE_DURATION / 4,
                useNativeDriver: true
              }),
              Animated.timing(player.wobbleAnim, {
                toValue: 1,
                duration: GAME_CONSTANTS.WOBBLE_DURATION / 2,
                useNativeDriver: true
              }),
              Animated.timing(player.wobbleAnim, {
                toValue: 0,
                duration: GAME_CONSTANTS.WOBBLE_DURATION / 4,
                useNativeDriver: true
              })
            ]).start(() => {
              // Reset wobbling state when animation completes
              player.isWobbling = false;
            });
            
            // Dispatch hit event for UI feedback
            dispatch({ type: 'hit' });
          }
          
          // Add score if obstacle passed and not already scored
          const obstacleKey = Object.keys(entities).find(
            (key) => entities[key].body && entities[key].body.id === otherBody.id
          );
          
          const obstacle = obstacleKey ? entities[obstacleKey] : null;
          if (obstacle && !obstacle.scored && player.body.position.x > obstacle.body.position.x) {
            obstacle.scored = true;
            dispatch({ type: 'score' });
          }
        }
        
        // Handle power-up collision
        if (otherBody.label === 'power-up') {
          // Find the power-up entity to remove it
          const powerUpKey = Object.keys(entities).find(
            (key) => entities[key].body && entities[key].body.id === otherBody.id
          );
          
          if (powerUpKey) {
            // Remove power-up from world
            Matter.World.remove(world, entities[powerUpKey].body);
            delete entities[powerUpKey];
            
            // Reset lives to maximum
            player.lives = GAME_CONSTANTS.MAX_LIVES;
            
            // Make player invincible
            player.isInvincible = true;
            
            // Dispatch power-up event
            dispatch({ type: 'power-up' });
            
            // Set timeout to remove invincibility
            setTimeout(() => {
              if (entities.player) {
                entities.player.isInvincible = false;
                dispatch({ type: 'power-up-end' });
              }
            }, GAME_CONSTANTS.INVINCIBILITY_DURATION);
          }
        }
      });
    }
    
    // Check for collisions with floor and ceiling
    if (
      player.body.position.y > height - 50 || 
      player.body.position.y < 50
    ) {
      // Only trigger game over if not already falling and not in countdown
      if (!player.isFalling && !player.isInCountdownPhase) {
        player.lives = 0;
        player.isFalling = true;
        
        setTimeout(() => {
          dispatch({ type: 'game-over' });
        }, 500);
      }
    }
  }
  
  return entities;
};

export { Physics, GAME_CONSTANTS };

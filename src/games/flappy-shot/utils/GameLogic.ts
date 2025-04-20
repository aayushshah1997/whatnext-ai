import Matter from 'matter-js';
import { Animated, Dimensions } from 'react-native';
import { GAME_CONSTANTS as PhysicsConstants } from '../systems/Physics';
import { Player } from '../entities';

const { width, height } = Dimensions.get('window');

// Export game constants for use in other files
export const GAME_CONSTANTS = {
  ...PhysicsConstants,
  // Add any additional game constants here
};

// Player constants
const PLAYER_SIZE = 90;     // Size of the player bird (px)

/**
 * Creates a player entity with all required properties
 * @param selectedBirdSprite The selected bird sprite information
 * @param position Optional position override
 * @param wobbleAnim Animated value for wobble animation
 * @returns A complete player entity
 */
export const createPlayerEntity = (
  selectedBirdSprite: any, 
  position: { x: number, y: number } = { x: width / 2, y: height / 2 },
  wobbleAnim: Animated.Value
) => {
  // Create the Matter.js body for the player
  const player = Matter.Bodies.rectangle(
    position.x,
    position.y,
    PLAYER_SIZE,
    PLAYER_SIZE,
    { 
      label: 'player',
      frictionAir: 0.02,
      restitution: 0.3,
      collisionFilter: {
        category: 0x0001,
        mask: 0x0002
      }
    }
  );
  
  // Return the complete player entity
  return {
    body: player,
    size: [PLAYER_SIZE, PLAYER_SIZE],
    color: selectedBirdSprite.color,
    renderer: Player,
    isInvincible: false,
    zIndex: 50, // Ensure bird is visible above other elements
    hasCustomImage: selectedBirdSprite.hasCustomImage,
    imageSource: selectedBirdSprite.imageSource,
    birdType: selectedBirdSprite.id,
    lives: GAME_CONSTANTS.MAX_LIVES || 3, // Fallback to 3 if constant is undefined
    isWobbling: false,
    isFalling: false,
    wobbleAnim: wobbleAnim,
    isInCountdownPhase: false
  };
};

/**
 * Sets up the game world with a player entity
 * @param selectedBirdSprite The selected bird sprite information
 * @param gameState Current game state
 * @param previewPosition Position from the bird preview
 * @param wobbleAnim Animated value for wobble animation
 * @returns Complete entities object with physics and player
 */
export const setupWorldWithBird = (
  selectedBirdSprite: any,
  gameState: 'menu' | 'countdown' | 'playing' | 'gameover',
  previewPosition: { x: number, y: number } = { x: 0, y: 0 },
  wobbleAnim: Animated.Value
) => {
  // Create physics engine
  const engine = Matter.Engine.create({ enableSleeping: false });
  const world = engine.world;
  
  // Set gravity to zero initially (will be set when game starts)
  engine.gravity.y = 0;
  
  // Only create player for countdown or playing states
  if (gameState === 'countdown' || gameState === 'playing') {
    // Use preview position if available, otherwise center
    const playerX = width / 2; // Always center horizontally
    const playerY = previewPosition.y || height / 2;
    
    console.log('Creating player at position:', playerX, playerY);
    
    // Create player entity
    const playerEntity = createPlayerEntity(
      selectedBirdSprite,
      { x: playerX, y: playerY },
      wobbleAnim
    );
    
    // Set countdown phase flag if in countdown
    playerEntity.isInCountdownPhase = gameState === 'countdown';
    
    // Make the player static during countdown so it doesn't fall
    if (gameState === 'countdown') {
      Matter.Body.setStatic(playerEntity.body, true);
    }
    
    // Add player to world
    Matter.World.add(world, [playerEntity.body]);
    
    // Return complete entities object
    return {
      physics: { engine, world },
      player: playerEntity
    };
  } else {
    // Return only physics engine without player when in menu
    return {
      physics: { engine, world }
    };
  }
};

/**
 * Triggers the wobble animation for the bird
 * @param player The player entity
 */
export const triggerWobble = (player: any) => {
  // Skip if already wobbling
  if (player.isWobbling) {
    return;
  }
  
  // Set wobbling flag
  player.isWobbling = true;
  
  // Reset wobble animation value
  player.wobbleAnim.setValue(1);
  
  // Create wobble animation sequence
  Animated.sequence([
    Animated.timing(player.wobbleAnim, {
      toValue: -1,
      duration: (GAME_CONSTANTS.WOBBLE_DURATION || 400) / 4,
      useNativeDriver: true
    }),
    Animated.timing(player.wobbleAnim, {
      toValue: 1,
      duration: (GAME_CONSTANTS.WOBBLE_DURATION || 400) / 2,
      useNativeDriver: true
    }),
    Animated.timing(player.wobbleAnim, {
      toValue: 0,
      duration: (GAME_CONSTANTS.WOBBLE_DURATION || 400) / 4,
      useNativeDriver: true
    })
  ]).start(() => {
    // Reset wobbling state when animation completes
    player.isWobbling = false;
  });
};

/**
 * Triggers the game over sequence
 * @param player The player entity
 * @param dispatch Function to dispatch events
 */
export const triggerGameOver = (player: any, dispatch: Function) => {
  // Set falling flag
  player.isFalling = true;
  
  // Apply downward velocity for fall
  Matter.Body.setVelocity(player.body, {
    x: 0,
    y: (GAME_CONSTANTS.TERMINAL_VEL || 12) * 1.5 // Faster fall on death
  });
  
  // Dispatch game over after a short delay to allow fall animation
  setTimeout(() => {
    dispatch({ type: 'game-over' });
  }, 1000);
};

/**
 * Handles power-up collection
 * @param player The player entity
 * @param powerUpBody The power-up body
 * @param entities All game entities
 * @param world The Matter.js world
 * @param dispatch Function to dispatch events
 */
export const handlePowerUpCollection = (
  player: any,
  powerUpBody: Matter.Body,
  entities: any,
  world: Matter.World,
  dispatch: Function
) => {
  // Find the power-up entity to remove it
  const powerUpKey = Object.keys(entities).find(
    (key) => entities[key].body && entities[key].body.id === powerUpBody.id
  );
  
  if (powerUpKey) {
    // Remove power-up from world
    Matter.World.remove(world, entities[powerUpKey].body);
    delete entities[powerUpKey];
    
    // Reset lives to maximum
    player.lives = GAME_CONSTANTS.MAX_LIVES || 3;
    
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
    }, GAME_CONSTANTS.INVINCIBILITY_DURATION || 5000);
  }
};

/**
 * Handles obstacle collision
 * @param player The player entity
 * @param obstacleBody The obstacle body
 * @param entities All game entities
 * @param dispatch Function to dispatch events
 */
export const handleObstacleCollision = (
  player: any,
  obstacleBody: Matter.Body,
  entities: any,
  dispatch: Function
) => {
  // Skip collision if player is invincible or already wobbling
  if (player.isInvincible || player.isWobbling) {
    return;
  }
  
  // Reduce lives by 1
  player.lives -= 1;
  
  // Check if game over (no lives left)
  if (player.lives <= 0) {
    triggerGameOver(player, dispatch);
  } else {
    // Trigger wobble animation
    triggerWobble(player);
    
    // Dispatch hit event for UI feedback
    dispatch({ type: 'hit' });
  }
  
  // Add score if obstacle passed and not already scored
  const obstacleKey = Object.keys(entities).find(
    (key) => entities[key].body && entities[key].body.id === obstacleBody.id
  );
  
  const obstacle = obstacleKey ? entities[obstacleKey] : null;
  if (obstacle && !obstacle.scored && player.body.position.x > obstacle.body.position.x) {
    obstacle.scored = true;
    dispatch({ type: 'score' });
  }
};

/**
 * Checks if the player is out of bounds
 * @param player The player entity
 * @param dispatch Function to dispatch events
 * @returns True if player is out of bounds
 */
export const checkOutOfBounds = (player: any, dispatch: Function) => {
  // Check if player is out of bounds
  if (
    player.body.position.y > height - 50 || 
    player.body.position.y < 50
  ) {
    // Only trigger game over if not already falling and not in countdown
    if (!player.isFalling && !player.isInCountdownPhase) {
      player.lives = 0;
      triggerGameOver(player, dispatch);
      return true;
    }
  }
  
  return false;
};

/**
 * Game Logic System - handles all game logic
 * @param entities All game entities
 * @param param1 Game engine parameters
 * @returns Updated entities
 */
export const GameLogicSystem = (entities: any, { touches, time, dispatch }: any) => {
  // Skip if no player or world exists
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
          y: GAME_CONSTANTS.JUMP_VELOCITY || -9,
        });
        
        // Add a slight rotation for visual effect
        Matter.Body.setAngle(player.body, -0.2);
      });
  }
  
  // Apply terminal velocity cap
  if (player.body.velocity.y > (GAME_CONSTANTS.TERMINAL_VEL || 12)) {
    Matter.Body.setVelocity(player.body, {
      x: player.body.velocity.x,
      y: GAME_CONSTANTS.TERMINAL_VEL || 12
    });
  }
  
  // Cap delta time to prevent Matter.js warnings and physics issues
  const delta = Math.min(time.delta, GAME_CONSTANTS.MAX_DELTA || 16.667);
  
  // Update physics engine with capped delta
  Matter.Engine.update(engine, delta);
  
  // Skip collision detection during countdown phase
  if (player.isInCountdownPhase) {
    return entities;
  }
  
  // Check for out of bounds
  if (checkOutOfBounds(player, dispatch)) {
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
          handleObstacleCollision(player, otherBody, entities, dispatch);
        }
        
        // Handle power-up collision
        if (otherBody.label === 'power-up') {
          handlePowerUpCollection(player, otherBody, entities, world, dispatch);
        }
      });
    }
  }
  
  return entities;
};

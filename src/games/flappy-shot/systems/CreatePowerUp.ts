import Matter from 'matter-js';
import { Dimensions } from 'react-native';
import { PowerUp } from '../entities/PowerUp';
import { GAME_CONSTANTS } from './Physics';

const { width, height } = Dimensions.get('window');
const POWER_UP_SIZE = 40;

let powerUpId = 0;
let lastPowerUpCheck = 0;
let lastPowerUpCreatedAt = 0;

const CreatePowerUp = (entities: any, { time }: any) => {
  // Don't create power-ups if game isn't running or if in countdown phase
  if (!entities.player || !entities.player.body || entities.player.isInCountdownPhase) {
    return entities;
  }
  
  const world = entities.physics.world;
  const now = Date.now();
  
  // Check if we should spawn a power-up based on the interval
  if (now - lastPowerUpCheck < GAME_CONSTANTS.POWER_UP_INTERVAL) {
    return entities;
  }
  
  lastPowerUpCheck = now;
  
  // Power-ups should spawn with the specified chance
  // and not spawn too close to the last one (minimum 8 seconds apart)
  if (Math.random() > GAME_CONSTANTS.POWER_UP_CHANCE || now - lastPowerUpCreatedAt < 8000) {
    return entities;
  }
  
  lastPowerUpCreatedAt = now;
  
  // Random y position for the power-up
  const randomY = Math.random() * (height - 300) + 150;
  
  // Create power-up body
  const powerUp = Matter.Bodies.rectangle(
    width + POWER_UP_SIZE / 2,
    randomY,
    POWER_UP_SIZE,
    POWER_UP_SIZE,
    {
      label: 'power-up',
      isStatic: true,
      isSensor: true, // Allow passing through for collision detection only
      collisionFilter: {
        category: 0x0002,
        mask: 0x0001
      }
    }
  );
  
  // Add to world
  Matter.World.add(world, [powerUp]);
  
  // Add to entities
  const powerUpKey = `powerUp-${powerUpId}`;
  entities[powerUpKey] = {
    body: powerUp,
    size: [POWER_UP_SIZE, POWER_UP_SIZE],
    collected: false,
    renderer: PowerUp,
    type: 'invincibility', // Type of power-up (for future expansion)
  };
  
  powerUpId += 1;
  
  return entities;
};

export { CreatePowerUp };

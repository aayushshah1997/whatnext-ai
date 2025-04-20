import Matter from 'matter-js';
import { Dimensions } from 'react-native';
import { Obstacle } from '../entities/Obstacle';

const { width, height } = Dimensions.get('window');
const OBSTACLE_GAP = 200;
const OBSTACLE_WIDTH = 60;
const MIN_HEIGHT = 100;
const MAX_HEIGHT = height - 300;

let obstacleId = 0;
let lastObstacleCreatedAt = 0;

// Drink types for obstacles
const drinkTypes = ['cocktail', 'beer', 'wine'];

const CreateObstacle = (entities: any, { time, dispatch }: any) => {
  // Don't create obstacles if game isn't running or if in countdown phase
  if (!entities.player || !entities.player.body || entities.player.isInCountdownPhase) {
    return entities;
  }
  
  const world = entities.physics.world;
  
  // Create a new obstacle every 1.5 seconds
  const now = Date.now();
  if (now - lastObstacleCreatedAt < 1500) {
    return entities;
  }
  
  lastObstacleCreatedAt = now;
  
  // Random height for the obstacle
  const randomHeight = Math.random() * (MAX_HEIGHT - MIN_HEIGHT) + MIN_HEIGHT;
  
  // Random drink type
  const randomDrinkType = drinkTypes[Math.floor(Math.random() * drinkTypes.length)];
  
  // Create obstacle body
  const obstacle = Matter.Bodies.rectangle(
    width + OBSTACLE_WIDTH / 2,
    randomHeight,
    OBSTACLE_WIDTH,
    OBSTACLE_WIDTH,
    {
      label: 'obstacle',
      isStatic: true,
      isSensor: true, // Allow passing through for collision detection only
    }
  );
  
  // Add to world
  Matter.World.add(world, [obstacle]);
  
  // Add to entities
  const obstacleKey = `obstacle-${obstacleId}`;
  entities[obstacleKey] = {
    body: obstacle,
    size: [OBSTACLE_WIDTH, OBSTACLE_WIDTH],
    color: '#e74c3c',
    type: randomDrinkType,
    scored: false,
    renderer: Obstacle,
  };
  
  obstacleId += 1;
  
  return entities;
};

export { CreateObstacle };

import Matter from 'matter-js';
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const RemoveObjects = (entities: any, { time }: any) => {
  const world = entities.physics.world;
  
  // Remove obstacles and power-ups that are off-screen or destroyed
  Object.keys(entities).forEach(key => {
    const entity = entities[key];
    
    if ((key.includes('obstacle') || key.includes('powerUp')) && 
        (entity.body.position.x < -50 || entity.isDestroyed)) {
      // Remove from physics world
      Matter.World.remove(world, entity.body);
      
      // Remove from entities
      delete entities[key];
    }
  });
  
  return entities;
};

export { RemoveObjects };

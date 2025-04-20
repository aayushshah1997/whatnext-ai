const PowerUpSystem = (entities: any, { events, dispatch }: any) => {
  const player = entities.player;
  
  // Handle power-up events
  if (events.length) {
    events.forEach((e: any) => {
      if (e.type === 'power-up') {
        // Player collected a power-up
        player.isPoweredUp = true;
      } else if (e.type === 'power-up-end') {
        // Power-up effect ended
        player.isPoweredUp = false;
      }
    });
  }
  
  return entities;
};

export { PowerUpSystem };

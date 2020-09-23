// only for checking how refactoring go
import { Engine } from './engine.js';

// loading textures, binding inputs, any other prep-stuff except automated (canvas in HTML, resizing, re-init stuff, etc.)
const Game = new Engine(
  {
    renderer: {
      smoothing: false,
    }
  },
  ()=>{
    // Game._debug.flags = 1;
    Game.renderer.drawDebug = 'sprite';
    Game.atlas
      .load('./images/sprites.png', [
        { id:'st1', bounds: [  0,  0,  8,  8] }, // small white
        { id:'st2', bounds: [  8,  0,  8,  8] }, // bright blue
        { id:'st3', bounds: [  0,  8,  8,  8] }, // diagonal green
        { id:'st4', bounds: [ 16,  0, 16, 16] }, // big purple
        { id:'st5', bounds: [  8,  8,  8,  8] }, // orange bubble
        { id:'spark1', bounds: [  0, 16,  4, 32] },
        { id:'spark2', bounds: [  4, 16,  4, 32] },
      ])
      .load('./images/star-ship.png', [
        { id: 'playerShip', bounds: [ 0, 0, 155, 108], bodyOffset: 'auto' }, // player ship
      ]);
    objects = Game.newObjectSpace(); // newPlayground
    objects.add('player') // calls ./objects/player.js@player() through objectLoader and add it into playspace
  }
);

Game.tick(({now, delta})=> {
  Game.renderer.renderObjects([
    { // test fake sprite
      active: true, x:130, y:130, z: 0,
      sprite: Game.atlas.list['playerShip'],
    },
  ], {now,delta});

  Game._debug.list = [
    `${Game._sys.fps} fps`,
  ];
});

Game.run();
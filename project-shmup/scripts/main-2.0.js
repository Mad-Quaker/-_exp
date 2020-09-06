// only for checking how refactoring go
import { Engine } from './engine.js';

// loading textures, binding inputs, any other prep-stuff except automated (canvas in HTML, resizing, re-init stuff, etc.)
const Game = new Engine(()=>{
  // Game._debug.flags = 1;
  Game.atlas.load('./images/sprites.png', [
      { id:'st1', bounds: [  0,  0,  8,  8] }, // small white
      { id:'st2', bounds: [  8,  0,  8,  8] }, // bright blue
      { id:'st3', bounds: [  0,  8,  8,  8] }, // diagonal green
      { id:'st4', bounds: [ 16,  0, 16, 16] }, // big purple
      { id:'st5', bounds: [  8,  8,  8,  8] }, // orange bubble
      { id:'spark1', bounds: [  0, 16,  4, 32] },
      { id:'spark2', bounds: [  4, 16,  4, 32] },
    ]);
  Game.atlas.load('./images/star-ship.png', [
      { id: 'playerShip', bounds: [ 0, 0, 155, 108], bodyOffset: 'auto' }, // player ship
    ]);
});

Game.tick(({now, delta})=> {
  Game._debug.list = [
    `${Game._sys.fps} fps`,
  ];
});

Game.run();
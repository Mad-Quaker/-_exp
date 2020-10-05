// only for checking how refactoring go
import { Engine } from './engine.js';

// loading textures, binding inputs, any other prep-stuff except automated (canvas in HTML, resizing, re-init stuff, etc.)
const Game = new Engine(
  {
    renderer: {
      width: 960, height: 600, // target
      smoothing: false,
      noUpScale: true,
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
    let objects = Game.newDimension({limit: 2000}); // aka newPlayground, space for objects
    // objects.add('player') // calls ./objects/player.js@player() through objectLoader and add it into playspace
  }
);

window.addEventListener('keyup', (e) => {
  // ## toggle upscale for test purpose
  // if (e.code === 'F9') {
  //   Game.renderer.reset({noUpScale: !Game.renderer.noUpScale});
  //   console.log(Game.renderer.noUpScale)
  // }
});

Game.tick(({now, delta})=> {
  Game.renderer.renderObjects([
    { // test fake sprite
      active: true, x: 200 + Math.sin(now / 1000)* 100, y:200 + Math.cos(now / 1000)* 100, z: 0,
      sprite: Game.atlas.list['playerShip'],
    },
  ], {now,delta});

  Game._debug.list = [
    `${Game._sys.fps} fps @ ${Game.renderer.size.width}x${Game.renderer.size.height} (${Math.round(Game.renderer.size.scale*100)}%)`,
  ];
});

Game.run();
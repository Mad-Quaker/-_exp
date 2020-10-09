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
    Game.renderer.loadBundle('./images/bundle.json');
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
      sprite: 'playerShip',
    },
  ], {now,delta});

  Game._debug.list = [
    `${Game._sys.fps} fps @ ${Game.renderer.size.width}x${Game.renderer.size.height} (${Math.round(Game.renderer.size.scale*100)}%)`,
  ];
});

Game.run();
import { Objects } from './objects.js';
import { Atlas } from './atlas.js';
import { Canvas } from './canvas.js';
import { Pointer } from './pointer.js';
import { Weapons } from './weapons.js';
import { Timer } from './timer.js';

const randomF = Math.random; // alias
const randomI = (value) => Math.round(randomF() * value);
const randomA = function(...args) { // equaly weighted random pick
  return args[Math.round(randomF() * args.length - 0.5)];
}

const switcher = function (states, callback) {
  let selected = 0;
  return function() {
    selected++;
    if (selected > states.length-1) selected = 0;
    callback(states[selected]);
  }
}

async function Init(document) {
  const debug = {
    showPointer: false,
  };
  const canvas = new Canvas({smoothing: false, depth: 9, blur: 0.8});
  canvas.bind(document.body);
  // key entities ref
  let Game = {
    state: false, // false=paused, true=running
    visible: true,
    player: undefined, // player object in `Game.actors`
    doodads: undefined, // non-physical objects/decorations (big decorations), no Z-ordering (0-9)
    objects: undefined, // array of all active objects, with Z-ordering (0-9), bullets/projectiles included
    particles: undefined, // non-physical particles, small, shortliving, no Z-ordering
    pause() {
      if (!this.state) return;
      this.state = false;
      this.time.scale(0.1);
      this.backTime.scale(0.1);
    },
    unpause() { // aka run()
      if (this.state) return;
      this.state = true;
      this.time.scale(1);
      this.backTime.scale(1);
    },
    time: Timer().scale(0.1),
    backTime: Timer().scale(0.1),
  };
  canvas.timer = Game.time;
  // load and define sprites
  const starsAtlas = await Atlas('./sprites.png', [
    { id:'st1', bounds: [  0,  0,  8,  8] }, // small white
    { id:'st2', bounds: [  8,  0,  8,  8] }, // bright blue
    { id:'st3', bounds: [  0,  8,  8,  8] }, // diagonal green
    { id:'st4', bounds: [ 16,  0, 16, 16] }, // big purple
    { id:'st5', bounds: [  8,  8,  8,  8] }, // orange bubble
    { id:'spark1', bounds: [  0, 16,  4, 32] },
    { id:'spark2', bounds: [  4, 16,  4, 32] },
  ]);
  const asteroidsAtlas = await Atlas('./asteroids.png', [
    { id:'asteroid1', bounds: [ 0, 0, 56, 48] }, // small asteroid
    { id:'asteroid2', bounds: [ 0, 48, 112, 80] }, // big asteroid
  ]);
  const projectilesAtlas = await Atlas('./projectiles.png', [
    { id:'plasmaBlue', bounds: [ 0, 0, 8, 16] },
    { id:'plasmaBlueEnd', bounds: [ 8, 0, 8, 16], animate: { frames: 6, fps: 40} },

  ]);
  const shipsAtlas = await Atlas('./star-ship.png', [
    { id: 'playerShip', bounds: [ 0, 0, 155, 108], bodyOffset: 'auto' }, // player ship
  ]);
  const shipsBurst = await Atlas('./star-ship-fire.png', [
    { id: 'playerBurst', bounds: [0,0,16,32], animate: { frames: 6, fps: 20 }, bodyOffset: 'auto'},
  ]);
  
  // entities
  Game.objects = new Objects('Objects', 2000);
  Game.player = Game.objects.add({
    x: canvas.width / 2, y: canvas.height / 2 + 200,
    z: 8,
    oX: canvas.width / 2, oY: canvas.height / 2 + 200,
    sprite: shipsAtlas.byId('playerShip'),
    nextBurst: Game.time.now + 100,
    oldBurst: Game.time.now,
    barrelsPos: function () { return { x: this.x, y: this.y - 10, spread: 50} },
    body: { width: 80, height: 80},
  });
  Game.player.burst = Game.objects.add({
    x: Game.player.x+1,
    y: Game.player.y+70,
    z: 9,
    size: 1,
    blend: 'additive',
    sprite: shipsBurst.byId('playerBurst'),
    step: function() {
      this.x = Game.player.x+1;
      this.y = Game.player.y+70;
    }
  });
  // if (p === Game.player) {
  //   ctx.globalAlpha = p.alpha;
  //   ctx.globalCompositeOperation='screen';
  //   ctx.drawImage(...playerBurst({x: p.x+1, y: p.y+70, now: Game.backTime.now, delta}));
  // }
      
  // const playerBurst = shipsBurst.byId('playerBurst');


  let asteroidsCount = 0;
  let asteroidsNext = 0;
  function asteroidSpawner(onScreen = false) {
    if (!onScreen && (asteroidsCount > 5 || Game.time.now < asteroidsNext)) return false;
    const rand = randomA(0,1);
    Game.objects.addX(1, {
      x: randomI(canvas.width),
      y: onScreen ? randomI(canvas.height) - canvas.height : -200,
      z: 3,
      size: 2,
      health: [100,200][rand],
      // vX: Math.random() * 40 - 10,
      vY: Math.random() * 100 + 280,
      sprite: asteroidsAtlas.byId(['asteroid1','asteroid2'][rand]),
      body: [{width: 84, height: 72}, {width: 168, height: 120}][rand],
      takeDamage: function(other, damage) {
        this.health -= damage;
        if (this.health <= 0) this.die(other);
      },
      die: function() {
        this.active = false;
        this.step = undefined;
        asteroidsCount = Math.max(0, --asteroidsCount);
      },
      step: function() {
        if (this.y > canvas.height + 200) {
          this.active = false;
          asteroidsCount = Math.max(0, --asteroidsCount);
        }
      }
    });
    asteroidsCount++;
    asteroidsNext = Game.time.now + randomI(1000);
    return true;
  }

  Game.player.step = ({now, delta}) => {
    if (Game.player.dest) {
      Game.player.vX = (Game.player.dest.x - Game.player.x) * 10;
      Game.player.vY = (Game.player.dest.y - Game.player.y) * 10;
    }
    const burstCount = 1 + randomI(2 + Math.min(0, Game.player.vY) / -200);
    if (Game.backTime.now > Game.player.oldBurst + 330 / burstCount && Game.particles) {
      const microOffset = [Game.player.x - Game.player.oX, Game.player.y - Game.player.oY];
      Game.particles.addX(burstCount, {}, function(i, r) {
        this.x = Game.player.x + randomF() * 19 - 9 + microOffset[0] * r;
        this.y = Game.player.y - randomF() * 20 + 70 + microOffset[1] * r;
        this.vY = 500 + randomF() * 100;
        // this.vX = Game.player.vX;
        // this.color = '#F80';
        this.color = `rgb(255,127,40)`;
        this.alpha = 0.8;
        this.size = 4;
        this.ttl = Game.backTime.now + 600;
        this.step = function({now, delta}) {
          this.timespan = (this.ttl - now) / 600;
          this.size = Math.max(0, 5 * Math.sin(Math.pow(this.timespan,4) * Math.PI));
          this.alpha = this.timespan ** 2;
        };
        // Game.player.nextBurst = Game.backTime.now + 30 + Math.min(Math.max(0, 3000 / (Game.player.vY + 1500)), 1) * 100;
        // Game.player.nextBurst = Game.backTime.now + 230 / (Math.round(Math.max(600-Game.player.vY,0) / 500) || 1);
        // Game.player.nextBurst = Game.backTime.now + 230 / burstCount;
        Game.player.oldBurst = Game.backTime.now;
      });
    }
    Game.player.oX = Game.player.x;
    Game.player.oY = Game.player.y;
  };

  Game.particles = new Objects('Particles', 10000)
    .addX(30, {}, function() {
      this.x = randomF() * canvas.width;
      this.y = randomF() * canvas.height - 100;
      this.vY = 600 + randomF() * 300;
      this.sprite = starsAtlas.byId(randomA('spark1','spark2')),
      this.alpha = 0.3;
      this.step = function () {
        if (this.y > canvas.height) {
          this.x = randomF() * canvas.width;
          this.y = -100;
          this.vY = 600 + randomF() * 300;
        }
      };
    });
  Game.doodads = new Objects('Doodads', 1000)
    .addX(90, {size: 1}, function(index) {
      this.x = Math.floor(canvas.width  * randomF());
      this.y = Math.floor(canvas.height * randomF());
      this.vY = 10 + 70 * Math.pow(randomF(),2);
      this.sprite = starsAtlas.byId(randomA('st1', 'st2', 'st3', 'st4', 'st5'));
      this.blend = 'additive';
      this.freq = randomF();
      this.size = this.vY < 40 ? 1 : 2;
      this.step = function({now}) {
        this.alpha = 0.3 + Math.min(0.7, (this.freq * 0.5) + 0.7 * Math.abs(Math.cos(now/90*this.freq + index)));
        if (this.y > canvas.height) {
          this.x = randomF() * canvas.width;
          this.y = -20;
        }
      }
    });

  const shooter = new Weapons(Game.objects, Game.particles);
  shooter.sprites.plasmaBlue = projectilesAtlas.byId('plasmaBlue');
  shooter.sprites.plasmaBlueEnd = projectilesAtlas.byId('plasmaBlueEnd');
  let fireOn = false;

  // Input
  const pointer = Pointer({
    pos: {x: Game.player.x,y: Game.player.y},
    bounds: { left: 0, right: canvas.width, top: 0, bottom: canvas.height },
  });
  pointer.handleDown = (e) => fireOn = true;
  pointer.handleUp = (e) => fireOn = false;
  pointer.handleMove = (e) => {
    Game.player.dest = {x: e.x, y: e.y};
  };
  function mouseMoveHandler(e) { pointer.onMove(e) }
  document.addEventListener('pointerlockchange', (e) => {
    if(document.pointerLockElement === canvas.element) {
      document.addEventListener("mousemove", mouseMoveHandler, false);
      pointer.isOn = true;
      Game.unpause();
    } else {
      document.removeEventListener("mousemove", mouseMoveHandler, false);
      Game.pause();
      pointer.isOn = false;
      document.exitPointerLock();
    }
  });
  // document.addEventListener('pointerlockerror', console.log);
  document.addEventListener('mousedown', (e) => { 
    if (!pointer.isOn) {
      // pointer.set([e.offsetX, e.offsetY]);
      canvas.element.requestPointerLock();
    }
    pointer.handleDown(e);
  });
  document.addEventListener('mouseup', (e) => { if (pointer.isOn) pointer.handleUp(e) });
  document.addEventListener("visibilitychange", function() {
    canvas._draw = Game.visible = document.visibilityState === 'visible';
    if (Game.visible) Game.pause(); else Game.unpause();
  });
  const bodyDebug = switcher([0,1], (v)=>{canvas.drawDebug=v});
  document.addEventListener('keyup', function(e) {
    const now = Game.time.now;
    if (e.code === 'Digit1' && shooter.weaponId !== 'plasma') {
      shooter.switch('plasma',now);
    } else if (e.code === 'Digit2' && shooter.weaponId !== 'splash' && false) {
      shooter.switch('splash',now);
    } else if (e.code === 'F2') {
      bodyDebug();
    } else if (e.code === 'KeyF') {
      canvas.element.requestFullscreen().catch(console.log);
    } else if (e.code === 'Escape' || e.code ==='KeyZ') {
      document.exitPointerLock();
      if (document.fullscreen) document.exitFullscreen();
    }
  });
  document.addEventListener('fullscreenchange', e => { canvas.fullscreen = document.fullscreen; });
  
  const ctx = canvas.ctx;
  
  function tick(prev = new Date().getTime()) {
    // const now = new Date().getTime();
    // const delta = Game.paused ? 0 : ((now - prev) || 0);
    // const time = Game.time.calc(prev);
    const {real, realDelta, now, delta} = Game.time.calc(prev);
    Game.backTime.calc(prev);
    
    window.requestAnimationFrame(()=>tick(real));
    
    // Process part    
    if (fireOn) shooter.shoot({now, delta}, Game.player.barrelsPos(), Game.player);
    asteroidSpawner();

    Game.doodads.process({now,delta});
    Game.objects.process({now,delta});
    Game.particles.process(Game.backTime);

    // Render part
    if (canvas._draw) {
      canvas.clear();
      canvas.renderObjects(Game.doodads.items, {now, delta}); // render stars
      canvas.renderObjects(Game.objects.items, {now, delta}); // render objects
      canvas.renderObjects(Game.particles.items, {now, delta}); // render particles

      // layer with text
      if (canvas.drawDebug)
        canvas.renderInfo([
          `[${pointer.pos.x}, ${pointer.pos.y}] + [${Math.round(Game.player.vX)},${Math.round(Game.player.vY)}]`,
          `${realDelta}ms - ${Math.floor(1000/realDelta)} FPS`,
          pointer.isOn ? "Lock ✔" : 'Lock',
          'Fullscreen - ' + (canvas.fullscreen?'ON':'OFF'),
          shooter.weaponId,
          `Active count - ${Game.objects.activeCount}`,
          `Asteroids count - ${asteroidsCount}`
        ]);
    }
      
    // drawing pointer(mouse)
    if (debug.showPointer && pointer.isOn) canvas.drawPointer(pointer.pos);
  }
  tick();
}

window.onload = ()=>Init(document);
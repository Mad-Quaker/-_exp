import { Objects } from './objects.js';
import { Atlas } from './atlas.js';
import { Renderer } from './renderer.js';
import { Mouse } from './mouse.js';
import { Weapons } from './weapons.js';
import { Timer } from './timer.js';
import { randomF, randomI, randomA, switcher } from './utility.js';

async function Init(document) {
  const debug = {
    showPointer: false,
  };
  const renderer = new Renderer({smoothing: false, depth: 9, blur: 0.8});
  // key entities ref
  let Game = {
    state: false, // false=paused, true=running
    visible: true,
    player: undefined, // player object in `Game.actors`
    doodads: undefined, // non-physical objects/decorations (big decorations), no Z-ordering
    objects: undefined, // array of all active objects, with Z-ordering (0-9), bullets/projectiles included
    particles: undefined, // non-physical particles, small, shortliving, no Z-ordering
    pause() {
      if (!this.state) return;
      this.state = false;
      this.time.scale(0.1);
    },
    unpause() { // aka run()
      if (this.state) return;
      this.state = true;
      this.time.scale(1);
    },
    time: new Timer().scale(0.1),
  };
  renderer.timer = Game.time;
  // load and define sprites
  const Sprites = renderer.atlas = new Atlas();
  Sprites
    .load('./images/sprites.png', [
      { id:'st1', bounds: [  0,  0,  8,  8] }, // small white
      { id:'st2', bounds: [  8,  0,  8,  8] }, // bright blue
      { id:'st3', bounds: [  0,  8,  8,  8] }, // diagonal green
      { id:'st4', bounds: [ 16,  0, 16, 16] }, // big purple
      { id:'st5', bounds: [  8,  8,  8,  8] }, // orange bubble
      { id:'spark1', bounds: [  0, 16,  4, 32] },
      { id:'spark2', bounds: [  4, 16,  4, 32] },
    ])
    .load('./images/asteroids.png', [
      { id:'asteroid1', bounds: [ 0, 0, 56, 48] }, // small asteroid
      { id:'asteroid2', bounds: [ 0, 48, 112, 80] }, // big asteroid
    ])
    .load('./images/projectiles.png', [
      { id:'plasmaBlue', bounds: [ 0, 0, 8, 16] },
      { id:'plasmaBlueHit', bounds: [ 8, 0, 16, 8], animate: { frames: 3, fps: 30} },
    ])
    .load('./images/star-ship.png', [
      { id: 'playerShip', bounds: [ 0, 0, 155, 108], bodyOffset: 'auto' }, // player ship
    ])
    .load('./images/star-ship-fire.png', [
      { id: 'playerBurst', bounds: [0,0,16,32], animate: { frames: 6, fps: 20 }, bodyOffset: 'auto'},
    ]);
  const isLoaded = await Sprites.isLoaded();
  
  // entities
  Game.objects = new Objects('Objects', 2000);
  Game.player = Game.objects.add({
    x: renderer.width / 2, y: renderer.height / 2 + 200,
    z: 8,
    size: 1,
    sprite: 'playerShip',
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
    sprite: Sprites.list.playerBurst,
    step: function() {
      this.x = Game.player.x+1;
      this.y = Game.player.y+70;
    }
  });
  let asteroidsCount = 0;
  let asteroidsNext = 0;
  function asteroidSpawner(onScreen = false) {
    if (!onScreen && (asteroidsCount > 5 || Game.time.now < asteroidsNext)) return false;
    const rand = randomA(0,1);
    Game.objects.addX(1, {
      x: randomI(renderer.width),
      y: onScreen ? randomI(renderer.height) - renderer.height : -200,
      z: 3,
      size: 2,
      health: [100,200][rand],
      // vX: Math.random() * 40 - 10,
      vY: Math.random() * 100 + 280,
      sprite: Sprites.list[['asteroid1','asteroid2'][rand]],
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
        if (this.y > renderer.height + 200) {
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
    const damping = Math.pow(0.0001,delta/1000);
    Game.player.vX = Game.player.vX * damping;
    Game.player.vY = Game.player.vY * damping;
    if (Game.player.x > renderer.width) Game.player.x = renderer.width;
    if (Game.player.x < 0) Game.player.x = 0;
    if (Game.player.y > renderer.height) Game.player.y = renderer.height;
    if (Game.player.y < 0) Game.player.y = 0;
    const burstCount = Math.min(1 + randomI(2 + Math.min(0, Game.player.vY) / -200), 10); // 10 as max
    if (Game.time.now > Game.player.oldBurst + 330 / burstCount && Game.particles) {
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
        this.ttl = Game.time.now + 600;
        this.step = function({now, delta}) {
          this.timespan = (this.ttl - now) / 600;
          this.size = Math.max(0, 5 * Math.sin(Math.pow(this.timespan,4) * Math.PI));
          this.alpha = this.timespan ** 2;
        };
        Game.player.oldBurst = Game.time.now;
      });
    }
    Game.player.oX = Game.player.x;
    Game.player.oY = Game.player.y;
  };

  Game.particles = new Objects('Particles', 20000)
    .addX(30, {}, function() {
      this.x = randomF() * renderer.width;
      this.y = randomF() * renderer.height - 100;
      this.vY = 600 + randomF() * 300;
      this.sprite = Sprites.list[randomA('spark1','spark2')],
      this.alpha = 0.3;
      this.step = function () {
        if (this.y > renderer.height) {
          this.x = randomF() * renderer.width;
          this.y = -100;
          this.vY = 600 + randomF() * 300;
        }
      };
    });
  Game.doodads = new Objects('Doodads', 1000)
    .addX(90, {size: 1}, function(index) {
      this.x = Math.floor(renderer.width  * randomF());
      this.y = Math.floor(renderer.height * randomF());
      this.vY = 10 + 70 * Math.pow(randomF(),2);
      this.sprite = Sprites.list[randomA('st1', 'st2', 'st3', 'st4', 'st5')];
      this.blend = 'additive';
      this.freq = randomF();
      this.size = this.vY < 40 ? 1 : 2;
      this.step = function({now}) {
        this.alpha = 0.3 + Math.min(0.7, (this.freq * 0.5) + 0.7 * Math.abs(Math.cos(now/90*this.freq + index)));
        if (this.y > renderer.height) {
          this.x = randomF() * renderer.width;
          this.y = -20;
        }
      }
    });

  const shooter = new Weapons(Game.objects, Game.particles);
  shooter.sprites.plasmaBlue = Sprites.list.plasmaBlue;
  shooter.sprites.plasmaBlueHit = Sprites.list.plasmaBlueHit;
  let fireOn = false;

  // Input
  const pointer = Mouse({
    pos: {x: Game.player.x,y: Game.player.y},
  });
  pointer.handleDown = (e) => fireOn = true;
  pointer.handleUp = (e) => fireOn = false;

  function mouseMoveHandler(e) { pointer.onMove(e) }
  document.addEventListener('pointerlockchange', (e) => {
    if(document.pointerLockElement === renderer.canvas) {
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
      renderer.canvas.requestPointerLock();
    }
    pointer.handleDown(e);
  });
  document.addEventListener('mouseup', (e) => { if (pointer.isOn) pointer.handleUp(e) });
  document.addEventListener("visibilitychange", function() {
    Game.visible = document.visibilityState === 'visible';
    renderer.setOnOff(Game.visible);
    if (Game.visible) Game.pause(); else Game.unpause();
  });
  const bodyDebug = switcher(['off','body','sprite'], (v)=>{renderer.drawDebug=v});
  const rendererToggle = switcher([true,false], v=>renderer.setOnOff(v));
  document.addEventListener('keyup', function(e) {
    const now = Game.time.now;
    // e.preventDefault();
    if (e.code === 'Digit1' && shooter.weaponId !== 'plasma') {
      shooter.switch('plasma',now);
    } else if (e.code === 'Digit2' && shooter.weaponId !== 'splash' && false) {
      shooter.switch('splash',now);
    } else if (e.code === 'F4') {
      rendererToggle();
    } else if (e.code === 'F2') {
      bodyDebug();
    } else if (e.code === 'KeyF') {
      renderer.canvas.requestFullscreen().catch(console.log);
    } else if (e.code === 'Escape' || e.code ==='KeyZ') {
      document.exitPointerLock();
      if (document.fullscreen) document.exitFullscreen();
    }
  });
  document.addEventListener('fullscreenchange', e => { renderer.fullscreen = document.fullscreen; });
  
  function tick(prev = new Date().getTime()) {
    const {real, realDelta, now, delta} = Game.time.calc(prev);
    const mouseObj = pointer.get();
    Game.player.vX = Game.player.vX + mouseObj.vX * 2; //
    Game.player.vY = Game.player.vY + mouseObj.vY * 2; //
    
    window.requestAnimationFrame(()=>tick(real));
    
    // Process part    
    if (fireOn) shooter.shoot({now, delta}, Game.player.barrelsPos(), Game.player);
    asteroidSpawner();

    Game.doodads.process({now,delta});
    Game.objects.process({now,delta});
    Game.particles.process({now,delta});

    // Render part
    if (renderer._draw) {
      renderer.clear();
      renderer.renderObjects(Game.doodads.items, {now, delta}); // render stars
      renderer.renderObjects(Game.objects.items, {now, delta}); // render objects
      renderer.renderObjects(Game.particles.items, {now, delta}); // render particles

      // const realActiveParticles = Game.particles.items.reduce((a,c)=>a+(c && c.active ? 1 : 0),0);

      // layer with text
      // if (renderer.drawDebug !== 'off')
        renderer.renderInfo([
          `[${pointer.pos.x}, ${pointer.pos.y}] + [${Math.round(Game.player.vX)},${Math.round(Game.player.vY)}]`,
          `${realDelta}ms - ${Math.floor(1000/realDelta)} FPS`,
          pointer.isOn ? "Lock ✔" : 'Lock',
          'Fullscreen - ' + (renderer.fullscreen?'ON':'OFF'),
          shooter.weaponId,
          `Active obj(${Game.objects.activeCount}), fx(${Game.particles.activeCount})`,
          `Debug: ${renderer.drawDebug}`,
        ], {width: 170});
    }
      
    // drawing pointer(mouse)
    if (debug.showPointer && pointer.isOn) renderer.drawPointer(pointer.pos);
  }
  tick();
}

window.onload = ()=>Init(document);
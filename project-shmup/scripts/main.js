import { Objects } from './objects.js';
import { Atlas } from './atlas.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { Weapons } from './weapons.js';
import { Timer } from './timer.js';
import { randomF, randomI, randomA, switcher } from './utility.js';

const debug = {
  showPointer: false,
};
const renderer = new Renderer({ /* width: 960, height: 600, */ noUpScale: true, smoothing: false, depth: 9, blur: 0.8});
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
renderer.loadBundle('./images/bundle.json');

// entities
Game.objects = new Objects('Objects', 2000);
Game.player = Game.objects.add({
  x: renderer.width / 2, y: renderer.height * 0.55,
  z: 8,
  size: 1,
  sprite: 'playerShip',
  nextBurst: Game.time.now + 100,
  oldBurst: Game.time.now,
  barrelsPos: function () { return { x: this.x, y: this.y - 10, spread: 50} },
  body: { width: 80, height: 80},
});
Game.player.burst = Game.objects.add({
  x: 1,
  y: 70,
  z: 9,
  size: 1,
  blend: 'additive',
  sprite: 'playerBurst',
  parent: Game.player,
});
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
    sprite: ['asteroid1','asteroid2'][rand],
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

Game.particles = new Objects('Particles', 20000)
  .addX(30, {}, function() {
    this.x = randomF() * renderer.width;
    this.y = randomF() * renderer.height - 100;
    this.vY = 600 + randomF() * 300;
    this.sprite = randomA('spark1','spark2'),
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
    this.sprite = randomA('st1', 'st2', 'st3', 'st4', 'st5');
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

const shooter = new Weapons(Game.objects, Game.particles, Game.time);
let fireOn = false;

// Input
const input = new Input({
  contextDisabled: true,
  lockable: true,
  onLockChange: (on)=> Game.time.scale(on ? 1 : 0.1),
});

document.addEventListener("visibilitychange", function() {
  Game.visible = document.visibilityState === 'visible';
  renderer.setOnOff(Game.visible);
  if (Game.visible) Game.pause(); else Game.unpause();
});
const bodyDebug = switcher(['off','body','sprite'], (v)=>{renderer.drawDebug=v});
const rendererToggle = switcher([true,false], v=>renderer.setOnOff(v));

input.bind('F4', (e)=>{ if (e.down) rendererToggle() })
.bind('F2', (e)=>{ if (e.down) bodyDebug(); })
.bind('Digit1', (e)=>{ if (e.down) shooter.switch('plasma') })
.bind('Digit2', (e)=>{ if (e.down) shooter.switch('splash') })
.bind('KeyF', (e)=>{ if (e.down) renderer.canvas.requestFullscreen().catch(console.log)})

function tick(prev = new Date().getTime()) {
  const {real, realDelta, now, delta} = Game.time.calc(prev);
  const mouseState = input.mouse.getState();
  Game.player.vX = Game.player.vX + mouseState.vX * 2; //
  Game.player.vY = Game.player.vY + mouseState.vY * 2; //
  
  window.requestAnimationFrame(()=>tick(real));
  
  // Process part    
  if (input.mouse.isButtonHeld(0)) shooter.shoot({now, delta}, Game.player.barrelsPos(), Game.player);
  asteroidSpawner();

  Game.doodads.process({now,delta});
  Game.objects.process({now,delta});
  Game.particles.process({now,delta});

  // Render part
  if (renderer._draw) {
    renderer.clear();
    // renderer.render(rootEntity, {now, delta});
    renderer.renderObjects(Game.doodads.items, {now, delta}); // render stars
    renderer.renderObjects(Game.objects.items, {now, delta}); // render objects
    renderer.renderObjects(Game.particles.items, {now, delta}); // render particles

    // const realActiveParticles = Game.particles.items.reduce((a,c)=>a+(c && c.active ? 1 : 0),0);

    // layer with text
    // if (renderer.drawDebug !== 'off')
      renderer.drawInfo([
        `[${mouseState.x}, ${mouseState.y}] + [${Math.round(Game.player.vX)},${Math.round(Game.player.vY)}]`,
        `${realDelta}ms - ${Math.floor(1000/realDelta)} FPS`,
        input.isFocused ? "Lock ✔" : 'Lock',
        'Fullscreen - ' + (renderer.fullscreen?'ON':'OFF'),
        shooter.weaponId,
        `Active obj(${Game.objects.activeCount}), fx(${Game.particles.activeCount})`,
        `Debug: ${renderer.drawDebug}`,
      ], {width: 170});
  }
    
  // drawing pointer(mouse)
  if (debug.showPointer && input.isFocused) renderer.drawPointer(input.mouse.pos);
}
renderer.isReady().then(()=>{
  tick();
});

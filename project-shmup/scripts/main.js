import { Objects } from './objects.js';
import { Atlas } from './atlas.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { Weapons } from './weapons.js';
import { Timer } from './timer.js';
import { Spawn, SpawnX, Process, Render, ListDebug } from './list.js';
import { randomF, randomI, randomA, switcher } from './utility.js';

const debug = {
  showPointer: false,
};
const renderer = new Renderer({ /* width: 960, height: 600, // */  noUpScale: true, smoothing: false, depth: 9, blur: 0.7});
// key entities ref
let Game = {
  state: false, // false=paused, true=running
  visible: true,
  player: undefined, // player object in `Game.actors`
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
Game.player = Spawn({
  x: renderer.width / 2, y: renderer.height * 0.55,
  vX: 0,
  z: 8,
  size: 1,
  sprite: 'playerShip',
  nextBurst: Game.time.now + 100,
  oldBurst: Game.time.now,
  barrelsPos: function () { return { x: this.x, y: this.y - 10, spread: 50} },
  body: { width: 80, height: 80},
});
Game.player.burst = Spawn({
  x: 1,
  y: 70,
  z: 8,
  size: 1,
  blend: 'additive',
  sprite: 'playerBurst',
  parent: Game.player,
});
Game.player.step = ({now, delta}) => {
  const damping = Math.pow(0.0001,delta);
  Game.player.vX = Game.player.vX * damping;
  Game.player.vY = Game.player.vY * damping;
  if (Game.player.x > renderer.width) Game.player.x = renderer.width;
  if (Game.player.x < 0) Game.player.x = 0;
  if (Game.player.y > renderer.height) Game.player.y = renderer.height;
  if (Game.player.y < 0) Game.player.y = 0;
  const burstCount = Math.min(1 + randomI(2 + Math.min(0, Game.player.vY) / -200), 10); // 10 as max
  if (Game.time.now > Game.player.oldBurst + 0.333 / burstCount && Game.particles) {
    const microOffset = [Game.player.x - Game.player.oX, Game.player.y - Game.player.oY];
    SpawnX(burstCount, {z: Game.player.z, blend: 'additive'}, function(i, r) {
      this.x = Game.player.x + randomF() * 19 - 9 + microOffset[0] * r;
      this.y = Game.player.y - randomF() * 20 + 70 + microOffset[1] * r;
      this.vY = 500 + randomF() * 100;
      // this.vX = Game.player.vX;
      // this.color = '#F80';
      this.color = `rgb(255,127,40)`;
      this.alpha = 0.8;
      this.size = 4;
      this.ttl = Game.time.now + 0.6;
      this.step = function({now, delta}) {
        this.timespan = (this.ttl - now) / 0.6;
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
  Spawn({
  // Game.objects.add({
    x: randomI(renderer.width),
    y: onScreen ? randomI(renderer.height) - renderer.height : -200,
    z: 7,
    size: 2,
    health: [200,300][rand],
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
  asteroidsNext = Game.time.now + randomF();
  return true;
}

Game.particles = new Objects('Particles', 20000)
// sparks
SpawnX(30, {z: 9}, function() {
  this.x = Math.floor(renderer.width  * randomF());
  this.y = Math.floor(renderer.height * randomF());
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
// Stars
SpawnX(90, {size: 1, z: 0}, function(index) {
  this.x = Math.floor(renderer.width  * randomF());
  this.y = Math.floor(renderer.height * randomF());
  this.vY = 10 + 70 * Math.pow(randomF(),2);
  this.sprite = randomA('st1', 'st2', 'st3', 'st4', 'st5');
  this.blend = 'additive';
  this.freq = randomF();
  this.size = this.vY < 40 ? 1 : 2;
  this.step = function({now}) {
    this.alpha = 0.1 + Math.min(0.9, (this.freq * 0.5) + 0.9 * Math.abs(Math.cos(now * 1000 /90*this.freq + index)));
    // this.alpha = 0.5 + Math.cos(now) * 0.5;
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
.bind('F3', (e)=>{ if (e.up) {
    // ListDebug(v=>({z:v.z,sprite:v.sprite}));
    console.log(Game.time);
  }
 })
.bind('Digit1', (e)=>{ if (e.down) shooter.switch('plasma') })
.bind('Digit2', (e)=>{ if (e.down) shooter.switch('splash') })
.bind('KeyF', (e)=>{ if (e.down) renderer.canvas.requestFullscreen().catch(console.log)})

function tick(prev = new Date().getTime()) {
  const {real, realDelta, now, delta} = Game.time.calc(prev);
  const mouseState = input.mouse.getState();
  Game.player.vX = Game.player.vX + mouseState.vX * 2; //
  Game.player.vY = Game.player.vY + mouseState.vY * 2; //
  
  // Process part    
  if (input.mouse.isButtonHeld(0)) shooter.shoot({now, delta}, Game.player.barrelsPos(), Game.player);
  asteroidSpawner();

  const objCount = Process({now,delta});

  // Render part
  if (renderer._draw) {
    renderer.clear();
    
    // custom Render
    Render(obj=>renderer.renderOneObject(obj,{now, delta}));
    
    // layer with text
    // if (renderer.drawDebug !== 'off')
      renderer.drawInfo([
        `[${mouseState.x}, ${mouseState.y}] + [${Math.round(Game.player.vX)},${Math.round(Game.player.vY)}]`,
        `${Math.floor(now)}s :: ${realDelta}ms - ${Math.floor(1000/realDelta)} FPS`,
        input.isFocused ? "Lock ✔" : 'Lock',
        'Fullscreen - ' + (renderer.fullscreen?'ON':'OFF'),
        shooter.weaponId,
        `Active obj list(${objCount})`,
        `Debug: ${renderer.drawDebug}`,
      ], {width: 170});
  }
    
  // drawing pointer(mouse)
  if (debug.showPointer && input.isFocused) renderer.drawPointer(input.mouse.pos);

  window.requestAnimationFrame(()=>tick(real));
  // setTimeout(()=>tick(real),100);
}
renderer.isReady().then(()=>{
  // ListDebug();
  tick();
});

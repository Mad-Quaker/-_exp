import { Objects } from './objects.js';
import { Spawn, SpawnX } from './list.js';

export class Weapons {
  weapons = [];
  weaponId = undefined;
  fireCooldown = false;
  constructor (time) {
    // if (!bulletsScope || !particlesScope) throw Error("Objects['Actors'] and Objects['Particles'] should be provided for new Weapons(bullets, particles)!");
    // this.bullets = bulletsScope;
    // this.particles = particlesScope;
    //
    this.selected = 'plasma';
    this.switchDelay = .5;
    this.fireCooldown = 0;
    this.time = time;
    this.init();
  }
  add (weaponId, options, _F) {
    this.weapons[weaponId] = { ...options, fire: _F};
    if (this.weaponId === undefined) this.weaponId = weaponId;
  }
  switch (weaponId) { this.weaponId = weaponId; this.fireCooldown = this.time.now + this.switchDelay };
  shoot ({now, delta, _scale}, position, owner) {
    if (this.weaponId === undefined || this.fireCooldown > now) return;
    this.weapons[this.weaponId].fire({now, delta}, position, owner);
    this.fireCooldown = now + 1 / (this.weapons[this.weaponId].shotsPerSec || 10);
  }
  init () {
    const particles = this.particles;
    // weapon - 1 - plasma
    this.add('plasma', {shotsPerSec: 10}, ({now,delta}, position, owner) => {
      // this.bullets.addX(2, {...position, now, z: 8, size: 2, blending: 'additive', owner, damage: 20 }, function(i,r) {
      SpawnX(2, {...position, now, z: owner.z, size: 2, blending: 'additive', owner, damage: 20 }, function(i,r) {
        // this.y = this.y - r * 8;
        // this.x = this.x + (r*20-10);
        if (position.spread) {
          this.x = this.x + r * position.spread - position.spread / 2;
        } else {
          this.x = this.x + Math.random() * 10 - 5;
        }
        // this.vX = Math.random() * 20 - 10;

        this.vY = -1500;
        this.ttl = now + .7;
        this.alpha = 1;
        this.sprite = 'plasmaBlue';
        this.blend = 'additive';
        this.body = {width: 14, height: 24};
        this.touch = function (other, {now, delta, subDelta}) {
          if (other === this.owner || other.owner === this.owner) return false;
          if (other.takeDamage) other.takeDamage(this, this.damage);
          // this.y = other.body.bottom + this.body.height/2;
          this.y = this.y + this.vY * subDelta;
          this.touch = undefined;
          this.sprite = 'plasmaBlueHit';
          this.bodyColor = '#F00';
          this.phase = now;
          // this.size = 2;
          this.vX = 0;
          this.vY = other.vY;
          this.ttl = now + .099; // 1000/30*3
          // return true;
          SpawnX(3, {
            x: this.x,
            y: this.y,
            z: this.z - 1,
            blend: 'additive',
            color: '#8ad4e4',
            size: 0.1,
          }, function () {
            this.vX = Math.random() * 500 - 250;
            this.vY = 500;
            const randomTime = .05 + Math.random() * .2;
            this.ttl = now + randomTime;
            this.step = function({now}) {
              const timespan = Math.max(0, this.ttl - now) / randomTime;
              this.size = 1+Math.max(0,1-timespan) * 3;
              this.alpha = timespan ** 0.5;
            }
          });
          return true;
        }
      })
    });
    // weapon - 2 - splash
    this.add('splash', {shotsPerSec: 1.3}, ({now,delta}, position) => {
      // this.bullets.addX(100, {...position, now}, function(i,r) {
      SpawnX(100, {...position, now}, function(i,r) {
        const ang = r * 2 * Math.PI;
        const speed = 350 + Math.random() * 300;
        // const speed = 100;
        this.vX = Math.cos(ang) * speed;
        this.vY = Math.sin(ang) * speed;
        this.ttl = now + 2;
        this.size = 3;
        this.color = '#FC6';
        this.step = function({now, delta}) {
          const timespan = 1 - (this.ttl - now) / 2;
          this.alpha = Math.pow((this.ttl - now) / 2, 4);
          this.size = 30 - 27 * (this.ttl - now) / 2;
          this.vX *= Math.pow(0.1, delta);
          this.vY *= Math.pow(0.1, delta);
        };
      })
    })        
  }
}
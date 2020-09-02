import { Objects } from './objects.js';

export class Weapons {
  weapons = [];
  weaponId = undefined;
  fireCooldown = false;
  constructor (bulletsObjects) {
    this.selected = 'plasma';
    this.switchDelay = 500;
    this.fireCooldown = 0;
    this.bullets = bulletsObjects || new Objects('Bullets', 10000);
    this.sprites = {};
    this.init();
  }
  add (weaponId, options, _F) {
    this.weapons[weaponId] = { ...options, fire: _F};
    if (this.weaponId === undefined) this.weaponId = weaponId;
  }
  switch (weaponId, {now}) { this.weaponId = weaponId; this.fireCooldown = now + this.switchDelay };
  shoot ({now, delta, _scale}, position, parent) {
    if (this.weaponId === undefined || this.fireCooldown > now) return;
    this.weapons[this.weaponId].fire({now, delta}, position, parent);
    this.fireCooldown = now + 1000 / (this.weapons[this.weaponId].shotsPerSec || 10);
  }
  init () {
    // weapon - 1 - plasma
    this.add('plasma', {shotsPerSec: 10}, ({now,delta}, position, parent) => {
      const plasmaBlue = this.sprites['plasmaBlue'];
      this.bullets.addX(2, {...position, now, z: 8, size: 2, blending: 'additive', parent }, function(i,r) {
        // this.y = this.y - r * 8;
        // this.x = this.x + (r*20-10);
        if (position.spread) {
          this.x = this.x + r * position.spread - position.spread / 2;
        } else {
          this.x = this.x + Math.random() * 10 - 5;
        }
        // this.vX = Math.random() * 20 - 10;

        this.vY = -1500;
        this.ttl = now + 700;
        this.alpha = 1;
        this.sprite = plasmaBlue;
        this.blending = 'additive';
        this.body = {width: 14, height: 24};
        this.touch = function (other) {
          if (other === this.parent) return;
          this.active = false;
        }
        // this.color = '#AAF';
      })
    });
    // weapon - 2 - splash
    this.add('splash', {shotsPerSec: 1.3}, ({now,delta}, position) => {
      this.bullets.addX(100, {...position, now}, function(i,r) {
        const ang = r * 2 * Math.PI;
        const speed = 350 + Math.random() * 300;
        this.vX = Math.cos(ang) * speed;
        this.vY = Math.sin(ang) * speed;
        this.ttl = now + 2000;
        this.size = 3;
        this.color = '#FC6';
        this.step = function({now}) {
          const timespan = 1 - (this.ttl - now) / 2000;
          this.alpha = Math.pow((this.ttl - now) / 2000, 4);
          this.size = 30 - 27 * (this.ttl - now) / 2000;
          this.vX *= Math.pow(0.05, delta / 1000);
          this.vY *= Math.pow(0.05, delta / 1000);
        };
      })
    })        
  }
}
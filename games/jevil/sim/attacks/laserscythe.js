

import { destroy, spawn } from '../entity.js';
import { spawnShake } from '../shake.js';
import { gmlRandom } from '../rng.js';
import { scrDamageAll } from '../damage.js';

export const laserscythe = {
  name: 'obj_laserscythe',
  objIndex: 273,

  create(e, state) {
    e.isBullet = true;
    e.componentMotion = true;
    e.grazed = 0;
    e.grazepoints = 15;
    e.timepoints = 0;
    e.target = 0;
    e.inv = 120;
    e.damage = 124;
    e.active = 1;
    e.image_xscale = 2;
    e.image_yscale = 2;
    e.image_angle = gmlRandom(state.gmlRng, 360);
    e.rotspeed = 14;
    e.hspeed = 0;
    e.vspeed = 5;
    e.mask_index = 'spr_joker_scythebody_mask';
    e.gravity = 1;
    e.explode = 0;
    e.explodetimer = 0;
    e.remrot = e.image_angle;
    e.remy = e.y;
    e.remx = e.x;
    e.scale = 2;
    e.sprite_index = 'spr_joker_scythebody';
  },

  step(e, state) {
    const roomHeight = state.roomHeight ?? 480;
    if (e.explode === 0) {
      e.remx = e.x;
      e.remy = e.y;
      e.image_angle += e.rotspeed;
      e.remrot = e.image_angle;
    }
    if (e.y >= roomHeight - 100 && e.explode === 0) {
      state.audio?.cue('snd_scytheburst', { restart: true });
      e.remx = e.x;
      e.remy = e.y;
      e.explode = 1;
      e.explodetimer = 0;
      e.remrot = e.image_angle;
      e.image_angle = 0;
      e.speed = 0;
      e.hspeed = 0;
      e.vspeed = 0;
      e.gravity = 0;
      e.mask_index = 'spr_tallpx';
      e.sprite_index = 'spr_tallpx';
      e.grazed = 0;
      e.y = 0;
      e.depth = (e.depth ?? 0) + 1;
    }
    if (e.explode === 1) {
      e.active = 0;
      e.image_xscale += 8;
      if (e.image_xscale >= 16) {
        e.active = 1;
      }
      if (e.image_xscale >= 32) {
        e.explode = 2;
      }
    }
    if (e.explode === 2) {
      e.image_xscale -= 4;
      if (e.image_xscale <= 16) {
        e.image_alpha -= 0.25;
        e.active = 0;
      }
      if (e.image_xscale <= 0) {
        destroy(e);
      }
    }
    if (e.grazed === 1) {
      for (const dc of state.entities) {
        if (dc.alive && dc.type.name === 'obj_dbulletcontroller') {
          dc.made += 0.2;
        }
      }
      e.grazed = 2;
    }
  },

  other15(b, state) {
    if (b.active !== 1) return;
    if (state.damageEnabled) {

      if (state.invTimer < 0) {
        spawnShake(state, spawn, { gated: false });
        if (state.soul && state.soul.alive) state.soul.dmgnoise = 1;
        state.audio?.cue('snd_hurt1', { restart: true });
        state.invTimer = state.invc * 40;
        const p = state.party;
        const temphp = [];
        for (let i = 0; i < 3; i += 1) {
          temphp[i] = p.hp[p.char[i]];
          if (temphp[i] < 0) temphp[i] = 0;
        }
        if (Math.ceil(temphp[0] + temphp[1] + temphp[2]) / 3 >= 10) {
          for (let i = 0; i < 3; i += 1) {
            if (temphp[i] > 0) {
              p.hp[p.char[i]] = Math.ceil(p.hp[p.char[i]] * 0.7);
            }
          }
        } else {

          scrDamageAll(state, b);
        }
      }
    }

  },
};

export const marker = {
  name: 'obj_marker',
  objIndex: 86,
};

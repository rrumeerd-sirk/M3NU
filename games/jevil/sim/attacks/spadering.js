


import { destroy, spawn } from '../entity.js';
import { gmlRandom } from '../rng.js';
import { lengthdirX, lengthdirY } from '../gml.js';
import { collidebullet, bulletInherit } from '../bullets/collidebullet.js';

function boxOf(state) {
  return state.entities.find((o) => o.alive && o.isSolid);
}

export const spadering = {
  name: 'obj_spadering',
  objIndex: 277,

  create(e, state) {
    e.ringno = 0;
    e.maxspade = 8;
    e.t = 0;
    e.con = 0;
    e.startspade = 0;
    e.spadet = 0;
    e.startang = gmlRandom(state.gmlRng, 360);
    e.grav = 0.2;
    e.size = 1;
    e.special = 0;
    e.side = 0;
    e.spade = [];
  },

  step(e, state) {
    const gt = boxOf(state);
    if (e.t === 0) {
      if (e.size > 1) {
        e.startang = -gmlRandom(state.gmlRng, 180);
      }
      for (let i = 0; i < e.maxspade; i += 1) {
        let spadeang = (360 / e.maxspade) * i + e.startang;
        if (e.side === 1) {
          spadeang = -spadeang;
        }
        const spadex = lengthdirX(300, spadeang + 180);
        const spadey = lengthdirY(300, spadeang + 180);
        const b = spawn(state, collidebullet, { x: spadex + gt.x, y: spadey + gt.y });
        bulletInherit(e, b);
        b.sprite_index = 'spr_spadebullet';
        b.image_alpha = 0;
        b.active = 1;
        b.image_blend = 'c_ltgray';
        b.direction = spadeang;
        b.image_angle = spadeang;
        b.speed = 26;
        b.image_xscale = e.size;
        b.image_yscale = e.size;
        e.spade[i] = b;
      }
    }
    if (e.t >= 1 && e.t < 15) {
      for (let i = 0; i < e.maxspade; i += 1) {
        const b = e.spade[i];
        if (b && b.alive) {
          b.speed *= 0.87;
          b.image_alpha += 0.1;
        }
      }
    }
    if (e.t === 15) {
      for (let i = 0; i < e.maxspade; i += 1) {
        const b = e.spade[i];
        if (b && b.alive) {
          b.speed = 0;
          b.image_alpha += 0.1;
        }
      }
    }
    if (e.t >= 15 && e.con === 0) {
      e.spadet += 1;
      if (e.special === 1) {
        e.spadet += 6;
      }
      if (e.spadet >= 4) {
        const b = e.spade[e.startspade];
        if (b && b.alive) {
          b.image_blend = 'c_white';
          b.gravity_direction = b.direction;
          b.speed = -3.4;
          b.gravity = e.grav;
        }
        e.startspade += 1;
        if (e.startspade >= e.maxspade) {
          e.con = 1;
          destroy(e);
        }
        e.spadet = 0;
      }
    }
    e.t += 1;
  },
};

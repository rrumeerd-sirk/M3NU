


import { scrDamage, scrDamageAll } from '../damage.js';
import { destroy } from '../entity.js';
import { gmlGreater, gmlLess } from '../gml.js';
import { setComponentSpeed } from '../index.js';

export const dbulletVert = {
  name: 'obj_dbullet_vert',
  objIndex: 238,

  create(e, state) {
    e.isBullet = true;
    e.componentMotion = true;
    e.hspeed = 0;
    e.vspeed = 0;
    if (e.y < state.view.y + 20) {
      e.y = state.view.y + 20;
    }
    if (e.y > state.view.y + 460) {
      e.y = state.view.y + 460;
    }
    e.difficulty = 1;
    e.times = 0;
    e.activetimer = 0;
    e.grazed = 0;
    e.grazepoints = 5;
    e.timepoints = 5;
    e.target = 0;
    e.dont = 1;
    e.inv = 120;
    e.damage = 124;
    e.active = 0;
    e.image_alpha = 0;
    if (!state.soul || !state.soul.alive) {
      destroy(e);
    }
    e.gmlType = 0;
    e.sprite_index = 'spr_diamondbullet_vert';
  },

  endStep(e, state) {

    e.drawn = [];
    if (e.dont === 0) {
      if (e.active === 0) {
        e.drawn.push([3 - e.image_alpha * 2, e.image_alpha]);

        if (gmlLess(e.image_alpha, 1)) {
          e.image_alpha += 0.1;
          if (e.gmlType === 1) {
            e.vspeed = 3;
            e.gravity = -0.5;
          }
        } else {
          if (e.gmlType === 0) {
            if (state.soul.y + 8 < e.y) {
              e.vspeed = 1;
              e.gravity = -0.2;
            } else {
              e.vspeed = -2;
              e.gravity = 1;
            }
          }
          e.active = 1;
        }
      }
      e.drawn.push([2 - e.image_alpha, e.image_alpha]);
      if (e.gmlType === 0) {

        if (gmlGreater(e.speed, 8)) {
          setComponentSpeed(e, 8);
        }
      }
      if (e.y > state.view.y + 500) {
        destroy(e);
      }
      if (e.y < state.view.y - 20) {
        destroy(e);
      }
    }
    e.dont = 0;
  },

  other15(b, state) {
    if (b.active !== 1) return;
    if (state.damageEnabled) {
      if (b.target !== 3) scrDamage(state, b);
      else scrDamageAll(state, b);
    }
    destroy(b);
  },
};

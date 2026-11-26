import { pointDirection } from '../gml.js';

import { destroy } from '../entity.js';
import { scrDamage, scrDamageAll } from '../damage.js';

export const collidebullet = {
  name: 'obj_collidebullet',
  objIndex: 201,

  create(e) {
    e.isBullet = true;
    e.builtinMotion = true;

  },

  other15(b, state) {
    if (b.active !== 1) return;
    if (state.damageEnabled) {
      if (b.target !== 3) {
        scrDamage(state, b);
      } else {
        scrDamageAll(state, b);
      }
    }
    destroy(b);
  },
};

export function bulletInherit(spawner, b) {
  b.damage = spawner.damage;
  b.grazepoints = spawner.grazepoints;
  b.timepoints = spawner.timepoints;
  b.inv = spawner.inv;
  b.target = spawner.target;
  b.grazed = 0;
  b.grazetimer = 0;
}

export function moveTowardsPoint(e, tx, ty, spd) {
  e.direction = pointDirection(e.x, e.y, tx, ty);
  e.speed = spd;
}

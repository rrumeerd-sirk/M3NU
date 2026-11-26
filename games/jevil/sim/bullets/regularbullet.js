


import { destroy } from '../entity.js';
import { scrDamage, scrDamageAll } from '../damage.js';

function regularCreate(e, state) {
  e.isBullet = true;
  e.builtinMotion = true;
  e.grazed = 0;
  e.grazepoints = 5;
  e.timepoints = 5;
  e.target = 0;
  e.dont = 1;
  e.inv = 60;
  e.damage = 124;
  e.active = 1;
  e.spec = 0;
  e.image_alpha = 1;
  if (!state.soul || !state.soul.alive) {
    destroy(e);
  }
  e.wall_destroy = 1;
}

function regularStep(e, state) {
  if (e.wall_destroy === 1) {
    if (e.x < state.view.x - 40) destroy(e);
    if (e.x > state.view.x + 680) destroy(e);
    if (e.y < state.view.y - 40) destroy(e);
    if (e.y > state.view.y + 520) destroy(e);
  }
}

export const regularbullet = {
  name: 'obj_regularbullet',
  objIndex: 203,
  create: regularCreate,
  step: regularStep,

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

export const regularbulletPermanent = {
  name: 'obj_regularbullet_permanent',
  objIndex: 204,
  create: regularCreate,
  step: regularStep,

  other15(b, state) {
    if (b.active !== 1) return;
    if (state.damageEnabled) {
      if (b.target !== 3) {
        scrDamage(state, b);
      } else {
        scrDamageAll(state, b);
      }
    }

  },
};

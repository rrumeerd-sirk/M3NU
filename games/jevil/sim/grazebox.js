

import { destroy } from './entity.js';

export const grazebox = {
  name: 'obj_grazebox',
  objIndex: 206,

  create(e, state) {
    e.grazetimer = 0;
    e.drawTimer = 0;
    state.grazebox = e;
  },

  endStep(e, state) {
    const h = state.soul;
    if (h && h.alive) {
      e.x = h.x + 10;
      e.y = h.y + 10;
    } else {
      destroy(e);
    }
  },

  drawStep(e, state) {
    const h = state.soul;
    if (h && h.alive) {
      e.x = h.x + 10;
      e.y = h.y + 10;
    }
    e.drawTimer = e.grazetimer;
    e.grazetimer -= 1;
  },
};

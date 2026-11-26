

import { destroy } from './entity.js';

function restoreView(e, state) {
  state.view.x = e.camerax;
  state.view.y = e.cameray;
}

export const shake = {
  name: 'obj_shake',
  objIndex: 147,

  create(e) {
    e.camera = 0;
    e.shakespeed = 1;
    e.shakesign = 1;
    e.shakex = 4;
    e.shakey = 4;
    e.siner = 0;
    e.active = 0;
    e.permashake = 0;
  },

  step(e, state) {
    if (e.active === 0) {
      e.camerax = state.view.x;
      e.cameray = state.view.y;
      if (!state.flag12) {
        state.view.x = e.camerax + e.shakex;
        state.view.y = e.cameray + e.shakey;
      }
      e.shakesign = -e.shakesign;
      e.active = 1;
      e.alarm[0] = e.shakespeed;
    }
  },

  alarm: {
    0: (e, state) => {
      if (!state.flag12) {
        state.view.x = e.camerax + e.shakex * e.shakesign;
        state.view.y = e.cameray + e.shakey * e.shakesign;
      }
      if (e.permashake === 0) {
        if (e.shakex > 0) e.shakex -= 1;
        if (e.shakey > 0) e.shakey -= 1;
      }
      e.shakesign = -e.shakesign;
      e.alarm[0] = e.shakespeed;
      if (e.shakex === 0 && e.shakey === 0) {
        restoreView(e, state);
        destroy(e);
      }
    },
  },
};

export function spawnShake(state, spawnFn, { gated = false } = {}) {
  if (gated && state.entities.some((o) => o.alive && o.type === shake)) return;
  spawnFn(state, shake, { x: 0, y: 0 });
}

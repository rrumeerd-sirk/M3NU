


import { destroy } from './entity.js';

export const tensionbar = {
  name: 'obj_tensionbar',
  objIndex: 333,
  builtinMotion: true,

  create(e, state) {
    e.tsiner = 0;
    state.tensionselect = 0;
    e.apparent = state.tension;
    e.current = state.tension;
    e.change = 0;
    e.changetimer = 15;
    e.red = 0;
    e.redtimer = 0;
    e.x = (state.view?.x ?? 0) - 40;
    e.y = (state.view?.y ?? 0) + 40;

    e.direction = 0;
    e.speed = 13;
    e.friction = 1;
    e.flashsiner = 0;
    e.tamtDrawn = 0;
    e.maxed = 0;
  },

  drawStep(e, state) {
    const maxt = state.maxtension;
    e.flashsiner += 1;
    const tamt = Math.floor((e.apparent / maxt) * 100);
    e.tamtDrawn = tamt;
    e.maxed = tamt >= 100 ? 1 : 0;
    if (Math.abs(e.apparent - state.tension) < 20) e.apparent = state.tension;
    if (e.apparent < state.tension) e.apparent += 20;
    if (e.apparent > state.tension) e.apparent -= 20;
    if (e.apparent !== e.current) {
      e.changetimer += 1;
      if (e.changetimer > 15) {
        const d = () => e.apparent - e.current;
        if (d() > 0) e.current += 2;
        if (d() > 10) e.current += 2;
        if (d() > 25) e.current += 3;
        if (d() > 50) e.current += 4;
        if (d() > 100) e.current += 5;
        if (d() < 0) e.current -= 2;
        if (d() < -10) e.current -= 2;
        if (d() < -25) e.current -= 3;
        if (d() < -50) e.current -= 4;
        if (d() < -100) e.current -= 5;
        if (Math.abs(d()) < 3) e.current = e.apparent;
      }
    }
    if ((state.tensionselect ?? 0) > 0) e.tsiner += 1;
  },

  alarm: {
    5: (e) => destroy(e),
  },
};


export function tensionbarLeave(state) {
  for (const e of state.entities) {
    if (e.alive && e.type === tensionbar) {
      e.alarm[5] = 15;

      e.direction = 180;
      e.speed = 10;
      e.friction = -0.4;
    }
  }
}

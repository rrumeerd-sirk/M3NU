


import { gmlRandom } from './rng.js';
import { destroy, spawn } from './entity.js';
import { mergeColor } from './gml.js';

const WHITE = [255, 255, 255];
const LIGHTF = mergeColor([128, 0, 128], WHITE, 0.6);
const LIGHTB = mergeColor([0, 255, 255], WHITE, 0.5);
const LIGHTG = mergeColor([0, 255, 0], WHITE, 0.5);
const COLORS = { 0: LIGHTB, 1: LIGHTF, 2: LIGHTG, 3: [0, 255, 0], 4: [255, 0, 0] };

export const dmgwriter = {
  name: 'obj_dmgwriter',
  objIndex: 312,
  componentMotion: true,

  create(e, state) {
    Object.assign(e, {
      spec: 0, delaytimer: 0, delay: 2, active: 0,
      damage: Math.round(gmlRandom(state.gmlRng, 600)),
      bounces: 0, dtype: -1, stretch: 0.2, stretchgo: 1,
      kill: 0, killtimer: 0, killactive: 0, specialmessage: 0,
      drawn: null,
      componentMotion: true,
    });
    for (const o of state.entities) {
      if (o.alive && o.type === dmgwriter && o.dtype !== 3) o.killtimer = 0;
    }
  },

  drawStep(e, state) {
    e.drawn = null;
    if (e.delaytimer < e.delay) {
      for (const o of state.entities) if (o.alive && o.type === dmgwriter) o.killtimer = 0;
    }
    e.delaytimer += 1;
    if (e.delaytimer === e.delay) {
      e.vspeed = -5 - gmlRandom(state.gmlRng, 2);
      e.hspeed = 10;
      e.vstart = e.vspeed;
      e.flip = 90;
    }
    if (e.delaytimer < e.delay) return;
    const color = COLORS[e.dtype] ?? WHITE;
    let message = e.specialmessage;
    if (e.damage === 0) message = 1;
    if (e.dtype === 4) message = 2;
    if (e.hspeed > 0) e.hspeed -= 1;
    if (e.hspeed < 0) e.hspeed += 1;
    if (Math.abs(e.hspeed) < 1) e.hspeed = 0;
    e.drawn = {
      message, color: message === 2 ? [255, 0, 0] : (message >= 3 ? [0, 255, 0] : color),
      text: String(e.damage), angle: e.spec === 1 ? 90 : 0,
      x: e.x + 30, y: e.y, xscale: 2 - e.stretch, yscale: e.stretch + e.kill, alpha: 1 - e.kill,
    };
    if (e.bounces < 2) e.vspeed += 1;
    if (e.y > e.ystart && e.bounces < 2 && e.killactive === 0) {
      e.y = e.ystart;
      e.vspeed = e.vstart / 2;
      e.bounces += 1;
    }
    if (e.bounces >= 2 && e.killactive === 0) {
      e.vspeed = 0;
      e.y = e.ystart;
    }
    if (e.stretchgo === 1) e.stretch += 0.4;
    if (e.stretch >= 1.2) {
      e.stretch = 1;
      e.stretchgo = 0;
    }
    e.killtimer += 1;
    if (e.killtimer > 35) e.killactive = 1;
    if (e.killactive === 1) {
      e.kill += 0.08;
      e.y -= 4;
    }
    if (e.kill > 1) destroy(e);
  },
};


export function makeDmgwriter(state, x, y, fields = {}) {
  const e = spawn(state, dmgwriter, { x, y });
  Object.assign(e, fields);
  return e;
}


export function dmgwritersKill(state) {
  for (const o of state.entities) {
    if (o.alive && o.type === dmgwriter && o.delaytimer >= 1) o.killactive = 1;
  }
}

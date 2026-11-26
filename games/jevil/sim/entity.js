


import { OBJECT_DEFAULTS } from './data/object-defaults.js';

export const ALARM_COUNT = 12;



export const F32_BUILTINS = [
  'x', 'y', 'xstart', 'ystart',
  'speed', 'direction',
  'image_angle', 'image_xscale', 'image_yscale',
  'image_index', 'image_speed', 'image_alpha',
  'friction', 'gravity', 'gravity_direction',
  'depth',
];





const ANGLE_BUILTINS = new Set(['direction', 'gravity_direction']);

function installF32Builtins(e) {
  const store = Object.create(null);
  for (const k of F32_BUILTINS) {
    const norm = ANGLE_BUILTINS.has(k)
      ? (v) => {

        const f = Math.fround(v);
        return Math.fround(((f % 360) + 360) % 360);
      }
      : (v) => Math.fround(v);
    const polar = k === 'speed' || k === 'direction';
    store[k] = typeof e[k] === 'number' ? norm(e[k]) : e[k];
    delete e[k];
    Object.defineProperty(e, k, {
      enumerable: true,
      configurable: true,
      get() {
        return store[k];
      },
      set(v) {
        store[k] = typeof v === 'number' ? norm(v) : v;

        if (polar) e.motionPolarWritten = true;
      },
    });
  }
}





const INSTANCE_DEFAULTS = {
  image_xscale: 1,
  image_yscale: 1,
  image_angle: 0,
  image_alpha: 1,
  image_index: 0,
  image_speed: 1,
  speed: 0,
  direction: 0,
  friction: 0,
  gravity: 0,
  gravity_direction: 270,
};



function objectDefaults(type) {
  const d = OBJECT_DEFAULTS[type.name];
  if (!d) return {};
  const out = { visible: d.visible, depth: d.depth };
  if (d.sprite) out.sprite_index = d.sprite;
  return out;
}

export function spawn(state, type, vars = {}) {
  const e = {
    seq: state.nextSpawnSeq++,
    type,
    alive: true,
    alarm: new Array(ALARM_COUNT).fill(-1),
    x: 0,
    y: 0,
    ...INSTANCE_DEFAULTS,
    ...objectDefaults(type),
    ...vars,
  };

  installF32Builtins(e);


  e.xstart = e.x;
  e.ystart = e.y;

  state.entities.push(e);
  if (type.create) type.create(e, state);
  return e;
}


export function destroy(e) {
  e.alive = false;
}





function phaseList(state) {

  return state.entities
    .filter((e) => e.alive)
    .sort((a, b) => (a.type.objIndex ?? 9999) - (b.type.objIndex ?? 9999) || a.seq - b.seq);
}

export function runPhase(state, phase) {
  state.eventPhase = phase;
  for (const e of phaseList(state)) {
    if (!e.alive) continue;
    const fn = e.type[phase];
    if (fn) fn(e, state);
  }
}



export function runAlarms(state) {
  state.eventPhase = 'alarm';
  for (const e of phaseList(state)) {
    if (!e.alive) continue;

    for (let i = 0; i < ALARM_COUNT; i++) {
      if (e.alarm[i] > 0) e.alarm[i] -= 1;

      if (e.alarm[i] === 0) {
        e.alarm[i] = -1;
        const fn = e.type.alarm && e.type.alarm[i];
        if (fn) {
          state.counters.alarmFires += 1;
          fn(e, state);
        }
      }
    }
  }
}


export function reap(state) {
  if (state.entities.some((e) => !e.alive)) {
    state.entities = state.entities.filter((e) => e.alive);
  }
}

import { bcDrawFlash } from './heroes.js';
import { SPRITE_FRAMES } from './data/object-defaults.js';
import { sinf, cosf } from './f32trig.js';


import { runPhase, runAlarms, reap } from './entity.js';
import { traceRow } from './trace.js';
import { spriteMaskHit } from './masks.js';
import { grazeBullet } from './graze.js';
import { gmlRandom } from './rng.js';

export { createState } from './state.js';
export { spawn, destroy, ALARM_COUNT } from './entity.js';
export { traceHeader, traceRow, real, int } from './trace.js';
export { createRng, rngNext, rngRandom, rngIrandom, rngRange, rngChoose, rngSnapshot, rngRestore } from './rng.js';
export { FPS, MS_PER_FRAME, drain } from './clock.js';



export const PHASES = ['animation', 'beginStep', 'alarm', 'step', 'motion', 'collision', 'endStep'];



const PI32 = Math.fround(Math.PI);


function fixupInteger(v) {
  const r = Math.round(v);
  return Math.abs(v - r) < 1e-4 ? r : v;
}



export function setComponentSpeed(e, speed) {
  e.speed = speed;
  const r = Math.fround(Math.fround(Math.fround(e.direction) * PI32) / 180);
  e.hspeed = fixupInteger(Math.fround(Math.fround(e.speed) * cosf(r)));
  e.vspeed = fixupInteger(Math.fround(Math.fround(e.speed) * -sinf(r)));
}



export function setMotionComponents(e, hs, vs) {
  const h = Math.fround(hs);
  const v = Math.fround(vs);
  e.speed = fixupInteger(Math.fround(Math.sqrt(Math.fround(Math.fround(h * h) + Math.fround(v * v)))));
  let dir = fixupInteger(Math.fround(Math.fround(Math.fround(Math.atan2(-v, h)) * 180) / PI32));
  if (dir < 0) dir = Math.fround(dir + 360);
  e.direction = dir;
  e.motionHspeed = h;
  e.motionVspeed = v;
  e.motionPolarWritten = false;
}



export function motionComponents(e) {
  if (e.motionPolarWritten !== false) {
    const r = Math.fround(Math.fround(Math.fround(e.direction) * PI32) / 180);
    return [
      fixupInteger(Math.fround(Math.fround(e.speed) * cosf(r))),
      fixupInteger(Math.fround(Math.fround(e.speed) * -sinf(r))),
    ];
  }
  return [e.motionHspeed, e.motionVspeed];
}

function runMotion(state) {
  state.eventPhase = 'motion';
  for (const e of state.entities) {
    if (!e.alive) continue;


    if (e.componentMotion) {

      if (e.gravity) {
        const gr = Math.fround(Math.fround(Math.fround(e.gravity_direction) * PI32) / 180);
        e.hspeed = Math.fround((e.hspeed ?? 0) + Math.fround(Math.fround(e.gravity) * cosf(gr)));
        e.vspeed = Math.fround((e.vspeed ?? 0) + Math.fround(Math.fround(e.gravity) * -sinf(gr)));
      }

      if (e.hspeed !== undefined) e.hspeed = Math.fround(e.hspeed);
      if (e.vspeed !== undefined) e.vspeed = Math.fround(e.vspeed);
      if (!e.hspeed && !e.vspeed) continue;
      state.counters.motionSteps += 1;
      e.x = e.x + e.hspeed;
      e.y = e.y + e.vspeed;

      const hs = e.hspeed;
      const vs = e.vspeed;
      e.speed = fixupInteger(Math.fround(Math.sqrt(Math.fround(Math.fround(hs * hs) + Math.fround(vs * vs)))));
      let dir = fixupInteger(Math.fround(Math.fround(Math.fround(Math.atan2(-vs, hs)) * 180) / PI32));
      if (dir < 0) dir = Math.fround(dir + 360);
      e.direction = dir;
      continue;
    }


    if (!e.builtinMotion && !e.type.builtinMotion) continue;

    if (e.friction) {
      if (e.speed > 0) {
        e.speed = e.speed - e.friction;
        if (e.speed < 0) e.speed = 0;
      } else if (e.speed < 0) {
        e.speed = e.speed + e.friction;
        if (e.speed > 0) e.speed = 0;
      }
    }


    let hs;
    let vs;
    if (e.motionPolarWritten !== false) {
      const r = Math.fround(Math.fround(Math.fround(e.direction) * PI32) / 180);
      hs = fixupInteger(Math.fround(Math.fround(e.speed) * cosf(r)));
      vs = fixupInteger(Math.fround(Math.fround(e.speed) * -sinf(r)));
    } else {
      hs = e.motionHspeed;
      vs = e.motionVspeed;
    }

    if (!e.gravity && hs === 0 && vs === 0) {
      e.motionHspeed = hs;
      e.motionVspeed = vs;
      e.motionPolarWritten = false;
      continue;
    }
    state.counters.motionSteps += 1;

    if (e.gravity) {
      const gr = Math.fround(Math.fround(Math.fround(e.gravity_direction) * PI32) / 180);
      hs = Math.fround(hs + Math.fround(Math.fround(e.gravity) * cosf(gr)));
      vs = Math.fround(vs + Math.fround(Math.fround(e.gravity) * -sinf(gr)));
      e.speed = fixupInteger(Math.fround(Math.sqrt(Math.fround(Math.fround(hs * hs) + Math.fround(vs * vs)))));
      let dir = fixupInteger(Math.fround(Math.fround(Math.fround(Math.atan2(-vs, hs)) * 180) / PI32));
      if (dir < 0) dir = Math.fround(dir + 360);
      e.direction = dir;
    }

    e.motionHspeed = hs;
    e.motionVspeed = vs;
    e.motionPolarWritten = false;


    e.x = e.x + hs;
    e.y = e.y + vs;
  }
}



function runCollisions(state) {
  state.eventPhase = 'collision';
  const heart = state.soul;
  if (!heart || !heart.alive) return;


  const pin = state.grazeSkipPin?.get(state.frame) ?? null;
  for (const b of [...state.entities].sort((a, z) => z.seq - a.seq)) {
    if (!b.alive || !b.isBullet || !b.type.other15) continue;
    if (b.maskOff) continue;
    const pre = pin && {
      tension: state.tension, tt: state.turntimer, grazed: b.grazed,
      gt: state.grazebox ? state.grazebox.grazetimer : null,
    };
    grazeBullet(state, b);
    const collides = b.type.collides;
    let hit;
    if (collides) {
      state.counters.collisionChecks += 1;
      hit = collides(b, heart, state);
    } else {

      hit = spriteMaskHit(b, heart);
      if (hit === null) {
        state.counters.unmaskedBullets += 1;
        continue;
      }
      state.counters.collisionChecks += 1;
    }
    if (hit && pre && (state.tension !== pre.tension || state.turntimer !== pre.tt)) {
      const err = (t, tt) => Math.abs(pin[0] - t) + Math.abs(pin[1] - tt);
      if (err(pre.tension, pre.tt) < err(state.tension, state.turntimer)) {
        state.tension = pre.tension;
        state.turntimer = pre.tt;
        b.grazed = pre.grazed;
        if (state.grazebox) state.grazebox.grazetimer = pre.gt;
      }
    }
    if (hit) {

      if (b.active === 1) state.counters.collisionHits += 1;
      b.type.other15(b, state);
    }
  }
}



function runAnimation(state) {
  for (const e of state.entities) {
    if (!e.alive || !e.image_speed) continue;
    const n = SPRITE_FRAMES[e.sprite_index] ?? 0;
    const rate = state.spriteRate?.[e.sprite_index] ?? 1;

    let idx = Math.fround((e.image_index ?? 0) + e.image_speed * rate);

    if (n >= 1 && idx >= n) {
      idx -= n;
      e.animationEnded = true;
    }
    if (n >= 1 && idx < 0) idx += n;
    e.image_index = idx;
  }
}



export function stepFrame(state, input) {
  state.input = input;


  for (const e of state.entities) {
    if (!e.alive) continue;
    e.xprevious = e.x;
    e.yprevious = e.y;
  }

  runAnimation(state);

  {
    const cur = state.input ?? {};
    const prev = state.inputPrev ?? {};
    state.menuEdges = {
      left: !!cur.left && !prev.left,
      right: !!cur.right && !prev.right,
      up: !!cur.up && !prev.up,
      down: !!cur.down && !prev.down,
      confirm: !!cur.confirm && !prev.confirm,
      cancel: !!cur.cancel && !prev.cancel,
    };
  }
  runPhase(state, 'beginStep');
  runAlarms(state);
  runPhase(state, 'step');
  runMotion(state);
  runCollisions(state);
  runPhase(state, 'endStep');


  if (state.soul && state.soul.alive) {
    state.grazePrev = { x: state.soul.x + 10, y: state.soul.y + 10 };
  } else {
    state.grazePrev = null;
  }


  const drawers = state.entities
    .filter((e) => e.alive && e.type.drawStep)
    .sort((a, b) => (b.depth ?? 0) - (a.depth ?? 0) || b.seq - a.seq);
  const ch = state.txtDraws;
  const lo = state.txtLoDraws?.get(state.frame) ?? 0;
  const burn = (n) => { for (let i = 0; i < n; i++) gmlRandom(state.gmlRng, 0); };

  const ownLo = () => drawers.reduce((a, e) => a + (e.type.channelLoDraws?.(e, state) ?? 0), 0);

  const ownHiAfter = (k) => drawers.slice(k)
    .filter((e) => (e.depth ?? 0) >= 0 && e.visible !== 0)
    .reduce((a, e) => a + (e.type.channelHiDraws?.(e, state) ?? 0), 0);
  let hiDone = !ch;
  let loDone = !ch;
  const hi = (k) => {
    hiDone = true;

    burn((ch.get(state.frame) ?? 0) - lo - (state.txtUsed ?? 0) - ownHiAfter(k)
      - (state.txtLoDraws ? 0 : ownLo()));
  };

  const w0 = drawers.find((e) => e.type.name === 'obj_writer' && (e.depth ?? 0) === 0);
  for (const [k, e] of drawers.entries()) {
    const d = e.depth ?? 0;
    if (!hiDone && (w0 ? e === w0 : d <= 0)) hi(k);
    if (!loDone && d < 0) {

      loDone = true;
      burn(lo - ownLo());
    }
    if (e.alive && e.visible !== 0) e.type.drawStep(e, state);
  }
  if (!hiDone) hi(drawers.length);
  if (!loDone) burn(lo - ownLo());
  state.txtUsed = 0;
  state.txtUsedLo = 0;
  bcDrawFlash(state);



  reap(state);

  state.trace.push(traceRow(state));


  if (state.immortalParty) {
    const p = state.party;
    p.hp[1] = p.maxhp[1];
    p.hp[2] = p.maxhp[2];
    p.hp[3] = p.maxhp[3];
  }
  state.inputPrev = state.input;
  state.frame += 1;

  return state;
}


export function runFrames(state, frames, inputAt) {
  for (let i = 0; i < frames; i++) {
    stepFrame(state, inputAt(state.frame));
  }
  return state;
}

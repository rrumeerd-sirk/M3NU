

import { spawn, destroy } from './entity.js';
import { gmlRandom } from './rng.js';

function charAt(s, i) {
  if (i > s.length) return '';
  if (i < 1) return s.length ? s[0] : '';
  return s[i - 1];
}

function insertAt(sub, s, index) {
  const k = Math.max(0, Math.min(s.length, index - 1));
  return s.slice(0, k) + sub + s.slice(k);
}

function deleteAt(s, index, count) {
  const k = index - 1;
  if (k < 0 || k >= s.length) return s;
  return s.slice(0, k) + s.slice(k + count);
}

const TYPERS = {

  4: { charline: 33, shake: 0, rate: 1, special: 1 },

  50: { charline: 33, shake: 0, rate: 1, special: 0 },
};

function asterskip(e) {
  if (e.aster === 1 && e.autoaster === 1) {
    e.length += 2;
    e.mystring = insertAt('||', e.mystring, e.fi);
  }
  if (e.aster === 2) e.aster = 1;
}

function formatPass(e) {

  if (e.dialoguer === 1) e.charline = e.originalcharline;
  e.length = e.mystring.length;
  let charpos = -1;
  let remspace = -1;
  e.aster = 0;
  for (e.fi = 0; e.fi < e.length + 1; e.fi += 1) {
    let skip = 0;
    const thischar = charAt(e.mystring, e.fi);
    if (thischar === '/' || thischar === '%') {
      if (charpos > -1) charpos -= 1;
    }
    if (thischar === '^') {
      if (charpos > -1) charpos -= 2;
    }
    if (thischar === '\\') {
      if (charpos > -1) charpos -= 3;
    }
    if (thischar === '&') {
      remspace = -1;
      charpos = 0;
      skip = 1;
      const nextchar = charAt(e.mystring, e.fi + 1);
      if (e.aster === 1 && e.autoaster === 1 && nextchar !== '*') {
        charpos = 2;
        e.length += 2;
        e.mystring = insertAt('||', e.mystring, e.fi + 1);
        e.fi += 2;
      }
    }
    if (skip === 0) {
      if (thischar === ' ') remspace = e.fi;
      if (thischar === '*') e.aster = 1;
      if (charpos >= e.charline) {
        if (remspace > 2) {
          e.mystring = deleteAt(e.mystring, remspace, 1);
          e.mystring = insertAt('&', e.mystring, remspace);
          e.fi = remspace + 1;
          remspace = -1;
          charpos = 1;
          asterskip(e);
        } else {
          e.mystring = insertAt('&', e.mystring, e.fi);
          e.length += 1;
          charpos = 1;
          remspace = -1;
          e.fi += 1;
          asterskip(e);
        }
      } else {
        charpos += 1;
      }
    }
  }
  e.formatted = 1;
}

function nextmsg(e) {
  e.msgno += 1;
  e.halt = 0;
  e.pos = 1;
  e.alarm[0] = 1;
  e.autoaster = 1;
  e.mystring = e.nstring[e.msgno] ?? '';
  e.formatted = 0;
}

export const writer = {
  name: 'obj_writer',
  objIndex: 10,
  create(e) {
    const t = TYPERS[e.typer ?? 4];
    e.skipme = 0;
    e.charline = t.charline;
    e.originalcharline = 33;
    e.rate = t.rate;
    e.shake = t.shake;
    e.special = t.special;
    e.skippable = 1;
    e.autoaster = 1;
    e.pos = 2;
    e.aster = 0;
    e.halt = 0;
    e.msgno = 0;
    e.first_alarm = 0;
    e.formatted = 0;
    e.siner = 0;
    e.mystring = e.nstring[0] ?? '';
    e.length = e.mystring.length;
    e.alarm[0] = e.rate;

    e.dialoguer = 0;
    e.facer = 0;
    if (e.battletext) {
      e.dialoguer = 1;
      e.facer = 1;
      e.charline = 26;
    }
  },
  alarm: {
    0: (e) => {
      if (e.pos <= e.length) e.alarm[0] = e.rate;
      if (e.first_alarm === 0) {
        const getchar = charAt(e.mystring, 1);
        e.pos += getchar === '\\' ? 3 : 1;
        e.first_alarm = 1;
        return;
      }
      let getchar = charAt(e.mystring, e.pos);
      let nextchar = charAt(e.mystring, e.pos + 1);
      if (getchar === '&') e.pos += 1;
      if (getchar === '\\') e.pos += 3;
      if (getchar === '/') {
        e.halt = nextchar === '%' ? 2 : 1;
        e.alarm[0] = -1;
      }
      getchar = charAt(e.mystring, e.pos);
      nextchar = charAt(e.mystring, e.pos + 1);
      if (getchar === '|') e.pos += 2;
      if (getchar === '^') {
        e.pos += 2;
        if (e.alarm[0] > 0) {
          const add = { 1: 5, 2: 10, 3: 15, 4: 20, 5: 30, 6: 40, 7: 60, 8: 90, 9: 150 }[nextchar];
          if (add) e.alarm[0] += add;
        }
      }
      e.pos += 1;
    },
  },
  drawStep(e, state) {
    let button1 = !!state.menuEdges?.confirm;
    let button2 = !!state.input?.cancel;

    if (state.input?.button3) {
      e.automash_timer = e.automash_timer ? 0 : 1;
      if (e.automash_timer === 0) {
        button1 = true;
        button2 = true;
      }
    }
    if (e.formatted === 0) formatPass(e);
    if (e.halt === 0 && button2 && e.pos < e.length && e.skippable === 1) e.skipme = 1;
    if (e.skipme === 1) {
      e.pos = e.mystring.length + 1;
      e.alarm[0] = -1;
    }
    let draws = 0;
    for (let n = 1; n < e.pos; n += 1) {
      let accept = 1;
      const mychar = charAt(e.mystring, n);
      if (mychar === '&') accept = 0;
      if (mychar === '|') accept = 0;
      if (mychar === '^') {
        accept = 0;
        n += 1;
      }
      if (mychar === '/') {
        e.halt = charAt(e.mystring, n + 1) === '%' ? 2 : 1;
        accept = 0;
      }
      if (mychar === '%') {
        accept = 0;
        if (charAt(e.mystring, n - 1) === '/') e.halt = 2;
        if (charAt(e.mystring, n + 1) === '%') destroy(e);
        else if (e.halt !== 2) nextmsg(e);
      }
      if (mychar === '\\') {
        accept = 0;
        n += 2;
      }
      if (accept === 1) draws += e.special >= 1 ? 4 : 2;
    }
    if (e.halt !== 0 && button1 && e.siner > 0) {
      if (e.halt === 1) nextmsg(e);
      if (e.halt === 2) {
        if (e.facer === 1) destroyFaces(state);
        destroy(e);
      }
    }
    e.skipme = 0;
    e.siner += 1;
    e.lastDraws = draws;
    if (state.nativeWriterDraws) {
      for (let i = 0; i < draws; i += 1) gmlRandom(state.gmlRng, e.shake);
    }
    return draws;
  },
};

export const face = {
  name: 'obj_face',
  objIndex: 7,
  create(e) {
    e.mouthmove = 0;
    e.mouthtimer = 0;
    e.face_index = 0;
    e.image_speed = 0;
    e.rate = 1;
    e.buffer = 4;
  },
};

export function destroyFaces(state) {
  for (const o of state.entities) if (o.alive && o.type === face) destroy(o);
}

export function spawnBattleWriter(state, pages) {
  const vx = state.view?.x ?? 0;
  const vy = state.view?.y ?? 0;
  const w = spawn(state, writer, { x: vx + 30, y: vy + 376, typer: 4, battletext: true, nstring: pages, born: state.frame });
  spawn(state, face, { x: vx + 26, y: vy + 380 });
  return w;
}

export function writerExists(state) {
  return state.entities.some((o) => o.alive && o.type === writer);
}

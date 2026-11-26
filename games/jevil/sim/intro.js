

import { jokerbgFields, jokerbgAdvance } from './jokerbg.js';

const LINES = {
  59: '* UEE HEE^1!&* VISITORS^1, VISITORS^1!&* NOW WE CAN PLAY^1, PLAY!/',
  60: '* THEN^1, AFTER YOU^1, I CAN PLAY WITH EVERYONE ELSE^1, TOO!/',
  62: '* So what are we playing^1, exactly...?/',
  64: "\\TJ* OH^1, IT'S JUST A SIMPLE NUMBERS GAME./%",
  140: '* WHEN YOUR HP DROPS TO 0^1, YOU LOSE!/',
  142: "* So that's the kinda game you wanna play^1, huh...?/",
  143: '\\E2* Then^1, I gotta warn you.../%',
  175: "* You're dealing with a couple of sharks./%",
  192: "* UEE HEE HEE^1! SHARK-TO-SHARK^1! I WOULDN'T HAVE IT ANY OTHER WAY!/",
  193: '* NOW^1, NOW!^1!&* LET THE GAMES BEGIN!!/%',
};
const ralface = (e) => `\\TX \\F0 \\E${e} \\FR \\TR %`;
const susface = (e) => `\\TX \\F0 \\E${e} \\FS \\TS %`;
const noface = '\\TX \\F0 \\T0 %';

const TYPERS = {
  6: { sound: null, hspace: 16, vspace: 36 },
  30: { sound: 'snd_txtsus', hspace: 16, vspace: 36 },
  31: { sound: 'snd_txtral', hspace: 16, vspace: 36 },
  35: { sound: 'snd_txtjok', hspace: 16, vspace: 36 },
  40: { sound: null, hspace: 8, vspace: 18 },
};

const TCODE = { 0: 6, X: 40, S: 30, R: 31, J: 35 };
const FCODE = { 0: 0, S: 1, R: 2 };
const ECODE = '0123456789ABCDE';

const PAUSE = { 1: 5, 2: 10, 3: 15, 4: 20, 5: 30, 6: 40, 7: 60, 8: 90, 9: 150 };
const SILENT = new Set([' ', '^', '!', '.', '?', ',', ':', '/', '\\', '|', '*']);

const HEROMAKE = [[80, 100], [90, 150], [100, 210]];

const charAt = (s, i) => (i > s.length ? '' : i < 1 ? (s.length ? s[0] : '') : s[i - 1]);
const insertAt = (sub, s, i) => {
  const k = Math.max(0, Math.min(s.length, i - 1));
  return s.slice(0, k) + sub + s.slice(k);
};
const deleteAt = (s, i, n) => (i - 1 < 0 || i - 1 >= s.length ? s : s.slice(0, i - 1) + s.slice(i - 1 + n));

function marker(x, y, sprite) {
  return { x, y, sprite, index: 0, speed: 0, hspeed: 0, vspeed: 0, friction: 0, angle: 0, visible: true };
}

export function createIntroScene() {
  return {
    t: 0,
    con: 1,
    alarm4: 0,
    bulcon: 0,
    bultimer: 0,
    done: false,
    jevil: { x: 500, y: 260, sprite: 'spr_joker_main', index: 0, speed: 0, visible: true },
    party: [],
    sbul: [],
    after: [],
    enc: null,
    bg: jokerbgFields(0),
    typer: 35,
    fc: 0,
    fe: 0,
    dlg: null,
    prevConfirm: true,
  };
}

function cue(cues, name, gain = 1) {
  cues.push({ name, pitch: 1, gain });
}

function afterimage(seq, m) {
  seq.after.push({ x: m.x, y: m.y, sprite: m.sprite, index: m.index, angle: m.angle || 0, alpha: 0.5 });
}

function dialogue(seq, pages) {
  seq.dlg = { pages, alarm0: 1, active: false, jewel: 0, writer: null, face: null };
}

function setTyper(seq, w, typer) {
  seq.typer = typer;
  const t = TYPERS[typer] ?? TYPERS[6];
  w.sound = t.sound;
  w.hspace = t.hspace;
  w.vspace = t.vspace;
}

function createWriter(seq, pages) {

  const w = {
    x: 58, y: 340, pages, msgno: 0, s: pages[0], pos: 2, alarm0: 1, alarm2: 1,
    firstAlarm: 0, firstnoise: 0, halt: 0, formatted: false, siner: 0,
    charline: 33, writingx: 58, glyphs: [],
  };
  setTyper(seq, w, seq.typer);
  seq.dlg.face = { x: 74, y: 350, facechange: 2, nowface: seq.fc, draw: null };
  return w;
}

function textsound(seq, w, cues) {
  let c = charAt(w.s, w.pos);
  if (c === '&') c = charAt(w.s, w.pos + 1);
  if (SILENT.has(c) || !w.sound) return;
  cue(cues, w.sound);
}

function nextmsg(w) {
  w.msgno += 1;
  w.halt = 0;
  w.pos = 1;
  w.alarm0 = 1;
  w.s = w.pages[w.msgno] ?? '';
  w.formatted = false;
  w.firstnoise = 0;
  w.alarm2 = 1;
}

function writerAlarm0(seq, w, cues) {
  if (w.firstAlarm === 1 && w.pos >= 2) textsound(seq, w, cues);
  if (w.pos <= w.s.length) w.alarm0 = 1;
  if (w.firstAlarm === 0) {
    w.pos += charAt(w.s, 1) === '\\' ? 3 : 1;
    w.firstAlarm = 1;
    return;
  }
  let g = charAt(w.s, w.pos);
  let n = charAt(w.s, w.pos + 1);
  if (g === '&') w.pos += 1;
  if (g === '\\') w.pos += 3;
  if (g === '/') {
    w.halt = n === '%' ? 2 : 1;
    w.alarm0 = -1;
  }
  g = charAt(w.s, w.pos);
  n = charAt(w.s, w.pos + 1);
  if (g === '|') w.pos += 2;
  if (g === '^') {
    w.pos += 2;
    if (w.alarm0 > 0) w.alarm0 += PAUSE[n] ?? 0;
  }
  w.pos += 1;
}

function faceSide(seq, w) {
  if (seq.fc === 0) {
    w.charline = 33;
    w.writingx = w.x;
  } else {
    w.charline = 26;
    w.writingx = w.x + 116;
  }
}

function controlCode(seq, w, code, arg) {
  if (code === 'E' && ECODE.includes(arg)) seq.fe = ECODE.indexOf(arg);
  if (code === 'F' && arg in FCODE) {
    seq.fc = FCODE[arg];
    return true;
  }
  if (code === 'T' && arg in TCODE) setTyper(seq, w, TCODE[arg]);
  return false;
}

function format(seq, w) {
  faceSide(seq, w);
  let length = w.s.length;
  let charpos = -1;
  let remspace = -1;
  let aster = 0;
  const asterskip = (i) => {
    if (aster === 1) {
      length += 2;
      w.s = insertAt('||', w.s, i);
    }
    if (aster === 2) aster = 1;
  };
  for (let i = 0; i < length + 1; i += 1) {
    let skip = 0;
    const ch = charAt(w.s, i);
    if ((ch === '/' || ch === '%') && charpos > -1) charpos -= 1;
    if (ch === '^' && charpos > -1) charpos -= 2;
    if (ch === '\\') {
      if (charpos > -1) charpos -= 3;
      const code = charAt(w.s, i + 1);
      const arg = charAt(w.s, i + 2);
      if (code === 'E' && ECODE.includes(arg)) seq.fe = ECODE.indexOf(arg);
      if (code === 'F' && arg in FCODE) {
        seq.fc = FCODE[arg];
        faceSide(seq, w);
      }
    }
    if (ch === '&') {
      remspace = -1;
      charpos = 0;
      skip = 1;
      if (aster === 1 && charAt(w.s, i + 1) !== '*') {
        charpos = 2;
        length += 2;
        w.s = insertAt('||', w.s, i + 1);
        i += 2;
      }
    }
    if (skip === 0) {
      if (ch === ' ') remspace = i;
      if (ch === '*') aster = 1;
      if (charpos >= w.charline) {
        if (remspace > 2) {
          w.s = deleteAt(w.s, remspace, 1);
          w.s = insertAt('&', w.s, remspace);
          i = remspace + 1;
          remspace = -1;
          charpos = 1;
          asterskip(i);
        } else {
          w.s = insertAt('&', w.s, i);
          length += 1;
          charpos = 1;
          remspace = -1;
          i += 1;
          asterskip(i);
        }
      } else {
        charpos += 1;
      }
    }
  }
  w.formatted = true;
}

function writerDraw(seq, w, pressed, mash = false) {
  if (!w.formatted) format(seq, w);

  if (mash && w.halt === 0 && w.pos < w.s.length) {
    w.pos = w.s.length + 1;
    w.alarm0 = -1;
  }
  w.glyphs = [];
  let wx = w.writingx;
  let wy = w.y;
  let gone = false;
  for (let n = 1; n < w.pos; n += 1) {
    const ch = charAt(w.s, n);
    if (ch === '&') {
      wx = w.writingx;
      wy += w.vspace;
      continue;
    }
    if (ch === '|') {
      wx += w.hspace;
      continue;
    }
    if (ch === '^') {
      n += 1;
      continue;
    }
    if (ch === '/') {
      w.halt = charAt(w.s, n + 1) === '%' ? 2 : 1;
      continue;
    }
    if (ch === '%') {
      if (charAt(w.s, n - 1) === '/') w.halt = 2;
      if (charAt(w.s, n + 1) === '%') gone = true;
      else if (w.halt !== 2) nextmsg(w);
      break;
    }
    if (ch === '\\') {
      if (controlCode(seq, w, charAt(w.s, n + 1), charAt(w.s, n + 2))) {
        wx = seq.fc === 0 ? w.x : w.x + 116;
      }
      n += 2;
      continue;
    }
    w.glyphs.push({ ch, x: wx, y: wy });
    wx += w.hspace;
  }
  if (!gone && w.halt !== 0 && pressed && w.siner > 0) {
    if (w.halt === 1) nextmsg(w);
    else gone = true;
  }
  w.siner += 1;
  return gone;
}

function stepDialogue(seq, pressed, cues, mash = false) {
  const d = seq.dlg;
  if (!d) return;
  if (!d.active) {
    d.alarm0 -= 1;
    if (d.alarm0 === 0) {
      d.active = true;
      d.writer = createWriter(seq, d.pages);
    }
    if (!d.active) return;
  } else {
    const w = d.writer;
    if (w.alarm0 > 0 && --w.alarm0 === 0) writerAlarm0(seq, w, cues);
    if (w.alarm2 > 0 && --w.alarm2 === 0 && w.firstnoise === 0) {
      w.firstnoise = 1;
      textsound(seq, w, cues);
    }
    d.face.nowface = seq.fc;
  }
  d.jewel += 1;
  if (writerDraw(seq, d.writer, pressed || mash, mash)) {
    seq.dlg = null;
    return;
  }
  const f = d.face;
  f.facechange -= 1;
  if (f.nowface !== seq.fc) f.facechange = 3;
  f.draw = f.facechange <= 0 && seq.fc !== 0 ? { fc: seq.fc, fe: seq.fe } : null;
}

function eventStep(seq, cues) {
  const [k, s, r] = seq.party;
  const j = seq.jevil;
  if (seq.con === 1) {
    seq.party = HEROMAKE.map(([x, y]) => {
      const m = marker(x - 100, y, 'spr_krisr_dark');
      m.hspeed = 2;
      m.speed = 0.2;
      return m;
    });
    seq.party[1].sprite = 'spr_susier_dark';
    seq.party[2].sprite = 'spr_ralseir';
    seq.con = 2;
    seq.alarm4 = 83;
  }
  if (seq.con === 3) {
    for (const m of seq.party) {
      m.index = 0;
      m.speed = 0;
      m.hspeed = 0;
    }
    seq.con = 4;
    seq.alarm4 = 20;
  }
  if (seq.con === 5) {
    cue(cues, 'snd_joker_laugh1');
    seq.typer = 35;
    seq.fc = 0;
    dialogue(seq, [LINES[59], LINES[60], ralface(0), LINES[62], noface, LINES[64]]);
    seq.con = 6;
  }
  if (seq.con === 6 && !seq.dlg) {
    j.speed = 0.5;
    cue(cues, 'snd_joker_laugh0');
    seq.con = 9;
    seq.alarm4 = 10;
  }
  if (seq.con === 10) {
    cue(cues, 'snd_rudebuster_swing');
    seq.bulcon = 1;
    seq.con = 11;
    seq.alarm4 = 10;
  }
  if (seq.bulcon === 1) {
    seq.sbul = [0, 1].map((i) => {
      const m = marker(s.x + 70, -i * 100 - 40, 'spr_joker_scythebody');
      m.vspeed = 24;
      m.angle = [37, 211][i];
      return m;
    });
    seq.bulcon = 2;
  }
  if (seq.bulcon === 2) {
    let below = 0;
    for (const m of seq.sbul) {
      m.angle += 24;
      afterimage(seq, m);
      if (m.y >= 580) below += 1;
    }
    if (below >= seq.sbul.length) {
      seq.bulcon = 3;
      seq.sbul = [];
    }
  }
  if (seq.con === 12) {
    s.sprite = 'spr_susie_shock_r';
    r.sprite = 'spr_ralsei_shock_overworld';
    for (const m of seq.party) {
      m.hspeed = -10;
      m.friction = 1;
    }
    seq.con = 13;
    seq.alarm4 = 45;
  }
  if (seq.con === 14) {
    j.speed = 0;
    s.sprite = 'spr_susier_dark_unhappy';
    r.sprite = 'spr_ralseir';
    seq.typer = 35;
    seq.fc = 0;
    seq.fe = 0;
    dialogue(seq, [LINES[140], susface(0), LINES[142], LINES[143]]);
    seq.con = 15.1;
  }
  if (seq.con === 15.1 && !seq.dlg) {
    s.sprite = 'spr_susieb_attack';
    r.sprite = 'spr_ralseib_attack';
    k.sprite = 'spr_krisb_attack';
    for (const m of seq.party) {
      m.index = 0;
      m.speed = 0.25;
    }
    seq.con = 16;
    seq.alarm4 = 60;
    cue(cues, 'snd_laz_c');
  }
  if (seq.con === 16) {
    if (s.index >= 5) s.speed = 0;
    if (k.index >= 6) k.speed = 0;
    if (r.index >= 5) r.speed = 0;
  }
  if (seq.con === 17) {
    seq.fe = 3;
    dialogue(seq, [LINES[175]]);
    seq.con = 18;
  }
  if (seq.con === 18 && !seq.dlg) {
    cues.push({ name: 'snd_joker_laugh0', pitch: 1, gain: 1, loop: true });
    j.speed = 0.25;
    seq.con = 19;
    seq.alarm4 = 15;
  }
  if (seq.con === 20) {
    seq.typer = 35;
    seq.fc = 0;
    dialogue(seq, [LINES[192], LINES[193]]);
    seq.con = 21;
  }
  if (seq.con === 21 && !seq.dlg) {
    cues.push({ name: 'snd_joker_laugh0', stop: true });
    seq.con = 22;
    seq.alarm4 = 1;
  }
  if (seq.con === 23) {
    for (const m of seq.party) m.visible = false;

    const sprites = ['spr_krisr_dark', 'spr_susier_wall', 'spr_ralseir'];
    const c = seq.party.map((m, i) => {
      const e = marker(m.x, m.y, sprites[i]);
      const [hx, hy] = HEROMAKE[i];
      e.dx = (hx - m.x) / 10;
      e.dy = (hy - m.y) / 10;
      return e;
    });
    seq.enc = { c, fightcon: 1, counttimer: 0 };
    seq.con = 25;
    seq.bultimer = 0;
    seq.bulcon = 10;
  }
  if (seq.bulcon === 10) {
    j.speed = 0.5;
    seq.bultimer += 1;
    afterimage(seq, j);
    j.y -= 16;
    j.x += 5;
    seq.bultimer += 1;
    if (seq.bultimer >= 10) seq.bulcon = 11;
  }
}

function stepEncounter(seq, cues) {
  const e = seq.enc;
  if (!e) return;
  if (e.fightcon === 1) {
    e.counttimer += 1;
    if (e.counttimer < 10) for (const m of e.c) afterimage(seq, m);
    if (e.counttimer >= 10) {
      cue(cues, 'snd_impact', 0.7);
      cue(cues, 'snd_weaponpull_fast', 0.8);
      const battle = ['spr_krisb_attack', 'spr_susieb_attack', 'spr_ralseib_battleintro'];
      e.c.forEach((m, i) => {
        m.dx = 0;
        m.dy = 0;
        m.x = HEROMAKE[i][0];
        m.y = HEROMAKE[i][1];
        m.index = 0;
        m.sprite = battle[i];
        m.speed = 0.5;
      });
      e.fightcon = 2;
      e.counttimer = 0;
    }
  } else if (e.fightcon === 2) {
    e.counttimer += 1;
    if (e.counttimer >= 15) seq.done = true;
  }
}

function move(m) {
  if (m.dx || m.dy) {
    m.x += m.dx;
    m.y += m.dy;
  }
  m.x += m.hspeed;
  m.y += m.vspeed;
  if (m.friction && m.hspeed) {
    const h = Math.abs(m.hspeed) - m.friction;
    m.hspeed = h > 0 ? Math.sign(m.hspeed) * h : 0;
  }
  m.index += m.speed;
}

export function stepIntroScene(seq, input, cues) {
  if (seq.done) return;
  const confirm = !!input?.confirm;
  const pressed = confirm && !seq.prevConfirm;
  seq.prevConfirm = confirm;

  let mash = false;
  if (input?.button3 && seq.dlg?.writer) {
    const w = seq.dlg.writer;
    w.automash = w.automash ? 0 : 1;
    mash = w.automash === 0;
  }

  if (seq.alarm4 > 0 && --seq.alarm4 === 0) seq.con += 1;

  stepEncounter(seq, cues);
  eventStep(seq, cues);
  for (const a of seq.after) a.alpha -= 0.04;
  seq.after = seq.after.filter((a) => a.alpha >= 0);
  for (const m of seq.party) move(m);
  for (const m of seq.sbul) move(m);
  if (seq.enc) for (const m of seq.enc.c) move(m);
  seq.jevil.index += seq.jevil.speed;
  jokerbgAdvance(seq.bg);
  stepDialogue(seq, pressed, cues, mash);
  seq.t += 1;
}

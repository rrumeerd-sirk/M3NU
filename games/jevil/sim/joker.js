

import { gmlChoose } from './rng.js';

export function createJoker() {
  return {
    maxhp: 3500,
    hp: 3500,
    at: 10,
    df: 5,
    jturn: 0,
    jattack: 0,
    turns: 0,
    chaosdance: 0,
    hypnosiscounter: 0,
    pirouettecounter: 0,
    pirouette: 0,
    mercymod: 0,
    pfactor: 1,
    tired: 0,
    monsterstatus: 0,
    dancelv: 0,
  };
}

export const DISPATCH = {
  0: { type: 70, damageMul: 5, graze: 2 },
  1: { type: 65, damageMul: 5, graze: 3 },
  2: { type: 49, damageMul: 4, graze: 3, all: true },
  3: { type: 75, damageMul: 6, graze: 3 },
  4: { type: 62, damageMul: 5, graze: 2, inv: 20 },
  5: { type: 50, damageMul: 4, graze: 3, all: true, turntimer: 300 },
  6: { type: 73, damageMul: 5 },
  7: { type: 68, damageMul: 5, graze: 2 },
  8: { type: 61, damageMul: 5, graze: 3, inv: 20, turntimer: 240 },
  9: { type: 48, damageMul: 4, graze: 4, all: true, turntimer: 270 },
  10: { type: 72, damageMul: 5 },
  11: { type: 76, damageMul: 6, graze: 3 },
  12: { type: 71, damageMul: 5, graze: 2 },
  13: { type: 46, damageMul: 4, graze: 4, all: true, turntimer: 330 },
  14: { type: 74, damageMul: 4 },
  15: { type: 77, damageMul: 4, turntimer: 1500 },
};

export function selectGates(j) {
  const mhpratio = j.hp / j.maxhp;

  if (mhpratio <= 0.8 && j.jturn === 4) {
    j.jturn = 5;
    j.dancelv = 1;
  }
  if (mhpratio <= 0.6 && j.jturn === 9) {
    j.jturn = 10;
  }
  if (mhpratio <= 0.4 && j.jturn === 14) {
    j.jturn = 15;
    j.dancelv = 3;
  }
  if (mhpratio <= 0.15 && j.jturn < 17) {
    j.jturn = 17;
    j.dancelv = 2;
  }
  if (j.hypnosiscounter >= 2 && j.jturn === 4) {
    if (j.turns >= 5 - j.hypnosiscounter) {
      j.jturn = 5;
      j.dancelv = 1;
    }
  }
  if (j.hypnosiscounter >= 4 && j.jturn === 9) {
    if (j.turns >= 11 - j.hypnosiscounter) {
      j.jturn = 10;
      j.dancelv = 1;
    }
  }
  if (j.hypnosiscounter >= 6 && j.jturn === 14) {
    if (j.turns >= 17 - j.hypnosiscounter) {
      j.jturn = 15;
      j.dancelv = 1;
    }
  }
  if (j.jturn >= 18) {
    j.dancelv = 3;
  }
  if (j.jturn >= 19) {
    if (j.turns >= 29 - j.hypnosiscounter) {
      j.tired = 1;
      j.monsterstatus = 1;
      j.dancelv = 2;
    }
  }
}

export function selectTurn(j, rng) {

  if (j.jturn >= 19) {
    if (j.df > -10) {
      j.df -= 3;
    }
    if (j.at < 11) {
      j.at += 0.5;
    }
    j.jattack = gmlChoose(rng, [0, 4, 7, 8, 10, 11, 12, 13, 13, 13]);
  }
  if (j.jturn >= 15 && j.jturn <= 18) {
    j.jattack = j.jturn - 3;
    j.jturn += 1;
  }
  if (j.jturn === 14) {
    j.jattack = gmlChoose(rng, [8, 9, 10, 11]);
  }
  if (j.jturn >= 10 && j.jturn <= 13) {
    j.jattack = j.jturn - 2;
    j.jturn += 1;
  }
  if (j.jturn === 9) {
    j.jattack = gmlChoose(rng, [4, 5, 6, 7]);
  }
  if (j.jturn >= 5 && j.jturn <= 8) {
    j.jattack = j.jturn - 1;
    j.jturn += 1;
  }
  if (j.jturn === 4) {
    j.jattack = gmlChoose(rng, [0, 1, 2, 3]);
  }
  if (j.jturn <= 3) {
    j.jattack = j.jturn;
    j.jturn += 1;
  }
  return j.jattack;
}

export function launchParams(j) {
  const d = DISPATCH[j.jattack];
  return {
    type: d.type,

    damage: j.at * j.pfactor * d.damageMul,
    grazepoints: d.graze ?? 1,
    inv: d.inv ?? 60,
    target: d.all ? 3 : 0,
    turntimer: d.turntimer ?? 240,
  };
}

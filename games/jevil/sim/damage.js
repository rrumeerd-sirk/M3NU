import { heroAt } from './heroes.js';
import { makeDmgwriter, dmgwritersKill } from './dmgwriter.js';
import { spawnShake } from './shake.js';

import { spawn } from './entity.js';
import { gmlChoose, gmlRandom } from './rng.js';
import { DEFAULT_GEAR, cloneGear, statsOf } from './equipment.js';

export function freshParty(gear = DEFAULT_GEAR) {
  const st = [1, 2, 3].map((ch) => statsOf(ch, gear));
  return {
    char: [1, 2, 3],
    hp: [0, 90, 110, 70],
    maxhp: [0, 90, 110, 70],

    battledf: st.map((x) => x.df),
    battleat: st.map((x) => x.at),
    battlemag: st.map((x) => x.mag),

    gear: cloneGear(gear),
    charaction: [0, 0, 0],
    charcantarget: [1, 1, 1],
    charmove: [1, 1, 1],
    chardead: [0, 0, 0],
    charspecial: [0, 0, 0],
    targeted: [0, 0, 0],
  };
}

export function scrDead(p, slot) {
  p.charmove[slot] = 0;
  p.charcantarget[slot] = 0;
  p.chardead[slot] = 1;
  p.charaction[slot] = 0;
  p.charspecial[slot] = 0;
}

export function scrRevive(p, slot) {
  p.charmove[slot] = 1;
  p.charcantarget[slot] = 1;
  p.chardead[slot] = 0;
}

export function scrHeal(state, slot, amount) {
  const p = state.party;
  const t = p.char[slot];
  const cur = p.hp[t];
  const belowzero = p.hp[t] <= 0;
  const abovemax = p.hp[t] > p.maxhp[t];
  if (!abovemax) {
    p.hp[t] += amount;
    if (p.hp[t] > p.maxhp[t]) p.hp[t] = p.maxhp[t];
  }
  if (belowzero && p.hp[t] >= 0) {
    if (p.hp[t] < Math.ceil(p.maxhp[t] / 6)) {
      p.hp[t] = Math.ceil(p.maxhp[t] / 6);
    }
    scrRevive(p, slot);
  }
  state.audio?.cue('snd_power');
  return p.hp[t] - cur;
}

export function scrRandomtarget(state) {
  const p = state.party;
  const able = !(p.charcantarget[0] === 0 && p.charcantarget[1] === 0 && p.charcantarget[2] === 0);
  let mytarget = gmlChoose(state.gmlRng, [0, 1, 2]);
  if (able) {
    while (p.charcantarget[mytarget] === 0) {
      mytarget = gmlChoose(state.gmlRng, [0, 1, 2]);
    }
  } else {
    mytarget = 3;
  }

  p.targeted[mytarget] = 1;
  state.lastMytarget = mytarget;
  return mytarget;
}

export function scrDamage(state, b) {
  const p = state.party;
  if (!(state.invTimer < 0)) return;

  let target = b.target;

  if (target < 3) {
    if (p.hp[p.char[target]] <= 0) {
      target = scrRandomtarget(state);
      b.target = target;

      const h = heroAt(state, target);
      if (h) {
        h.image_blend = 'c_white';
        h.darkify = 0;
      }
    }
  }
  let chartarget = 3;
  let tdamage = b.damage;
  if (target < 3) {
    tdamage = Math.ceil(tdamage - p.battledf[target] * 3);
    chartarget = p.char[target];
    if (p.charaction[target] === 10) {
      tdamage = Math.ceil((2 * tdamage) / 3);
    }
    if (tdamage < 1) {
      tdamage = 1;
    }
  }

  spawnShake(state, spawn, { gated: true });

  {
    const h = target < 3 ? heroAt(state, target) : null;
    if (h) {
      h.hurt = 1;
      h.hurttimer = 0;
    }
  }
  let hpdiff = tdamage;
  dmgwritersKill(state);
  let doomtype = -1;
  if (state.soul && state.soul.alive) {
    state.soul.dmgnoise = 1;
  }
  if (target < 3) {
    if (p.hp[chartarget] <= 0) {
      doomtype = 4;
      p.hp[chartarget] -= Math.round(tdamage / 4);
      hpdiff = Math.round(tdamage / 4);
    } else {
      p.hp[chartarget] -= tdamage;
      if (p.hp[chartarget] <= 0) {
        hpdiff = Math.abs(p.hp[chartarget] - p.maxhp[chartarget] / 2);
        doomtype = 4;
        p.hp[chartarget] = Math.round(-p.maxhp[chartarget] / 2);
        scrDead(p, target);
      }
    }

    const h = heroAt(state, target);
    makeDmgwriter(state, h?.x ?? 0, (h?.y ?? 0) + (h?.myheight ?? 0) - 24, { damage: hpdiff, dtype: doomtype });
  }
  if (target === 3) {
    for (let hpi = 0; hpi < 3; hpi += 1) {
      const ct = p.char[hpi];
      if (p.hp[ct] >= 0) {
        if (p.charaction[hpi] === 10) {
          p.hp[ct] -= Math.ceil(tdamage / 2);
        } else {
          p.hp[ct] -= tdamage;
        }
        if (p.hp[ct] <= 0) {

          p.hp[ct] = Math.round(-p.maxhp[0] / 2);
        }
      }
    }
  }
  state.invTimer = state.invc * 40;
  let gameover = 1;
  for (let i = 0; i < 3; i++) {
    if (p.char[i] !== 0 && p.hp[p.char[i]] > 0) gameover = 0;
  }
  if (gameover === 1) {
    state.gameOver = true;
  }
}

export function scrDamageAll(state, b) {
  const p = state.party;
  if (!(state.invTimer < 0)) return;
  const remdamage = b.damage;
  const temptarget = b.target;
  for (let ti = 0; ti < 3; ti += 1) {
    state.invTimer = -1;
    b.damage = remdamage;
    b.target = ti;
    if (p.hp[p.char[ti]] > 0 && p.char[ti] !== 0) {
      scrDamage(state, b);
    }
  }
  state.invTimer = state.invc * 40;
  b.target = temptarget;
}

export function endTurnAutoheal(state) {
  const p = state.party;
  for (let i = 0; i < 3; i += 1) {
    const t = p.char[i];
    const h = heroAt(state, i);
    if (h) h.tu = 0;
    if (t !== 0 && p.hp[t] <= 0) {
      const dw = makeDmgwriter(state, h?.x ?? 0, (h?.y ?? 0) + (h?.myheight ?? 0) - 24, { delay: 1, dtype: 3 });
      dw.damage = scrHeal(state, i, Math.ceil(p.maxhp[t] / 8));
      if (p.hp[t] >= 1) dw.specialmessage = 4;
    }
  }
}



import { spawn, destroy } from './entity.js';
import { afterimage } from './afterimage.js';
import { makeBurstbolt } from './attackfx.js';
import { bodyDefeat } from './jokerbody.js';
import { ITEMS, scrItemspell, scrHeal } from './items.js';
import { gmlChoose } from './rng.js';
import { scrTensionheal } from './graze.js';
import { writer, spawnBattleWriter, face, destroyFaces } from './writer.js';
import { BATTLEMSG_START } from './talk.js';
import {
  spellAt, spellInfo, scrSpelltext, heroEntity, healVisuals, rudebusterAnim, pacifyspell, C_YELLOW,
} from './spells.js';

function scrCharcan(state, slot) {
  const p = state.party;
  if (p.hp[p.char[slot]] <= 0) return false;
  if (state.acting?.[slot] === 1) return false;
  if (p.char[slot] === 0) return false;
  return true;
}

export function scrNexthero(state) {
  const prevturn = state.charturn;
  const p = state.party;

  let moveswapped = 0;
  if (state.charturn === 0) {
    moveswapped = 1;
    if (p.charmove[1] === 1 && scrCharcan(state, 1)) {
      state.charturn = 1;
    } else if (p.charmove[2] === 1 && scrCharcan(state, 2)) {
      state.charturn = 2;
    } else {
      scrEndturn(state);
      moveswapped = 0;
    }
  }
  if (state.charturn === 1 && moveswapped === 0) {
    moveswapped = 1;
    if (scrCharcan(state, 2) && (state.acting?.[1] ?? 0) === 0) {
      state.charturn = 2;
    } else {
      scrEndturn(state);
      moveswapped = 0;
    }
  }
  if (state.charturn === 2 && moveswapped === 0) {
    scrEndturn(state);
  }
  if (moveswapped === 1) {
    state.bmenuno = 0;
  }

  if (state.charturn > 0) {
    state.temptension[state.charturn] = state.tension;
  }
  if (state.tempitem && state.charturn > 0) {
    for (let k = 0; k < 12; k += 1) {
      state.tempitem[k][state.charturn] = state.tempitem[k][prevturn];
    }
  }

}

export function scrPrevhero(state) {
  const p = state.party;
  let moveswapped = 0;
  if (state.charturn === 1) {
    if (p.charmove[0] === 1) {
      state.charturn = 0;
      moveswapped = 1;
    }
  }
  if (state.charturn === 2) {
    moveswapped = 1;
    if (p.charmove[1] === 1 && (state.acting?.[1] ?? 0) === 0) {
      state.charturn = 1;
    } else if (p.charmove[0] === 1) {
      state.charturn = 0;
    }
  }
  const fa = (p.faceaction ??= [0, 0, 0]);
  if (moveswapped === 1) {
    state.bmenuno = 0;
    fa[state.charturn] = 0;
    p.chartarget && (p.chartarget[state.charturn] = 0);
    p.charaction[state.charturn] = 0;
    p.charspecial[state.charturn] = 0;
  }
  if (state.charturn === 0) {

    const j = state.entities.find((o) => o.alive && o.type.name === 'obj_joker');
    if (j) j.acting = 0;
    state.acting = [0, 0, 0];
    fa[1] = 0;
    p.chartarget && (p.chartarget[1] = 0);
    p.charaction[1] = 0;
    p.charspecial[1] = 0;
    fa[2] = 0;
    state.tension = state.temptension[0];
  } else {
    state.tension = state.temptension[state.charturn];
  }

  if (state.tempitem) {
    for (let k = 0; k < 12; k += 1) {
      if (state.charturn === 0) state.tempitem[k][0] = state.inventory?.[k] ?? 0;
      else state.tempitem[k][state.charturn] = state.tempitem[k][state.charturn - 1];
    }
  }
}

export function scrSpellconsumeb(state) {
  const p = state.party;
  state.tension -= state.pendingSpellCost ?? 0;
  (p.faceaction ??= [0, 0, 0])[state.charturn] = 2;
  p.charaction[state.charturn] = 2;
  const coord2 = state.bmenucoord2 ?? [0, 0, 0];
  p.charspecial[state.charturn] = spellAt(p.char[state.charturn], coord2[state.charturn]);
  state.tensionselect = 0;
  scrNexthero(state);
}

export function scrEndturn(state) {
  itemWriteback(state);

  for (const o of state.entities) if (o.alive && o.type === writer) destroy(o);
  destroyFaces(state);
  const p = state.party;
  state.attacking = 0;
  for (let i = 0; i < 3; i += 1) {
    if (p.charaction[i] === 1) state.attacking = 1;
  }
  if ((state.acting?.[0] ?? 0) === 0) {
    scrAttackphase(state);
  } else {
    state.charturn = 3;
    state.myfight = 3;
  }
}

export function scrAttackphase(state) {
  const p = state.party;
  let fightphase = 1;
  state.charturn = 3;
  for (let i = 0; i < 3; i += 1) {
    if (p.charaction[i] === 4 || p.charaction[i] === 2) fightphase = 0;
  }
  if (state.myfight === 4) fightphase = 1;
  if (fightphase === 1) {
    state.myfight = 1;
    spawn(state, attackpress, { x: 2, y: 365 });
  } else {
    state.myfight = 4;
    spawn(state, spellphase, { x: 0, y: 0 });
  }
}

export const spellphase = {
  name: 'obj_spellphase',
  objIndex: 191,
  create(e) {
    e.spelltimer = 0;
    e.spellmax = 40;
    e.spelltotal = 0;
    e.char = 0;
    e.castyet = 0;
    e.re_castyet = 0;
    e.active = 0;
    e.alarm[0] = 5;
    e.using = [0, 0, 0];
    e.gotspell = [0, 0, 0];
    e.gotitem = [0, 0, 0];
    e.spellwriter = null;
  },
  alarm: {
    0: (e, state) => {
      const p = state.party;
      for (let xyz = 0; xyz < 3; xyz += 1) {
        e.using[xyz] = 0;
        e.gotspell[xyz] = 0;
        e.gotitem[xyz] = 0;
        for (const [act, pose, flag] of [[2, 2, 'gotspell'], [4, 4, 'gotitem']]) {
          if (p.charaction[xyz] !== act) continue;
          e.spelltotal += 1;
          e.using[xyz] = 1;
          e[flag][xyz] = 1;
          if (e.castyet === 0) {
            const hero = heroEntity(state, xyz);
            if (hero) {
              hero.state = pose;
              hero.attacktimer = 0;
            }
            e.castyet = 1;
            e.char = xyz + 1;
            e.spellwriter = spawnBattleWriter(state, scrSpelltext(state, p.charspecial[xyz], xyz));
          }
        }
      }
      e.active = 1;
      state.spelldelay = 90;
    },
  },
  step(e, state) {
    if (e.active !== 1) return;
    e.spelltimer += 1;

    const writerGone = state.writerBusy
      ? !state.writerBusy(state.frame)
      : !(e.spellwriter && e.spellwriter.alive);
    if (e.spelltimer >= state.spelldelay && writerGone) {
      const endQueue = () => {
        scrAttackphase(state);
        if (e.spellwriter) destroy(e.spellwriter);
        destroy(e);
      };
      if (e.char >= 3 || e.spelltotal === 1) {
        endQueue();
      } else if (!state.jokerDefeated) {

        const p = state.party;
        for (const [flag, pose] of [['gotitem', 4], ['gotspell', 2]]) {
          if (e[flag][e.char] !== 1) continue;
          e.re_castyet = 1;
          const hero = heroEntity(state, e.char);
          if (hero) hero.state = pose;
          if (e.spellwriter) destroy(e.spellwriter);
          e.spellwriter = spawnBattleWriter(state, scrSpelltext(state, p.charspecial[e.char], e.char));
        }
        state.spelldelay = 90;
        if (e.re_castyet === 0) state.spelldelay = 1;
        e.char += 1;
        for (let r = 0; r < 2; r += 1) {
          if (e.char < 3 && e.using[e.char] === 0) e.char += 1;
        }
        e.spelltimer = 0;
        e.re_castyet = 0;
      } else {
        endQueue();
      }
    }
  },
};

export function scrSpell(state, spellId, caster) {
  const p = state.party;
  const star = p.chartarget?.[caster] ?? 0;
  const j = state.joker;
  state.spelldelay = 10;
  if (spellId >= 200) {
    scrItemspell(state, spellId - 200, star);
    return;
  }
  switch (spellId) {
    case 2: {

      const healnum = p.battlemag[caster] * 5;
      scrHeal(state, star, healnum);
      healVisuals(state, star, healnum);
      state.spelldelay = 15;
      break;
    }
    case 3:
      if (j.monsterstatus === 1) {

        state.jokerDefeated = true;
        state.jokerPacified = true;
        bodyDefeat(state);
      } else {

        const je = state.entities.find((o) => o.alive && o.type.name === 'obj_joker');
        const ps = spawn(state, pacifyspell, { x: 0, y: 0 });
        ps.target = je;
        ps.fail = 1;
      }
      state.spelldelay = 20;
      break;
    case 4: {

      state.spelldelay = 30;
      if (!state.jokerDefeated) {
        state.spelldelay = 70;
        const damage = Math.ceil((p.battlemag[caster] * 5 + p.battleat[caster] * 11) - j.df * 3);
        const susie = heroEntity(state, 1);
        const anim = spawn(state, rudebusterAnim, { x: susie ? susie.x : 90, y: susie ? susie.y : 150 });
        anim.damage = damage;
        anim.star = star;
        anim.caster = caster;
      }
      break;
    }
    case 100:

      if ((j.mercymod ?? 0) >= 100) {
        state.jokerDefeated = true;
      } else {
        j.mercymod = Math.max(0, (j.mercymod ?? 0) + 0);
        const je = state.entities.find((o) => o.alive && o.type.name === 'obj_joker');
        const ps = spawn(state, pacifyspell, { x: 0, y: 0 });
        ps.target = je;
        ps.fail = 1;
        ps.flashcolor = C_YELLOW;
      }
      state.spelldelay = 0;
      break;
    default:
      break;
  }
}

export const attackpress = {
  name: 'obj_attackpress',
  objIndex: 190,
  create(e, state) {
    const p = state.party;

    state.hittarget = 0;
    const havechar = [0, 1, 2].map((i) => (p.charaction[i] === 1 ? 1 : 0));
    e.havechar = havechar;

    let boltorder0 = gmlChoose(state.gmlRng, [0, 1, 2]);
    if (havechar[1] === 0 && havechar[2] === 0) boltorder0 = 0;
    if (boltorder0 === 2) gmlChoose(state.gmlRng, [0, 1]);
    else if (boltorder0 === 1) gmlChoose(state.gmlRng, [0, 2]);
    else gmlChoose(state.gmlRng, [1, 2]);
    if (havechar[1] === 1 && havechar[2] === 0) gmlChoose(state.gmlRng, [0, 1]);

    const charbolt = havechar.map((h) => (h === 1 ? 1 : 0));
    const bolttotal = charbolt[0] + charbolt[1] + charbolt[2];
    e.bolttotal = bolttotal;
    e.boltchar = [];
    e.boltframe = [];
    e.boltalive = [];
    const boltuse = [0, 0, 0];
    const diff = 12;
    for (let i = 0; i < bolttotal; i += 1) {
      e.boltalive[i] = 1;
      let c = gmlChoose(state.gmlRng, [0, 1, 2]);
      while (havechar[c] === 0) c = gmlChoose(state.gmlRng, [0, 1, 2]);
      while (boltuse[c] >= charbolt[c]) {
        c = gmlChoose(state.gmlRng, [0, 1, 2]);
        while (havechar[c] === 0) c = gmlChoose(state.gmlRng, [0, 1, 2]);
      }
      e.boltchar[i] = c;
      boltuse[c] += 1;
    }
    let boltxoff = 0;
    let lastbolt = -1;
    for (let i = 0; i < bolttotal; i += 1) {
      boltxoff += lastbolt;
      e.boltframe[i] = 30 + boltxoff;
      if (i < bolttotal - 1) {
        if (lastbolt !== 0 && e.boltchar[i] !== e.boltchar[i + 1]) {
          lastbolt = gmlChoose(state.gmlRng, [0, diff, diff * 1.5]);
        } else {
          lastbolt = gmlChoose(state.gmlRng, [diff, diff * 1.5]);
        }
      } else {
        lastbolt = gmlChoose(state.gmlRng, [diff, diff * 1.5]);
      }
    }

    state.lastBoltData = { frame: state.frame, boltframe: [...e.boltframe], boltchar: [...e.boltchar] };

    e.points = [0, 0, 0];
    e.attackedH = [0, 0, 0];
    e.maxdelay = 0;
    e.maxdelaytimer = 0;
    e.active = 0;
    e.posttimer = 0;
    e.boltx = 0;
    e.imagetimer = 0;
    e.timermax = havechar.every((h) => h === 0) ? 3 : 50;
    e.fade = 0;
    e.fadeamt = 0;
    e.fakefade = 0;

    e.pressbuffer = [0, 0, 0, 0];
    e.drawn = null;
  },
  drawStep(e, state) {
    const monsterAlive = state.joker.hp > 0 ? 1 : 0;
    e.drawn = null;
    e.maxdelaytimer += 1;
    if (e.maxdelaytimer >= e.maxdelay) e.active = 1;
    if (e.active !== 1) return;

    const p = state.party;
    const drawn = { boxes: [], bolts: [], fade: 0 };
    for (let i = 0; i < 3; i += 1) {
      if (p.char[i] !== 0 && e.havechar[i] === 1) {
        const j = p.char[i];
        drawn.boxes.push([i, j, e.pressbuffer[j] > 0 ? e.pressbuffer[j] / 5 : 0]);
      }
    }

    const boltcount = [0, 0, 0];
    for (let i = 0; i < e.bolttotal; i += 1) {
      if (e.boltframe[i] - e.boltx < -5) e.boltalive[i] = 0;
      const rel = e.boltframe[i] - e.boltx;
      if (!(rel < 0) && e.imagetimer === 0 && e.boltalive[i] === 1) {
        spawn(state, afterimage, {
          x: e.x + 80 + e.boltframe[i] * 8 - e.boltx * 8, y: e.y + 38 * e.boltchar[i],
          sprite_index: 'spr_attackspot', image_alpha: 0.4,
        });
      }
      if (e.boltalive[i] === 1) {
        drawn.bolts.push([e.x + 80 + e.boltframe[i] * 8 - e.boltx * 8, e.y + 38 * e.boltchar[i],
          rel < 0 ? 1 + rel / 3 : 1]);
        boltcount[e.boltchar[i]] += 1;
      }
    }
    for (let i = 0; i < 3; i += 1) {
      if (boltcount[i] === 0 && e.havechar[i] === 1 && e.attackedH[i] === 0) {
        e.attackedH[i] = 1;

        if (monsterAlive) {
          const hero = state.entities.find((h) => h.alive && h.slot === i && h.type.alarm?.[1]);
          if (hero) {
            hero.points = e.points[i];
            hero.state = 1;
            hero.attacktimer = 0;
            hero.attacked = 0;
          }
        }

        break;
      }
    }

    if (monsterAlive && state.menuEdges?.confirm) {

      e.pressbuffer[0] = 5;
      e.pressbuffer[1] = 5;
      e.pressbuffer[2] = 5;
      let qualify = -1;
      let topclose = 999;
      let dual = -1;
      for (let i = 0; i < e.bolttotal; i += 1) {
        if (e.boltalive[i] !== 1) continue;
        const close = e.boltframe[i] - e.boltx;
        if (close < 15 && close > -5) {
          if (close === topclose) dual = i;
          if (close < topclose) { topclose = close; qualify = i; }
        }
      }
      const award = (idx) => {
        const bc = e.boltchar[idx];
        const pp = Math.abs(topclose);
        makeBurstbolt(state, e.x + 80 + e.boltframe[idx] * 8 - e.boltx * 8, e.y + 38 * bc, bc, pp);
        if (pp === 0) e.points[bc] += 150;
        else if (pp === 1) e.points[bc] += 120;
        else if (pp === 2) e.points[bc] += 110;
        else e.points[bc] += 100 - pp * 2;
        e.boltalive[idx] = 0;
      };
      if (qualify !== -1) {
        award(qualify);
        if (dual !== -1) award(dual);
      }
    }

    if (monsterAlive === 0) {

      e.fakefade = 1;
      if (e.posttimer < e.timermax - 35) e.posttimer = e.timermax - 34;
    }
    e.imagetimer += 1;
    e.boltx += 1;
    e.pressbuffer[0] -= 1;
    e.pressbuffer[1] -= 1;
    e.pressbuffer[2] -= 1;
    if (e.imagetimer > 1) e.imagetimer = 0;

    let goahead = 0;
    if ((e.attackedH[0] === 1 || e.havechar[0] === 0)
      && (e.attackedH[1] === 1 || e.havechar[1] === 0)
      && (e.attackedH[2] === 1 || e.havechar[2] === 0)) goahead = 1;
    if (monsterAlive === 0) goahead = 1;
    if (goahead === 1) {
      e.posttimer += 1;
      if (e.posttimer > e.timermax && e.fade === 0) {

        for (const h of state.entities) {
          if (!h.alive || h.type.objIndex < 213 || h.type.objIndex > 215) continue;
          if (h.state === 1) h.state = 0;
          h.attacked = 0;
          h.itemed = 0;
        }
        if (monsterAlive) {
          state.mnfight = 1;
          state.myfight = -1;
        } else {
          state.jokerDefeated = true;
        }
        e.fade = 1;
      }
    }

    if (e.fade === 1 || e.fakefade === 1) {
      e.fadeamt += 0.08;
      drawn.fade = e.fadeamt;
      if (e.fade === 1 && e.fadeamt > 1) destroy(e);
    }
    e.drawn = drawn;
  },
};

export function menuStep(e, state) {

  const preMenu = state.bmenuno;
  const snap = () => JSON.stringify([state.bmenucoord0, state.bmenucoord9, state.bmenucoord2,
    state.bmenucoord4, state.bmenucoord7, state.bmenucoord8, state.charturn]);
  const preSnap = snap();
  menuStepInner(e, state);
  if (state.myfight === 0) {
    if (state.bmenuno !== preMenu) state.audio?.cue('snd_select');
    else if (snap() !== preSnap) state.audio?.cue('snd_menumove');
  }
}

const coordOf = (state, n) => state[`bmenucoord${n}`] ?? (state[`bmenucoord${n}`] = [0, 0, 0]);

const CANACT = [1, 1, 1, 0, 0, 0];
const ACTCOST = [0, 50, 125, 0, 0, 0];
const ACTACTOR = [0, 1, 4, 0, 0, 0];

function menuStepInner(e, state) {
  if (state.myfight !== 0) return;

  if (state.bmenuno === 0 && !(e.battlewriter && e.battlewriter.alive)) {
    e.battlewriter = spawnBattleWriter(state, [state.battlemsg ?? BATTLEMSG_START]);
  }
  const p = state.party;
  const inp = state.menuEdges;
  if (!inp) return;
  const ct = () => state.charturn;

  const menuDepth = (d) => {
    const w = e.battlewriter;
    if (w && w.alive) {
      if (d === 10) w.skipme = 1;
      w.depth = d;
    }
    for (const o of state.entities) if (o.alive && o.type === face) o.depth = d;
  };

  if (state.bmenuno === 0) {
    const coord = state.bmenucoord0;
    if (inp.left && e.lbuffer < 0) {
      coord[ct()] = coord[ct()] === 0 ? 4 : coord[ct()] - 1;
      e.rbuffer = 1;
    }
    if (inp.right && e.rbuffer < 0) {
      coord[ct()] = coord[ct()] === 4 ? 0 : coord[ct()] + 1;
      e.lbuffer = 1;
    }
    if (inp.confirm && e.twobuffer < 0) {
      e.onebuffer = 1;
      const c = coord[ct()];
      if (c === 0) state.bmenuno = 1;
      if (c === 1 && p.char[ct()] !== 1) state.bmenuno = 2;
      if (c === 1 && p.char[ct()] === 1) state.bmenuno = 11;
      if (c === 2 && state.tempitem && state.tempitem[0][ct()] !== 0) {
        state.bmenuno = 4;
        const c4 = coordOf(state, 4);
        for (let i = 0; i < 12; i += 1) {
          if (state.tempitem[c4[ct()]][ct()] === 0 && c4[ct()] > 0) c4[ct()] -= 1;
        }
      }
      if (c === 3) state.bmenuno = 12;
      if (c === 4) {
        scrTensionheal(state, 40);
        (p.faceaction ??= [0, 0, 0])[ct()] = 4;
        p.charaction[ct()] = 10;
        scrNexthero(state);
      }
    }
    if (inp.cancel && e.onebuffer < 0 && ct() > 0) {
      e.twobuffer = 1;
      scrPrevhero(state);
    }
    menuDepth(3);
  }

  if (state.bmenuno === 2) {
    menuDepth(10);
    const c2 = coordOf(state, 2);
    const thischar = p.char[ct()];
    const sp = (i) => spellAt(thischar, i);
    if (inp.right) {
      let cango = 1;
      const sc = c2[ct()];
      if (sc < 11) {
        if (sp(c2[ct()] + 1) === 0) {
          cango = 0;
          if (sc % 2 === 1 && sc > 0) c2[ct()] -= 1;
        }
      } else {
        c2[ct()] -= 1;
        cango = 0;
      }
      if (cango === 1) c2[ct()] += sc % 2 === 0 ? 1 : -1;
    }
    if (inp.left) {
      const sc = c2[ct()];
      if (sp(1) !== 0) c2[ct()] += sc % 2 === 0 ? 1 : -1;
    }
    if (inp.down) {
      const sc = c2[ct()];
      let cango = 1;
      if (sc >= 10) cango = 0;
      else {
        if (sp(sc + 2) === 0) cango = 0;
        if (sc === 5 && sp(6) !== 0 && sp(7) === 0) cango = 2;
      }
      if (cango === 1) c2[ct()] += 2;
      if (cango === 2) c2[ct()] = 6;
    }
    if (inp.up) {
      if (c2[ct()] > 1) c2[ct()] -= 2;
    }
    const info = spellInfo(sp(c2[ct()]), p);
    state.tensionselect = info.cost;
    if (inp.confirm && sp(c2[ct()]) !== 0 && e.onebuffer < 0) {
      if (info.cost <= state.tension) {
        e.onebuffer = 2;
        state.bmenuno = 0;
        state.pendingSpellCost = info.cost;
        if (info.target === 0) scrSpellconsumeb(state);
        if (info.target === 1) state.bmenuno = 8;
        if (info.target === 2) state.bmenuno = 3;
      }
    }
    if (inp.cancel && e.onebuffer < 0) {
      state.tensionselect = 0;
      e.twobuffer = 1;
      state.bmenuno = 0;
    }
  }

  if (state.bmenuno === 4) {
    menuDepth(10);
    const c4 = coordOf(state, 4);
    const ti = (i) => (state.tempitem[i] ? state.tempitem[i][ct()] : 0) ?? 0;
    if (ti(c4[ct()]) === 0) c4[ct()] -= 1;
    if (inp.right) {
      let cango = 1;
      const ic = c4[ct()];
      if (ic < 11) {
        if (ti(c4[ct()] + 1) === 0) {
          cango = 0;
          if (ic % 2 === 1 && ic > 0) c4[ct()] -= 1;
        }
      } else {
        c4[ct()] -= 1;
        cango = 0;
      }
      if (cango === 1) c4[ct()] += ic % 2 === 0 ? 1 : -1;
    }
    if (inp.left) {
      const ic = c4[ct()];
      if (ti(1) !== 0) c4[ct()] += ic % 2 === 0 ? 1 : -1;
    }
    if (inp.down) {
      const ic = c4[ct()];
      let cango = 1;
      if (ic >= 10) cango = 0;
      else {
        if (ti(ic + 2) === 0) cango = 0;
        if (ic === 5 && ti(6) !== 0 && ti(7) === 0) cango = 2;
      }
      if (cango === 1) c4[ct()] += 2;
      if (cango === 2) c4[ct()] = 6;
    }
    if (inp.up) {
      if (c4[ct()] > 1) c4[ct()] -= 2;
    }
    if (ti(c4[ct()]) === 0) c4[ct()] -= 1;
    if (inp.confirm && ti(c4[ct()]) !== 0 && e.onebuffer < 0) {
      e.onebuffer = 2;
      state.bmenuno = 0;
      const target = ITEMS[ti(c4[ct()])]?.target ?? 0;
      if (target === 0 || target === 2) scrItemconsumeb(state);
      if (target === 1) state.bmenuno = 7;
    }
    if (inp.cancel && e.onebuffer < 0) {
      e.twobuffer = 1;
      state.bmenuno = 0;
    }
  }

  if (state.bmenuno === 9) {
    const c9 = coordOf(state, 9);
    if (inp.right) {
      let cango = 1;
      const ac = c9[ct()];
      if (ac < 5) {
        if (CANACT[c9[ct()] + 1] === 0) {
          cango = 0;
          if (ac % 2 === 1 && ac > 0) c9[ct()] -= 1;
        }
      } else {
        c9[ct()] -= 1;
        cango = 0;
      }
      if (cango === 1) c9[ct()] += ac % 2 === 0 ? 1 : -1;
    }
    if (inp.left) {
      const ac = c9[ct()];
      if (ac % 2 === 0) {
        if (CANACT[ac + 1] !== 0) c9[ct()] += 1;
      } else {
        c9[ct()] -= 1;
      }
    }
    if (inp.down) {
      const ac = c9[ct()];
      let cango = 1;
      if (ac >= 4) cango = 0;
      else if (CANACT[ac + 2] === 0) cango = 0;
      if (cango === 1) c9[ct()] += 2;
    }
    if (inp.up) {
      if (c9[ct()] > 1) c9[ct()] -= 2;
    }
    const a = c9[ct()];
    state.tensionselect = ACTCOST[a];

    let canpress = 1;
    if ((ACTACTOR[a] === 2 || ACTACTOR[a] === 4) && p.hp[2] <= 0) canpress = 0;
    if ((ACTACTOR[a] === 3 || ACTACTOR[a] === 4) && p.hp[3] <= 0) canpress = 0;
    if (canpress === 1) {
      if (inp.confirm && CANACT[a] === 1 && state.tension >= state.tensionselect && e.onebuffer < 0) {
        e.onebuffer = 2;
        state.bmenuno = 0;
        state.tension -= ACTCOST[a];
        state.tensionselect = 0;
        const j = state.entities.find((o) => o.alive && o.type.name === 'obj_joker');
        if (j) j.acting = a + 1;
        state.acting[0] = 1;
        if (ACTACTOR[a] === 2) state.acting[1] = 1;
        if (ACTACTOR[a] === 3) state.acting[2] = 1;
        if (ACTACTOR[a] === 4) {
          state.acting[2] = 1;
          state.acting[1] = 1;
        }
        for (let i = 0; i < 3; i += 1) {
          if (state.acting[i] === 1) {
            p.charaction[i] = 9;
            (p.faceaction ??= [0, 0, 0])[i] = 6;
          }
        }
        scrNexthero(state);
      }
    }
    if (inp.cancel && e.onebuffer < 0) {
      state.tensionselect = 0;
      e.twobuffer = 1;
      state.bmenuno = 11;
    }
  }

  const GROUP = [7, 1, 8, 3, 11, 12];
  if (GROUP.includes(state.bmenuno)) {
    menuDepth(10);
    if (inp.cancel && e.onebuffer < 0) {
      e.twobuffer = 1;
      if (state.bmenuno === 1 || state.bmenuno === 11 || state.bmenuno === 12) state.bmenuno = 0;
      if (state.bmenuno === 7) state.bmenuno = 4;
      if (state.bmenuno === 8 || state.bmenuno === 3) state.bmenuno = 2;
    }
    if (GROUP.includes(state.bmenuno)) {
      const n = state.bmenuno;
      const cn = coordOf(state, n);

      const ht = (n === 7 || n === 8) ? [1, 1, 1] : (state.monsters ?? [1, 0, 0]);
      if (cn[ct()] === 2 && ht[2] === 0) cn[ct()] = 0;
      if (cn[ct()] === 0 && ht[0] === 0) cn[ct()] = 1;
      if (cn[ct()] === 1 && ht[1] === 0) cn[ct()] = 0;
      if (cn[ct()] === 0 && ht[0] === 0) cn[ct()] = 2;
      if (inp.down) {
        const c = cn[ct()];
        if (c === 0) { if (ht[1] === 1) cn[ct()] = 1; else if (ht[2] === 1) cn[ct()] = 2; }
        else if (c === 1) { if (ht[2] === 1) cn[ct()] = 2; else if (ht[0] === 1) cn[ct()] = 0; }
        else if (c === 2) { if (ht[0] === 1) cn[ct()] = 0; else if (ht[1] === 1) cn[ct()] = 1; }
      }
      if (inp.up) {
        const c = cn[ct()];
        if (c === 0) { if (ht[2] === 1) cn[ct()] = 2; else if (ht[1] === 1) cn[ct()] = 1; }
        else if (c === 1) { if (ht[0] === 1) cn[ct()] = 0; else if (ht[2] === 1) cn[ct()] = 2; }
        else if (c === 2) { if (ht[1] === 1) cn[ct()] = 1; else if (ht[0] === 1) cn[ct()] = 0; }
      }
      if (inp.confirm && e.onebuffer < 0) {
        e.onebuffer = 1;
        p.chartarget = p.chartarget ?? [0, 0, 0];
        if (state.bmenuno === 1) {
          p.chartarget[ct()] = cn[ct()];
          (p.faceaction ??= [0, 0, 0])[ct()] = 1;
          p.charaction[ct()] = 1;
          scrNexthero(state);
        }
        if (state.bmenuno === 7) {
          p.chartarget[ct()] = cn[ct()];
          scrItemconsumeb(state);
        }
        if (state.bmenuno === 8 || state.bmenuno === 3) {
          p.chartarget[ct()] = cn[ct()];
          scrSpellconsumeb(state);
        }
        if (state.bmenuno === 11) {
          state.bmenuno = 9;
          const c9 = coordOf(state, 9);
          let actcoord = c9[ct()];
          for (let i = 0; i < 6; i += 1) {
            if (CANACT[actcoord] === 0 && actcoord > 0) {
              c9[ct()] -= 1;
              actcoord -= 1;
            }
          }
          e.onebuffer = 1;
        }
        if (state.bmenuno === 12) {
          (p.faceaction ??= [0, 0, 0])[ct()] = 10;
          p.chartarget[ct()] = cn[ct()];
          p.charaction[ct()] = 2;
          p.charspecial[ct()] = 100;
          scrNexthero(state);
        }
      }
    }
  }
}

export function itemWriteback(state) {
  if (!state.inventory || !state.tempitem) return;
  const col = Math.min(state.charturn, 2);
  for (let i = 0; i < 12; i += 1) state.inventory[i] = state.tempitem[i][col];
  for (let i = 0; i < 12; i += 1) {
    for (let j = 0; j < 3; j += 1) state.tempitem[i][j] = state.inventory[i];
  }
}

function scrItemconsumeb(state) {
  const p = state.party;
  const col = state.charturn;
  const c4 = coordOf(state, 4);
  const id = state.tempitem[c4[col]][col];
  (p.faceaction ??= [0, 0, 0])[col] = 3;
  p.charaction[col] = 4;
  p.charspecial[col] = id + 200;
  if (ITEMS[id]?.usable === 1) {

    state.tempitem[12][col] = 0;
    for (let i = c4[col]; i < 12; i += 1) state.tempitem[i][col] = state.tempitem[i + 1][col];
  }
  scrNexthero(state);
}

export function menuBuffers(e) {
  e.onebuffer -= 1;
  e.twobuffer -= 1;
  e.lbuffer -= 1;
  e.rbuffer -= 1;
}

export function mnendturnMenu(state) {
  const p = state.party;

  for (const n of [0, 1, 2, 3, 4, 7, 8, 9, 11, 12]) state[`bmenucoord${n}`] = [0, 0, 0];
  state.mnfight = 0;
  state.myfight = 0;
  state.bmenuno = 0;
  state.charturn = 0;

  if (p.charmove[0] === 0) state.charturn = 1;
  if (state.charturn === 1 && p.charmove[1] === 0) state.charturn = 2;
  let skip = 0;
  if (state.charturn === 2 && p.charmove[2] === 0) skip = 1;
  state.acting = [0, 0, 0];
  state.temptension = [state.tension, state.tension, state.tension];
  for (let i = 0; i < 3; i += 1) {
    p.charspecial[i] = 0;
    p.targeted[i] = 0;
    p.charaction[i] = 0;
    (p.faceaction ??= [0, 0, 0])[i] = 0;
  }
  if (skip === 1) {
    scrEndturn(state);
  }
}

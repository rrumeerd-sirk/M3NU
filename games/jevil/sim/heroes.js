import { spawnShake } from './shake.js';
import { makeDmgwriter } from './dmgwriter.js';
import { scrSpell } from './menu.js';
import { spawn } from './entity.js';


import { gmlRandom, channelRandom } from './rng.js';
import { scrTensionheal } from './graze.js';
import { gmlCos, mergeColor } from './gml.js';
import { SPRITE_FRAMES } from './data/object-defaults.js';
import { afterimage } from './afterimage.js';
import { makeBasicattack } from './attackfx.js';


const SPRITES = [
  {
    normalsprite: 'spr_krisr_dark', idlesprite: 'spr_krisb_idle', defendsprite: 'spr_krisb_defend',
    hurtsprite: 'spr_krisb_hurt', attackreadysprite: 'spr_krisb_attackready', attacksprite: 'spr_krisb_attack',
    itemsprite: 'spr_krisb_item', actreadysprite: 'spr_krisb_actready', actsprite: 'spr_krisb_act',
    itemreadysprite: 'spr_krisb_itemready', spellreadysprite: 'spr_krisb_actready', spellsprite: 'spr_krisb_act',
    defeatsprite: 'spr_krisb_defeat', victorysprite: 'spr_krisb_victory',
    actframes: 7, actreturnframes: 10, attackframes: 6, itemframes: 6, defendframes: 5, spellframes: 10,
    attackspeed: 0.5, mywidth: 68, myheight: 74,
  },
  {
    normalsprite: 'spr_susier_dark', idlesprite: 'spr_susieb_idle', defendsprite: 'spr_susieb_defend',
    hurtsprite: 'spr_susieb_hurt', attackreadysprite: 'spr_susieb_attackready', attacksprite: 'spr_susieb_attack',
    itemsprite: 'spr_susieb_item', actreadysprite: 'spr_susieb_actready', actsprite: 'spr_susieb_act',
    itemreadysprite: 'spr_susieb_itemready', spellreadysprite: 'spr_susieb_spellready', spellsprite: 'spr_susieb_spell',
    defeatsprite: 'spr_susieb_defeat', victorysprite: 'spr_susieb_victory',
    actframes: 7, actreturnframes: 10, attackframes: 5, itemframes: 5, defendframes: 5, spellframes: 8,
    attackspeed: 0.5, mywidth: 70, myheight: 82,
  },
  {
    normalsprite: 'spr_ralseir', idlesprite: 'spr_ralseib_idle', defendsprite: 'spr_ralseib_defend',
    hurtsprite: 'spr_ralsei_shock', attackreadysprite: 'spr_ralseib_attackready', attacksprite: 'spr_ralseib_attack',
    itemsprite: 'spr_ralseib_item', actreadysprite: 'spr_ralseib_actready', actsprite: 'spr_ralseib_act',
    itemreadysprite: 'spr_ralseib_itemready', spellreadysprite: 'spr_ralseib_spellready', spellsprite: 'spr_ralseib_spell',
    defeatsprite: 'spr_ralseib_defeat', victorysprite: 'spr_ralseib_victory',
    actframes: 7, actreturnframes: 10, attackframes: 5, itemframes: 7, defendframes: 6, spellframes: 10,
    attackspeed: 0.5, mywidth: 52, myheight: 86,
  },
];

const WHITE = [255, 255, 255];
const BLACK = [0, 0, 0];


export function heroAt(state, slot) {
  return state.entities.find((o) => o.alive && o.slot === slot && o.type.objIndex >= 213 && o.type.objIndex <= 215);
}



function heroDraw(e, state) {
  const p = state.party;
  const slot = e.slot;
  const fa = (p.faceaction ??= [0, 0, 0]);
  const cc = (p.charcond ??= [0, 0, 0]);
  e.hurtDraw = null;
  e.targetDraw = null;
  e.flashAlpha = null;
  e.mainDraw = false;
  if (p.hp[p.char[slot]] > 0) {
    if (state.myfight === 3 && fa[slot] === 6) e.state = 6;
    if (e.state === 0 && e.hurt === 0) {
      e.acttimer = 0;
      e.thissprite = e.idlesprite;
      if (fa[slot] === 1) e.thissprite = e.attackreadysprite;
      if (fa[slot] === 3) e.thissprite = e.itemreadysprite;
      if (fa[slot] === 2) e.thissprite = e.spellreadysprite;
      if (fa[slot] === 6) e.thissprite = e.actreadysprite;
      if (cc[slot] === 5) {
        e.thissprite = e.defeatsprite;
        fa[slot] = 9;
      }
      if (fa[slot] === 4) {
        e.thissprite = e.defendsprite;
        e.index = e.defendtimer;
        if (e.defendtimer < e.defendframes) e.defendtimer += 0.5;
      } else {
        e.defendtimer = 0;
        e.index = e.siner / 5;
      }
      e.siner += 1;
    }
    if (e.state === 1 && e.hurt === 0) {
      e.siner += 1;
      if (e.attacked === 0) {

        if (e.type.objIndex === 213) state.audio?.cue('snd_laz_c');
        if (e.points === 150) {
          state.audio?.cue('snd_criticalswing');
          for (let k = 0; k < 3; k++) {
            const y = e.y + 30 + channelRandom(state, 30);
            const x = e.x + e.mywidth + channelRandom(state, 50);
            const anim = spawn(state, afterimage, { x, y });
            Object.assign(anim, {
              sprite_index: 'spr_lightfairy', image_speed: 0.25, depth: -20,
              image_xscale: 2, image_yscale: 2,
            });
            anim.hspeed = 2 + channelRandom(state, 4);
            anim.friction = -0.25;
          }
        }
        e.attacked = 1;
        e.alarm[1] = 10;
      }
      e.image_index = e.attacktimer < e.attackframes ? e.attacktimer : e.attackframes;
      e.thissprite = e.attacksprite;
      e.index = e.image_index;
      e.attacktimer += e.attackspeed;
    }
    if ((e.state === 2 || e.state === 4) && e.hurt === 0) {
      e.siner += 1;
      if (e.itemed === 0) {
        e.itemed = 1;
        e.alarm[4] = 15;
      }
      const frames = e.state === 2 ? e.spellframes : e.itemframes;
      e.image_index = e.attacktimer < frames ? e.attacktimer : frames;

      if (state.jokerDefeated) e.attacktimer = 0;
      e.index = e.image_index;
      e.thissprite = e.state === 2 ? e.spellsprite : e.itemsprite;
      e.attacktimer += 0.5;
    }
    if (e.state === 6) {
      if (state.myfight === 3) {
        if (e.acttimer < e.actframes) e.acttimer += 0.5;
      } else {
        e.acttimer += 0.5;
      }
      e.thissprite = e.actsprite;
      e.index = e.acttimer;
      if (e.acttimer >= e.actreturnframes) {
        e.acttimer = 0;
        e.state = 0;
        fa[slot] = 0;
      }
    }
    if (e.state === 7) {
      e.hurt = 0;
      e.hurttimer = 0;
      if (e.victoryanim < e.victoryframes) {
        e.thissprite = e.victorysprite;
        e.index = e.victoryanim;
        e.victoryanim += 0.334;
      } else {
        e.thissprite = e.normalsprite;
        e.index = 0;
      }
    }
    if (e.hurt === 1) {
      e.hurtindex = Math.min(e.hurttimer / 2, 2);
      if (cc[slot] === 5) {
        fa[slot] = 5;
        p.charmove[slot] = 1;
        cc[slot] = 0;
      }
      if (fa[slot] === 0) fa[slot] = 5;
      e.specdraw = 1;
      if (fa[slot] !== 4) {
        e.hurtDraw = [e.hurtsprite, e.hurtindex, e.x - 20 + e.hurtindex * 10];
      } else {
        e.thissprite = e.defendsprite;
        e.index = e.defendtimer;
        e.hurtDraw = [e.defendsprite, e.defendtimer, e.x - 20 + e.hurtindex * 10];
      }
      if (e.hurttimer > 15) {
        e.hurttimer = 0;
        e.hurt = 0;
        if (fa[slot] === 5) fa[slot] = 0;
      }
      e.hurttimer += 1;
    }
  } else {
    cc[slot] = 0;
    e.hurttimer = 0;
    e.hurt = 0;
    e.thissprite = e.defeatsprite;
    e.index = 0;
    e.siner += 1;
  }
  if (e.specdraw === 0) {
    e.sprite_index = e.thissprite;
    e.image_index = e.index;
    e.mainDraw = true;
    if (e.flash === 1) {
      e.fsiner += 1;
      e.flashAlpha = -gmlCos(e.fsiner / 5) * 0.4 + 0.6;
    }
  }
  e.specdraw = 0;
  if (e.becomeflash === 0) e.flash = 0;
  const darkener = state.entities.some((o) => o.alive && o.type.name === 'obj_darkener');
  if ((p.targeted?.[slot] ?? 0) === 1) {
    if (state.mnfight === 1) e.targetDraw = e.siner / 10;
  } else if (e.combatdarken === 1 && darkener) {
    if (e.darkify === 1) {
      if (e.darkentimer < 15) e.darkentimer += 1;
      e.image_blend = mergeColor(WHITE, BLACK, e.darkentimer / 30);
    }
  }
  if (e.darkify === 0) {
    if (e.darkentimer > 0) e.darkentimer -= 3;
    e.image_blend = mergeColor(WHITE, BLACK, e.darkentimer / 30);
  }
  e.becomeflash = 0;
}



export function bcDrawFlash(state) {
  if (!state.party) return;

  if (state.myfight === 0 && [1, 3, 9, 11, 12].includes(state.bmenuno)) {
    const je = jokerEntity(state);
    if (je) {
      if (je.flash === 0) je.fsiner = 0;
      je.flash = 1;
      je.becomeflash = 1;
    }
  }
  if ((state.bmenuno === 7 || state.bmenuno === 8) && state.myfight === 0) {
    const c = state[`bmenucoord${state.bmenuno}`] ?? [0, 0, 0];
    const h = heroAt(state, c[state.charturn] ?? 0);
    if (h) {
      if (h.flash === 0) h.fsiner = 0;
      h.flash = 1;
      h.becomeflash = 1;
    }
  }
}

function jokerEntity(state) {
  return state.entities.find((o) => o.alive && o.type.name === 'obj_joker');
}



function hurtJoker(state, amt) {
  const je = jokerEntity(state);
  if (!je) return;
  if (amt > 0) {
    je.shakex = 9;
    je.state = 3;
    je.hurttimer = 30;
    je.hurtamt = amt;
  } else {
    je.hurtamt = 0;
  }
}



export function damageEnemy(state, damage, delay = 2, caster = 1) {

  const hit = state.hittarget ?? 0;
  makeDmgwriter(state, 520, 200 - hit * 20, { dtype: (state.party?.char?.[caster] ?? 2) - 1, damage, delay });
  state.hittarget = hit + 1;
  state.joker.hp -= damage;
  if (damage > 0) {
    state.audio?.cue('snd_damage');
    hurtJoker(state, damage);
    const jk = jokerEntity(state);
    if (jk) jk.hurttimer = 30;
  }
}

function makeHero(slot, objIndex, name) {
  return {
    name,
    objIndex,
    create(e) {

      Object.assign(e, {
        slot, points: 0, becomeflash: 0, state: 0, flash: 0, siner: 0, fsiner: 0,
        attacktimer: 0, attacked: 0, combatdarken: 1, darkentimer: 0, darkify: 0,
        image_xscale: 2, image_yscale: 2, index: 0, specdraw: 0, victoryanim: 0,
        hurt: 0, hurttimer: 0, hurtindex: 0, acttimer: 0, defendtimer: 0, itemed: 0,
        cancelattack: 0,
      });
      Object.assign(e, SPRITES[slot]);
      e.victoryframes = SPRITE_FRAMES[e.victorysprite] ?? 1;
    },
    drawStep: heroDraw,
    alarm: {

      4: (e, state) => {

        state.party.faceaction[e.slot] = 0;
        if (!state.jokerDefeated) scrSpell(state, state.party.charspecial[e.slot], e.slot);
        e.state = 0;
        e.attacktimer = 0;
      },
      1: (e, state) => {
        state.party.faceaction[e.slot] = 0;

        if (state.joker.hp <= 0) e.cancelattack = 1;
        if (e.cancelattack === 0) {

          const p = state.party;
          const hit = state.hittarget ?? 0;
          const dm = makeDmgwriter(state, 520, 200 - hit * 20, { dtype: p.char[e.slot] - 1, delay: 8 });
          let damage = Math.round((p.battleat[e.slot] * e.points) / 20 - state.joker.df * 3);
          if (damage < 0) damage = 0;
          if (damage === 0) dm.delay = 2;
          dm.damage = damage;
          state.hittarget = hit + 1;
          state.joker.hp -= damage;
          if (damage > 0) {

            scrTensionheal(state, Math.round(e.points / 15));

            const ry = gmlRandom(state.gmlRng, 6);
            const rx = gmlRandom(state.gmlRng, 6);
            makeBasicattack(state, 520 + rx, 180 + ry, e.type.name, e.points);

            if (e.type.objIndex === 214) {
              state.audio?.cue('snd_impact');
              spawnShake(state, spawn, { gated: false });
            }

            state.audio?.cue('snd_damage');
            hurtJoker(state, damage);
            const jk = jokerEntity(state);
            if (jk) jk.hurttimer = 30;
          }
        }

      },
    },
  };
}


export const heroKris = makeHero(0, 213, 'obj_herokris');
export const heroSusie = makeHero(1, 214, 'obj_herosusie');
export const heroRalsei = makeHero(2, 215, 'obj_heroralsei');
export const HEROES = [heroKris, heroSusie, heroRalsei];



import { spawn, destroy } from './entity.js';
import { makeDmgwriter } from './dmgwriter.js';
import { gmlRandom } from './rng.js';
import { marker } from './attacks/laserscythe.js';
import { scrAfterimage } from './afterimage.js';
import { setMotionComponents } from './index.js';
import { WHITE, angleDifference, gmlSin, mergeColor, pointDirection, pointDistance } from './gml.js';
import { damageEnemy } from './heroes.js';

const HERO_SIZE = { obj_herokris: [68, 74], obj_herosusie: [70, 82], obj_heroralsei: [52, 86] };

export const JEVIL_MONSTERX = 520;
export const JEVIL_MONSTERY = 180;

export function heroEntity(state, slot) {
  return state.entities.find((o) => o.alive && o.slot === slot && o.type.objIndex >= 213 && o.type.objIndex <= 215);
}

export const healanim = {
  name: 'obj_healanim',
  objIndex: 301,
  create(e) {
    e.t = 0;
    e.starcount = 0;
    e.stars = [];
    e.particlesprite = 'spr_sparestar_anim';
  },
  step(e, state) {
    e.t += 1;
    const target = e.target;
    if (!target || !target.alive) {
      for (const st of e.stars) if (st.alive) destroy(st);
      destroy(e);
      return;
    }
    if (e.t === 1) {
      e.x = target.x;
      e.y = target.y;
      e.image_xscale = target.image_xscale;
      e.image_yscale = target.image_yscale;
      e.sprite_index = target.sprite_index;
      const size = HERO_SIZE[target.type.name] ?? [34, 37];
      e.sw = size[0];
      e.sh = size[1];
      scrOflash(state, target);
    }
    if (e.t >= 1 && e.t <= 5) {
      for (let i = 0; i < 2; i += 1) {

        const sy = gmlRandom(state.gmlRng, e.sh);
        const sx = gmlRandom(state.gmlRng, e.sw);
        const st = spawn(state, marker, { x: e.x + sx, y: e.y + sy });
        st.builtinMotion = true;
        st.image_angle = gmlRandom(state.gmlRng, 360);
        st.depth = -10;
        st.image_xscale = 2;
        st.image_yscale = 2;
        st.image_alpha = 2;
        st.image_speed = 0.25;
        const hs = 2 - gmlRandom(state.gmlRng, 2);
        const vs = -3 - gmlRandom(state.gmlRng, 2);
        setMotionComponents(st, hs, vs);
        st.friction = 0.2;
        st.sprite_index = e.particlesprite;
        st.image_blend = [0, 255, 0];
        e.stars.push(st);
        e.starcount += 1;
      }
    }
    if (e.t >= 5 && e.t <= 30) {
      for (const st of e.stars) {
        if (!st.alive) continue;
        st.image_angle -= 10;
        st.image_alpha -= 0.1;
        if (st.image_alpha <= 0) destroy(st);
      }
      if (e.t >= 30) destroy(e);
    }
  },
};

export function scrOflash(state, target) {
  return spawn(state, oflash, {
    x: target.x, y: target.y,
    image_xscale: target.image_xscale, image_yscale: target.image_yscale,
    image_speed: 0, image_index: target.image_index, sprite_index: target.sprite_index,
    depth: target.depth - 1, target,
  });
}

export const oflash = {
  name: 'obj_oflash',
  objIndex: 302,
  create(e) {
    e.flashspeed = 1;
    e.siner = 0;
    e.image_speed = 0;
    e.drawn = null;
  },
  drawStep(e) {
    if (e.target?.alive) {
      e.image_index = e.target.image_index;

      if (e.sprite_index !== e.target.sprite_index) e.image_index = 0;
      e.sprite_index = e.target.sprite_index;
    }
    e.siner += e.flashspeed;
    e.drawn = [e.sprite_index, e.image_index, e.x, e.y, e.image_xscale, e.image_yscale, gmlSin(e.siner / 3)];
    if (e.siner > 4 && gmlSin(e.siner / 3) < 0) destroy(e);
  },
};

function healWriter(state, slot, amount) {
  const hero = heroEntity(state, slot);
  const tu = hero?.tu ?? 0;
  const dw = makeDmgwriter(state, hero?.x ?? 0, (hero?.y ?? 0) + (hero?.myheight ?? 0) - 24 - tu * 20,
    { delay: 8, dtype: 3, damage: amount });
  const p = state.party;
  const ch = p.char[slot];
  if (p.hp[ch] >= p.maxhp[ch]) dw.specialmessage = 3;
  if (hero) hero.tu = tu + 1;
}

export function healVisuals(state, slot, amount) {
  const hero = heroEntity(state, slot);
  if (hero) {
    const ha = spawn(state, healanim, { x: hero.x, y: hero.y });
    ha.target = hero;
  }
  healWriter(state, slot, amount);
}

export const rudebusterAnim = {
  name: 'obj_rudebuster_anim',
  objIndex: 303,
  create(e, state) {
    e.t = 0;
    e.image_speed = 0;
    e.damage = 1;
    e.red = 0;
    e.image_xscale = 2;
    e.image_yscale = 2;
    e.sprite_index = 'spr_susie_rudebuster';
    const susie = heroEntity(state, 1);
    e.depth = susie ? susie.depth : 0;
    if (susie) susie.visible = 0;
  },
  step(e, state) {
    e.image_index = e.t / 2;
    if (e.t >= 28) {
      const susie = heroEntity(state, 1);
      if (susie) susie.visible = 1;
      destroy(e);
    }

    if (!state.jokerDefeated) {
      if (e.t === 10) {
        state.audio?.cue('snd_rudebuster_swing');
        const b = spawn(state, rudebusterBolt, { x: e.x + 40, y: e.y + 30 });
        b.caster = e.caster;
        b.damage = e.damage;
        b.star = e.star;
        if (e.red === 1) b.red = 1;
      }
    }
    e.t += 1;
  },
};

export const rudebusterBolt = {
  name: 'obj_rudebuster_bolt',
  objIndex: 304,
  builtinMotion: true,
  create(e) {
    e.damage = 1;
    e.star = 0;
    e.caster = 0;
    e.image_alpha = 0;
    e.image_xscale = 2;
    e.image_yscale = 2;
    e.t = 0;
    e.explode = 0;
    e.bolt_timer = 0;
    e.chosen_bolt = 0;
    e.final_bolt = 0;
    e.red = 0;
    e.image_speed = 1;
    e.maxaft = 0;
    e.aft = [];
    e.burst = [];
    e.sprite_index = 'spr_rudebuster_beam';
  },
  step(e, state) {
    if (e.image_alpha < 1) e.image_alpha += 0.25;
    else e.image_alpha = 1;
    if (e.t === 0) {
      e.cx = JEVIL_MONSTERX;
      e.cy = JEVIL_MONSTERY;
      e.direction = pointDirection(e.x, e.y, e.cx, e.cy) - 20;
      e.speed = 24;
      e.friction = -1.5;
      e.image_angle = e.direction;
    }
    if (e.t >= 1 && e.explode === 0) {
      e.bolt_timer += 1;
      if (state.menuEdges?.confirm && e.bolt_timer >= 4 && e.chosen_bolt === 0) {
        e.chosen_bolt = e.bolt_timer;
      }
      const dir = pointDirection(e.x, e.y, e.cx, e.cy);
      e.direction = e.direction + angleDifference(dir, e.direction) / 4;
      e.image_angle = e.direction;
      if (pointDistance(e.x, e.y, e.cx, e.cy) <= 40) {
        e.final_bolt = e.chosen_bolt;
        e.visible = 0;
        e.explode = 1;
        e.t = 1;
      }
    }
    if (e.explode === 1) {
      if (e.t === 1) {
        if (e.chosen_bolt > 0) {
          const bonus = { 0: 30, 1: 28, 2: 22, 3: 20, 4: 13, 5: 11, 6: 10 }[e.final_bolt - e.chosen_bolt];
          if (bonus) e.damage += bonus;
          if (Math.abs(e.chosen_bolt - e.final_bolt) <= 2) state.audio?.cue('snd_scytheburst');
        }
        if (e.red === 1) e.damage += 90;
        state.hittarget = 0;
        damageEnemy(state, e.damage, 2, e.caster);
        state.audio?.cue('snd_rudebuster_hit');
        for (let i = 0; i < 8; i++) {
          const b = scrAfterimage(state, e);
          b.image_speed = 0.5;
          b.x = e.cx;
          b.y = e.cy;
          b.image_angle = 45 + i * 90;
          b.direction = b.image_angle;
          b.speed = 25;
          b.builtinMotion = true;
          b.depth = e.depth - 10;
          e.burst[i] = b;
        }
      }
      if (e.t >= 2) {
        for (let i = 0; i < 8; i++) {
          const b = e.burst[i];
          if (!b?.alive) continue;
          b.speed *= i < 4 ? 0.75 : 0.8;
          b.image_xscale *= 0.8;
        }
      }
      if (e.t >= 18) destroy(e);
    }
    if (e.explode === 0) {
      const a = scrAfterimage(state, e);
      a.image_yscale = 1.8;
      a.image_angle = e.image_angle;
      a.image_index = 4;
      a.image_speed = 0.5;
      a.image_alpha = e.image_alpha - 0.2;
      e.aft[e.maxaft++] = a;
    }
    for (let i = 0; i < e.maxaft; i++) {
      const a = e.aft[i];
      if (a.alive) {
        a.image_yscale -= 0.1;
        if (a.image_yscale <= 0.1) destroy(a);
      }
      if (e.explode === 1 && a.alive) {
        a.image_alpha -= 0.07;
        a.image_yscale *= 0.9;
        if (a.image_yscale <= 0.1) destroy(a);
      }
    }
    e.t += 1;
  },
};

export const SPELL_TABLE = { 1: [7], 2: [4], 3: [3, 2] };

export function spellAt(char, slot) {
  return (slot >= 0 && SPELL_TABLE[char]?.[slot]) || 0;
}

export function spellInfo(id, party = null) {
  if (id === 4 && party?.gear?.[2]?.[0] === 7) return { cost: 100, target: 2 };
  switch (id) {
    case 0: return { cost: -1, target: 0 };
    case 1: return { cost: 125, target: 2 };
    case 2: return { cost: 80, target: 1 };
    case 3: return { cost: 40, target: 2 };
    case 4: return { cost: 125, target: 2 };
    case 5: return { cost: 0, target: 2 };
    case 6: return { cost: 0, target: 0 };
    case 7: return { cost: 0, target: 0 };
    default: return { cost: -1, target: 1 };
  }
}

export const CHARNAME = { 1: 'Kris', 2: 'Susie', 3: 'Ralsei' };
const ITEM_TEXT = {
  201: '* ~1 used the DARK CANDY!/%',
  202: '* ~1 used the REVIVE MINT!/%',
  205: '* ~1 used the BROKEN CAKE!/%',
  206: '* ~1 used the TOPCAKE!/%',
  207: '* ~1 used the SPINCAKE!/%',
  208: '* ~1 used the DARKBURGER!/%',
  209: '* ~1 used the LANCERCOOKIE!/%',
  210: '* ~1 used the GIGASALAD!/%',
  211: '* ~1 used the CLUBS SANDWICH!/%',
  212: '* ~1 used the HEARTS DONUT!/%',
  213: '* ~1 used the CHOCO DIAMOND!/%',
  214: '* ~1 used the FAV SANDWICH!/%',
  215: '* ~1 used the ROULXS ROUX!/%',
};

export function scrSpelltext(state, spell, caster) {
  const name = CHARNAME[state.party.char[caster]] ?? ' ';
  const sub = (s) => s.replace('~1', name).replace('~2', 'JEVIL');
  const j = state.joker;
  const mercy = j.mercymod ?? 0;
  switch (spell) {
    case 2: return [sub('* ~1 cast HEAL PRAYER!/%')];
    case 3: {
      if (j.monsterstatus === 1) return [sub('* ~1 cast PACIFY!/%')];
      if (mercy >= 100) return [sub("* ~1 cast PACIFY^1!&* But the foe wasn't \\cBTIRED\\cW... try \\cYSPARING\\cW!/%")];
      return [sub("* ~1 cast PACIFY^1!&* But the enemy wasn't \\cBTIRED\\cW.../%")];
    }
    case 4: return [sub('* ~1 used RUDE BUSTER!/%')];
    case 100: {
      if (mercy >= 100) return [sub('* ~1 spared ~2!/%')];
      if (j.monsterstatus === 1) {
        return [sub("* ~1 spared ~2^2!&* But its name wasn't \\cYYELLOW\\cW.../"), "* (Try using Ralsei's \\cBPACIFY\\cW!)/%"];
      }
      return [sub("* ~1 spared ~2^2!&* But its name wasn't \\cYYELLOW\\cW.../%")];
    }
    case 203: return [sub('* ~1 used the GLOWSHARD!/'), '* But nothing happened.../%'];
    case 204: return [sub('* ~1 read the MANUAL!/'), '* But nothing happened.../%'];
    default: return ITEM_TEXT[spell] ? [sub(ITEM_TEXT[spell])] : [' '];
  }
}

export const C_BLUE = [0, 0, 255];
export const C_YELLOW = [255, 255, 0];

export const pacifyspell = {
  name: 'obj_pacifyspell',
  objIndex: 298,
  create(e) {
    e.con = 1;
    e.siner = 0;
    e.fail = 0;
    e.flashcolor = C_BLUE;
    e.alarm[4] = 50;
  },
  step(e, state) {
    const t = e.target;
    if (!t?.alive) {
      e.con = 99;
      destroy(e);
      return;
    }
    if (e.con === 1) {

      e.siner = 0;
      e.con = 5;
    }
    if (e.con === 5) {
      e.con = 6;
      e.alarm[4] = 8;
    }
    if (e.con === 6) t.image_blend = mergeColor(blendRGB(t.image_blend), e.flashcolor, 0.12);
    if (e.con === 7) {
      e.con = 8;
      e.alarm[4] = 8;
    }
    if (e.con === 8) t.image_blend = mergeColor(blendRGB(t.image_blend), WHITE, 0.16);
    if (e.con === 9) {
      t.image_blend = WHITE;
      destroy(e);
    }
  },
  alarm: {
    4: (e) => {
      e.con += 1;
    },
  },
};

function blendRGB(v) {
  return Array.isArray(v) ? v : WHITE;
}

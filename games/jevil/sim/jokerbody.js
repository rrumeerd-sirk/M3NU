

import { heroAt } from './heroes.js';
import { destroy } from './entity.js';
import { scrSpareanim } from './spareanim.js';
import { channelRandom } from './rng.js';
import { gmlCos, gmlSin, gmlLessEq, gmlGreater } from './gml.js';

export const jokerBody = {
  name: 'obj_joker_body',
  objIndex: 271,

  create(e, state) {
    Object.assign(e, {
      siner: 0, ji: 0, maxchain: 6, maxdist: 0, size: 2, floatsiner: 0, floatsinerspeed: 1,
      sndcon: 0, condition: 0, timer: 0, spintimer: 0,
      s_xscale: 2, s_yscale: 2, s_sprite: 'spr_joker_teleport', s_y: 0, s_vspeed: 0, s_alpha: 1,
      image_speed: 0.334, dancesiner: 0, fade: 0, fade_a: 1,
      fly: 0, flyx: 0, offx: 0, offy: 0,
      shadowx: [0, 0, 0, 0, 0, 0, 0], shadowy: [0, 0, 0, 0, 0, 0, 0], sfactor: [1, 1, 1, 1, 1, 1, 1],
      drawList: [], shadow: null,
    });
    Object.defineProperty(e, 'dancelv', {
      get: () => state.joker?.dancelv ?? 0,
      set: (v) => { if (state.joker) state.joker.dancelv = v; },
      enumerable: true,
    });
  },

  drawStep(e, state) {
    const list = (e.drawList = []);
    e.shadow = null;
    const heroes = [0, 1, 2].map((s) => heroAt(state, s)).filter(Boolean);
    const dancelv = e.dancelv;

    e.floatsiner += e.floatsinerspeed;
    e.fly = gmlSin(e.floatsiner / 8) * 3 * (e.floatsinerspeed * 2 - 1);
    e.flyx = 0;
    if (dancelv >= 1) e.flyx = gmlCos(e.floatsiner / 8) * 3 * (e.floatsinerspeed * 2 - 1);
    if (dancelv === 4) {
      e.flyx = 0;
      e.fly = 0;
    }
    e.offx = e.x + 20;
    e.offy = e.y + 18;
    const { offx, offy, fly, flyx } = e;

    if (e.condition === 0) {
      if (e.fade === 0) e.fade_a = 1;
      if (e.fade === 1) e.fade_a = Math.abs(gmlSin(e.floatsiner / 13));
      if (dancelv === 0) list.push(['spr_joker_main', 0, offx + flyx, offy + fly, 2, 2, e.fade_a]);
      if (dancelv === 1) list.push(['spr_joker_dance', e.floatsiner / 3, offx + flyx, offy + fly, 2, 2, 1]);
      if (dancelv === 2) list.push(['spr_joker_tired', 0, offx + flyx, offy + fly, 2, 2, 1]);
      if (dancelv === 3) {
        e.dancesiner += 1;
        for (let i = 0; i < 7; i++) {
          if (i >= 1) {
            e.shadowx[i] += gmlSin(i + e.floatsiner / 5) * 8 * e.sfactor[i];
            e.shadowy[i] += gmlCos(i + e.floatsiner / 5) * 4 * e.sfactor[i];
          }
          const dalpha = gmlSin(i + e.dancesiner / 9);
          if (dalpha < 0 && i >= 1) {
            e.shadowx[i] = 60 - channelRandom(state, 120);
            e.shadowy[i] = 60 - channelRandom(state, 120);
            e.sfactor[i] = 1.5 - channelRandom(state, 3);
          }
          list.push(['spr_joker_dance', e.dancesiner / 2 + i / 4, e.x + e.shadowx[i], e.y + e.shadowy[i], 2, 2, dalpha]);
        }
      }
      if (dancelv === 4) list.push(['spr_joker_teleport', 1, offx + flyx, offy + fly, 2, 2, 1]);
    }

    if (e.condition === 1) {
      if (e.maxdist >= 150) e.maxdist = 150;
      let sinadd = 0.8 + e.maxdist / 50;
      if (sinadd < 0.8) sinadd = 0.8;
      if (sinadd > 2) sinadd = 2;
      e.siner += sinadd;
      const sinx = gmlSin(e.siner / 4) * e.maxdist;
      const siny = -Math.abs(gmlSin(e.siner / 4)) * (e.maxdist * 0.7);
      e.ji = 0;
      if (sinx > e.maxdist / 2 && e.maxdist > 15) e.ji = 1;
      if (sinx < -e.maxdist / 2 && e.maxdist > 15) e.ji = 2;
      if (e.maxdist < 4) e.ji = 3;
      for (let i = 0; i < e.maxchain - 1; i++) {
        list.push(['spr_jokerchain', e.ji, offx + sinx * (i / e.maxchain) - 2,
          offy + 6 + (siny - 32) * (i / e.maxchain) + fly, 2, 2, 1]);
      }
      list.push(['spr_jokerbody', 0, offx - 42, offy + fly - 2, 2, 2, 1]);
      list.push(['spr_jokerhead', e.ji, offx + sinx - 2, offy + siny + fly - 14, 2, 2, 1]);
      e.maxdist -= 1;
      if (e.maxdist <= 0) {
        e.maxdist = 0;
        e.condition = 0;
      }
    }

    if (e.condition === 2) {
      for (const h of heroes) h.image_alpha -= 0.25;
      if (e.sndcon === 0) {
        state.audio?.cue('snd_spearappear');
        e.sndcon = 1;
      }
      list.push(['spr_joker_main', 0, offx, offy + fly, e.size, 2, 1]);
      e.size -= 0.5;
      if (e.size <= 0) {
        for (const h of heroes) h.image_alpha = 0;
        e.sndcon = 0;
        e.size = 2;
        e.condition = 4;
      }
    }

    if (e.condition === 3) {
      for (const h of heroes) h.image_alpha += 0.25;
      if (e.sndcon === 0) {
        state.audio?.cue('snd_spearappear');
        e.sndcon = 1;
      }
      list.push(['spr_joker_main', 0, offx, offy + fly, e.size, 2, 1]);
      e.size += 0.5;
      if (e.size >= 2) {
        for (const h of heroes) h.image_alpha = 1;
        e.size = 2;
        e.condition = 0;
        e.sndcon = 0;
      }
    }

    if (e.condition === 4) {
      if (gmlLessEq(state.turntimer, 10)) {
        e.timer = 0;
        e.condition = 3;
        e.size = 0;
      }
    }

    if (e.condition === 5) {
      e.timer += 1;
      if (e.timer === 1) {
        e.spintimer = 0;
        e.s_xscale = 2;
        e.s_yscale = 2;
        e.s_sprite = 'spr_joker_teleport';
        e.s_y = 0;
        e.s_vspeed = 0;
        e.s_alpha = 1;
        state.audio?.cue('snd_joker_metamorphosis');
      }
      if (e.timer >= 1 && e.timer <= 3) {
        e.s_xscale *= 1.3;
        e.s_yscale *= 0.7;
      }
      if (e.timer >= 5 && e.timer <= 15) {
        e.s_xscale *= 0.7;
        e.s_yscale *= 1.3;
      }
      if (e.timer >= 15 && e.timer <= 30) {
        e.spintimer += 1;
        e.s_xscale = gmlSin(e.spintimer / 3) * 2;
        e.s_sprite = 'spr_joker_scythebody';
        e.s_yscale *= 0.7;
        if (e.s_xscale >= 2) e.s_xscale = 2;
        if (e.s_yscale <= 2) e.s_yscale = 2;
      }
      if (e.timer >= 30 && e.timer < 41) {
        e.spintimer += 1;
        e.s_xscale = gmlSin(e.spintimer / 3) * 2;
        e.s_vspeed -= 3;
        e.s_y += e.s_vspeed;
        e.s_alpha -= 0.1;
      }
      if (e.timer >= 41) {
        if (state.entities.some((o) => o.alive && o.type.name === 'obj_battlecontroller')) {
          if (gmlGreater(state.turntimer, 10)) {
            e.timer = 0;
            e.condition = 4;
          }
        }
      }
      list.push([e.s_sprite, 0, offx, offy + e.s_y, e.s_xscale, e.s_yscale, e.s_alpha]);
    }

    if ((e.condition === 0 || e.condition === 1) && dancelv <= 2) {

      const sw = 42 * (e.image_xscale ?? 1);
      e.shadow = [e.x + sw / 2 - 20 - fly + flyx, e.y + 80 - fly / 2, e.x + sw / 2 + 30 + fly + flyx, e.y + 85 + fly / 2];
    }
  },
};

export function bodyDefeat(state) {
  const b = state.jokerBody;
  if (b?.alive) {
    b.image_xscale = 2;
    b.image_yscale = 2;
    b.sprite_index = 'spr_joker_teleport';
    b.image_index = 1;
    b.image_speed = 0;
    if (state.joker.hp > 0) scrSpareanim(state, b, b.x + 20, b.y + 18);
  }
  for (const o of state.entities) {
    if (o.alive && o.type.name === 'obj_astream') destroy(o);
  }
  if (b?.alive) {
    b.dancelv = 4;
    b.condition = 0;
  }
  if (state.jokerbg?.alive) state.jokerbg.on = 0;
  state.monsters = [0, 0, 0];
  for (const o of state.entities) {
    if (o.alive && o.type.name === 'obj_joker') destroy(o);
  }
}

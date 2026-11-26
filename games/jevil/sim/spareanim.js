

import { spawn, destroy } from './entity.js';
import { gmlRandom } from './rng.js';
import { gmlLessEq } from './gml.js';
import { SPRITE_SIZES } from './data/object-defaults.js';
import { setMotionComponents } from './index.js';
import { marker } from './attacks/laserscythe.js';

export const spareanim = {
  name: 'obj_spareanim',
  objIndex: 306,
  create(e, state) {
    e.t = 0;
    e.image_speed = 0;
    e.starcount = 0;
    e.star = [];
    e.afterimage = 0;
    e.tone = 0;
    e.neotone = 0;
    state.audio?.cue('snd_spare');
  },
  drawStep(e, state) {
    const list = [];
    const at = (x, a, fog) => list.push([e.sprite_index, e.image_index, x, e.y, e.image_xscale, e.image_yscale, a, fog]);
    if (e.t >= 6 && e.t <= 26) {
      e.afterimage += 1;
      at(e.x + e.afterimage * 4, 0.7 - e.afterimage / 25, true);
      at(e.x + e.afterimage * 8, 0.4 - e.afterimage / 30, true);
    }
    if (e.t < 6) {
      if (e.t < 5) at(e.x, 1 - e.neotone / 4, false);
      const maxwhite = Math.min(e.t / 5, 1);
      at(e.x, maxwhite - e.tone / 5, true);
    }
    e.drawList = list;
    if (e.t >= 1 && e.t <= 5) {
      const [w, h] = SPRITE_SIZES[e.sprite_index] ?? [0, 0];
      for (let i = 0; i < 2; i += 1) {
        const ry = gmlRandom(state.gmlRng, h * e.image_yscale);
        const rx = gmlRandom(state.gmlRng, w * e.image_xscale);
        const s = spawn(state, marker, { x: e.x + rx, y: e.y + ry });
        s.image_xscale = 2;
        s.image_yscale = 2;
        s.sprite_index = 'spr_sparestar_anim';
        s.image_alpha = 2;
        s.image_speed = 0.25;
        s.builtinMotion = true;
        setMotionComponents(s, -3, 0);
        s.gravity = 0.5;
        s.gravity_direction = 0;
        e.star[e.starcount] = s;
        e.starcount += 1;
      }
    }
    if (e.t >= 5 && e.t <= 30) {
      for (let i = 0; i < e.starcount; i += 1) {
        const s = e.star[i];
        if (!s.alive) continue;
        s.image_angle = (s.image_angle ?? 0) + 10;
        s.image_alpha -= 0.1;
        if (gmlLessEq(s.image_alpha, 0)) destroy(s);
      }
    }
    if (e.t >= 5 && e.t < 10) e.tone += 1;
    if (e.t >= 9) {
      e.neotone += 1;
      if (e.neotone >= 30) {
        for (let i = 0; i < e.starcount; i += 1) if (e.star[i].alive) destroy(e.star[i]);
        destroy(e);
      }
    }
    e.t += 1;
  },
};

export function scrSpareanim(state, body, x, y) {
  return spawn(state, spareanim, {
    x, y, sprite_index: 'spr_joker_teleport', image_index: 0,
    image_xscale: body.image_xscale, image_yscale: body.image_yscale,
  });
}

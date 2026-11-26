


import { mergeColor } from './gml.js';
import { destroy, spawn } from './entity.js';
import { afterimage } from './afterimage.js';
import { BATTLEBG_MASK } from './masks.js';


export function settleBox(gt) {
  gt.growcon = 2;
  gt.timer = gt.maxtimer;
  gt.image_xscale = 2;
  gt.image_yscale = 2;
  gt.image_angle = 0;
  gt.image_alpha = 1;
  gt.fullgrow = 1;
  return gt;
}

export const battlebox = {
  name: 'obj_growtangle',
  objIndex: 311,

  create(e) {

    e.image_xscale = 0;
    e.image_yscale = 0;
    e.image_alpha = 0.3;
    e.timer = 0;
    e.maxtimer = 15;
    e.growcon = 1;
    e.image_speed = 0;

    e.image_blend = mergeColor([0, 128, 0], [0, 255, 0], 0.5);
    e.fullgrow = 0;
    e.keep = 0;
    e.megakeep = 0;

    e.isSolid = true;
    e.mask = BATTLEBG_MASK;
    e.sprite_index = 'spr_battlebg_0';
    e.xstart = e.x;
    e.ystart = e.y;
  },

  step(e, state) {

    let growth = 0;
    if (e.timer < e.maxtimer && e.growcon === 1) {
      growth = 1;
    }
    if (e.timer > 0 && e.growcon === 3) {
      growth = 1;
    }
    if (growth === 1) {
      if (e.growcon === 1) e.timer += 1;
      if (e.growcon === 3) e.timer -= 1;
      e.image_xscale = 2 * (e.timer / e.maxtimer);
      e.image_yscale = 2 * (e.timer / e.maxtimer);
      e.image_angle = 180 + 180 * (e.timer / e.maxtimer);
      e.image_alpha = 0.5 + (e.timer / e.maxtimer) * 0.5;
      spawn(state, afterimage, {
        x: e.x,
        y: e.y,
        sprite_index: e.sprite_index,
        image_xscale: e.image_xscale,
        image_yscale: e.image_yscale,
        image_angle: e.image_angle,
        depth: e.depth - 1,
        image_blend: e.image_blend,
        image_alpha: (1 - e.image_alpha) + 0.1,
        image_speed: 0,
      });
      if (e.timer >= e.maxtimer && e.growcon === 1) {
        e.growcon = 2;
        e.image_angle = 0;
      }
      if (e.timer <= 0 && e.growcon === 3) {

        destroy(e);
      }
    }
  },
};

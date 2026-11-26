

import { GRAZE_MASK, SPRITE_MASKS, masksOverlap } from './masks.js';
import { gmlGreaterEq } from './gml.js';

export function scrTensionheal(state, amount) {
  state.tension += amount;
  if (state.tension > state.maxtension) {
    state.tension = state.maxtension;
  }
}

function grazes(e, gx, gy) {
  const mask = e.mask ?? SPRITE_MASKS[e.mask_index ?? e.sprite_index] ?? null;
  if (!mask) return false;
  return masksOverlap(
    GRAZE_MASK, gx, gy,
    mask, e.x, e.y, e.image_xscale ?? 1, e.image_yscale ?? 1, e.image_angle ?? 0,
  );
}

export function grazeBullet(state, b) {
  if (!state.grazeEnabled) return;
  if (!state.grazePrev) return;
  const { x: gx, y: gy } = state.grazePrev;
  {
    if (!b.alive || !b.isBullet) return;
    if (b.grazepoints === undefined) return;
    if (!grazes(b, gx, gy)) return;

    if (state.invTimer < 0) {
      if (b.grazed === 1) {
        scrTensionheal(state, b.grazepoints / 20);
        if (gmlGreaterEq(state.turntimer, 10)) {
          state.turntimer -= b.timepoints / 20;
        }
        const gb = state.grazebox;
        if (gb) {
          if (gb.grazetimer >= 0 && gb.grazetimer < 4) {
            gb.grazetimer = 3;
          }
          if (gb.grazetimer < 2) {
            gb.grazetimer = 2;
          }
        }
      }
      if (b.grazed === 0) {
        b.grazed = 1;
        scrTensionheal(state, b.grazepoints);
        if (gmlGreaterEq(state.turntimer, 10)) {
          state.turntimer -= b.timepoints;
        }
        state.audio?.cue('snd_graze');
        if (state.grazebox) state.grazebox.grazetimer = 10;
      }
    }
  }
}

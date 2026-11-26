


import { HEART_MASK, masksOverlap } from './masks.js';

export { HEART_MASK };

export function placeMeetingSolid(state, x, y) {
  for (const o of state.entities) {
    if (!o.alive || !o.isSolid || !o.mask) continue;
    if (masksOverlap(HEART_MASK, x, y, o.mask, o.x, o.y, o.image_xscale, o.image_yscale)) {
      return true;
    }
  }
  return false;
}

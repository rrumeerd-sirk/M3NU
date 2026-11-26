


import { destroy, spawn } from './entity.js';
import { marker } from './attacks/laserscythe.js';
import { gmlLess } from './gml.js';

export const afterimage = {
  name: 'obj_afterimage',
  objIndex: 192,

  step(e) {
    e.image_alpha -= 0.04;

    if (gmlLess(e.image_alpha, 0)) destroy(e);
  },
};



export function scrAfterimage(state, src) {
  return spawn(state, afterimage, {
    x: src.x, y: src.y,
    sprite_index: src.sprite_index, image_index: src.image_index ?? 0,
    ...(src.image_blend !== undefined && { image_blend: src.image_blend }),
    image_speed: 0, depth: src.depth ?? 0,
    image_xscale: src.image_xscale ?? 1, image_yscale: src.image_yscale ?? 1,
    image_angle: src.image_angle ?? 0,
  });
}



export const afterimageGrow = {
  name: 'obj_afterimage_grow',
  objIndex: 193,
  step(e) {
    e.image_alpha -= 0.1;
    e.image_xscale += 0.2;
    e.image_yscale += 0.2;
    if (gmlLess(e.image_alpha, 0)) destroy(e);
  },
};


export function scrDarkMarker(state, x, y, sprite) {
  return spawn(state, marker, {
    x, y, sprite_index: sprite, image_speed: 0, image_xscale: 2, image_yscale: 2,
  });
}

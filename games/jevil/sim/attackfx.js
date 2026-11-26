


import { destroy, spawn } from './entity.js';
import { SPRITE_SIZES } from './data/object-defaults.js';
import { WHITE, gmlLess, mergeColor } from './gml.js';

export const basicattack = {
  name: 'obj_basicattack',
  objIndex: 195,
  create(e) {
    e.image_xscale = 2;
    e.image_yscale = 2;
    e.damage = 100;
    e.image_speed = 0.334;
    e.maxindex = 3;
    e.critical = 0;
  },
  step(e) {
    if (e.critical === 1) {
      e.image_xscale += 0.1;
      e.image_yscale += 0.1;
    }
    if (e.image_index >= e.maxindex) destroy(e);
  },
};

export const burstbolt = {
  name: 'obj_burstbolt',
  objIndex: 200,
  create(e) {
    e.mag = 0.1;
  },
  step(e) {
    const [w, h] = SPRITE_SIZES[e.sprite_index] ?? [0, 0];
    e.image_alpha -= 0.1;
    e.image_xscale += e.mag;
    e.image_yscale += e.mag;
    e.x += ((1 - w * e.image_xscale) * e.mag) / 2.7;
    e.y += ((1 - h * e.image_yscale) * e.mag) / 2.5;
    if (gmlLess(e.image_alpha, 0)) destroy(e);
  },
};


export function makeBasicattack(state, x, y, heroObj, points) {
  const a = spawn(state, basicattack, { x, y });
  if (heroObj === 'obj_herosusie') {
    a.sprite_index = 'spr_attack_mash2';
    a.image_speed = 0.5;
    a.maxindex = 4;
  }
  if (heroObj === 'obj_heroralsei') {
    a.sprite_index = 'spr_attack_slap1';
    a.maxindex = 4;
    a.image_speed = 0.5;
  }
  if (points === 150) {
    a.image_xscale = 2.5;
    a.image_yscale = 2.5;
  }
  return a;
}


const CHARCOLOR = [[0, 255, 255], [255, 0, 255], [0, 255, 0]];
const BOLTCOLOR = CHARCOLOR.map((c) => mergeColor(c, WHITE, 0.5));


export function makeBurstbolt(state, x, y, bc, p) {
  const b = spawn(state, burstbolt, { x, y });
  if (p === 0) {
    b.image_blend = [255, 255, 0];
    b.mag = 0.2;
  }
  if (p >= 3) b.image_blend = BOLTCOLOR[bc];
  if (p >= 15) b.image_blend = CHARCOLOR[bc];
  return b;
}

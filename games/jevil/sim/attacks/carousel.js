


import { gmlGreater, gmlLess, gmlGreaterEq, gmlSin, gmlCos } from '../gml.js';
import { scrDamage, scrDamageAll } from '../damage.js';

export const carouselbullet = {
  name: 'obj_carouselbullet',
  objIndex: 275,

  create(e) {
    e.isBullet = true;
    e.siner = 0;
    e.siner2 = 0;
    e.t = 0;
    e.componentMotion = true;
    e.hspeed = 6;
    e.vspeed = 0;
    e.sinspeed = 1;
    e.altmode = 0;
    e.altsin = 0;
    e.timer = 0;
    e.difficulty = 1;
    e.times = 0;
    e.activetimer = 0;
    e.grazed = 0;
    e.grazepoints = 10;
    e.timepoints = 10;
    e.target = 0;
    e.inv = 120;
    e.damage = 124;
    e.active = 0;
    e.image_xscale = 2;
    e.image_yscale = 2;
    e.image_alpha = 0;
    e.image_speed = 0;
    e.gmlType = 0;
    e.con = 0;
    e.vsin = 0;
    e.wall_destroy = 0;
    e.sprite_index = 'spr_carousel';
  },

  step(e, state) {
    const gt = state.entities.find((o) => o.alive && o.isSolid);
    if (e.t <= 25) {
      e.image_alpha += 0.04;
    }
    if (e.t === 25) {
      e.active = 1;
    }
    if (e.t === 0) {
      e.maxspeed = Math.abs(e.hspeed);
      e.hspeed = 0;
    }
    e.t += 1;
    e.siner += e.sinspeed;
    const sinfactor_0 = gmlSin((e.siner - 1) / 20);
    const sinfactor = gmlSin(e.siner / 20);
    const sinsign = sinfactor - sinfactor_0;
    e.x = gt.x - sinfactor * 150;
    e.image_xscale = sinsign * 50;
    if (gmlGreater(e.image_xscale, 2)) {
      e.image_xscale = 2;
    }
    if (gmlLess(e.image_xscale, -2)) {
      e.image_xscale = -2;
    }
    if (gmlGreater(sinsign, 0)) {
      e.depth = 21;
      e.active = 0;
      e.image_blend = 'c_gray';
    }
    if (gmlLess(sinsign, 0)) {
      e.depth = 0;
      if (gmlGreaterEq(e.image_alpha, 1)) {
        e.active = 1;
      }
      e.image_blend = 'c_white';
    }
    e.vsin += 1;
    if (e.altmode === 0 || e.altmode === 2 || e.altmode === 3) {
      e.y += gmlSin(e.vsin / 10) * 3.5;
    }
    if (e.altmode === 1) {
      e.y -= gmlSin(e.vsin / 10) * 3.5;
    }
    if (e.altmode === 99) {
      e.altsin += 1;
      e.y += gmlCos(e.altsin / 20) * 2;
    }
    if (e.altmode === 99) {
      e.altsin += 1;
      e.y += gmlCos(e.altsin / 10) * 2;
    }
  },

  other15(b, state) {
    if (b.active !== 1) return;
    if (state.damageEnabled) {
      if (b.target !== 3) {
        scrDamage(state, b);
      } else {
        scrDamageAll(state, b);
      }
    }

  },
};




import { destroy, spawn } from '../entity.js';
import { bulletInherit, moveTowardsPoint } from '../bullets/collidebullet.js';
import { regularbullet } from '../bullets/regularbullet.js';
import { afterimage } from '../afterimage.js';


function leaveAfterimage(state, e) {
  spawn(state, afterimage, { x: e.x, y: e.y, sprite_index: e.sprite_index, image_angle: e.image_angle });
}

function fireBall(state, e, sprite, direction, speed) {

  const bul = spawn(state, regularbullet, { x: e.x, y: e.y });
  bul.sprite_index = sprite;
  bul.direction = direction;
  bul.speed = speed;
  bul.image_angle = e.direction;
  return bul;
}

export const clubsbulletDark = {
  name: 'obj_clubsbullet_dark',
  objIndex: 236,

  create(e) {
    e.builtinMotion = true;
    e.difficulty = 1;
    e.times = 0;
    e.activetimer = 0;
    e.grazed = 0;
    e.grazepoints = 1;
    e.timepoints = 1;
    e.target = 0;
    e.dont = 1;
    e.inv = 120;
    e.damage = 124;
    e.active = 0;
    e.dtimer = 0;
    e.gmlType = 0;
    e.initangle = 0;
    e.sprite_index = 'spr_clubsbullet_dark';
  },

  step(e, state) {
    e.dtimer += 1;
    const heart = state.soul;
    if (e.gmlType === 0) {
      if (e.dtimer === 15 || e.dtimer === 19 || e.dtimer === 23) {
        moveTowardsPoint(e, heart.x + 8, heart.y + 8, 0.1);
        for (const [spr, dd] of [['spr_clubsball_b', 0], ['spr_clubsball_c', -17], ['spr_clubsball_a', 17]]) {
          const bul = fireBall(state, e, spr, e.direction + dd, 4);
          bul.damage = e.damage;
          bul.target = e.target;
          bul.grazepoints = 2;
          bul.timepoints = 1;
        }
      }
      if (e.dtimer === 25) {
        leaveAfterimage(state, e);
        destroy(e);
      }
    }
    if (e.gmlType === 2) {
      if (e.dtimer === 20 || e.dtimer === 22 || e.dtimer === 24) {
        moveTowardsPoint(e, heart.x + 8, heart.y + 8, 0.1);
        bulletInherit(e, fireBall(state, e, 'spr_clubsball_b', (e.direction - 2) + e.initangle, 5));
        bulletInherit(e, fireBall(state, e, 'spr_clubsball_c', (e.direction - 19 - 2) + e.initangle, 5));
        bulletInherit(e, fireBall(state, e, 'spr_clubsball_a', ((e.direction + 19) - 2) + e.initangle, 5));
        e.initangle += 2;
      }
      if (e.dtimer === 26) {
        leaveAfterimage(state, e);
        destroy(e);
      }
    }
  },
};

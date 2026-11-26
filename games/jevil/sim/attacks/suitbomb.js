import { pointDirection } from '../gml.js';

import { destroy, spawn } from '../entity.js';
import { gmlRandom, gmlChoose } from '../rng.js';
import { lengthdirX, lengthdirY } from '../gml.js';
import { bulletInherit, moveTowardsPoint } from '../bullets/collidebullet.js';
import { regularbullet } from '../bullets/regularbullet.js';

export const heartbombBlast = {
  name: 'obj_heartbomb_blast',
  objIndex: 269,

  create(e) {
    e.made = 0;
    e.active = 0;
    e.pausetimer = 0;
    e.con = 0;
    e.siner = 0;
    e.maxlength = 0;
    e.visible = 0;
    e.builtinMotion = true;
    e.son = [];
  },

  step(e, state) {
    if (e.made === 0) {
      for (let i = 0; i < 4; i += 1) {
        const son = spawn(state, regularbullet, { x: e.x, y: e.y });
        son.sprite_index = 'spr_heartbullet';
        bulletInherit(e, son);
        e.son[i] = son;
      }
      e.made = 1;
    }
    e.pausetimer += 1;
    if (e.pausetimer >= 10 && e.con === 0) {
      moveTowardsPoint(e, state.soul.x + 8, state.soul.y + 8, 7);
      e.con = 1;
    }
    e.siner += 1;
    if (e.maxlength < 40) {
      e.maxlength += 4;
    }
    for (let i = 0; i < 4; i += 1) {
      const son = e.son[i];
      if (son && son.alive) {
        son.x = e.x + lengthdirX(e.maxlength, e.siner * 3 + i * 90);
        son.y = e.y + lengthdirY(e.maxlength, e.siner * 3 + i * 90);
      }
    }
  },
};

export const suitbomb = {
  name: 'obj_suitbomb',
  objIndex: 270,

  create(e, state) {
    e.visible = 0;
    e.gmlType = gmlChoose(state.gmlRng, [0, 1, 2, 3]);
    e.y = -80;
    e.image_xscale = 2;
    e.image_yscale = 2;
    e.con = 0;
    e.timer = 0;
    e.image_speed = 0;
    e.componentMotion = true;
    e.vspeed = 10;
    e.hspeed = 0;
    e.maxtimer = 20 + gmlRandom(state.gmlRng, 16);
    e.explodedraw = 0;
  },

  step(e, state) {
    if (e.con === 0) {
      if (e.gmlType === 0) e.sprite_index = 'spr_bomb_spade';
      if (e.gmlType === 1) e.sprite_index = 'spr_bomb_diamond';
      if (e.gmlType === 2) e.sprite_index = 'spr_bomb_heart';
      if (e.gmlType === 3) e.sprite_index = 'spr_bomb_club';
      e.visible = 1;
      e.con = 1;
    }
    if (e.con === 1) {
      e.timer += 1;
      if (e.timer >= 10) {

        e.image_speed = e.timer / e.maxtimer;
      }
      if (e.timer >= e.maxtimer) {
        e.con = 2;
        e.timer = 0;

        e.hspeed = 0;
        e.vspeed = 0;
        e.speed = 0;
      }
    }
    if (e.con === 2) {

      if (state.burstnoiseFrame !== state.frame) {
        state.burstnoiseFrame = state.frame;
        state.audio?.cue('snd_bomb');
      }
      const heart = state.soul;
      if (e.gmlType === 0) {
        const dir = gmlRandom(state.gmlRng, 360);
        const maxe = 12;
        for (let i = 0; i < 12; i += 1) {
          const s = spawn(state, regularbullet, { x: e.x, y: e.y });
          bulletInherit(e, s);
          s.active = 1;
          s.direction = dir + i * (360 / maxe);
          s.speed = 8;
          s.image_angle = s.direction;
          s.sprite_index = 'spr_spadebullet';
        }
        e.con = 3;
      }
      if (e.gmlType === 1) {
        for (let i = 0; i < 3; i += 1) {
          const d = spawn(state, regularbullet, { x: e.x, y: e.y });
          d.damage = 100;
          bulletInherit(e, d);
          moveTowardsPoint(d, heart.x + 8, heart.y + 8, 11);
          d.speed -= i;
          d.image_angle = d.direction;
          d.sprite_index = 'spr_diamondbullet';
        }
        e.con = 3;
      }
      if (e.gmlType === 2) {
        const h = spawn(state, heartbombBlast, { x: e.x, y: e.y });
        bulletInherit(e, h);
        e.con = 3;
      }
      if (e.gmlType === 3) {
        const dir = pointDirection(e.x, e.y, heart.x + 8, heart.y + 8);
        for (let i = 0; i < 3; i += 1) {
          const c = spawn(state, regularbullet, { x: e.x, y: e.y });
          c.sprite_index = 'spr_clubsbullet';
          c.damage = 100;
          bulletInherit(e, c);
          c.active = 1;
          c.direction = (dir - 20) + i * 20;
          c.image_angle = c.direction;
          c.speed = 8;
        }
        e.con = 3;
      }
    }
    if (e.explodedraw >= 40) {
      destroy(e);
    }
  },

  endStep(e) {

    if (e.con >= 2) {
      e.explodedraw += 1;
    }
  },
};

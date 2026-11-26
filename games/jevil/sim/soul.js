

import { placeMeetingSolid } from './collision.js';
import { spawn } from './entity.js';
import { grazebox } from './grazebox.js';

const SPRITE_WIDTH = 20;
const SPRITE_HEIGHT = 20;

export const soul = {
  name: 'obj_heart',
  objIndex: 313,

  create(e, state) {

    state.sp = 4;
    e.wspeed = state.sp;

    e.image_speed = 0;
    e.fly = 0;
    e.darken = 1;
    e.darkamt = 0;
    e.dmgnoise = 0;
    spawn(state, grazebox, { x: e.x + 10, y: e.y + 10 });
    e.boundaryup = 0;

    e.disableslow = 0;
    if (state.input && state.input.focus) {
      e.disableslow = 1;
    }
  },

  step(e, state) {
    const input = state.input;

    e.wallcheck = 0;
    let press_l = 0;
    let press_r = 0;
    let press_d = 0;
    let press_u = 0;
    let bkx = 0;
    let bky = 0;
    let bkxy = 0;
    e.jelly = 2;

    if (input.left) press_l = 1;
    if (input.right) press_r = 1;
    if (input.up) press_u = 1;
    if (input.down) press_d = 1;

    let px = 0;
    let py = 0;

    if (press_r === 1) px = e.wspeed;
    if (press_l === 1) px = -e.wspeed;
    if (press_d === 1) py = e.wspeed;
    if (press_u === 1) py = -e.wspeed;

    if (input.focus) {
      if (e.disableslow === 0) {
        px = Math.ceil(px * 0.5);
        py = Math.ceil(py * 0.5);
      }
    } else {
      e.disableslow = 0;
    }

    let xmeet = 0;
    let ymeet = 0;
    let xymeet = 0;
    if (placeMeetingSolid(state, e.x + px, e.y + py)) {
      xymeet = 1;
    }

    if (placeMeetingSolid(state, e.x + px, e.y)) {

      if (placeMeetingSolid(state, e.x + px, e.y)) {
        for (let g = e.wspeed; g > 0; g -= 1) {
          let mvd = 0;
          if (press_d === 0 && !placeMeetingSolid(state, e.x + px, e.y - g)) {
            e.y -= g;
            py = 0;
            break;
          }
          if (press_u === 0 && mvd === 0 && !placeMeetingSolid(state, e.x + px, e.y + g)) {
            e.y += g;
            py = 0;
            break;
          }
        }
      }
      xmeet = 1;
      bkx = 0;
      if (px > 0) {
        for (let i = px; i >= 0; i -= 1) {
          if (!placeMeetingSolid(state, e.x + i, e.y)) {
            px = i;
            bkx = 1;
            break;
          }
        }
      }
      if (px < 0) {
        for (let i = px; i <= 0; i += 1) {
          if (!placeMeetingSolid(state, e.x + i, e.y)) {
            px = i;
            bkx = 1;
            break;
          }
        }
      }
      if (bkx === 0) px = 0;
    }

    if (placeMeetingSolid(state, e.x, e.y + py)) {
      ymeet = 1;
      bky = 0;
      if (placeMeetingSolid(state, e.x, e.y + py)) {
        for (let g = e.wspeed; g > 0; g -= 1) {
          let mvd = 0;
          if (press_r === 0 && !placeMeetingSolid(state, e.x - g, e.y + py)) {
            e.x -= g;
            px = 0;
            break;
          }
          if (mvd === 0 && press_l === 0 && !placeMeetingSolid(state, e.x + g, e.y + py)) {
            e.x += g;
            px = 0;
            break;
          }
        }
      }
      if (py > 0) {
        for (let i = py; i >= 0; i -= 1) {
          if (!placeMeetingSolid(state, e.x, e.y + i)) {
            py = i;
            bky = 1;
            break;
          }
        }
      }
      if (py < 0) {
        for (let i = py; i <= 0; i += 1) {
          if (!placeMeetingSolid(state, e.x, e.y + i)) {
            py = i;
            bky = 1;
            break;
          }
        }
      }
      if (bky === 0) py = 0;
    }

    if (placeMeetingSolid(state, e.x + px, e.y + py)) {
      xymeet = 1;
      bkxy = 0;
      let i = px;
      let j = py;
      while (j !== 0 || i !== 0) {
        if (!placeMeetingSolid(state, e.x + i, e.y + j)) {
          px = i;
          py = j;
          bkxy = 1;
          break;
        }
        if (Math.abs(j) >= 1) {
          if (j > 0) j -= 1;
          if (j < 0) j += 1;
        } else {
          j = 0;
        }
        if (Math.abs(i) >= 1) {
          if (i > 0) i -= 1;
          if (i < 0) i += 1;
        } else {
          i = 0;
        }
      }
      if (bkxy === 0) {
        px = 0;
        py = 0;
      }
    }

    if (e.x + px >= state.view.x + 640 - SPRITE_WIDTH) {
      px = state.view.x + 640 - SPRITE_WIDTH - e.x;
    }
    if (e.x + px <= 0) {
      px = -e.x;
    }
    if (e.y + py <= 0) {
      py = -e.y;
    }
    if (e.y + py >= state.view.y + 320 - SPRITE_HEIGHT + e.boundaryup) {
      py = state.view.y + 320 - SPRITE_HEIGHT - e.y + e.boundaryup;
    }

    e.x += px;
    e.y += py;

    if (e.dmgnoise === 1) {
      e.dmgnoise = 0;
      state.dmgnoiseCue = (state.dmgnoiseCue ?? 0) + 1;
      state.audio?.cue('snd_hurt1', { restart: true });
    }

    state.invTimer -= 1;
    if (state.invTimer > 0) {
      e.image_speed = 0.25;
    } else {
      e.image_speed = 0;
      e.image_index = 0;
    }

    state.heartx = e.x + 2 - state.view.x;
    state.hearty = e.y + 2 - state.view.y;
  },
};

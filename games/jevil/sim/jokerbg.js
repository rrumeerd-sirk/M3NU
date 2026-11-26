

import { mergeColor } from './gml.js';

const NAVY = [0, 0, 128];
const DKGRAY = [64, 64, 64];
const BLACK = [0, 0, 0];

export const DKBLUE = mergeColor(NAVY, DKGRAY, 0.1);
export const DKBLUE2 = mergeColor(NAVY, DKGRAY, 0.5);
export const DKBLUE3 = mergeColor(mergeColor(NAVY, DKGRAY, 0.5), BLACK, 0.2);

export function jokerbgFields(on = 0) {
  return {
    siner: 0, rot: 0, bgx: 0, rotcounter: 0, rotfps: 1, rotspeed: 0, on, bgalpha: 0,
    drawn: { bgx: 0, rot: 0, bgalpha: 0 },
  };
}

export function jokerbgAdvance(P) {
  if (P.bgx >= 640) P.bgx -= 640;
  if (P.on === 1 && P.bgalpha < 1) P.bgalpha += 0.02;
  if (P.on === 0 && P.bgalpha > 0) P.bgalpha -= 0.02;
  P.drawn = { bgx: P.bgx, rot: P.rot, bgalpha: P.bgalpha };
  P.siner += 2;
  if (P.on === 1) P.rotcounter += 1;
  if (P.rotcounter >= P.rotfps && P.on === 1) {
    if (P.on === 1 && P.rotspeed < 1) P.rotspeed += 0.1;
    P.bgx += 1 * P.rotfps;
    P.rot += 2.5 * P.rotfps * P.rotspeed;
    P.rotcounter = 0;
  }
}

export const jokerbg = {
  name: 'obj_jokerbg_triangle_real',
  objIndex: 137,
  create(e) {
    const on = e.on ?? 0;
    Object.assign(e, jokerbgFields(on));
  },
  drawStep(e) {
    jokerbgAdvance(e);
  },
};

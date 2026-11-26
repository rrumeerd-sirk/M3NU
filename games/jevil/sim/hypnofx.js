


import { destroy } from './entity.js';
import { gmlCos, gmlSin } from './gml.js';
import { channelRandom } from './rng.js';

export const hypnofx = {
  name: 'obj_hypnofx',
  objIndex: 305,
  channelHiDraws: (e) => (e.timer === 0 ? 1 : 0),
  create(e) {
    e.size = 0;
    e.ringmax = 4;
    e.timer = 0;
    e.drawList = [];
  },
  drawStep(e, state) {
    const list = (e.drawList = []);
    e.timer += 1;
    if (e.timer === 1) {
      const initsiner = channelRandom(state, 400);
      e.ringsize = [];
      e.ringradius = [];
      e.ringalpha = [];
      e.ringsiner = [];
      for (let i = 0; i < e.ringmax; i++) {
        e.ringsize[i] = 1 + 0.5 * i;
        e.ringradius[i] = 2 + i * 12;
        e.ringalpha[i] = 0;
        e.ringsiner[i] = initsiner;
      }
    }
    if (e.timer >= 2) {
      for (let i = 0; i < e.ringmax; i++) {
        e.ringsiner[i] += (i + 2) * e.ringalpha[i];
        if (e.timer < 12 && e.ringalpha[i] < 1) e.ringalpha[i] += 0.2;
        if (e.timer >= 24) e.ringalpha[i] -= 0.1;
        list.push([
          e.x + gmlSin(e.ringsiner[i] / 12) * e.ringradius[i],
          e.y + gmlCos(e.ringsiner[i] / 12) * e.ringradius[i],
          e.ringsize[i], e.ringalpha[i],
        ]);
      }
      if (e.timer >= 38) destroy(e);
    }
  },
};

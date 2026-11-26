

import { destroy, spawn } from './entity.js';
import { writer } from './writer.js';

export const battleblcon = {
  name: 'obj_battleblcon',
  objIndex: 309,
  create(e, state) {
    e.mywriter = spawn(state, writer, {
      x: e.x + 5, y: e.y + 5, typer: e.typer ?? 50, nstring: [e.msg ?? ''], born: state.frame,
    });
    e.mywriter.depth = (e.depth ?? 0) - 5;
  },
  step(e) {
    if (!e.mywriter?.alive) destroy(e);
  },
};

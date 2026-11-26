


import { createRng, gmlCreate } from './rng.js';
import { freshParty } from './damage.js';

export function createState({ seed, traceBulletSlots = 0 } = {}) {
  if (!Number.isInteger(seed)) {
    throw new Error(`seed must be an integer, got ${seed}`);
  }

  return {

    frame: 0,

    seed,
    rng: createRng(seed),

    entities: [],
    nextSpawnSeq: 0,


    soul: null,
    hp: 0,
    invTimer: 0,


    view: { x: 0, y: 0 },
    sp: 4,
    heartx: 0,
    hearty: 0,
    turntimer: 999,
    invc: 1,


    party: freshParty(),
    tension: 0,
    maxtension: 250,
    grazeEnabled: false,
    grazebox: null,
    gameOver: false,
    shake: 0,


    damageEnabled: true,


    chooseTable: null,
    chooseIndex: 0,


    gmlRng: gmlCreate(0),


    phase: 'none',


    eventPhase: 'init',


    input: null,

    traceBulletSlots,
    trace: [],


    counters: {
      collisionChecks: 0,
      unmaskedBullets: 0,
      collisionHits: 0,
      motionSteps: 0,
      alarmFires: 0,
    },
  };
}



import { spawn, destroy } from './entity.js';
import { scrRandomtarget } from './damage.js';
import { jokerBody, bodyDefeat } from './jokerbody.js';
import { jokerbg } from './jokerbg.js';
import { tensionbar } from './tensionbar.js';
import { soul } from './soul.js';
import { battlebox } from './battlebox.js';
import { dbulletController } from './attacks/dbullet-controller.js';
import { HEROES } from './heroes.js';
import { freshInventory } from './items.js';
import { createJoker, selectTurn, selectGates, DISPATCH } from './joker.js';
import { endTurnAutoheal, freshParty } from './damage.js';
import { menuStep, menuBuffers, mnendturnMenu, scrAttackphase } from './menu.js';
import { gmlChoose, channelChoose } from './rng.js';
import { moveTowardsPoint } from './bullets/collidebullet.js';
import { spawnBattleWriter, writer } from './writer.js';
import { heroEntity } from './spells.js';
import { scrHealitemspell, scrHealallitemspell } from './items.js';
import { scrRevive } from './damage.js';
import { gmlRandom } from './rng.js';
import { gmlCos, gmlLessEq } from './gml.js';
import { hypnofx } from './hypnofx.js';
import { battleblcon } from './blcon.js';
import { talkText, flavorText } from './talk.js';
import { afterimageGrow, scrDarkMarker } from './afterimage.js';
import { marker } from './attacks/laserscythe.js';

function writerGone(state) {
  const bornNow = state.entities.some((o) => o.alive && o.type === writer && o.born === state.frame);
  if (bornNow) return false;
  if (state.writerBusy) return !state.writerBusy(state.frame);
  return !state.entities.some((o) => o.alive && o.type === writer);
}

function chaosDance(state, e, j) {
  const cd = j.chaosdance;
  let msg = '* Something happened!/%';
  if (cd === 0) {
    msg = '* What^1!&* It was just foley!/%';
    const ch = gmlChoose(state.gmlRng, [0, 1, 2]);
    state.audio?.cue(['snd_badexplosion', 'snd_carhonk', 'snd_toilet'][ch]);
  }
  if (cd === 1) {
    msg = "* JEVIL felt at ease^1!&* JEVIL's defense dropped!/%";
    if (j.df >= -16) j.df -= 4;
    state.audio?.cue('snd_weirdeffect');
  }
  if (cd === 2) {
    msg = '* Awkward^1! Upcoming attack will hurt rapidly!/%';
    state.audio?.cue('snd_awkward');
    state.invc = 0.4;
  }
  if (cd === 3) {
    msg = '* Tranquil^1!&* The dance defended the party!/%';
    j.pfactor = 0.7;
    state.audio?.cue('snd_shadowpendant');
  }
  if (cd === 4) {
    for (const o of state.entities) {
      if (o.alive && o.type === marker && o.sprite_index === 'spr_uselessbird') destroy(o);
    }
    const bird = scrDarkMarker(state, (state.view?.x ?? 0) - 40, (state.view?.y ?? 0) + 60, 'spr_uselessbird');

    bird.builtinMotion = true;
    bird.direction = 0;
    bird.speed = 12;
    bird.image_speed = 0.334;
    state.audio?.cue('snd_birdtweet');
    msg = "* What^1!&* It's nothing but a useless bird!/%";
  }
  if (cd === 5) {
    msg = '* It felt comforting!/%';

    const star = gmlChoose(state.gmlRng, [0, 1, 2]);
    scrHealitemspell(state, star, Math.floor(gmlRandom(state.gmlRng, 31) + 25));
  }
  if (cd === 6) {
    msg = "* Everyone's HP got jumbled up!/%";
    const p = state.party;
    const swap1 = gmlChoose(state.gmlRng, [2, 3]);
    const swap2 = swap1 === 2 ? 3 : 2;
    const remhp = [...p.hp];
    const curmaxhp = [...p.maxhp];
    p.maxhp[1] = curmaxhp[swap1];
    p.maxhp[swap1] = curmaxhp[swap2];
    p.maxhp[swap2] = curmaxhp[1];
    p.hp[1] = remhp[swap1];
    p.hp[swap1] = remhp[swap2];
    p.hp[swap2] = remhp[1];

    const hc = state.hpcolor ?? [0, 1, 2];
    const rem = [...hc];
    hc[0] = rem[swap1 - 1];
    hc[swap1 - 1] = rem[swap2 - 1];
    hc[swap2 - 1] = rem[0];
    state.hpcolor = hc;
    for (let i = 1; i <= 3; i += 1) {
      if (p.hp[i] < 1) {
        p.hp[1] += Math.floor(p.hp[i] / 3);
        p.hp[2] += Math.floor(p.hp[i] / 3);
        p.hp[3] += Math.floor(p.hp[i] / 3);
        p.hp[i] = 1;
      }
    }
    for (let i = 1; i <= 3; i += 1) if (p.hp[i] < 1) p.hp[i] = 1;
    scrRevive(p, 0);
    scrRevive(p, 1);
    scrRevive(p, 2);
    state.audio?.cue('snd_weirdeffect');
  }
  if (cd === 7) {
    state.audio?.cue('snd_boost');
    msg = "* JEVIL's upcoming move got powered up!/%";
    j.pfactor = 1.25;
  }
  if (cd === 8) {
    state.audio?.cue('snd_applause');
    msg = '* A perfect 10!/%';
    scrHealallitemspell(state, 36 + Math.floor(gmlRandom(state.gmlRng, 15)));
  }

  spawnBattleWriter(state, [msg]);
}

export const darkener = {
  name: 'obj_darkener',
  objIndex: 205,

  create(e) {
    e.darken = 1;
    e.darkamt = 0;
  },

  endStep(e, state) {
    const heroes = state.entities.filter((o) => o.alive && o.type.objIndex >= 213 && o.type.objIndex <= 215);
    if (e.darken === 1) {
      for (const h of heroes) h.darkify = 1;
      if (e.darkamt < 15) e.darkamt += 1;
    }
    if (e.darken === 0) {
      for (const gt of state.entities) {
        if (gt.alive && gt.type.name === 'obj_growtangle') {
          gt.growcon = 3;
        }
      }
      for (const h of heroes) h.darkify = 0;
      if (e.darkamt > 0) e.darkamt -= 1;
      if (e.darkamt === 0) destroy(e);
    }
  },
};

export const returnheart = {
  name: 'obj_returnheart',
  objIndex: 220,
  builtinMotion: true,

  create(e, state) {

    e.flytime = 8;
    const kris = state.entities.find((o) => o.alive && o.type.name === 'obj_herokris');
    e.distx = (kris ? kris.x : 80) + 10;
    e.disty = (kris ? kris.y : 100) + 40;
    const dist = Math.hypot(e.distx - e.x, e.disty - e.y);
    moveTowardsPoint(e, e.distx, e.disty, dist / e.flytime);
    e.alarm[0] = e.flytime;
    e.image_alpha = 1;
    e.image_speed = 0;
  },

  alarm: {
    0: (e, state) => {
      e.x = e.distx;
      e.y = e.disty;
      spawn(state, heartburst, { x: e.x, y: e.y });
      destroy(e);
    },
  },
};

export const heartburst = {
  name: 'obj_heartburst',
  objIndex: 209,
  create(e) {
    e.burst = 0;
    e.drawList = [];
  },
  drawStep(e) {
    e.burst += 1;
    const b = e.burst;
    const x = e.xstart + 9;
    const y = e.ystart + 9;
    e.drawList = [
      ['spr_heartoutline2', 0, x, y, 0.25 + b, 0.25 + b / 2, 0.8 - b / 6],
      ['spr_heartoutline', 0, x, y, 0.25 + b / 1.5, 0.25 + b / 3, 1 - b / 6],
      ['spr_heartoutline', 0, x, y, 0.2 + b / 2.5, 0.2 + b / 5, 1.2 - b / 6],
    ];
    if (b > 10) destroy(e);
  },
};

function jokerHurtDraw(e, state) {
  if (e.hurttimer > 0) {
    e.hurttimer = 0;
    const j = state.joker;
    const mhpratio = j.hp / j.maxhp;

    const laughnoise = channelChoose(state, [0, 1, 2]);
    state.audio?.cue(['snd_joker_laugh0', 'snd_joker_ha1', 'snd_joker_ha0'][laughnoise]);
    const body = state.jokerBody;
    if (body?.alive) {
      body.condition = 1;
      body.siner = 0;
      body.maxdist += 20 + (e.hurtamt ?? 0) / 5;
      if (body.maxdist < 30) body.maxdist = 30;
      body.floatsinerspeed = 1 + (1 - mhpratio);
    }
    if (state.jokerbg?.alive && mhpratio > 0) state.jokerbg.rotspeed = 1 + (1.5 - mhpratio * 1.5);
    if (mhpratio <= 0.8 && (j.dancelv ?? 0) === 0) j.dancelv = 1;
    if (mhpratio <= 0.4 && j.jturn < 17) j.dancelv = 3;
    if (mhpratio <= 0.2 && j.jturn === 17) j.dancelv = 2;
    if (mhpratio <= 0) {

      state.jokerDefeated = true;
      bodyDefeat(state);
    }
  }
  e.hurttimer -= 1;
  if (e.hurttimer < 0) e.state = 0;
}

export const jokerFight = {

  drawStep(e, state) {
    e.fogDraw = null;
    if (e.state === 3) jokerHurtDraw(e, state);
    if (e.state === 0) {
      e.siner += 1;
      e.thissprite = 'spr_joker_main';
      if (e.flash === 1) {

        e.fsiner += 1;
        const b = state.jokerBody;
        if (b?.alive) {
          b.fsiner = e.fsiner;
          const a = -gmlCos(e.fsiner / 5) * 0.4 + 0.6;
          const spr = ['spr_joker_main', 'spr_joker_dance', 'spr_joker_tired'][b.dancelv];
          if (spr) e.fogDraw = [spr, b.dancelv === 1 ? b.floatsiner / 3 : 0, b.offx + b.flyx, b.offy + b.fly, 2, 2, a];
        }
      }
    }
    if (e.becomeflash === 0) e.flash = 0;
    e.becomeflash = 0;
  },

  name: 'obj_joker',
  objIndex: 292,

  create(e, state) {
    e.j = state.joker;
    e.talked = 0;
    e.attacked = 0;
    e.rtimer = 0;
    e.talktimer = 0;
    e.talkmax = 90;
    e.pendingLaunch = null;
    e.state = 0;
    e.hurttimer = 0;
    e.hurtamt = 0;
    e.siner = 0;
    e.flash = 0;
    e.fsiner = 0;
    e.becomeflash = 0;
    e.thissprite = 'spr_joker_main';
    e.image_speed = 0;
    e.image_xscale = 2;
    e.image_yscale = 2;
    e.x = 500;
    e.y = 160;

    state.jokerBody = spawn(state, jokerBody, { x: e.x, y: e.y });
  },

  step(e, state) {
    const j = e.j;

    if (state.mnfight === 1 && e.talked === 0) {

      if (state.joker.pirouette !== 2) state.invc = state.reminvc ?? 1;

      selectGates(j);
      const jt = j.jturn;
      state.enemyLine = { jturn: jt, rr: -1 };

      const single = state.forceAttack != null;
      if (jt === 0 && !single) state.audio?.cue('snd_joker_chaos');
      if (jt === 7 && !single) state.audio?.cue('snd_joker_anything');

      if (jt === 3 || jt === 13 || jt === 18) state.jokerBody && (state.jokerBody.condition = 5);

      if (single && state.forceAttack === 15) state.jokerBody && (state.jokerBody.condition = 5);
      if (jt === 17) j.dancelv = 2;
      if (jt === 4 || jt === 9 || jt === 14 || jt === 19) {
        const rr = gmlChoose(state.gmlRng, [0, 1, 2, 3]);
        state.enemyLine.rr = rr;
        if (rr === 0) {
          state.enemyLine.alt = gmlChoose(state.gmlRng, [0, 1]);
          if (!single) state.audio?.cue('snd_joker_chaos');
        }
        if (rr === 1 && !single) state.audio?.cue('snd_joker_anything');
        if (rr === 2) {
          state.enemyLine.alt = gmlChoose(state.gmlRng, [0, 1]);
        }
      }

      if (!single) {
        spawn(state, battleblcon, {
          x: e.x - 160, y: e.y - 20, sprite_index: 'spr_battleblcon_long', typer: 50,
          msg: talkText(state.enemyLine),
        });
      }

      selectTurn(j, state.gmlRng);

      if (single) j.jattack = state.forceAttack;

      if ([2, 5, 9, 13, 15].includes(j.jattack)) {

        const p = state.party;
        for (let t = 0; t < 3; t++) if (p.charcantarget[t] === 1) p.targeted[t] = 1;
        e.mytarget = 3;
      } else {
        e.mytarget = scrRandomtarget(state);
      }

      if (!state.entities.some((o) => o.alive && o.type.name === 'obj_darkener')) {
        spawn(state, darkener, { x: 0, y: 0 });
      }
      e.talked = 1;
      e.talktimer = 0;
      if (single) e.talkmax = 1;
    }

    if (e.talked === 1 && state.mnfight === 1) {
      e.rtimer = 0;
      if (state.menuEdges?.confirm && e.talktimer > 15) {
        e.talktimer = e.talkmax;
      }
      e.talktimer += 1;
      if (e.talktimer >= e.talkmax) {
        for (const o of state.entities) if (o.alive && o.type === writer) destroy(o);
        state.mnfight = 2;
      }
      if (state.mnfight === 2) {

        if (!state.entities.some((o) => o.alive && o.type.name === 'obj_moveheart')
            && (!state.soul || !state.soul.alive)) {
          spawn(state, moveheart, { x: 80 + 10, y: 100 + 40 });
        }
        if (!state.entities.some((o) => o.alive && o.type.name === 'obj_growtangle')) {
          spawn(state, battlebox, { x: state.view.x + 320, y: state.view.y + 170 });
        }
      }
    }

    if (state.myfight === 3) {
      const j = state.joker;
      if (e.actcon === undefined) e.actcon = 0;
      if (e.acting === 1 && e.actcon === 0) {
        e.actcon = 1;
        spawnBattleWriter(state, ['* JEVIL &* There is no strategy to defeat the enemy. Good luck!/%']);
      }
      if (e.acting === 2 && e.actcon === 0) {
        e.actcon = 5;
        state.audio?.cue('snd_pirouette');
        const kris = heroEntity(state, 0);
        if (kris) kris.visible = 0;
        e.dancekris = scrDarkMarker(state, kris?.x ?? 0, kris?.y ?? 0, 'spr_krisb_pirouette');
        e.dancekris.image_speed = 0.3334;
        e.dancekris.depth = kris?.depth ?? 0;
        spawn(state, afterimageGrow, {
          x: e.dancekris.x + 28, y: e.dancekris.y + 40,
          sprite_index: 'spr_pirouette_fx', image_xscale: 2, image_yscale: 2,
        });
        spawnBattleWriter(state, ['* Kris spun around^1!&* JEVIL got slightly more TIRED^1, and...!/%']);
      }
      if (e.actcon === 5 && writerGone(state)) {
        if (e.dancekris) destroy(e.dancekris);
        const kris = heroEntity(state, 0);
        if (kris) kris.visible = 1;
        chaosDance(state, e, j);
        j.hypnosiscounter += 0.5;
        if (j.hypnosiscounter >= 9) j.monsterstatus = 1;
        j.pirouette = j.chaosdance;
        j.pirouettecounter += 1;
        e.actcon = 1;
      }
      if (e.acting === 3 && e.actcon === 0) {
        if (j.at > 10) j.at -= 0.5;
        spawn(state, hypnofx, { x: 520, y: 180 });
        state.audio?.cue('snd_hypnosis');
        e.actcon = 1;
        const aaa = gmlChoose(state.gmlRng, [0, 1, 2]);
        const part1 = ['* Ralsei chanted something^1!', '* Susie spun something around^1!', '* Kris gazed strangely^1!'][aaa];
        let part3 = '&* JEVIL became more TIRED!';

        if (j.hypnosiscounter >= 9) {
          part3 = "&* JEVIL's looking exhausted!";
          j.monsterstatus = 1;
        }
        j.pfactor = 0.7;
        j.hypnosis = 1;
        j.hypnosiscounter += 1;
        spawnBattleWriter(state, [part1 + "&* JEVIL's next attack weakened!" + part3 + '/%']);
      }
      if (e.actcon === 1 && writerGone(state)) {
        e.actcon = 0;
        scrAttackphase(state);
      }
    }

    if (state.mnfight === 2 && e.attacked === 0) {
      e.rtimer += 1;
      if (e.rtimer === 12) {
        state.turntimer = 240;

        const d = DISPATCH[j.jattack];
        if (j.jattack === 4 || j.jattack === 8) state.audio?.cue('snd_joker_anything');

        const body = state.jokerBody;
        if (body?.alive) {
          if ([0, 2, 5, 9, 12, 13].includes(j.jattack)) body.condition = 2;
          if ([3, 11, 15].includes(j.jattack) && body.condition < 4) body.condition = 5;
        }
        const dc = spawn(state, dbulletController, { x: e.x, y: e.y });
        dc.gmlType = d.type;
        dc.target = e.mytarget ?? 0;
        dc.damage = j.at * j.pfactor * d.damageMul;
        dc.grazepoints = d.graze ?? 1;
        dc.joker = 1;
        if (d.turntimer) state.turntimer = d.turntimer;

        state.enemyFlavor = {
          frame: state.frame,
          rr: gmlChoose(state.gmlRng, [0, 1, 2, 3, 4]),
          jturn: j.jturn,
          dancelv: j.dancelv ?? 0,
          tired: j.monsterstatus === 1,
        };
        state.battlemsg = flavorText(state.enemyFlavor);
        j.pfactor = 1;
        j.turns += 1;
        j.chaosdance += 1;
        if (j.chaosdance >= 9) j.chaosdance = 0;
        e.attacked = 1;
      } else if (e.rtimer < 12) {
        state.turntimer = 120;
      }
    }
  },
};

export const moveheart = {
  name: 'obj_moveheart',
  objIndex: 219,
  builtinMotion: true,
  create(e, state) {
    e.flytime = 8;
    e.distx = state.view.x + 310;
    e.disty = state.view.y + 160;
    const dist = Math.hypot(e.distx - e.x, e.disty - e.y);
    moveTowardsPoint(e, e.distx, e.disty, dist / e.flytime);
    e.alarm[0] = e.flytime;
    e.image_alpha = 0;
    e.image_speed = 0;
    spawn(state, heartburst, { x: e.x, y: e.y });
  },
  step(e) {
    e.image_alpha += 0.334;
  },
  alarm: {
    0: (e, state) => {
      e.x = e.distx;
      e.y = e.disty;
      state.soul = spawn(state, soul, { x: e.distx, y: e.disty });
      state.grazeEnabled = true;
      destroy(e);
    },
  },
};

export const battlecontroller = {
  name: 'obj_battlecontroller',
  objIndex: 196,

  create(e, state) {

    spawn(state, tensionbar, { x: 0, y: 0 });
    e.timeron = 1;
    e.reset = 0;

    const inv = state.inventory ?? [];
    state.tempitem = [];
    for (let i = 0; i < 13; i += 1) {
      state.tempitem[i] = [inv[i] ?? 0, inv[i] ?? 0, inv[i] ?? 0];
    }

    e.lbuffer = 0;
    e.rbuffer = 0;
    e.onebuffer = 0;
    e.twobuffer = 0;

    state.myfight = 0;
    state.mnfight = 0;
    state.bmenuno = 0;
    state.charturn = 0;
    state.bmenucoord0 = [0, 0, 0];
    state.acting = [0, 0, 0];
    state.temptension = [0, 0, 0];
  },

  step(e, state) {

    menuStep(e, state);
    if (state.mnfight === 2 && e.timeron === 1) {
      state.turntimer -= 1;
      if (gmlLessEq(state.turntimer, 0) && e.reset === 0) {
        for (const o of state.entities) {
          if (!o.alive) continue;
          const n = o.type.name;

          if (o.isBullet || n === 'obj_joker_teleport' || n === 'obj_spadering' ||
              n === 'obj_suitbomb' || n === 'obj_heartbomb_blast' ||
              n === 'obj_clubsbullet_dark' || n === 'obj_dbulletcontroller') {
            o.alive = false;
          }
          if (n === 'obj_darkener') o.darken = 0;
        }
        if (state.soul && state.soul.alive) {
          spawn(state, returnheart, { x: state.soul.x, y: state.soul.y });
          destroy(state.soul);
          state.grazeEnabled = false;
        }
        e.reset = 1;
        e.alarm[2] = 15;
      }
    }

    menuBuffers(e);
  },

  alarm: {
    2: (e, state) => {

      e.reset = 0;
      endTurnAutoheal(state);
      mnendturnMenu(state);
      const joker = state.entities.find((o) => o.alive && o.type.name === 'obj_joker');
      if (joker) {
        joker.attacked = 0;
        joker.talked = 0;
        joker.acting = 0;
      }
    },
  },
};

export function buildFightScene(state, { menuPause = 60, inventory = null, gear = null } = {}) {
  state.hp = 90;
  state.invTimer = 0;
  state.phase = 'fight';
  state.view = { x: 0, y: 0 };
  state.roomHeight = 480;
  state.turntimer = 999;
  state.damageEnabled = true;
  state.grazeEnabled = false;

  state.nativeWriterDraws = true;
  state.menuPause = menuPause;
  state.reminvc = 1;

  state.hittarget = 0;

  state.mnfight = 0;

  state.inventory = inventory ? [...inventory.slice(0, 12), 0] : freshInventory();
  while (state.inventory.length < 13) state.inventory.splice(-1, 0, 0);

  if (gear) state.party = freshParty(gear);
  state.joker = createJoker();

  state.jokerbg = spawn(state, jokerbg, { x: 40, y: 0, on: 1 });
  spawn(state, battlecontroller);

  HEROES.forEach((h, i) => spawn(state, h, { x: [80, 90, 100][i], y: [100, 150, 210][i], depth: 200 - i * 20 }));
  spawn(state, jokerFight, { x: 500, y: 160 });
  return state;
}

export function buildSingleScene(state, { jattack = 0, inventory = null, gear = null } = {}) {
  buildFightScene(state, { inventory, gear });
  state.forceAttack = jattack;
  state.mnfight = 1;
  state.myfight = -1;
  return state;
}

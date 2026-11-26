import { WEAPONS, ARMOR, canEquip, statsOf, cloneGear, STARTING_GEAR } from './equipment.js';
import { WEAPON_REFUSALS, ARMOR_REFUSALS } from './equip-refusals.js';
import { DEFAULT_GEAR, PARTY } from './damage.js';
import { ITEMS, ITEM_IDS, DEFAULT_BAG, INVENTORY_SIZE } from './items.js';

import {
  DIALS, freshDials, clampDial, stepDial,
} from './dials.js';

import { mergeColor, lengthdirX, lengthdirY, WHITE, RED } from './gml.js';
import { gmlCreate, gmlRandom } from './rng.js';

export const MODES = [
  {
    id: 'normal',
    name: 'NORMAL',
  },
  {
    id: 'hitless',
    name: 'HITLESS',
  },
  {
    id: 'endless',
    name: 'ENDLESS',
  },
  {
    id: 'single',
    name: 'SINGLE ATTACK',
  },
  {
    id: 'practice',
    name: 'PRACTICE',
  },
];

export function modeRows(title) {
  const own = title && Array.isArray(title.modes) ? title.modes : null;
  return own && own.length > 0 ? own : MODES;
}

export const ENDLESS_STAGES = [
  {
    id: 'all',
    name: 'WHOLE FIGHT',
    phase: 0,
  },
  {
    id: 'phase1',
    name: 'PHASE 1',
    phase: 1,
  },
  {
    id: 'phase2',
    name: 'PHASE 2',
    phase: 2,
  },
  {
    id: 'phase3',
    name: 'PHASE 3',
    phase: 3,
  },
  {
    id: 'phase4',
    name: 'PHASE 4',
    phase: 4,
  },
];

export function endlessPhase(index) {
  return ENDLESS_STAGES[index | 0]?.phase ?? 0;
}

export const ITEM_PICKER = [0, ...ITEM_IDS];

export const SETTINGS_PAGES = [
  { id: 'audio', name: 'MUSIC / SFX' },
  { id: 'graphics', name: 'GRAPHICS' },

  { id: 'controls', name: 'CONTROLS' },

  { id: 'share', name: 'SHARE SETUP' },
  { id: 'unused', name: 'UNUSED' },
];

export function controlRows(title) {
  const rows = [

    { id: 'touch', name: 'TOUCH BUTTONS', value: title.swapZX ? 'X / Z' : 'Z / X' },

    { id: 'holdbreath', name: 'SINGLE HOLDBREATH', value: title.holdBreath ? 'ON' : 'OFF' },

    { id: 'nbc', name: 'NO BULLET COOLDOWNS', value: title.noBulletCooldown ? 'ON' : 'OFF' },
  ];

  const dials = title.dials ?? freshDials();
  for (const d of DIALS) {
    const v = clampDial(d.id, dials[d.id]);
    rows.push({
      id: d.id,
      name: d.name,
      value: d.format(v),
      slider: true,
      fraction: (v - d.min) / (d.max - d.min),
      off: v === d.def,

      locked: title.replaying === true,
    });
  }

  const devices = Object.keys(title.bindings?.devices ?? {});
  if (devices.length) {

    rows.push({ id: 'bindings', name: 'BUTTONS', value: deviceName(title.bindings.device) });
  }
  return rows;
}

export function deviceName(id) {
  if (id === 'keyboard') return 'KEYBOARD';
  if (id === 'touch') return 'TOUCH';
  if (id?.startsWith('gamepad')) return `GAMEPAD ${id.slice(7)}`;
  return 'UNKNOWN';
}

export const TITLE_EXTRAS = [];

export const CREDITS = [
  { role: 'Developer', who: 'Radi0', link: 'radi0.dev' },
  { role: 'Bug fixing and playtesting', who: 'WandeR', link: 'wander22lstr.carrd.co' },

  { role: 'Support', who: '', link: 'ko-fi.com/shadowcrystaldev' },
];

export const creditLink = (row) => (row.link ? `https://${row.link}` : null);

export function titleCredits(title) {
  return title?.credits ?? CREDITS;
}

export function pocketOf(kind, gear = null) {
  const pockets = {
    weapon: 0,
    armor1: 1,
    armor2: 2,
  };
  if (gear && kind in pockets) return pockets[kind];
  return kind in pockets ? pockets[kind] : -1;
}

export function previewStats(ch, gear) {
  const base = PARTY[ch];
  const w = WEAPONS[gear[0]];
  const a1 = ARMOR[gear[1]];
  const a2 = ARMOR[gear[2]];
  return {
    hp: base.hp,
    at: base.at + (w?.at ?? 0) + (a1?.at ?? 0) + (a2?.at ?? 0),
    df: base.df + (w?.df ?? 0) + (a1?.df ?? 0) + (a2?.df ?? 0),
    mag: base.mag + (w?.mag ?? 0) + (a1?.mag ?? 0) + (a2?.mag ?? 0),
  };
}

export const GEAR_PAGES = [
  { id: 'weapons', name: 'WEAPONS' },
  { id: 'armor', name: 'ARMOR' },
];

export function gearChoices(title, ch, page) {
  if (page === 'weapons') {
    const base = DEFAULT_GEAR[ch][0];
    return Object.keys(WEAPONS)
      .filter((id) => canEquip(ch, 'weapon', id))
      .map((id) => Number(id))
      .sort((a, b) => (a === base ? -1 : b === base ? 1 : a - b));
  }
  return Object.keys(ARMOR)
    .filter((id) => canEquip(ch, 'armor', id))
    .map((id) => Number(id))
    .sort((a, b) => a - b);
}

export function wornBy(gear, id) {
  return (gear[0] === id) + (gear[1] === id) + (gear[2] === id);
}

export function itemOf(id) {
  return WEAPONS[id] ?? ARMOR[id];
}

export const partyTabs = [
  { ch: 1, name: 'KRIS' },
  { ch: 2, name: 'SUSIE' },
  { ch: 3, name: 'RALSEI' },
];

export function unusedRowStyle(title) {
  const unused = title.unused ?? { found: 0, total: 0 };
  const heat = unused.found / Math.max(1, unused.total);
  const red = [255, 64, 64];
  return {
    name: `UNUSED ${unused.found} / ${unused.total}`,
    taken: unused.found === unused.total && unused.total > 0,
    dim: unused.found === 0,
    heat,
    red,
    shake: unused.found === unused.total && unused.total > 0 ? (Math.random() - 0.5) * 2 : 0,
    shattering: unused.found === unused.total && unused.total > 0 && title.unused?.shatter,
    sprite: 'spr_unused_badge',
  };
}

export { DEFAULT_GEAR, DEFAULT_BAG, INVENTORY_SIZE, ITEM_IDS, PARTY, DIALS, freshDials, clampDial, stepDial };

export function showCredits(title) {
  title.settings = {
    page: 'credits',
    root: true,
    cursor: 0,
  };
}

export function createTitle() {
  return {

    mode: null,
    index: 0,

    attackIndex: 0,
    pickingAttack: false,
    siner: 0,
    held: {},

    settings: null,

    gear: cloneGear(STARTING_GEAR),

    bag: [...DEFAULT_BAG],

    volumes: { music: 50, sfx: 50 },

    shake: true,

    scaling: 'fit',

    swapZX: false,

    dirty: false,
  };
}

export function stepTitle(title, input, attacks) {
  title.siner += 1;
  const pressed = (k) => {
    const down = !!input?.[k];
    const was = !!title.held[k];
    title.held[k] = down;
    return down && !was;
  };

  if (title.settings) {
    const r = stepSettings(title, pressed);
    return {
      moved: r.moved, chosen: false, selected: r.selected, error: r.error,
      link: r.link ?? null, share: r.share ?? false,
    };
  }

  const list = title.pickingAttack ? attacks.length : modeRows(title).length + TITLE_EXTRAS.length;
  const cur = title.pickingAttack ? 'attackIndex' : 'index';
  let moved = false;
  if (pressed('up')) { title[cur] = (title[cur] + list - 1) % list; moved = true; }
  if (pressed('down')) { title[cur] = (title[cur] + 1) % list; moved = true; }

  const cancelled = pressed('cancel');
  if (cancelled && title.pickingAttack) {
    title.pickingAttack = false;
    return { moved: true, chosen: false };
  }

  if (pressed('confirm')) {
    if (!title.pickingAttack && title.index >= modeRows(title).length) {
      // TITLE_EXTRAS is empty, should not reach here
      return { moved: false, chosen: false, selected: true };
    }
    if (!title.pickingAttack && modeRows(title)[title.index]?.id === 'single') {
      title.pickingAttack = true;
      return { moved: false, chosen: false, selected: true };
    }
    title.mode = modeRows(title)[title.index]?.id;
    return { moved: false, chosen: true, selected: true };
  }

  return { moved, chosen: false };
}

function openPage(title, page, root = false) {
  title.settings = {
    page,
    root,
    cursor: 0,
    shared: 0,
    items: { stage: 'slots', slot: 0, pick: 0 },
    gear: { stage: 'slots', ch: 1, row: 0, pick: 0 },
  };
}

function stepSettings(title, pressed) {
  const s = title.settings;
  const out = { moved: false, selected: false, error: false };
  const leavePage = () => {
    if (s.root) title.settings = null;
    else { s.page = null; s.cursor = 0; }
  };
  const wrap = (n) => {
    if (pressed('up')) { s.cursor = (s.cursor + n - 1) % n; out.moved = true; }
    if (pressed('down')) { s.cursor = (s.cursor + 1) % n; out.moved = true; }
  };

  if (s.page === null) {
    if (s.shared > 0) s.shared -= 1;
    wrap(SETTINGS_PAGES.length);
    if (pressed('cancel')) { title.settings = null; out.moved = true; return out; }
    if (pressed('confirm')) {
      if (!(s.cursor >= 0 && s.cursor < SETTINGS_PAGES.length)) s.cursor = 0;
      const page = SETTINGS_PAGES[s.cursor].id;
      out.selected = true;
      if (page === 'share') {
        out.share = true;
        s.shared = 60;
        return out;
      }
      s.hubCursor = s.cursor;
      s.page = page;
      s.cursor = 0;
    }
    return out;
  }

  if (s.page === 'credits') {
    const credits = titleCredits(title);
    wrap(credits.length);
    if (pressed('cancel')) { leavePage(); out.moved = true; return out; }
    if (pressed('confirm')) {
      out.link = creditLink(credits[s.cursor] ?? {});
      out.selected = !!out.link;
    }
    return out;
  }

  if (s.page === 'gear') {
    const g = s.gear;
    if (g.stage === 'slots') {
      if (pressed('left')) { g.ch = g.ch === 1 ? 3 : g.ch - 1; out.moved = true; }
      if (pressed('right')) { g.ch = g.ch === 3 ? 1 : g.ch + 1; out.moved = true; }
      if (pressed('up')) { g.row = (g.row + 2) % 3; out.moved = true; }
      if (pressed('down')) { g.row = (g.row + 1) % 3; out.moved = true; }
      if (pressed('cancel')) { leavePage(); out.moved = true; return out; }
      if (pressed('confirm')) {
        g.stage = 'pick';
        g.pick = Math.max(0, gearChoices(title, g.ch, g.row).indexOf(title.gear[g.ch][g.row]));
        out.selected = true;
      }
      return out;
    }
    const list = gearChoices(title, g.ch, g.row);
    const n = list.length;
    if (pressed('up')) { g.pick = (g.pick + n - 1) % n; out.moved = true; }
    if (pressed('down')) { g.pick = (g.pick + 1) % n; out.moved = true; }
    if (pressed('cancel')) { g.stage = 'slots'; out.moved = true; return out; }
    if (pressed('confirm')) {
      title.gear[g.ch][g.row] = list[g.pick];
      title.dirty = true;
      g.stage = 'slots';
      out.selected = true;
    }
    return out;
  }

  if (s.page === 'items') {
    const it = s.items;
    if (it.stage === 'slots') {

      if (pressed('left') || pressed('right')) { it.slot ^= 1; out.moved = true; }
      if (pressed('up')) { it.slot = (it.slot + INVENTORY_SIZE - 2) % INVENTORY_SIZE; out.moved = true; }
      if (pressed('down')) { it.slot = (it.slot + 2) % INVENTORY_SIZE; out.moved = true; }
      if (pressed('cancel')) { leavePage(); out.moved = true; return out; }
      if (pressed('confirm')) {
        it.stage = 'pick';
        it.pick = Math.max(0, ITEM_PICKER.indexOf(title.bag[it.slot] ?? 0));
        out.selected = true;
      }
      return out;
    }
    const n = ITEM_PICKER.length;
    if (pressed('up')) { it.pick = (it.pick + n - 1) % n; out.moved = true; }
    if (pressed('down')) { it.pick = (it.pick + 1) % n; out.moved = true; }
    if (pressed('cancel')) { it.stage = 'slots'; out.moved = true; return out; }
    if (pressed('confirm')) {
      title.bag[it.slot] = ITEM_PICKER[it.pick];
      title.dirty = true;
      it.stage = 'slots';
      out.selected = true;
    }
    return out;
  }

  if (s.page === 'audio') {
    wrap(2);
    const key = s.cursor === 0 ? 'music' : 'sfx';
    const step = (d) => {
      const v = Math.max(0, Math.min(100, title.volumes[key] + d));
      if (v !== title.volumes[key]) {
        title.volumes[key] = v;
        title.dirty = true;
        out.moved = true;
      }
    };
    if (pressed('left')) step(-10);
    if (pressed('right')) step(10);
    if (pressed('cancel')) { leavePage(); s.cursor = s.hubCursor ?? 0; out.moved = true; }
    return out;
  }

  if (s.page === 'graphics') {
    const rows = graphicsRows(title);
    wrap(rows.length);
    if (pressed('left') || pressed('right') || pressed('confirm')) {
      const id = rows[s.cursor].id;
      if (id === 'scaling') title.scaling = title.scaling === 'fit' ? 'pixel' : 'fit';
      if (id === 'shake') title.shake = !title.shake;
      title.dirty = true;
      out.selected = true;
    }
    if (pressed('cancel')) { leavePage(); s.cursor = s.hubCursor ?? 1; out.moved = true; }
    return out;
  }

  if (s.page === 'controls') {
    const rows = controlRows(title);
    wrap(rows.length);
    if (pressed('left') || pressed('right') || pressed('confirm')) {
      if (rows[s.cursor].id === 'touch') title.swapZX = !title.swapZX;
      title.dirty = true;
      out.selected = true;
    }
    if (pressed('cancel')) { leavePage(); s.cursor = s.hubCursor ?? 2; out.moved = true; }
    return out;
  }

  leavePage();
  return out;
}

export function graphicsRows(title) {
  return [
    { id: 'scaling', name: 'SCREEN SIZE', value: title.scaling === 'fit' ? 'FULL' : 'SMALL' },

    { id: 'shake', name: 'SCREEN SHAKE', value: title.shake ? 'ON' : 'OFF' },
  ];
}

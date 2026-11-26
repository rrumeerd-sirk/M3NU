

import { ITEMS } from './items.js';
import { DEFAULT_GEAR, STARTING_GEAR, cloneGear, weaponChoices, armorChoices } from './equipment.js';

export const SHARE_MODES = [
  { id: 'normal', name: 'NORMAL' },
  { id: 'hitless', name: 'HITLESS' },
  { id: 'endless', name: 'ENDLESS' },
  { id: 'single', name: 'SINGLE ATTACK' },
  { id: 'practice', name: 'PRACTICE' },
];

export const MODES = SHARE_MODES.filter((m) => m.id !== 'endless');

export const TITLE_EXTRAS = [
  { id: 'gear', name: 'GEAR' },
  { id: 'items', name: 'ITEMS' },
  { id: 'settings', name: 'SETTINGS' },
];

export const SETTINGS_PAGES = [
  { id: 'audio', name: 'MUSIC / SFX' },
  { id: 'graphics', name: 'GRAPHICS' },
  { id: 'controls', name: 'CONTROLS' },

];

export const INVENTORY_SIZE = 12;

export const DEFAULT_BAG = [6, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8];

export const ITEM_PICKER = [0, ...Object.keys(ITEMS).map(Number).filter((id) => ITEMS[id].usable)];

export const CREDITS = [
  { role: 'Developer', who: 'Radi0', link: 'radi0.dev' },
  { role: 'SUPPORT', who: '', link: 'ko-fi.com/shadowcrystaldev' },
];

export const creditLink = (row) => (row.link ? `https://${row.link}` : null);

export function controlRows(title) {
  return [
    { id: 'touch', name: 'TOUCH BUTTONS', value: title.swapZX ? 'X / Z' : 'Z / X' },
  ];
}

export function graphicsRows(title) {
  return [
    { id: 'scaling', name: 'SCREEN SIZE', value: title.scaling === 'fit' ? 'FULL' : 'SMALL' },

    { id: 'shake', name: 'SCREEN SHAKE', value: title.shake ? 'ON' : 'OFF' },
  ];
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

export function gearChoices(title, ch, row) {
  return row === 0 ? weaponChoices(ch, DEFAULT_GEAR[ch][0]) : armorChoices(ch);
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
    wrap(CREDITS.length);
    if (pressed('cancel')) { leavePage(); out.moved = true; return out; }
    if (pressed('confirm')) {
      out.link = creditLink(CREDITS[s.cursor] ?? {});
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

  const list = title.pickingAttack ? attacks.length : MODES.length + TITLE_EXTRAS.length;
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
    if (!title.pickingAttack && title.index >= MODES.length) {
      const extra = TITLE_EXTRAS[title.index - MODES.length];
      if (extra.id === 'credits') openPage(title, 'credits', true);
      else if (extra.id === 'items') openPage(title, 'items', true);
      else if (extra.id === 'gear') openPage(title, 'gear', true);
      else openPage(title, null);
      return { moved: false, chosen: false, selected: true };
    }
    if (!title.pickingAttack && MODES[title.index].id === 'single') {
      title.pickingAttack = true;
      return { moved: false, chosen: false, selected: true };
    }
    title.mode = MODES[title.index].id;
    return { moved: false, chosen: true, selected: true };
  }

  return { moved, chosen: false };
}

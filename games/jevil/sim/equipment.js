

export const WEAPONS = {
  1: { name: 'Wood Blade', at: 0, df: 0, mag: 0, who: [1] },

  2: { name: 'Mane Ax', at: 0, df: 0, mag: 0, who: [] },
  3: { name: 'Red Scarf', at: 0, df: 0, mag: 0, who: [3] },
  4: { name: 'EverybodyWeapon', at: 12, df: 6, mag: 8, who: [1, 2, 3] },
  5: { name: 'Spookysword', at: 2, df: 0, mag: 0, who: [1] },
  6: { name: 'Brave Ax', at: 2, df: 0, mag: 0, who: [2] },
  7: { name: 'Devilsknife', at: 5, df: 0, mag: 4, who: [2] },
  8: { name: 'Trefoil', at: 4, df: 0, mag: 0, who: [1] },
  9: { name: 'Ragger', at: 2, df: 0, mag: 0, who: [3] },
  10: { name: 'DaintyScarf', at: 0, df: 0, mag: 2, who: [3] },
};

export const ARMOR = {
  1: { name: 'Amber Card', at: 0, df: 1, mag: 0, who: [1, 2, 3] },
  2: { name: 'Dice Brace', at: 0, df: 2, mag: 0, who: [1, 2, 3] },
  3: { name: 'Pink Ribbon', at: 0, df: 1, mag: 0, who: [1, 3] },
  4: { name: 'White Ribbon', at: 0, df: 2, mag: 0, who: [1, 3] },
  5: { name: 'IronShackle', at: 1, df: 2, mag: 0, who: [1, 2, 3] },
  6: { name: 'MouseToken', at: 0, df: 0, mag: 2, who: [1, 2, 3] },
  7: { name: 'Jevilstail', at: 2, df: 2, mag: 2, who: [1, 2, 3] },
};

export const BASE = {
  1: { at: 10, df: 2, mag: 0 },
  2: { at: 14, df: 2, mag: 1 },
  3: { at: 8, df: 2, mag: 7 },
};

export const DEFAULT_GEAR = { 1: [1, 0, 0], 2: [2, 0, 0], 3: [3, 0, 0] };

export const STARTING_GEAR = { 1: [5, 4, 1], 2: [6, 2, 1], 3: [10, 5, 1] };

const sameGear = (a, b) => [1, 2, 3].every((ch) => [0, 1, 2].every((k) => (a?.[ch]?.[k] | 0) === b[ch][k]));

export const cloneGear = (g) => ({ 1: [...g[1]], 2: [...g[2]], 3: [...g[3]] });

export function weaponChoices(ch, worn) {
  const ids = Object.keys(WEAPONS).map(Number).filter((id) => WEAPONS[id].who.includes(ch));
  if (worn && !ids.includes(worn)) ids.unshift(worn);
  return ids;
}

export function armorChoices(ch) {
  return [0, ...Object.keys(ARMOR).map(Number).filter((id) => ARMOR[id].who.includes(ch))];
}

export function normalizeGear(g) {
  const out = cloneGear(STARTING_GEAR);
  for (const ch of [1, 2, 3]) {
    const row = g?.[ch];
    if (!Array.isArray(row)) continue;
    const w = row[0] | 0;
    if (weaponChoices(ch, DEFAULT_GEAR[ch][0]).includes(w)) out[ch][0] = w;
    for (const k of [1, 2]) {
      const a = row[k] | 0;
      if (armorChoices(ch).includes(a)) out[ch][k] = a;
    }
  }
  return out;
}

export function statsOf(ch, gear) {
  const [w, a1, a2] = gear?.[ch] ?? DEFAULT_GEAR[ch];
  const pieces = [WEAPONS[w], ARMOR[a1], ARMOR[a2]].filter(Boolean);
  const b = BASE[ch];
  return {
    at: b.at + pieces.reduce((s, p) => s + p.at, 0),
    df: b.df + pieces.reduce((s, p) => s + p.df, 0),
    mag: b.mag + pieces.reduce((s, p) => s + p.mag, 0),
  };
}

export const isFreshFileGear = (g) => sameGear(g, DEFAULT_GEAR);

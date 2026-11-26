

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const VERSION = 'K';
const OLD_VERSION = 'J';

export const NONE = 63;

const enc = (n) => ALPHABET[Math.max(0, Math.min(63, n | 0))];
const dec = (ch) => {
  const i = ALPHABET.indexOf(ch);
  return i < 0 ? null : i;
};

export const CONFIG_LENGTH = 24;
const OLD_LENGTH = 15;

export function encodeConfig({ mode = NONE, attack = NONE, bag = null, gear = null } = {}) {
  let out = VERSION + enc(mode) + enc(attack);
  for (let i = 0; i < 12; i++) out += enc(bag ? (bag[i] ?? 0) : NONE);
  for (const ch of [1, 2, 3]) {
    for (let k = 0; k < 3; k++) out += enc(gear ? (gear[ch]?.[k] ?? 0) : NONE);
  }
  return out;
}

export function decodeConfig(token, { itemOk = () => true, modeCount = 5, attackCount = 16 } = {}) {
  if (typeof token !== 'string') return null;
  const current = token[0] === VERSION && token.length === CONFIG_LENGTH;
  const old = token[0] === OLD_VERSION && token.length === OLD_LENGTH;
  if (!current && !old) return null;
  const v = [];
  for (const ch of token) {
    const n = dec(ch);
    if (n === null) return null;
    v.push(n);
  }
  const pick = (n, count) => (n === NONE || n < 0 || n >= count ? null : n);
  const bagVals = v.slice(3, 15);
  return {
    mode: pick(v[1], modeCount),
    attack: pick(v[2], attackCount),
    bag: bagVals.every((n) => n === NONE) ? null : bagVals.map((n) => (n !== NONE && itemOk(n) ? n : 0)),

    gear: !current || v.slice(15, 24).every((n) => n === NONE) ? null
      : { 1: v.slice(15, 18), 2: v.slice(18, 21), 3: v.slice(21, 24) },
  };
}

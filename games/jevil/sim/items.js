

import { scrRevive } from './damage.js';
import { healVisuals } from './spells.js';

export const ITEMS = {
  1: { name: 'Dark Candy', desc: 'Heals#40HP', target: 1, usable: 1 },
  2: { name: 'ReviveMint', desc: 'Heal#Downed#Ally', target: 1, usable: 1 },
  3: { name: 'Glowshard', desc: 'Sell#at#shops', target: 0, usable: 0 },
  4: { name: 'Manual', desc: 'Read#out of#battle', target: 2, usable: 0 },
  5: { name: 'BrokenCake', desc: 'Heals#20HP', target: 1, usable: 1 },
  6: { name: 'Top Cake', desc: 'Heals#team#160HP', target: 2, usable: 1 },
  7: { name: 'Spincake', desc: 'Heals#team#80HP', target: 2, usable: 1 },
  8: { name: 'Darkburger', desc: 'Heals#70HP', target: 1, usable: 1 },
  9: { name: 'LancerCookie', desc: 'Heals#50HP', target: 1, usable: 1 },
  10: { name: 'GigaSalad', desc: 'Heals#4HP', target: 1, usable: 1 },
  11: { name: 'ClubsSandwich', desc: 'Heals#team#30HP', target: 2, usable: 1 },
  12: { name: 'HeartsDonut', desc: 'Healing#varies', target: 1, usable: 1 },
  13: { name: 'ChocDiamond', desc: 'Healing#varies', target: 1, usable: 1 },
  14: { name: 'Favwich', desc: 'Heals#ALL HP', target: 1, usable: 1 },
  15: { name: 'RouxlsRoux', desc: 'Heals#50 HP', target: 1, usable: 1 },
};

export function freshInventory() {
  return [6, 2, 2, 8, 8, 8, 8, 8, 8, 8, 8, 8, 0];
}

export function scrHeal(state, slot, amount) {
  const p = state.party;
  const ch = p.char[slot];
  const cur = p.hp[ch];
  const belowzero = cur <= 0;
  const abovemax = cur > p.maxhp[ch];
  if (!abovemax) {
    p.hp[ch] += amount;
    if (p.hp[ch] > p.maxhp[ch]) p.hp[ch] = p.maxhp[ch];
  }
  if (belowzero && p.hp[ch] >= 0) {
    const floor6 = Math.ceil(p.maxhp[ch] / 6);
    if (p.hp[ch] < floor6) p.hp[ch] = floor6;
    scrRevive(p, slot);
  }
  state.audio?.cue('snd_power');
  return p.hp[ch] - cur;
}

export function scrHealitemspell(state, slot, amount) {
  scrHeal(state, slot, amount);
  healVisuals(state, slot, amount);
  state.spelldelay = 15;
}

export function scrHealallitemspell(state, amount) {
  for (let i = 0; i < 3; i += 1) {
    if (state.party.char[i] !== 0) scrHeal(state, i, amount);
  }
  for (let i = 0; i < 3; i += 1) healVisuals(state, i, amount);
  state.spelldelay = 20;
}

export function scrItemspell(state, itemId, star) {
  const p = state.party;
  switch (itemId) {
    case 1: scrHealitemspell(state, star, 40); break;
    case 2: {
      const ch = p.char[star];
      let amt = Math.ceil(p.maxhp[ch] / 2);
      if (p.hp[ch] <= 0) amt = Math.ceil(p.maxhp[ch]) + Math.abs(p.hp[ch]);
      scrHealitemspell(state, star, amt);
      break;
    }
    case 5: scrHealitemspell(state, star, 20); break;
    case 6: scrHealallitemspell(state, 160); break;
    case 7: scrHealallitemspell(state, 80); break;
    case 8: scrHealitemspell(state, star, 70); break;
    case 9: scrHealitemspell(state, star, 50); break;
    case 10: scrHealitemspell(state, star, 4); break;
    case 11: scrHealallitemspell(state, 30); break;
    case 12: scrHealitemspell(state, star, [0, 10, 90, 60][p.char[star]] ?? 10); break;
    case 13: scrHealitemspell(state, star, [0, 80, 30, 30][p.char[star]] ?? 30); break;
    case 14: scrHealitemspell(state, star, 500); break;
    case 15: scrHealitemspell(state, star, 60); break;
    default: break;
  }
}

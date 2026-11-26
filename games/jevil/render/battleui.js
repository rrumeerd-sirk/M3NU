

import { loadFont, drawText, textWidth, textHeight } from './font.js';
import { ITEMS } from '../sim/items.js';
import { drawSpriteExt } from './draw/gm.js';
import { CHARNAME, SPELL_TABLE, spellInfo } from '../sim/spells.js';

const BPY = 152;
const FNT = loadFont('../assets/fonts', 'fnt_mainbig');

const MONSTER_NAME = 'JEVIL';
const ACT_NAMES = ['Check', 'Pirouette', 'Hypnosis'];
const ACT_COSTS = [0, 50, 125];

const ACT_DESC = ['', 'Random#Chaos', 'Induce#TIRED'];
const ACT_ACTOR = [0, 1, 4];
const GRAY = [128, 128, 128];
const SPELL_NAMES = { 2: 'Heal Prayer', 3: 'Pacify', 4: 'Rude Buster' };
const AQUA_BLUE = 'rgb(0,179,255)';

const ITEM_NAMES = {
  1: 'Dark Candy', 2: 'ReviveMint', 5: 'BrokenCake', 6: 'Top Cake',
  7: 'Spincake', 8: 'Darkburger', 9: 'LancerCookie', 10: 'GigaSalad',
  11: 'ClubsSandwich', 12: 'HeartsDonut', 13: 'ChocDiamond',
  14: 'Favwich', 15: 'RouxlsRoux', 3: 'Glowshard', 4: 'Manual',
};

const SPELL_DESC = { 2: 'Heal#Ally', 3: 'Spare#TIRED foe', 4: 'Rude#Damage#' };
const HP_COLORS = ['#00ffff', '#ff00ff', '#00ff00'];

function drawDesc(ctx, text) {
  const lh = textHeight(FNT);
  String(text ?? '').split('#').forEach((line, i) => {
    if (line) drawText(ctx, FNT, line, 500, 375 + i * lh, { color: '#808080' });
  });
}

const BCOLOR = 'rgb(45,19,45)';

const state2 = {
  mmy: [0, 0, 0],
  sSiner: 0,
};

function frameOf(sprites, name, idx) {
  const e = sprites.get(name);
  if (!e || !e.frames.length) return null;
  return { img: e.frames[Math.abs(Math.floor(idx)) % e.frames.length], meta: e.meta };
}

function blit(ctx, sprites, name, idx, x, y, alpha = 1) {
  const f = frameOf(sprites, name, idx);
  if (!f || !f.img) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(f.img, x - f.meta.ox, y - f.meta.oy);
  ctx.restore();
}

function gmlRect(ctx, color, x1, y1, x2, y2) {
  const l = Math.round(Math.min(x1, x2));
  const r = Math.round(Math.max(x1, x2));
  const t = Math.round(Math.min(y1, y2));
  const b = Math.round(Math.max(y1, y2));
  ctx.fillStyle = color;
  ctx.fillRect(l, t, r - l + 1, b - t + 1);
}

const HP_CHARS = '0123456789-+';
function drawHpNumber(ctx, sprites, text, xRight, yTop, color = null) {
  const entry = sprites.get('spr_numbersfontsmall');
  if (!entry) return;
  const sep = 2;
  const w = entry.meta.w;
  let x = xRight - String(text).length * (w + sep);
  for (const ch of String(text)) {
    const idx = HP_CHARS.indexOf(ch);
    const img = entry.frames[idx];
    if (idx >= 0 && img) ctx.drawImage(color ? tintedFrame(img, color) : img, x, yTop);
    x += w + sep;
  }
}

const tintCache = new Map();
function tintedFrame(img, color) {
  const key = `${img.src}|${color}`;
  let c = tintCache.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = color;
  g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(img, 0, 0);
  tintCache.set(key, c);
  return c;
}

export function drawDmgWriter(ctx, sprites, d) {
  const color = `rgb(${d.color[0]},${d.color[1]},${d.color[2]})`;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, d.alpha));
  ctx.translate(d.x, d.y);
  if (d.angle) ctx.rotate((-d.angle * Math.PI) / 180);
  ctx.scale(d.xscale, d.yscale);
  if (d.message === 0) {
    const entry = sprites.get('spr_numbersfontbig');
    let px = -d.text.length * 20;
    for (const ch of d.text) {
      const img = entry?.frames?.['0123456789'.indexOf(ch)];
      if (img) ctx.drawImage(tintedFrame(img, color), px, 0);
      px += 20;
    }
  } else {
    const entry = sprites.get('spr_battlemsg');
    const img = entry?.frames?.[d.message - 1];
    if (img) ctx.drawImage(tintedFrame(img, color), -entry.meta.ox, -entry.meta.oy);
  }
  ctx.restore();
}

export function drawBattleUI(ctx, sprites, state, simAdvanced = true) {
  if (!sprites) return;
  const bp = BPY;
  const p = state.party;
  if (!p) return;

  ctx.fillStyle = '#000';
  ctx.fillRect(-10, 480 - bp, 710, 481 - (480 - bp));
  ctx.fillStyle = BCOLOR;
  ctx.fillRect(-10, 480 - bp - 2, 710, 2);
  ctx.fillRect(-10, 480 - bp + 34, 710, 2);

  const inMenu = state.myfight === 0 && state.mnfight === 0;

  for (let c = 0; c < 3; c += 1) {
    const xchunk = [0, 212, 424][c];
    const selected = state.charturn === c && inMenu;

    const m = state2.mmy;
    if (!simAdvanced) {

    } else if (selected) {
      if (m[c] > -32) m[c] -= 2;
      if (m[c] > -24) m[c] -= 4;
      if (m[c] > -16) m[c] -= 6;
      if (m[c] > -8) m[c] -= 8;
      if (m[c] < -32) m[c] = -64;
    } else if (m[c] < -14) {
      m[c] += 15;
    } else {
      m[c] = 0;
    }
    const mmy = m[c];

    const charcolor = HP_COLORS[(state.hpcolor ?? [0, 1, 2])[c]];

    if (selected) {
      state2.sSiner += 2;
      ctx.fillStyle = charcolor;
      ctx.fillRect(xchunk, 480 - bp, 210, 3);
    }

    const btc = [0, 0, 0, 0, 0];
    if (selected && state.bmenuno === 0) {
      btc[state.bmenucoord0?.[c] ?? 0] = 1;
    }
    const by = 485 - bp;
    blit(ctx, sprites, 'spr_btfight', btc[0], xchunk + 15, by);
    blit(ctx, sprites, c === 0 ? 'spr_btact' : 'spr_bttech', btc[1], xchunk + 50, by);
    blit(ctx, sprites, 'spr_btitem', btc[2], xchunk + 85, by);
    blit(ctx, sprites, 'spr_btspare', btc[3], xchunk + 120, by);
    blit(ctx, sprites, 'spr_btdefend', btc[4], xchunk + 155, by);

    if (c === 2 && selected && state.joker?.monsterstatus === 1 && state.tension >= 40) {
      const a = 0.4 + Math.sin(state.frame / 6) * 0.4;
      blit(ctx, sprites, 'spr_bttech', 1, xchunk + 50, by, Math.max(0, a));
    }

    ctx.fillStyle = selected ? charcolor : BCOLOR;
    ctx.fillRect(xchunk, 480 - bp - 2 + mmy, 212, (480 - bp) - (480 - bp - 2 + mmy) + 1);
    ctx.fillStyle = '#000';
    ctx.fillRect(xchunk + 2, 480 - bp + mmy, 208, 33);

    const bo = 336 + mmy;
    const head = ['spr_headkris', 'spr_headsusie', 'spr_headralsei'][c];
    const bname = ['spr_bnamekris', 'spr_bnamesusie', 'spr_bnameralsei'][c];
    blit(ctx, sprites, head, 0, 13 + xchunk, bo);
    blit(ctx, sprites, bname, 0, 51 + xchunk, bo + 3);
    blit(ctx, sprites, 'spr_hpname', 0, 109 + xchunk, bo + 11);

    const hp = p.hp[p.char[c]];
    const maxhp = p.maxhp[p.char[c]];

    let hpColor = null;
    if (hp / maxhp <= 0.25) hpColor = '#ffff00';
    if (hp <= 0) hpColor = '#ff0000';
    drawHpNumber(ctx, sprites, hp, 160 + xchunk, bo - 2, hpColor);
    blit(ctx, sprites, 'spr_hpslash', 0, 159 + xchunk, bo - 4);
    drawHpNumber(ctx, sprites, maxhp, 205 + xchunk, bo - 2, hpColor);

    ctx.fillStyle = '#800000';
    ctx.fillRect(128 + xchunk, bo + 11, 75, 8);
    if (hp > 0 && maxhp > 0) {
      ctx.fillStyle = charcolor;
      ctx.fillRect(128 + xchunk, bo + 11, Math.ceil((hp / maxhp) * 75), 8);
    }
  }

  if (inMenu) {
    const bm = state.bmenuno;

    if (bm === 1 || bm === 3 || bm === 11) {
      blit(ctx, sprites, 'spr_heart', 0, 55, 385);
      const tired = state.joker?.monsterstatus === 1;
      const nameColor = tired ? AQUA_BLUE : '#ffffff';
      drawText(ctx, FNT, MONSTER_NAME, 80, 375, { color: nameColor });
      const nw = textWidth(FNT, MONSTER_NAME);
      if (tired) blit(ctx, sprites, 'spr_tiredmark', 0, 80 + nw + 40, 385);
      gmlRect(ctx, '#800000', 510, 380, 590, 395);
      const jr = state.joker ? state.joker.hp / state.joker.maxhp : 1;
      gmlRect(ctx, '#00ff00', 510, 380, 510 + jr * 80, 395);
    }

    if (bm === 9) {
      const coord = state.bmenucoord9?.[state.charturn] ?? 0;
      const icx = (coord % 2 === 1) ? 240 : 10;
      const icy = 385 + Math.floor(coord / 2) * 30;
      blit(ctx, sprites, 'spr_heart', 0, icx, icy);

      const down = (ch) => !p.char.includes(ch) || (p.hp[ch] ?? 0) <= 0;
      for (let i = 0; i < ACT_NAMES.length; i += 1) {
        const x = (i % 2 ? 230 : 0) + 30;
        const y = 375 + Math.floor(i / 2) * 30;
        const who = ACT_ACTOR[i];
        let cant = state.tension < ACT_COSTS[i];
        let off = 0;
        const sus = who === 2 || who === 4;
        const ral = who === 3 || who === 4;
        if (sus) { off = 36; if (down(2)) cant = true; }
        if (ral) { off = 36; if (down(3)) cant = true; }
        if (who === 4) off = Math.round(off * 1.8);
        const blend = sus && down(2) ? GRAY : null;
        if (who === 2 || who === 4) drawSpriteExt(ctx, sprites.get('spr_headsusie'), 0, x, y, 1, 1, 0, blend, 1);
        if (who === 3) drawSpriteExt(ctx, sprites.get('spr_headralsei'), 0, x, y, 1, 1, 0, blend, 1);
        if (who === 4) drawSpriteExt(ctx, sprites.get('spr_headralsei'), 0, x + 30, y, 1, 1, 0, blend, 1);
        drawText(ctx, FNT, ACT_NAMES[i], x + off, y, { color: cant ? '#808080' : '#ffffff' });
      }
      drawDesc(ctx, ACT_DESC[coord]);
      if (state.tensionselect > 0) {
        drawText(ctx, FNT, `${Math.round((ACT_COSTS[coord] / 250) * 100)}% TP`, 500, 440, { color: '#ffa000' });
      }
    }

    if (bm === 2) {
      const coord = state.bmenucoord2?.[state.charturn] ?? 0;
      const icx = (coord % 2 === 1) ? 230 : 10;
      const icy = 385 + Math.floor(coord / 2) * 30;
      blit(ctx, sprites, 'spr_heart', 0, icx, icy);
      const spells = (SPELL_TABLE[p.char[state.charturn]] ?? []).filter((id) => SPELL_NAMES[id]);
      const costs = Object.fromEntries(spells.map((id) => [id, spellInfo(id, p).cost]));
      for (let i = 0; i < spells.length; i += 1) {
        const id = spells[i];
        let color = '#ffffff';
        if (state.tension < costs[id]) color = '#808080';
        else if (id === 3 && state.joker?.monsterstatus === 1) color = AQUA_BLUE;
        drawText(ctx, FNT, SPELL_NAMES[id], (i % 2) ? 260 : 30, 375 + Math.floor(i / 2) * 30, { color });
      }
      const selId = spells[coord] ?? spells[0];
      drawDesc(ctx, SPELL_DESC[selId]);
      const pct = Math.round(((costs[selId] ?? 0) / 250) * 100);
      drawText(ctx, FNT, `${pct}% TP`, 500, 440, { color: '#ffa000' });
    }
  }

  if (inMenu && state.bmenuno === 4 && state.tempitem) {
    const col = state.charturn;
    let coord = state.bmenucoord4?.[col] ?? 0;

    const page = coord > 5 ? 1 : 0;
    if (page) coord -= 6;
    const icx = (coord % 2 === 1) ? 230 : 10;
    const icy = 385 + Math.floor(coord / 2) * 30;
    blit(ctx, sprites, 'spr_heart', 0, icx, icy);
    for (let i = 0; i < 6; i += 1) {
      const id = state.tempitem[page * 6 + i]?.[col] ?? 0;
      if (id === 0) continue;
      drawText(ctx, FNT, ITEM_NAMES[id] ?? `Item ${id}`,
        (i % 2) ? 260 : 30, 375 + Math.floor(i / 2) * 30, { color: '#ffffff' });
    }
    drawDesc(ctx, ITEMS[state.tempitem[page * 6 + coord]?.[col] ?? 0]?.desc ?? '---');

    if (page === 0 && (state.inventory?.[6] ?? 0) !== 0) {
      blit(ctx, sprites, 'spr_morearrow', 0, 470, 445 + Math.sin(state.frame / 10) * 2);
    }
    if (page === 1) {
      const f = frameOf(sprites, 'spr_morearrow', 0);
      if (f?.img) {
        ctx.save();
        ctx.translate(470, 395 - Math.sin(state.frame / 10) * 2);
        ctx.scale(1, -1);
        ctx.drawImage(f.img, -f.meta.ox, -f.meta.oy);
        ctx.restore();
      }
    }
  }

  if (inMenu && (state.bmenuno === 7 || state.bmenuno === 8) && (state.myfight ?? 0) === 0) {
    const coords = state.bmenuno === 7 ? state.bmenucoord7 : state.bmenucoord8;
    const coord = coords?.[state.charturn] ?? 0;
    blit(ctx, sprites, 'spr_heart', 0, 55, 385 + coord * 30);
    for (let i = 0; i < 3; i += 1) {
      const ch = p.char[i];
      if (ch === 0) continue;
      drawText(ctx, FNT, CHARNAME[ch], 80, 375 + i * 30, { color: '#ffffff' });
      gmlRect(ctx, '#800000', 400, 380 + i * 30, 500, 395 + i * 30);
      gmlRect(ctx, '#00ff00', 400, 380 + i * 30, 400 + (p.hp[ch] / p.maxhp[ch]) * 100, 395 + i * 30);
    }
  }

}

export function drawTensionbar(ctx, sprites, state, tb) {
  const x = Math.round(tb.x);
  const y = Math.round(tb.y);
  const H = 196;
  const W = 25;
  const maxt = state.maxtension ?? 250;
  const ap = tb.apparent;
  const cur = tb.current;
  const bottom = y + H - 1;

  const rect = (v, color) => {
    const top = y + H - (v / maxt) * H;
    const y1 = Math.min(top, bottom);
    const y2 = Math.max(top, bottom);
    ctx.fillStyle = color;
    ctx.fillRect(x + 3, Math.round(y1), W - 3, Math.round(y2) - Math.round(y1) + 1);
  };
  blit(ctx, sprites, 'spr_tplogo', 0, x - 30, y + 30);
  blit(ctx, sprites, 'spr_tensionbar', 1, x, y);
  const tamt = tb.tamtDrawn;
  if (tamt < 100) {
    drawText(ctx, FNT, String(tamt), x - 30, y + 70, { color: '#ffffff' });
    drawText(ctx, FNT, '%', x - 25, y + 95, { color: '#ffffff' });
  } else {
    drawText(ctx, FNT, 'M', x - 28, y + 70, { color: '#ffff00' });
    drawText(ctx, FNT, 'A', x - 24, y + 90, { color: '#ffff00' });
    drawText(ctx, FNT, 'X', x - 20, y + 110, { color: '#ffff00' });
  }

  const ORANGE = '#ffa040';
  const MAXED = 'rgb(255,208,32)';
  if (cur > 0) {
    if (ap < cur) {
      rect(cur, '#ff0000');
      rect(ap, ORANGE);
    }
    if (ap > cur) {
      rect(ap, '#ffffff');
      rect(cur, tb.maxed ? MAXED : ORANGE);
    }
    if (ap === cur) rect(cur, tb.maxed ? MAXED : ORANGE);
  }
  if ((state.tensionselect ?? 0) > 0) {
    const theight = y + H - (cur / maxt) * H;
    let theight2 = theight + (state.tensionselect / maxt) * H;
    let color = '#ffffff';
    let alpha = Math.abs(Math.sin(tb.tsiner / 8) * 0.5) + 0.2;
    if (theight2 > bottom) {
      theight2 = bottom;
      color = '#404040';
      alpha = 0.7;
    }
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    const y1 = Math.min(theight, theight2);
    const y2 = Math.max(theight, theight2);
    ctx.fillRect(x + 3, Math.round(y1), W - 3, Math.round(y2) - Math.round(y1) + 1);
    ctx.restore();
  }
  if (ap > 20 && ap < maxt) {
    blit(ctx, sprites, 'spr_tensionmarker', 0, x + 3, y + H - (cur / maxt) * H);
  }
  blit(ctx, sprites, 'spr_tensionbar', 0, x, y);
}

const PRESS_NAVY = [0, 0, 128];
const PRESS_CHAR = { 1: [0, 0, 255], 2: [128, 0, 128], 3: [0, 128, 0] };
const mergeWhite = (c, t) => `rgb(${c.map((v) => Math.round(v + (255 - v) * t)).join(',')})`;

export function drawAttackpress(ctx, sprites, ap) {
  const d = ap.drawn;
  if (!d) return;
  const x = ap.x;
  const y = ap.y;
  const boltspeed = 8;
  for (let i = 1; i <= 2; i += 1) {

    ctx.fillStyle = mergeWhite(PRESS_NAVY, 0);
    ctx.fillRect(x, y + 38 * i, 301, 3);
  }
  for (const [i, j, flash] of d.boxes) {
    ctx.strokeStyle = mergeWhite(PRESS_CHAR[j] ?? [255, 255, 255], flash);
    ctx.lineWidth = 1;
    ctx.strokeRect(x + 78.5, y + 38 * i + 0.5, 2 + 15 * boltspeed, 36);
    ctx.strokeRect(x + 79.5, y + 38 * i + 1.5, 15 * boltspeed, 34);
    blit(ctx, sprites, 'spr_pressfront', j - 1, x, y + 38 * i);
    blit(ctx, sprites, 'spr_pressfront_b', 0, x, y + 38 * i);
    blit(ctx, sprites, 'spr_pressspot', j - 1, x + 80, y + 38 * i);
  }
  for (const [bx, by, alpha] of d.bolts) {
    if (alpha > 0) blit(ctx, sprites, 'spr_attackspot', 0, bx, by, alpha);
  }
  if (d.fade > 0) {

    ctx.save();
    ctx.globalAlpha = Math.min(1, d.fade);
    ctx.fillStyle = '#000';
    ctx.fillRect(x - 1, y - 1, 642, 302);
    ctx.restore();
  }
}

export function resetBattleUI() {
  state2.mmy = [0, 0, 0];
}

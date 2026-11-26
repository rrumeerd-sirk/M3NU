

import { loadFont, drawText } from './font.js';

const MAINBIG = loadFont('../assets/fonts', 'fnt_mainbig');
const DOTUMCHE = loadFont('../assets/fonts', 'fnt_dotumche');

const TYPERS = {
  4: { font: MAINBIG, color: '#ffffff', hspace: 16, vspace: 28, special: 1 },
  50: { font: DOTUMCHE, color: '#000000', hspace: 9, vspace: 20, special: 0 },
};

const XCOLORS = {
  R: '#ff0000', B: '#0000ff', Y: '#ffff00', G: '#00ff00', W: '#ffffff', X: '#000000',
};

export function drawWriter(ctx, e) {
  const t = TYPERS[e.typer ?? 4];
  const s = e.mystring;
  if (!t || !s) return;
  let wx = e.x;
  let wy = e.y;
  let color = t.color;
  for (let n = 1; n < e.pos && n <= s.length; n += 1) {
    const ch = s[n - 1];
    if (ch === '&') {
      wx = e.x;
      wy += t.vspace;
      continue;
    }
    if (ch === '|') {
      wx += t.hspace;
      continue;
    }
    if (ch === '^') {
      n += 1;
      continue;
    }
    if (ch === '/' || ch === '%') continue;
    if (ch === '\\') {
      if (s[n] === 'c') color = s[n + 1] === '0' ? t.color : (XCOLORS[s[n + 1]] ?? color);
      n += 2;
      continue;
    }
    drawText(ctx, t.font, ch, wx, wy, { color, special: t.special });
    wx += t.hspace;
  }
}



import { DKBLUE as DKBLUE_RGB, DKBLUE2 as DKBLUE2_RGB, DKBLUE3 as DKBLUE3_RGB } from '../sim/jokerbg.js';

const css = ([r, g, b]) => `rgb(${r},${g},${b})`;
const DKBLUE = css(DKBLUE_RGB);
const DKBLUE2 = css(DKBLUE2_RGB);
const DKBLUE3 = DKBLUE3_RGB;

const ldx = (len, deg) => len * Math.cos((deg * Math.PI) / 180);
const ldy = (len, deg) => -len * Math.sin((deg * Math.PI) / 180);

const tintCache = new Map();
function tintedBg(img, rgb) {
  const key = rgb.join(',');
  let c = tintCache.get(key);
  if (!c) {
    c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);

    const d = g.getImageData(0, 0, c.width, c.height);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      px[i] = (px[i] * rgb[0]) / 255;
      px[i + 1] = (px[i + 1] * rgb[1]) / 255;
      px[i + 2] = (px[i + 2] * rgb[2]) / 255;
    }
    g.putImageData(d, 0, 0);
    tintCache.set(key, c);
  }
  return c;
}

export function drawJokerbg(ctx, sprites, P) {
  const entry = sprites?.get('spr_carouselbg');
  const img = entry?.frames?.[0];
  const trimax = 8;
  const xcen = 320;
  const ycen = 240;
  const radius = 360;

  if (img && P.bgalpha > 0) {
    const t = tintedBg(img, DKBLUE3);
    ctx.save();
    ctx.globalAlpha = Math.min(1, P.bgalpha);
    let curx = 0;
    let curl = P.bgx | 0;
    let curscale = 1;
    for (let i = 0; i < 16; i += 1) {
      ctx.drawImage(t, curl, 0, 5, Math.min(300, img.height), curx, -i, 5 * curscale, 300);
      curscale = Math.floor(1 + 0.5 * i);
      curl += 5;
      if (curl >= 640) curl -= 640;
      curx += 5 * curscale - 5;
    }
    for (let i = 16; i > 0; i -= 1) {
      ctx.drawImage(t, curl, 0, 5, Math.min(380, img.height), curx, -i, 5 * curscale, 380);
      let tempscale = 1 + 0.5 * i;
      if (tempscale < 1) tempscale = 1;
      curscale = Math.ceil(tempscale);
      curl += 5;
      if (curl >= 640) curl -= 640;
      curx += 5 * curscale - 5;
    }
    ctx.restore();
  }

  {
    ctx.save();
    let blackon = 0;
    const vertex = (i) => {
      let ny1 = ldy(radius / 2, P.rot + (360 / trimax) * i);
      let ny2 = ldy(radius / 2, P.rot + (360 / trimax) * (i + 1));
      if (ny1 <= 0) ny1 *= 0.6;
      if (ny2 <= 0) ny2 *= 0.6;
      const color = blackon === 0 ? DKBLUE : DKBLUE2;
      blackon = blackon === 0 ? 1 : 0;
      return {
        nx1: ldx(radius, P.rot + (360 / trimax) * i),
        nx2: ldx(radius, P.rot + (360 / trimax) * (i + 1)),
        ny1, ny2, color,
      };
    };
    const tri = (x1, y1, x2, y2, x3, y3, color) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(x3, y3);
      ctx.closePath();
      ctx.fill();
    };
    for (let i = 0; i < trimax; i += 1) {
      const v = vertex(i);
      tri(xcen, ycen, xcen + v.nx1, ycen + v.ny1, xcen + v.nx2, ycen + v.ny2, v.color);
    }
    for (let i = 0; i < 8; i += 1) {
      const v = vertex(i);
      if ((v.ny1 > 0 || v.ny2 > 0) && v.nx2 > v.nx1 - 48) {
        tri(xcen, ycen - 80, xcen + v.nx1 / 6, ycen + v.ny1 / 6, xcen + v.nx2 / 6, ycen + v.ny2 / 6, v.color);
      }
    }
    for (let i = 8; i >= 0; i -= 1) {
      const v = vertex(i);
      if (v.ny1 > 0 || v.ny2 > 0) {
        tri(xcen, ycen - 80, xcen + v.nx1 / 4, ycen + v.ny1 - 380, xcen + v.nx2 / 4, ycen + v.ny2 - 380, v.color);
      }
    }
    for (let i = 0; i < trimax; i += 1) {
      const v = vertex(i);
      tri(xcen, ycen - 320, xcen + v.nx1, ycen + v.ny1 - 320, xcen + v.nx2, ycen + v.ny2 - 320, v.color);
    }
    ctx.restore();
  }
}

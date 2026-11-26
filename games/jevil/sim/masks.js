



import { MASK_DATA as raw } from './data/masks.js';

function build(m) {
  return {
    name: m.name,
    w: m.w,
    h: m.h,
    originX: m.originX,
    originY: m.originY,
    bbox: m.bbox,

    px: m.rows.map((r) => Array.from(r, (c) => c === '1')),

    axisRect: m.axisRect === true,
  };
}


export const HEART_MASK = build(raw.heart);
export const BATTLEBG_MASK = build(raw.battlebg);




export const SPADEBULLET_MASK = build(raw.spadebullet);


export const DIAMONDBULLET_MASK = build(raw.diamondbullet);
export const HEARTBULLET_MASK = build(raw.heartbullet);
export const CLUBSBULLET_MASK = build(raw.clubsbullet);


export const SCYTHEBODY_MASK = build(raw.scythebody);


export const CLUBSBALL_A_MASK = build(raw.clubsballA);
export const CLUBSBALL_B_MASK = build(raw.clubsballB);
export const CLUBSBALL_C_MASK = build(raw.clubsballC);
export const DIAMONDBULLET_VERT_MASK = build(raw.diamondbulletVert);


export const TALLPX_MASK = build(raw.tallpx);


export const CAROUSEL_MASK = build(raw.carousel);



export const SPRITE_MASKS = {

  spr_spadebullet: SPADEBULLET_MASK,
  spr_diamondbullet: DIAMONDBULLET_MASK,
  spr_heartbullet: HEARTBULLET_MASK,
  spr_clubsbullet: CLUBSBULLET_MASK,
  spr_joker_scythebody_mask: SCYTHEBODY_MASK,
  spr_clubsball_a: CLUBSBALL_A_MASK,
  spr_clubsball_b: CLUBSBALL_B_MASK,
  spr_clubsball_c: CLUBSBALL_C_MASK,
  spr_diamondbullet_vert: DIAMONDBULLET_VERT_MASK,
  spr_tallpx: TALLPX_MASK,
  spr_carousel: CAROUSEL_MASK,
};



const probeCache = new Map();
function probeMask(n) {
  let m = probeCache.get(n);
  if (!m) {
    const side = Math.max(1, Math.round(n));
    m = build({
      name: `probe${side}`,
      w: side,
      h: side,
      originX: 0,
      originY: 0,
      bbox: [0, 0, side - 1, side - 1],
      rows: Array.from({ length: side }, () => '1'.repeat(side)),
    });
    probeCache.set(n, m);
  }
  return m;
}



function rint(x) {
  const f = Math.floor(x);
  const d = x - f;
  if (d < 0.5) return f;
  if (d > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}



export function collisionRectanglePrecise(x1, y1, x2, y2, e, mask) {
  if (!mask) return false;

  const sxs = e.image_xscale ?? 1;
  const sys = e.image_yscale ?? 1;
  const ang = e.image_angle ?? 0;
  const r = (ang * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const [bl, bt, br, bb] = mask.bbox;
  const lx0 = (bl - mask.originX) * sxs;
  const lx1 = (br + 1 - mask.originX) * sxs;
  const ly0 = (bt - mask.originY) * sys;
  const ly1 = (bb + 1 - mask.originY) * sys;
  let mnx = Infinity;
  let mxx = -Infinity;
  let mny = Infinity;
  let mxy = -Infinity;
  for (const u of [lx0, lx1]) {
    for (const v of [ly0, ly1]) {
      const wx = e.x + u * cos + v * sin;
      const wy = e.y - u * sin + v * cos;
      if (wx < mnx) mnx = wx;
      if (wx > mxx) mxx = wx;
      if (wy < mny) mny = wy;
      if (wy > mxy) mxy = wy;
    }
  }
  const ix0 = Math.max(x1, mnx);
  const ix1 = Math.min(x2, mxx);
  const iy0 = Math.max(y1, mny);
  const iy1 = Math.min(y2, mxy);
  if (ix0 > ix1 || iy0 > iy1) return false;
  const px0 = rint(ix0);
  const px1 = rint(ix1);
  const py0 = rint(iy0);
  const py1 = rint(iy1);
  const ax = rint(e.x);
  const ay = rint(e.y);
  for (let py = py0; py <= py1; py++) {
    for (let px = px0; px <= px1; px++) {
      const dx = px + 0.5 - ax;
      const dy = py + 0.5 - ay;
      const u = dx * cos - dy * sin;
      const v = dx * sin + dy * cos;
      const sx = Math.floor(u / sxs + mask.originX);
      if (sx < 0 || sx >= mask.w) continue;
      const sy = Math.floor(v / sys + mask.originY);
      if (sy < 0 || sy >= mask.h) continue;
      if (mask.px[sy][sx]) return true;
    }
  }
  return false;
}

export function scrPreciseHit(heart, e, mask, n = 3) {
  const half = n / 2;
  const hx = heart.x + 10;
  const hy = heart.y + 10;
  if (!mask) return false;
  return collisionRectanglePrecise(hx - half, hy - half, hx + half, hy + half, e, mask);
}



export function enginePairHit(heart, e, mask) {
  if (!mask) return false;
  return masksOverlap(
    HEART_MASK, heart.x, heart.y,
    mask, e.x, e.y, e.image_xscale ?? 1, e.image_yscale ?? 1, e.image_angle ?? 0,
  );
}


export function spriteMaskHit(e, heart) {

  const m = SPRITE_MASKS[e.mask_index ?? e.sprite_index];
  if (!m) return null;
  return masksOverlap(
    HEART_MASK, heart.x, heart.y,
    m, e.x, e.y, e.image_xscale, e.image_yscale, e.image_angle,
  );
}





function rintHalfEven(x) {
  const f = Math.floor(x);
  const d = x - f;
  if (d < 0.5) return f;
  if (d > 0.5) return f + 1;
  return f % 2 === 0 ? f : f + 1;
}



export function masksOverlap(maskA, ax, ay, maskB, bx, by, bsx, bsy, bangle = 0) {

  return masksOverlapRectA(maskA, ax, ay, maskB, bx, by, bsx, bsy, bangle);
}

function masksOverlapRectA(maskA, ax, ay, maskB, bx, by, bsx, bsy, bangle = 0) {

  if (bangle % 360 === 0 && bsx === 1 && bsy === 1 && !maskB.axisRect) {
    const axi = rintHalfEven(ax);
    const ayi = Math.floor(ay + 0.5);
    const bxi = rintHalfEven(bx);
    const byi = Math.floor(by + 0.5);
    const [fal, fat, far, fab] = maskA.bbox;
    const [fbl, fbt, fbr, fbb] = maskB.bbox;
    const fLeft = Math.max(axi - maskA.originX + fal, bxi - maskB.originX + fbl);
    const fRight = Math.min(axi - maskA.originX + far, bxi - maskB.originX + fbr);
    const fTop = Math.max(ayi - maskA.originY + fat, byi - maskB.originY + fbt);
    const fBottom = Math.min(ayi - maskA.originY + fab, byi - maskB.originY + fbb);
    for (let py = fTop; py <= fBottom; py++) {
      for (let px = fLeft; px <= fRight; px++) {
        if (maskA.px[py - (ayi - maskA.originY)][px - (axi - maskA.originX)]
            && maskB.px[py - (byi - maskB.originY)][px - (bxi - maskB.originX)]) {
          return true;
        }
      }
    }
    return false;
  }

  const cos = Math.cos((bangle * Math.PI) / 180);
  const sin = Math.sin((bangle * Math.PI) / 180);

  const [al, at, ar, ab] = maskA.bbox;
  const aox = maskA.originX ?? 0;
  const aoy = maskA.originY ?? 0;
  const aLeft = ax - aox + al;
  const aRight = ax - aox + ar;
  const aTop = ay - aoy + at;
  const aBottom = ay - aoy + ab;

  const [bl, bt, br, bb] = maskB.bbox;
  const x0 = (bl - maskB.originX) * bsx;
  const x1 = (br + 1 - maskB.originX) * bsx;
  const y0 = (bt - maskB.originY) * bsy;
  const y1 = (bb + 1 - maskB.originY) * bsy;
  let minx = Infinity;
  let maxx = -Infinity;
  let miny = Infinity;
  let maxy = -Infinity;
  for (const u of [x0, x1]) {
    for (const v of [y0, y1]) {
      const wx = u * cos + v * sin;
      const wy = -u * sin + v * cos;
      if (wx < minx) minx = wx;
      if (wx > maxx) maxx = wx;
      if (wy < miny) miny = wy;
      if (wy > maxy) maxy = wy;
    }
  }
  const left = Math.max(Math.ceil(aLeft), rintHalfEven(bx + minx));
  const right = Math.min(Math.floor(aRight), rintHalfEven(bx + maxx) - 1);
  const top = Math.max(Math.ceil(aTop), rintHalfEven(by + miny));
  const bottom = Math.min(Math.floor(aBottom), rintHalfEven(by + maxy) - 1);
  if (left > right || top > bottom) return false;

  for (let py = top; py <= bottom; py++) {
    for (let px = left; px <= right; px++) {
      const acx = Math.floor(px - (ax - aox));
      if (acx < 0 || acx >= maskA.w) continue;
      const acy = Math.floor(py - (ay - aoy));
      if (acy < 0 || acy >= maskA.h) continue;
      if (!maskA.px[acy][acx]) continue;


      if (maskB.axisRect) return true;
      const dx = px - bx;
      const dy = py - by;
      const u = dx * cos - dy * sin;
      const v = dx * sin + dy * cos;

      const sx = Math.floor((bsx > 0 ? u : u + 1) / bsx + maskB.originX);
      if (sx < 0 || sx >= maskB.w) continue;
      const sy = Math.floor((bsy > 0 ? v : v + 1) / bsy + maskB.originY);
      if (sy < 0 || sy >= maskB.h) continue;
      if (maskB.px[sy][sx]) return true;
    }
  }

  return false;
}

function masksOverlapPrecise(maskA, ax, ay, maskB, bx, by, bsx, bsy, bangle = 0) {

  const px = rintHalfEven(bx);
  const py = rintHalfEven(by);
  const [al, at, ar, ab] = maskA.bbox;
  const [bl, bt, br, bb] = maskB.bbox;


  const r = (bangle * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);


  const lx0 = (bl - maskB.originX) * bsx;
  const lx1 = (br + 1 - maskB.originX) * bsx;
  const ly0 = (bt - maskB.originY) * bsy;
  const ly1 = (bb + 1 - maskB.originY) * bsy;
  let minx = Infinity;
  let maxx = -Infinity;
  let miny = Infinity;
  let maxy = -Infinity;
  for (const u of [lx0, lx1]) {
    for (const v of [ly0, ly1]) {
      const wx = u * cos + v * sin;
      const wy = -u * sin + v * cos;
      if (wx < minx) minx = wx;
      if (wx > maxx) maxx = wx;
      if (wy < miny) miny = wy;
      if (wy > maxy) maxy = wy;
    }
  }
  const left = Math.floor(px + minx);
  const right = Math.ceil(px + maxx) - 1;
  const top = Math.floor(py + miny);
  const bottom = Math.ceil(py + maxy) - 1;


  const aox = maskA.originX ?? 0;
  const aoy = maskA.originY ?? 0;
  for (let cy = at; cy <= ab; cy++) {
    const rowA = maskA.px[cy];
    const wy = ay + cy - aoy;
    if (wy < top || wy > bottom) continue;
    const dy = wy - py;

    for (let cx = al; cx <= ar; cx++) {
      if (!rowA[cx]) continue;
      const wx = ax + cx - aox;
      if (wx < left || wx > right) continue;
      const dx = wx - px;

      const u = dx * cos - dy * sin;
      const v = dx * sin + dy * cos;

      const sx = Math.floor(u / bsx + maskB.originX);
      if (sx < 0 || sx >= maskB.w) continue;
      const sy = Math.floor(v / bsy + maskB.originY);
      if (sy < 0 || sy >= maskB.h) continue;

      if (maskB.px[sy][sx]) return true;
    }
  }
  return false;
}





function localBBox(meta, sx, sy) {
  const [bl, bt, br, bb] = meta.bbox;
  return {
    x0: (bl - meta.ox) * sx,

    x1: (br + 1 - meta.ox) * sx,
    y0: (bt - meta.oy) * sy,
    y1: (bb + 1 - meta.oy) * sy,
  };
}


export function rotatedRectCorners(meta, x, y, sx, sy, angleDeg) {
  const r = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(r);
  const sin = Math.sin(r);
  const b = localBBox(meta, sx, sy);
  const pts = [];
  for (const u of [b.x0, b.x1]) {
    for (const v of [b.y0, b.y1]) {

      pts.push({ x: x + u * cos + v * sin, y: y - u * sin + v * cos });
    }
  }

  return [pts[0], pts[1], pts[3], pts[2]];
}


function aabbHitsOBB(rx0, ry0, rx1, ry1, corners) {
  const axes = [
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: corners[1].x - corners[0].x, y: corners[1].y - corners[0].y },
    { x: corners[3].x - corners[0].x, y: corners[3].y - corners[0].y },
  ];
  const rect = [
    { x: rx0, y: ry0 },
    { x: rx1, y: ry0 },
    { x: rx1, y: ry1 },
    { x: rx0, y: ry1 },
  ];

  for (const a of axes) {
    const len = Math.hypot(a.x, a.y);
    if (len === 0) continue;
    const ax = a.x / len;
    const ay = a.y / len;

    let amin = Infinity;
    let amax = -Infinity;
    for (const p of rect) {
      const d = p.x * ax + p.y * ay;
      if (d < amin) amin = d;
      if (d > amax) amax = d;
    }
    let bmin = Infinity;
    let bmax = -Infinity;
    for (const p of corners) {
      const d = p.x * ax + p.y * ay;
      if (d < bmin) bmin = d;
      if (d > bmax) bmax = d;
    }
    if (amax < bmin || bmax < amin) return false;
  }
  return true;
}



export function scrPreciseHitRotatedRect(heart, e, meta, n = 3) {
  const half = n / 2;
  const hx = heart.x + 10;
  const hy = heart.y + 10;
  const corners = rotatedRectCorners(
    meta,
    e.x,
    e.y,
    e.image_xscale ?? 1,
    e.image_yscale ?? 1,
    e.image_angle ?? 0,
  );
  return aabbHitsOBB(hx - half, hy - half, hx + half, hy + half, corners);
}



export function collisionLineRect(x1, y1, x2, y2, rx0, ry0, rx1, ry1) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let t0 = 0;
  let t1 = 1;

  for (const [p, q] of [
    [-dx, x1 - rx0],
    [dx, rx1 - x1],
    [-dy, y1 - ry0],
    [dy, ry1 - y1],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
      continue;
    }
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
  }
  return true;
}


export function heartBBox(heart) {
  const [l, t, r, b] = HEART_MASK.bbox;

  return [heart.x + l, heart.y + t, heart.x + r + 1, heart.y + b + 1];
}




export const GRAZE_MASK = build({
  name: 'spr_grazemask',
  w: 50,
  h: 50,
  originX: 25,
  originY: 25,
  bbox: [0, 0, 49, 49],
  rows: Array.from({ length: 50 }, () => '1'.repeat(50)),
})

GRAZE_MASK.axisRect = true;

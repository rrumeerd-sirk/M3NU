import { sinf, cosf } from './f32trig.js';
import { sin as f64sin } from './f64trig.js';




export function gmlSin(x) {
  return f64sin(x);
}
export function gmlCos(x) {
  return cosf(Math.fround(x));
}


export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function clamp01(v) {
  return clamp(v, 0, 1);
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function sign(v) {
  return v > 0 ? 1 : v < 0 ? -1 : 0;
}


export function scrMovetowards(from, to, step) {
  if (from === to) return from;
  if (from > to) return Math.max(from - step, to);
  return Math.min(from + step, to);
}



export function scrApproach(from, to, step) {
  if (from < to) {
    from += step;
    if (from > to) return to;
  } else {
    from -= step;
    if (from < to) return to;
  }
  return from;
}

export function inverselerp(a, b, v) {
  if (b === a) return 0;
  return (v - a) / (b - a);
}


export function scrEaseIn(t, curve) {
  if (curve < -3 || curve > 7) return t;
  switch (curve) {
    case 0:
      return t;
    case 1:
      return -gmlCos(t * 1.5707963267948966) + 1;
    case 6:
      return Math.pow(2, 10 * (t - 1));
    case 7:
      return -(Math.sqrt(1 - t * t) - 1);
    case -1: {
      const s = 1.70158;
      return t * t * ((s + 1) * t - s);
    }
    default:
      return Math.pow(t, curve);
  }
}


export function scrEaseOut(t, curve) {
  if (curve < -3 || curve > 7) return t;
  switch (curve) {
    case 0:
      return t;
    case 1:
      return gmlSin(t * 1.5707963267948966);
    case 2:
      return -t * (t - 2);
    case 6:
      return -Math.pow(2, -10 * t) + 1;
    case 7: {
      const u = t - 1;
      return Math.sqrt(1 - u * u);
    }
    default: {
      const u = t - 1;
      if (curve === 4) return -1 * (Math.pow(u, curve) - 1);
      return Math.pow(u, curve) + 1;
    }
  }
}




const PI32_LD = Math.fround(Math.PI);
function snapTowardZero(v) {
  const t = Math.trunc(v);
  return Math.abs(v - t) < 1e-4 ? t + 0 : v;
}
export function lengthdirX(len, dir) {
  const r = Math.fround(Math.fround(Math.fround(dir) * PI32_LD) / 180);
  return snapTowardZero(Math.fround(Math.fround(len) * cosf(r)));
}

export function lengthdirY(len, dir) {
  const r = Math.fround(Math.fround(Math.fround(dir) * PI32_LD) / 180);
  return -snapTowardZero(Math.fround(Math.fround(len) * sinf(r)));
}



const PI32 = Math.fround(Math.PI);
export function pointDirection(x1, y1, x2, y2) {
  const f = Math.fround;
  const dx = f(f(x2) - f(x1));
  const dy = f(f(y2) - f(y1));
  const a = f(Math.atan2(f(-dy), dx));
  let d = f(f(a * 180) / PI32);
  const n = Math.round(d);
  if (Math.abs(d - n) < 1e-4) d = n;
  return d < 0 ? f(d + 360) : d;
}



export function pointDistance(x1, y1, x2, y2) {
  return Math.hypot(x2 - x1, y2 - y1);
}



export function angleDifference(a, b) {
  const f = Math.fround;
  return f(f(f(f(f(a) - f(b)) % 360) + 540) % 360) - 180;
}



export const WHITE = [255, 255, 255];
export const BLACK = [0, 0, 0];
export const RED = [255, 0, 0];
export const GRAY = [128, 128, 128];



export function mergeColor(a, b, t) {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  const ch = (i) => {
    const v = a[i] + (b[i] - a[i]) * k;
    const f = Math.floor(v);
    const d = v - f;
    if (d !== 0.5) return d < 0.5 ? f : f + 1;
    return f % 2 === 0 ? f : f + 1;
  };
  return [ch(0), ch(1), ch(2)];
}



export function scrAnglechange(current, target, limit) {
  const d = angleDifference(target, current);
  return d < -limit ? -limit : d > limit ? limit : d;
}



export const GML_EPSILON = 0.00001;
export function gmlGreater(a, b) {
  return a - b > GML_EPSILON;
}
export function gmlLess(a, b) {
  return b - a > GML_EPSILON;
}
export function gmlGreaterEq(a, b) {
  return a - b >= -GML_EPSILON;
}
export function gmlLessEq(a, b) {
  return b - a >= -GML_EPSILON;
}

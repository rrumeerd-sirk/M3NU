


const buf = new DataView(new ArrayBuffer(8));
function fromBits(hi, lo) {
  buf.setUint32(0, hi);
  buf.setUint32(4, lo);
  return buf.getFloat64(0);
}

function expOf(d) {
  buf.setFloat64(0, d);
  return (buf.getUint32(0) >>> 20) & 0x7ff;
}


const SPLIT = 134217729;
function twoProdErr(a, b, p) {
  let t = SPLIT * a;
  const ah = t - (t - a), al = a - ah;
  t = SPLIT * b;
  const bh = t - (t - b), bl = b - bh;
  return ((ah * bh - p) + ah * bl + al * bh) + al * bl;
}

function decompose(d) {
  buf.setFloat64(0, d);
  const hi = buf.getUint32(0), lo = buf.getUint32(4);
  const bexp = (hi >>> 20) & 0x7ff;
  let m = (BigInt(hi & 0xfffff) << 32n) | BigInt(lo);
  let e;
  if (bexp === 0) e = -1074;
  else { m |= 1n << 52n; e = bexp - 1075; }
  if (hi >>> 31) m = -m;
  return [m, e];
}
function bitLength(n) { return n.toString(2).length; }
function fmaSlow(a, b, c) {
  const [ma, ea] = decompose(a), [mb, eb] = decompose(b);
  let mp = ma * mb, ep = ea + eb;
  if (c === 0) {   } else {
    const [mc, ec] = decompose(c);
    const E = Math.min(ep, ec);
    mp = (mp << BigInt(ep - E)) + (mc << BigInt(ec - E));
    ep = E;
  }
  if (mp === 0n) return 0;
  const neg = mp < 0n;
  let n = neg ? -mp : mp;
  const L = bitLength(n);

  let keep = 53;
  const topExp = ep + L - 1;
  if (topExp < -1022) keep = Math.max(0, 53 - (-1022 - topExp));
  const drop = L - keep;
  if (drop > 0) {
    const D = BigInt(drop);
    const q = n >> D;
    const rem = n - (q << D);
    const half = 1n << (D - 1n);
    n = (rem > half || (rem === half && (q & 1n))) ? q + 1n : q;
    ep += drop;
  }

  let v = Number(n);
  const h = Math.trunc(ep / 2);
  v = v * 2 ** h * 2 ** (ep - h);
  return neg ? -v : v;
}
export function fma(a, b, c) {
  const p = a * b;
  if (!Number.isFinite(p) || !Number.isFinite(c)) return p + c;
  if (a === 0 || b === 0) return p + c;
  if (twoProdErr(a, b, p) === 0 && Math.abs(p) > 1e-290) return p + c;
  return fmaSlow(a, b, c);
}


const HALF = 0.5;
const ONE = 1.0;
const POINT_166 = fromBits(0x3fc55555, 0x55555555);
const TWOBYPI = fromBits(0x3fe45f30, 0x6dc9c883);
const PIBY2_1 = fromBits(0x3ff921fb, 0x54400000);
const PIBY2_1TAIL = fromBits(0x3dd0b461, 0x1a626331);
const PIBY2_2 = fromBits(0x3dd0b461, 0x1a600000);
const PIBY2_2TAIL = fromBits(0x3ba3198a, 0x2e037073);
const PIBY2_3 = fromBits(0x3ba3198a, 0x2e000000);
const PIBY2_3TAIL = fromBits(0x397b839a, 0x252049c1);

const C1 = fromBits(0x3fa55555, 0x55555555);
const C2 = fromBits(0xbf56c16c, 0x16c16967);
const C3 = fromBits(0x3efa01a0, 0x19f4ec91);
const C4 = fromBits(0xbe927e4f, 0xa17f667b);
const C5 = fromBits(0x3e21eeb6, 0x90382eec);
const C6 = fromBits(0xbda907db, 0x47258aa7);
const S1 = fromBits(0xbfc55555, 0x55555555);
const S2 = fromBits(0x3f811111, 0x11110bb3);
const S3 = fromBits(0xbf2a01a0, 0x19e83e5c);
const S4 = fromBits(0x3ec71de3, 0x796cde01);
const S5 = fromBits(0xbe5ae600, 0xb42fdfa7);
const S6 = fromBits(0x3de5e0b2, 0xf9a43bb8);


const MASK_3FE = fromBits(0x3fe921fb, 0x54442d18);
const MASK_3F2 = fromBits(0x3f200000, 0);
const MASK_3E4 = fromBits(0x3e400000, 0);
const E_5 = fromBits(0x415312d0, 0);


function reduce(ax) {
  if (!(ax < E_5)) throw new RangeError(`f64trig: |x| >= 5e6 (${ax}) needs Payne-Hanek`);
  const npi2 = Math.trunc(fma(ax, TWOBYPI, HALF)) | 0;
  const region = npi2 & 3;
  const n = npi2;
  let rhead = fma(-n, PIBY2_1, ax);
  let rtail = n * PIBY2_1TAIL;
  const expdiff = (expOf(ax) - expOf(rhead)) >>> 0;
  if (expdiff >= 15) {
    let t = rhead;
    let rt = n * PIBY2_2;
    rhead = t - rt;
    rtail = fma(n, PIBY2_2TAIL, -((t - rhead) - rt));
    if (expdiff >= 48) {
      t = rhead;
      rt = n * PIBY2_3;
      rhead = t - rt;
      rtail = fma(n, PIBY2_3TAIL, -((t - rhead) - rt));
    }
  }
  const r = rhead - rtail;
  const rr = (rhead - r) - rtail;
  return [r, rr, region];
}


function sinPoly(x2) {
  let p = fma(x2, S6, S5);
  p = fma(p, x2, S4);
  p = fma(p, x2, S3);
  p = fma(p, x2, S2);
  return p;
}


function sinPiby4(x, xx) {
  const x2 = x * x;
  const p = sinPoly(x2);
  const x3 = x * x2;
  let t = x3 * p;
  t = xx * HALF - t;
  t = t * x2;
  t = t - xx;
  t = fma(-x3, S1, t);
  return x - t;
}


function cosPiby4(x, xx) {
  const x2 = x * x;
  const r = HALF * x2;
  const t = ONE - r;
  let m = (ONE - t) - r;
  m = fma(-x, xx, m);
  const x4 = x2 * x2;
  let p = fma(x2, C6, C5);
  p = fma(p, x2, C4);
  p = fma(p, x2, C3);
  p = fma(p, x2, C2);
  p = fma(p, x2, C1);
  p = fma(x4, p, m);
  return p + t;
}

export function sin(x) {
  if (!Number.isFinite(x)) return NaN;
  const ax = Math.abs(x);

  if (ax < MASK_3FE) {
    if (ax >= MASK_3F2) {
      const x2 = x * x;
      const p = fma(sinPoly(x2), x2, S1);
      const x3 = x * x2;
      return fma(x3, p, x);
    }
    if (ax >= MASK_3E4) return fma(-((x * x) * x), POINT_166, x);
    return x;
  }
  const [r, rr, region] = reduce(ax);
  const res = region & 1 ? cosPiby4(r, rr) : sinPiby4(r, rr);
  return ((region >= 2) !== (x < 0)) ? -res : res;
}

export function cos(x) {
  if (!Number.isFinite(x)) return NaN;
  const ax = Math.abs(x);
  if (ax <= MASK_3FE) {

    if (ax >= MASK_3F2) {
      const x2 = x * x;
      let p = fma(x2, C6, C5);
      p = fma(p, x2, C4);
      p = fma(p, x2, C3);
      p = fma(p, x2, C2);
      p = fma(p, x2, C1);
      p = fma(p, x2, -HALF);
      return fma(p, x2, ONE);
    }
    if (ax >= MASK_3E4) return fma(-(HALF * x), x, ONE);
    return ONE;
  }
  const [r, rr, region] = reduce(ax);
  const res = region & 1 ? sinPiby4(r, rr) : cosPiby4(r, rr);
  return (region === 1 || region === 2) ? -res : res;
}

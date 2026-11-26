

const buf = new DataView(new ArrayBuffer(8));
function bitsHi(d) {
  buf.setFloat64(0, d);
  return buf.getUint32(0);
}
function fromBits(hi, lo) {
  buf.setUint32(0, hi);
  buf.setUint32(4, lo);
  return buf.getFloat64(0);
}

function expOf(d) {
  return (bitsHi(d) >>> 20) & 0x7ff;
}

function absBitsLE(d, hi, lo) {
  buf.setFloat64(0, d);
  const h = buf.getUint32(0) & 0x7fffffff;
  const l = buf.getUint32(4);
  return h < hi || (h === hi && l <= lo);
}
function absBitsLT(d, hi, lo) {
  buf.setFloat64(0, d);
  const h = buf.getUint32(0) & 0x7fffffff;
  const l = buf.getUint32(4);
  return h < hi || (h === hi && l < lo);
}

const TWOBYPI = fromBits(0x3fe45f30, 0x6dc9c883);
const PIBY2_1 = fromBits(0x3ff921fb, 0x54400000);
const PIBY2_1TAIL = fromBits(0x3dd0b461, 0x1a626331);
const PIBY2_2 = fromBits(0x3dd0b461, 0x1a600000);
const PIBY2_2TAIL = fromBits(0x3ba3198a, 0x2e037073);
const SIXTH = fromBits(0x3fc55555, 0x55555555);
const LIMIT = 5e6;

const SS1 = fromBits(0xbfc55555, 0x55555555);
const SS2 = fromBits(0x3f811111, 0x11111111);
const SS3 = fromBits(0xbf2a01a0, 0x1a01a01a);
const SS4 = fromBits(0x3ec71de3, 0xa556c734);
const SC0 = fromBits(0xbfe00000, 0x00000000);
const SC1 = fromBits(0x3fa55555, 0x55555555);
const SC2 = fromBits(0xbf56c16c, 0x16c16c16);
const SC3 = fromBits(0x3efa01a0, 0x1a01a019);
const SC4 = fromBits(0xbe927e4f, 0xb7789f5c);

const CS1 = fromBits(0xbfc55555, 0x55555555);
const CC1 = fromBits(0x3fa55555, 0x55555555);
const CS2 = fromBits(0x3f811111, 0x11110bb3);
const CC2 = fromBits(0xbf56c16c, 0x16c16967);
const CS3 = fromBits(0xbf2a01a0, 0x19e83e5c);
const CC3 = fromBits(0x3efa01a0, 0x19f4ec90);
const CS4 = fromBits(0x3ec71de3, 0x796cde01);
const CC4 = fromBits(0xbe927e4f, 0xa17f65f6);

function reduce(x) {
  if (x >= LIMIT) throw new Error(`f32trig: |x| ${x} needs Payne-Hanek (unported)`);
  const xexp = expOf(x);
  const npi2 = Math.trunc(x * TWOBYPI + 0.5);
  const n = npi2;
  let rhead = x - n * PIBY2_1;
  let rtail = n * PIBY2_1TAIL;
  let r = rhead - rtail;
  const e = expOf(r);
  if (xexp - e > 15) {
    const t = rhead;
    rtail = n * PIBY2_2;
    rhead = t - rtail;
    rtail = n * PIBY2_2TAIL - ((t - rhead) - rtail);
    r = rhead - rtail;
  }
  return { r, region: npi2 & 3, e };
}

function sinPolyS(x) {
  const x2 = x * x;
  const x4 = x2 * x2;
  const x3 = x * x2;
  const a = (SS4 * x2 + SS3) * x4;
  const b = SS2 * x2 + SS1;
  return x + (a + b) * x3;
}
function cosPolyS(x) {
  const x2 = x * x;
  const x4 = x2 * x2;
  const a = (SC4 * x2 + SC3) * x4;
  const b = SC2 * x2 + SC1;
  const c = SC0 * x2 + 1.0;
  return c + (a + b) * x4;
}

export function sinf(xf) {
  const x = Math.fround(xf);
  if (!Number.isFinite(x)) return NaN;
  const neg = x < 0 || Object.is(x, -0);
  const ax = Math.abs(x);
  if (absBitsLE(ax, 0x3fe921fb, 0x54442d18)) {
    if (absBitsLT(ax, 0x3f200000, 0)) return x;
    if (absBitsLT(ax, 0x3f800000, 0)) return Math.fround(x - ((x * x) * x) * SIXTH);
    return Math.fround(sinPolyS(x));
  }
  const { r, region, e } = reduce(ax);
  let z;
  if (e < 0x3f2) {
    if (e <= 0x3de) z = (region & 1) === 0 ? r : 1.0;
    else {
      const r2 = r * r;
      z = (region & 1) === 0 ? r - (SIXTH * r) * r2 : 1.0 - r2 * 0.5;
    }
  } else {
    z = (region & 1) === 0 ? sinPolyS(r) : cosPolyS(r);
  }
  if ((((region >> 1) & 1) ^ (neg ? 1 : 0)) === 1) z = 0 - z;
  return Math.fround(z);
}

export function cosf(xf) {
  const x = Math.fround(xf);
  if (!Number.isFinite(x)) return NaN;
  const ax = Math.abs(x);
  let r;
  let region;
  let small = false;
  let e = 0;
  if (absBitsLE(ax, 0x3fe921fb, 0x54442d18)) {
    r = ax;
    region = 0;
  } else {
    ({ r, region, e } = reduce(ax));
    small = e < 0x3f2;
  }
  const x2 = r * r;
  let z;
  if (small) {
    if (e <= 0x3de) z = (region & 1) ? r : 1.0;
    else z = (region & 1) ? r - (SIXTH * r) * x2 : 1.0 - x2 * 0.5;
  } else if (region & 1) {
    const x4 = x2 * x2;
    const a = (CS4 * x2 + CS3) * x4;
    const b = CS2 * x2 + CS1;
    z = (a + b) * (x2 * r) + r;
  } else {
    const x4 = x2 * x2;
    const a = (CC4 * x2 + CC3) * x4;
    const b = CC2 * x2 + CC1;
    z = (a + b) * x4 - (0.5 * x2 - 1.0);
  }
  if ((region + 1) & 2) z = 0 - z;
  return Math.fround(z);
}

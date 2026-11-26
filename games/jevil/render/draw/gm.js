



export const ldx = (len, deg) => len * Math.cos((deg * Math.PI) / 180);

export const ldy = (len, deg) => -len * Math.sin((deg * Math.PI) / 180);

export const c_white = [255, 255, 255];
export const c_gray = [128, 128, 128];
export const c_red = [255, 0, 0];
export const c_black = [0, 0, 0];


export function mergeColor(a, b, t) {
  const k = Math.max(0, Math.min(1, t));
  return [
    Math.round(a[0] + (b[0] - a[0]) * k),
    Math.round(a[1] + (b[1] - a[1]) * k),
    Math.round(a[2] + (b[2] - a[2]) * k),
  ];
}

export const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;



const tintCache = new Map();
export function tinted(img, color) {
  if (!img) return null;

  if (!Array.isArray(color)) {
    throw new TypeError(
      `tinted() needs an [r,g,b] array, got ${JSON.stringify(color)}`,
    );
  }

  const key = img.src ? `${img.src}|${color[0]},${color[1]},${color[2]}` : null;
  if (key) {
    const hit = tintCache.get(key);
    if (hit) return hit;
  }
  let c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(img, 0, 0);

  g.globalCompositeOperation = 'multiply';
  g.fillStyle = rgb(color);
  g.fillRect(0, 0, c.width, c.height);

  g.globalCompositeOperation = 'destination-in';
  g.drawImage(img, 0, 0);
  if (key) tintCache.set(key, c);
  return c;
}





export function fogged(img, color) {
  if (!img) return null;
  if (!Array.isArray(color)) {
    throw new TypeError(`fogged() needs an [r,g,b] array, got ${JSON.stringify(color)}`);
  }
  const key = img.src ? `fog|${img.src}|${color[0]},${color[1]},${color[2]}` : null;
  if (key) {
    const hit = tintCache.get(key);
    if (hit) return hit;
  }
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.fillStyle = rgb(color);
  g.fillRect(0, 0, c.width, c.height);
  g.globalCompositeOperation = 'destination-in';
  g.drawImage(img, 0, 0);
  if (key) tintCache.set(key, c);
  return c;
}

export function drawSpriteExt(ctx, entry, sub, x, y, xs, ys, angleDeg, color, alpha, fog = false) {
  if (!entry || !entry.frames.length) return;
  const img = entry.frames[((sub | 0) % entry.frames.length + entry.frames.length) % entry.frames.length];
  if (!img) return;
  const src = color ? (fog ? fogged(img, color) : tinted(img, color)) : img;
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.translate(x, y);
  if (angleDeg) ctx.rotate((-angleDeg * Math.PI) / 180);
  ctx.scale(xs, ys);
  ctx.drawImage(src, -(entry.meta.ox ?? 0), -(entry.meta.oy ?? 0));
  ctx.restore();
}



export function drawBeamColor(ctx, x, y, length, width, angle, color, alpha, circle = false) {
  const e1x = x + ldx(length, angle + width / 2);
  const e1y = y + ldy(length, angle + width / 2);
  const e2x = x + ldx(length, angle - width / 2);
  const e2y = y + ldy(length, angle - width / 2);

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  if (circle) {
    ctx.fillStyle = rgb(color);
    ctx.beginPath();
    ctx.arc(x + ldx(length, angle), y + ldy(length, angle), width / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const g = ctx.createLinearGradient(x, y, x + ldx(length, angle), y + ldy(length, angle));
  g.addColorStop(0, rgb(color));
  g.addColorStop(1, 'rgb(0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(e1x, e1y);
  ctx.lineTo(e2x, e2y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}



export function drawOutline(ctx, entry, e, dist, color, alpha) {
  let xA = dist;
  let xB = 0;
  let yA = 0;
  let yB = dist;
  if (e.image_angle % 90 !== 0) {
    xA = ldx(dist, e.image_angle);
    xB = ldx(dist, e.image_angle + 90);
    yA = ldy(dist, e.image_angle + 90);
    yB = ldy(dist, e.image_angle);
  }
  const a = e.image_alpha * alpha;
  for (const [dx, dy] of [[xA, yA], [-xA, -yA], [xB, yB], [-xB, -yB]]) {
    drawSpriteExt(ctx, entry, e.image_index, e.x + dx, e.y + dy,
      e.image_xscale, e.image_yscale, e.image_angle, color, a);
  }
}


export function pingpong(v, n) {
  if (n === 0) return v;
  const m = ((v % (n * 2)) + n * 2) % (n * 2);
  return m > n ? n * 2 - m : m;
}

export const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);



export function drawGrowtangle(ctx, e, sprites, fallbackName) {

  const entry = sprites.get(e.sprite_index ?? fallbackName);
  if (!entry || entry.frames.length < 2) return false;
  drawSpriteExt(ctx, entry, 1, e.x, e.y,
    e.image_xscale, e.image_yscale, e.image_angle, e.image_blend, e.image_alpha);
  return false;
}

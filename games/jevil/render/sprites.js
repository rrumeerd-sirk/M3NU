



const BASE = new URL('../assets/sprites/', import.meta.url).href;



export const SPRITE_FOR = {
  obj_heart: 'spr_dodgeheart',
  obj_growtangle: 'spr_battlebg_0',
  obj_joker: 'spr_joker_main',
  obj_herokris: 'spr_krisb_idle',
  obj_herosusie: 'spr_susieb_idle',
  obj_heroralsei: 'spr_ralseib_idle',
  obj_laserscythe: 'spr_joker_scythebody',
  obj_joker_teleport: 'spr_joker_teleport',
};



export const DRAW_ALIAS = {
  spr_dodgeheartmask: 'spr_dodgeheart',
  spr_joker_scythebody_mask: 'spr_joker_scythebody',
  spr_battlebg_stretch_hitbox: 'spr_battlebg_0',
};

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);

    img.onerror = () => resolve(null);
    img.src = src;
  });
}



export async function loadSprites(base = BASE) {
  const res = await fetch(base + 'manifest.json');
  if (!res.ok) throw new Error(`sprite manifest not found at ${base}manifest.json`);
  const manifest = await res.json();

  const out = new Map();
  const jobs = Object.entries(manifest).map(async ([name, meta]) => {
    const frames = await Promise.all(meta.files.map((f) => loadImage(base + f)));
    out.set(name, { meta, frames: frames.filter(Boolean) });
  });
  await Promise.all(jobs);
  return out;
}


export function spriteFor(sprites, e) {
  let name = e.sprite_index ?? SPRITE_FOR[e.type?.name];
  if (!name) return null;
  name = DRAW_ALIAS[name] ?? name;
  return sprites.get(name) ?? null;
}

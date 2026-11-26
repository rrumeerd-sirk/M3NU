import { loadFont, drawText, textWidth } from './gm-font.js';
import { drawWingdings, wingdingsWidth, wingdingsHeight } from './wingdings.js';

const VIEW_W = 640, VIEW_H = 480;
const MS_PER_FRAME = 1000 / 30;
const SCALE = 2;


const BG_ORIGIN_X = 5, BG_ORIGIN_Y = 5;
const BG_OFFSET_X = -BG_ORIGIN_X * 2, BG_OFFSET_Y = -BG_ORIGIN_Y * 2;


const SCREEN_X = 128, SCREEN_Y = 32, SCREEN_W = 384, SCREEN_H = 288;
export const SCREEN = { x: SCREEN_X, y: SCREEN_Y, w: SCREEN_W, h: SCREEN_H };

const BWSPEED = 3;
const KRIS_W = 19 * SCALE, KRIS_H = 38 * SCALE;


const CONSOLE_SPOT_X = 300, CONSOLE_SPOT_Y = 298;
const ENTRY_X = 576;


const BOOT_BLUE = '#2F38B0';

const BOARD_BLUE = '#2F38B0';



const DEVICES = [
  { name: 'DELTARUNE WEB BATTLES', href: null, ready: true, submenu: 'deltarune' },
  { name: 'ADOFAI 2014 BACKUP', href: 'games/adofai/', ready: true },
  { name: 'BEATBLOCK WEB-PORT', href: 'games/bb-web/', ready: true },
  { name: 'DELTARUNE WEB-PORT', href: 'games/dr-web/', ready: true },
  { name: 'MUSIC PLAYER (W.I.P)', href: 'games/music/', ready: true },
  { name: 'UNDERTALE WEB-PORT', href: 'games/ut-web/', ready: true },
  { name: 'WINDOWS 11 IN BROWSER', href: 'games/win11/', ready: true },
];

const DELTARUNE_GAMES = [
  { name: 'JEVIL', href: 'games/jevil/', ready: true },
  { name: 'KNIGHT (W.I.P)', href: 'games/knight/?mode=normal', ready: true },
  { name: 'KNIGHT (PRACTICE)', href: 'games/knight/?mode=practice', ready: true },
  { name: 'KNIGHT (SINGLE ATTACK)', href: null, ready: true, submenu: 'attack' },
];

const ATTACKS = [
  { id: 'stars', name: 'STARS' },
  { id: 'tracking11', name: 'TRACKING SWORDS' },
  { id: 'flurry', name: 'FLURRY (BOX SPLITTER)' },
  { id: 'tunnel', name: 'SWORD TUNNEL' },
  { id: 'vortex', name: 'SWORD VORTEX + TRACKING' },
  { id: 'tracking14', name: 'TRACKING SWORDS (LATE)' },
  { id: 'roaring', name: 'ROARING' },
  { id: 'stream', name: 'X ATTACKS (STREAM)' },
  { id: 'swordfall', name: 'SWORDS FALLING' },
  { id: 'underbox', name: 'ORBS UNDER tHE BOX' },
  { id: 'knightlines', name: 'KNIGHTLINES (SPEARS)' },
  { id: 'swordslash', name: 'SWORDSLASH (CRESCENTS)' },
  { id: 'tunnel2', name: 'SWORD TUNNEL (REVISED)' },
  { id: 'combination', name: 'COMBINATION' },
  { id: 'diagonal', name: 'DIAGONAL BULLETS' },
  { id: 'rotating16', name: 'ROTATING + TRACKING' },
  { id: 'tracking17', name: 'TRACKING SWORDS (MULTI)' },
];

const FACE_DOWN = 0, FACE_RIGHT = 1, FACE_UP = 2, FACE_LEFT = 3;
const FACE_KEY = ['d', 'r', 'u', 'l'];

function loadImage(src) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error(`${src} missing`));
    i.src = src;
  });
}

export async function runRoom(canvas, opts = {}) {
  const base = opts.base ?? 'assets/room/';
  const ctx = canvas.getContext('2d');
  canvas.width = VIEW_W;
  canvas.height = VIEW_H;
  ctx.imageSmoothingEnabled = false;


  const boardFont = await loadFont(opts.mantleBase ?? 'assets/mantle/', 'fnt_8bit');


  const tvBar = await loadImage(`${opts.tvBase ?? 'assets/tv/'}bar.png`).catch(() => null);
  const tvDot = await loadImage(`${opts.tvBase ?? 'assets/tv/'}dot.png`).catch(() => null);

  // Load hat sprites (ralsei with hat)
  const hatDir = `${base}hat/`;
  const hatWalk = {
    d: await Promise.all([0,1,2,3].map(f => loadImage(`${hatDir}spr_ralseid_${f}.png`))),
    r: await Promise.all([0,1,2,3].map(f => loadImage(`${hatDir}spr_ralseir_${f}.png`))),
    u: await Promise.all([0,1,2,3].map(f => loadImage(`${hatDir}spr_ralseiu_${f}.png`))),
    l: await Promise.all([0,1,2,3].map(f => loadImage(`${hatDir}spr_ralseil_${f}.png`))),
  };

  // Load no-hat sprites (ralsei without hat)
  const noHatDir = `${base}no-hat/`;
  const noHatWalk = {
    d: await Promise.all([0,1,2,3].map(f => loadImage(`${noHatDir}spr_ralsei_walk_down_sad_subtle_${f}.png`))),
    r: await Promise.all([0,1,2,3].map(f => loadImage(`${noHatDir}spr_ralsei_walk_right_sad_subtle_${f}.png`))),
    u: await Promise.all([0,1,2,3].map(f => loadImage(`${noHatDir}spr_ralsei_walk_up_sad_subtle_${f}.png`))),
    l: await Promise.all([0,1,2,3].map(f => loadImage(`${noHatDir}spr_ralsei_walk_left_sad_subtle_${f}.png`))),
  };

  // Load kris walk sprites
  const krisDir = `${base}kris/`;
  const krisWalk = {
    d: await Promise.all([0,1,2,3].map(f => loadImage(`${krisDir}down_${f}.png`))),
    r: await Promise.all([0,1,2,3].map(f => loadImage(`${krisDir}right_${f}.png`))),
    u: await Promise.all([0,1,2,3].map(f => loadImage(`${krisDir}up_${f}.png`))),
    l: await Promise.all([0,1,2,3].map(f => loadImage(`${krisDir}left_${f}.png`))),
  };

  // Load susie walk sprites
  const susieDir = `${base}susie/`;
  const susieWalk = {
    d: await Promise.all([0,1,2,3].map(f => loadImage(`${susieDir}down_${f}.png`))),
    r: await Promise.all([0,1,2,3].map(f => loadImage(`${susieDir}right_${f}.png`))),
    u: await Promise.all([0,1,2,3].map(f => loadImage(`${susieDir}up_${f}.png`))),
    l: await Promise.all([0,1,2,3].map(f => loadImage(`${susieDir}left_${f}.png`))),
  };

  const [bg, consoleImg, tvglow, krisHold, ...statics] = await Promise.all([
    loadImage(`${base}bg.png`),
    loadImage(`${base}console.png`),
    loadImage(`${base}tvglow.png`),

    loadImage(`${base}vessel_hold.png`),
    ...[0, 1, 2, 3, 4, 5, 6, 7].map((f) => loadImage(`${base}static_${f}.png`)),
  ]);


  const soundOn = opts.soundOn !== false;
  const nocontroller = new Audio(`${base}nocontroller.wav`);
  const tvstatic = new Audio(`${base}tvstatic.wav`);
  nocontroller.volume = 0.4; tvstatic.volume = 0.35;

  const tvPowerOn = new Audio(`${base}snd_tv_poweron2.wav`);
  const nesIntro = new Audio(`${base}snd_nes_intro.wav`);
  tvPowerOn.volume = 0.45; nesIntro.volume = 0.45;

  const menuMove = new Audio(`${base}snd_menumove.wav`);
  const menuSelect = new Audio(`${base}snd_select.wav`);
  menuMove.volume = 0.5; menuSelect.volume = 0.5;

  const tvBase = opts.tvBase ?? 'assets/tv/';
  const sndTvOff = new Audio(`${tvBase}tvturnoff.wav`);
  const sndTvOff2 = new Audio(`${tvBase}tvturnoff2.wav`);
  sndTvOff.volume = 0.5; sndTvOff2.volume = 0.5;
  const play = (a) => { if (soundOn) { a.currentTime = 0; a.play().catch(() => {}); } };
  const stop = (a) => { a.pause(); a.currentTime = 0; };


  const held = new Set();
  const pressed = new Set();
  const KEYMAP = {
    arrowup: 'u', arrowdown: 'd', arrowleft: 'l', arrowright: 'r',
    w: 'u', s: 'd', a: 'l', d: 'r', z: 'z', enter: 'z', x: 'x', shift: 'x',
    m: 'm',
    n: 'n',
  };
  const onKey = (e) => {
    const k = KEYMAP[e.key.toLowerCase()];
    if (!k) return;
    e.preventDefault();

    // Cycle character with M key (ralsei+hat -> ralsei no-hat -> kris -> susie -> ralsei+hat)
    if (k === 'm') {
      if (kris.character === 'ralsei' && kris.hat) {
        kris.hat = false;  // ralsei with hat -> ralsei no hat
      } else if (kris.character === 'ralsei' && !kris.hat) {
        kris.character = 'kris';  // ralsei no hat -> kris
      } else if (kris.character === 'kris') {
        kris.character = 'susie';  // kris -> susie
      } else {
        kris.character = 'ralsei';  // susie -> ralsei with hat
        kris.hat = true;
      }
      return;
    }


    if (screenState === 'device') {
      if (k === 'u') { deviceSel = (deviceSel + DEVICES.length - 1) % DEVICES.length; play(menuMove); }
      if (k === 'd') { deviceSel = (deviceSel + 1) % DEVICES.length; play(menuMove); }
      if (k === 'z') {
        const d = DEVICES[deviceSel];
        if (d.ready) {
          if (d.submenu === 'attack') {
            play(menuSelect);
            startAttackSelect();
          } else if (d.submenu === 'deltarune') {
            play(menuSelect);
            startDeltaruneSelect();
          } else {
            play(menuSelect); startLaunch(d.href);
          }
        } else { play(menuMove); notBuilt = 90; }
      }
      return;
    }

    if (!held.has(k)) pressed.add(k);
    held.add(k);
  };
  const onKeyUp = (e) => {
    const k = KEYMAP[e.key.toLowerCase()];
    if (k) held.delete(k);
  };
  window.addEventListener('keydown', onKey);
  window.addEventListener('keyup', onKeyUp);


  const kris = {
    x: ENTRY_X, y: CONSOLE_SPOT_Y,
    facing: FACE_LEFT,
    imageIndex: 0,
    runtimer: 0,
    frozen: false,
    holding: false,
    hat: true,  // true = hat, false = no-hat
    character: 'ralsei',  // 'ralsei', 'kris', 'susie'
  };


  const WALK = { x1: 110, x2: 620, y1: 250, y2: 340 };



  const SOLIDS = [

    { x: 270, y: 336, w: 100, h: 18 },
  ];



  const FEET = { inset: 8, height: 12 };
  const feetBox = (x, y) => ({
    x: x + FEET.inset,
    y: y + KRIS_H - FEET.height,
    w: KRIS_W - FEET.inset * 2,
    h: FEET.height,
  });

  const meets = (x, y) => {
    const f = feetBox(x, y);
    if (x < WALK.x1 || x + KRIS_W > WALK.x2 || y < WALK.y1 || y > WALK.y2) return true;
    return SOLIDS.some((s) =>
      f.x < s.x + s.w && f.x + f.w > s.x && f.y < s.y + s.h && f.y + f.h > s.y);
  };



  let con = 'idle';
  let timer = 0;

  let suspended = false;

  let deviceSel = 0;
  let attackSel = 0;
  let deltaruneSel = 0;
  let plugged = false;
  let notBuilt = 0;



  let launch = null;

  function startLaunch(href) {
    if (launch) return;
    if (opts.onLaunch) opts.onLaunch(href);
    else location.href = href;
  }

  function startAttackSelect() {
    screenState = 'attack';
    attackSel = 0;
  }

  function startDeltaruneSelect() {
    screenState = 'deltarune';
    deltaruneSel = 0;
  }

  const LAUNCH_DOT = 10;
  const LAUNCH_LINE = 12;
  const LAUNCH_OPEN = 10;
  const LAUNCH_TOTAL = LAUNCH_DOT + LAUNCH_LINE + LAUNCH_OPEN + 6;

  function stepLaunch() {
    if (!launch) return;
    launch.t += 1;
    if (launch.t === LAUNCH_DOT) play(sndTvOff);

    if (launch.t >= LAUNCH_TOTAL && !launch.gone) {
      launch.gone = true;
      if (opts.onLaunch) opts.onLaunch(launch.href);
      else location.href = launch.href;
    }
  }


  function drawLaunch() {
    if (!launch) return;
    const t = launch.t;
    const cx = VIEW_W / 2, cy = VIEW_H / 2;
    const ease = (a, b, k) => a + (b - a) * Math.min(1, Math.max(0, k));


    if (tvDot && t < LAUNCH_DOT + LAUNCH_LINE) {
      const k = t / LAUNCH_DOT;
      const sc = k <= 1 ? ease(0, 0.4, k) : ease(0.4, 0, (t - LAUNCH_DOT) / LAUNCH_LINE);
      if (sc > 0) {
        ctx.drawImage(tvDot, cx - (tvDot.width * sc) / 2, cy - (tvDot.height * sc) / 2,
          tvDot.width * sc, tvDot.height * sc);
      }
    }


    if (tvBar && t >= LAUNCH_DOT) {
      const wk = Math.min(1, (t - LAUNCH_DOT) / LAUNCH_LINE);
      const hk = Math.max(0, (t - LAUNCH_DOT - LAUNCH_LINE) / LAUNCH_OPEN);
      const xs = ease(0, 6, wk);
      const ys = ease(0.05, 10, hk);
      const w = tvBar.width * xs, h = tvBar.height * ys;
      ctx.drawImage(tvBar, cx - w / 2, cy - h / 2, w, h);
    }


    if (t >= LAUNCH_DOT + LAUNCH_LINE + LAUNCH_OPEN) {
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }
  }
  let screenState = 'nocontroller';
  let staticTimer = 0;
  let onBooted = opts.onBooted ?? (() => {});
  let booted = false;



  function atConsole() {
    const cx = kris.x + KRIS_W / 2;
    return cx > 170 && cx < 440 && kris.facing === FACE_UP;
  }

  function stepKris() {
    if (kris.frozen || suspended) return;

    const pr = held.has('r') ? 1 : 0, pl = held.has('l') ? 1 : 0;
    const pd = held.has('d') ? 1 : 0, pu = held.has('u') ? 1 : 0;


    const running = held.has('x');
    if (running && (pr || pl || pd || pu)) kris.runtimer += 1; else kris.runtimer = 0;
    let wspeed = BWSPEED + 5;  // Default: fast (auto-sprint)
    if (running) {
      wspeed = BWSPEED;  // X held = slow
    }

    let px = 0, py = 0, pressdir = -1;
    if (pr) { px = wspeed; pressdir = FACE_RIGHT; }
    if (pl) { px = -wspeed; pressdir = FACE_LEFT; }
    if (pd) { py = wspeed; pressdir = FACE_DOWN; }
    if (pu) { py = -wspeed; pressdir = FACE_UP; }
    if (pressdir !== -1) kris.facing = pressdir;

    if (px && meets(kris.x + px, kris.y)) px = 0;
    if (py && meets(kris.x, kris.y + py)) py = 0;
    kris.x += px;
    kris.y += py;


    if (px || py) kris.imageIndex += 0.25; else kris.imageIndex = 0;
  }

  function stepConsole() {

    if (con === 'idle') {
      if (pressed.has('z') && atConsole()) {
        pressed.clear();
        plugged = true;
        kris.frozen = true;
        kris.holding = true;
        kris.x = CONSOLE_SPOT_X;
        kris.y = CONSOLE_SPOT_Y;
        kris.facing = FACE_UP;
        con = 'static';
        timer = 0;
        stop(nocontroller);
        play(tvPowerOn);
        play(tvstatic);
        screenState = 'static';
      }
      return;
    }

    // Handle attack selection screen
    if (screenState === 'attack') {
      const list = ATTACKS;
      if (pressed.has('u')) { attackSel = (attackSel + list.length - 1) % list.length; play(menuMove); }
      if (pressed.has('d')) { attackSel = (attackSel + 1) % list.length; play(menuMove); }
      if (pressed.has('z')) {
        const a = list[attackSel];
        play(menuSelect);
        startLaunch('games/knight/?mode=single&attack=' + a.id);
      }
      if (pressed.has('x')) {
        screenState = 'device';
        play(menuMove);
      }
      pressed.clear();
      return;
    }

    // Handle deltarune selection screen
    if (screenState === 'deltarune') {
      const list = DELTARUNE_GAMES;
      if (pressed.has('u')) { deltaruneSel = (deltaruneSel + list.length - 1) % list.length; play(menuMove); }
      if (pressed.has('d')) { deltaruneSel = (deltaruneSel + 1) % list.length; play(menuMove); }
      if (pressed.has('z')) {
        const d = list[deltaruneSel];
        if (d.ready) {
          if (d.submenu === 'attack') {
            play(menuSelect);
            startAttackSelect();
          } else {
            play(menuSelect); startLaunch(d.href);
          }
        } else { play(menuMove); notBuilt = 90; }
      }
      if (pressed.has('x')) {
        screenState = 'device';
        play(menuMove);
      }
      pressed.clear();
      return;
    }

    timer += 1;


    if (con === 'static' && timer >= 24) {
      stop(tvstatic);
      play(nesIntro);
      con = 'blue';
      timer = 0;
      screenState = 'blue';
    }

    if (con === 'blue' && timer >= 30 && !booted) {
      booted = true;
      con = 'device';
      screenState = 'device';
      onBooted();
    }
  }


  function drawScreen() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H);
    ctx.clip();

    if (screenState === 'nocontroller') {
      ctx.fillStyle = BOOT_BLUE;
      ctx.fillRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO CONTROLLER', SCREEN_X + SCREEN_W / 2, SCREEN_Y + SCREEN_H / 2);
    } else if (screenState === 'static') {

      staticTimer += 0.5;
      const f = statics[Math.floor(staticTimer) % statics.length];
      ctx.fillStyle = '#000';
      ctx.fillRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H);
      for (let y = SCREEN_Y; y < SCREEN_Y + SCREEN_H; y += 128 * SCALE) {
        for (let x = SCREEN_X; x < SCREEN_X + SCREEN_W; x += 128 * SCALE) {
          ctx.globalAlpha = 0.85;
          ctx.drawImage(f, x, y, 128 * SCALE, 128 * SCALE);
        }
      }
      ctx.globalAlpha = 1;
    } else if (screenState === 'blue') {
      ctx.fillStyle = BOOT_BLUE;
      ctx.fillRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H);
    } else if (screenState === 'device') {

      ctx.fillStyle = BOARD_BLUE;
      ctx.fillRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H);

      const cx = SCREEN_X + SCREEN_W / 2;
      const ADV = 16;
      const GLYPH_SCALE = 1;
      const FONT_H = 20;
      const lineH = 34;

      const widthOf = (d) => (d.ready ? textWidth(boardFont, d.name)
                                      : wingdingsWidth(d.name, ADV));
      const maxW = Math.max(...DEVICES.map(widthOf));


      const listH = DEVICES.length * lineH;
      const pad = 26;
      const room = SCREEN_H - pad * 2;
      let scroll = 0;
      if (listH > room) {
        const want = deviceSel * lineH + lineH / 2 - room / 2;
        scroll = Math.max(0, Math.min(listH - room, want));
      }
      const top = SCREEN_Y + (listH > room ? pad : Math.round((SCREEN_H - listH) / 2)) - scroll;

      ctx.save();
      ctx.beginPath();
      ctx.rect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H);
      ctx.clip();

      DEVICES.forEach((d, i) => {
        const y = top + i * lineH;
        if (y + lineH < SCREEN_Y || y > SCREEN_Y + SCREEN_H) return;
        const chosen = i === deviceSel;
        const colour = chosen ? '#ffff00'
          : (d.ready ? '#ffffff' : 'rgba(255,255,255,0.66)');
        const x = Math.round(cx - widthOf(d) / 2);


        if (d.ready) {
          drawText(ctx, boardFont, d.name, x, y, { color: colour });
        } else {
          const dy = Math.round((FONT_H - wingdingsHeight(GLYPH_SCALE)) / 2);
          drawWingdings(ctx, d.name, x, y + dy,
            { scale: GLYPH_SCALE, advance: ADV, color: colour });
        }


      });
      ctx.restore();
    } else if (screenState === 'attack') {
      // Draw attack selection screen
      ctx.fillStyle = BOARD_BLUE;
      ctx.fillRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H);

      const cx2 = SCREEN_X + SCREEN_W / 2;
      const FONT_H2 = 20;
      const lineH2 = 28;
      const pad2 = 20;

      const list = ATTACKS;
      const listH2 = list.length * lineH2;
      const room2 = SCREEN_H - pad2 * 2 - 30;
      let scroll2 = 0;
      if (listH2 > room2) {
        const want = attackSel * lineH2 + lineH2 / 2 - room2 / 2;
        scroll2 = Math.max(0, Math.min(listH2 - room2, want));
      }
      const top2 = SCREEN_Y + pad2 + 30 - scroll2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H);
      ctx.clip();

      list.forEach((a, i) => {
        const y = top2 + i * lineH2;
        if (y + lineH2 < SCREEN_Y || y > SCREEN_Y + SCREEN_H) return;
        const chosen = i === attackSel;
        const colour = chosen ? '#ffff00' : '#ffffff';
        const w = textWidth(boardFont, a.name);
        const x = Math.round(cx2 - w / 2);

        drawText(ctx, boardFont, a.name, x, y, { color: colour });

      });
      ctx.restore();

      // Hint
      ctx.font = '14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('Z: Select  X: Back', cx2, SCREEN_Y + SCREEN_H - 15);
    } else if (screenState === 'deltarune') {
      // Draw deltarune selection screen
      ctx.fillStyle = BOARD_BLUE;
      ctx.fillRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H);

      const cx2 = SCREEN_X + SCREEN_W / 2;
      const FONT_H2 = 20;
      const lineH2 = 34;
      const pad2 = 20;

      const list = DELTARUNE_GAMES;
      const listH2 = list.length * lineH2;
      const room2 = SCREEN_H - pad2 * 2 - 30;
      let scroll2 = 0;
      if (listH2 > room2) {
        const want = deltaruneSel * lineH2 + lineH2 / 2 - room2 / 2;
        scroll2 = Math.max(0, Math.min(listH2 - room2, want));
      }
      const top2 = SCREEN_Y + pad2 + 30 - scroll2;

      ctx.save();
      ctx.beginPath();
      ctx.rect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H);
      ctx.clip();

      list.forEach((d, i) => {
        const y = top2 + i * lineH2;
        if (y + lineH2 < SCREEN_Y || y > SCREEN_Y + SCREEN_H) return;
        const chosen = i === deltaruneSel;
        const colour = chosen ? '#ffff00'
          : (d.ready ? '#ffffff' : 'rgba(255,255,255,0.66)');
        const w = textWidth(boardFont, d.name);
        const x = Math.round(cx2 - w / 2);

        drawText(ctx, boardFont, d.name, x, y, { color: colour });

      });
      ctx.restore();

      // Hint
      ctx.font = '14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.fillText('Z: Select  X: Back', cx2, SCREEN_Y + SCREEN_H - 15);
    }

    const vg = ctx.createRadialGradient(
      SCREEN_X + SCREEN_W / 2, SCREEN_Y + SCREEN_H / 2, SCREEN_W * 0.18,
      SCREEN_X + SCREEN_W / 2, SCREEN_Y + SCREEN_H / 2, SCREEN_W * 0.72);
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(0.62, 'rgba(0,0,16,0.20)');
    vg.addColorStop(1, 'rgba(0,0,12,0.52)');
    ctx.fillStyle = vg;
    ctx.fillRect(SCREEN_X, SCREEN_Y, SCREEN_W, SCREEN_H);

    ctx.restore();
  }

  function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);


    drawScreen();
    ctx.drawImage(bg, BG_OFFSET_X, BG_OFFSET_Y, bg.width * SCALE, bg.height * SCALE);


    if (screenState !== 'off') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = screenState === 'static' ? 0.25 : 0.5;
      ctx.drawImage(tvglow, 0, 320, tvglow.width * SCALE, tvglow.height * SCALE);
      ctx.restore();
    }

    ctx.drawImage(consoleImg, 202, 322, consoleImg.width * SCALE, consoleImg.height * SCALE);

    let sprite;
    if (kris.holding) {
      sprite = krisHold;
    } else {
      let walkSet;
      if (kris.character === 'ralsei') {
        walkSet = kris.hat ? hatWalk : noHatWalk;
      } else if (kris.character === 'kris') {
        walkSet = krisWalk;
      } else { // susie
        walkSet = susieWalk;
      }
      const dir = FACE_KEY[kris.facing];
      sprite = walkSet[dir][Math.floor(kris.imageIndex) % 4];
    }
    ctx.drawImage(sprite, Math.round(kris.x), Math.round(kris.y), KRIS_W, KRIS_H);


    if (screenState === 'device' && notBuilt > 0) {
      const line = 'NOT BUILT';
      const w = textWidth(boardFont, line);
      drawText(ctx, boardFont, line,
        Math.round(SCREEN_X + SCREEN_W / 2 - w / 2), SCREEN_Y + SCREEN_H - 34,
        { color: '#ffff00' });
    }

    drawLaunch();


  }


  let raf = 0, acc = 0, last = performance.now();
  function frame(now) {
    acc += now - last;
    last = now;

    if (acc > MS_PER_FRAME * 4) acc = MS_PER_FRAME;
    let guard = 0;
    while (acc >= MS_PER_FRAME && guard++ < 8) {
      acc -= MS_PER_FRAME;
      stepKris();
      stepConsole();
      stepLaunch();
      if (notBuilt > 0) notBuilt -= 1;
      pressed.clear();
    }
    draw();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);


  if (opts.alreadyBooted) {
    plugged = true;
    kris.holding = true;
    kris.frozen = false;
    kris.x = CONSOLE_SPOT_X;
    kris.y = CONSOLE_SPOT_Y;
    kris.facing = FACE_UP;
    con = 'device';
    screenState = 'device';
    booted = true;
    setTimeout(() => onBooted(), 0);
  } else {

    play(nocontroller);
  }

  window.__room = {
    get kris() { return kris; },
    get con() { return con; },
    get screen() { return screenState; },
    get plugged() { return plugged; },
    atConsole,
    get deviceSel() { return deviceSel; },
    get launch() { return launch; },
    startLaunch,
    suspend(v = true) { suspended = v; },
    press: (k, on = true) => { if (on) { held.add(k); pressed.add(k); } else held.delete(k); },
    stop() {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onKeyUp);
      stop(nocontroller); stop(tvstatic);
    },
  };
  return window.__room;
}



import { createState, stepFrame } from '../sim/index.js';
import { createRecorder, recordInput, encodeReplay, decodeReplay } from '../sim/replay.js';
import { drain } from '../sim/clock.js';
import { ATTACKS } from '../sim/scenes/practice.js';
import { buildFightScene, buildSingleScene } from '../sim/fight.js';
import { createTitle, stepTitle, MODES, SHARE_MODES, CREDITS, creditLink, INVENTORY_SIZE } from '../sim/modes.js';
import { normalizeGear, isFreshFileGear } from '../sim/equipment.js';
import { encodeConfig, decodeConfig, NONE } from '../sim/share.js';
import { ITEMS } from '../sim/items.js';
import { drawTitle, drawGameOver, stepGameOver, makeGameOver } from '../render/title.js';
import { createTvTurnoff, stepTvTurnoff } from '../sim/tvturnoff.js';
import { drawTvTurnoff } from '../render/draw/tvturnoff.js';
import { createIntroScene, stepIntroScene } from '../sim/intro.js';
import { drawIntroScene } from '../render/draw/intro.js';
import { bindKeyboard } from '../input/keyboard.js';
import { bindTouch, blockPageZoom } from '../input/touch.js';
import { bindGamepad } from '../input/gamepad.js';
import { createRenderer } from '../render/canvas.js';
import { loadSprites } from '../render/sprites.js';
import { createAudio } from '../render/audio.js';
import { deltaruneMultiplier } from '../render/windowsize.js';
import { resetBattleUI } from '../render/battleui.js';
import { resetJokerBody } from '../render/jokerbody.js';

const canvas = document.getElementById('game');
let sprites = null;
try {
  sprites = await loadSprites();
} catch {
  sprites = null;
}
const renderer = createRenderer(canvas, sprites);
const ctx = renderer.ctx;

let scalingMode = 'fit';
function fitCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const availW = window.innerWidth * dpr;
  const availH = window.innerHeight * dpr;
  const fit = Math.min(availW / renderer.VIEW_W, availH / renderer.VIEW_H);
  let scale = fit;
  if (scalingMode === 'pixel' && fit >= 1) {
    const m = deltaruneMultiplier(
      window.screen?.width ?? window.innerWidth,
      window.screen?.height ?? window.innerHeight,
      renderer.VIEW_W,
      renderer.VIEW_H,
    );
    scale = Math.min(m * dpr, Math.floor(fit));
  }
  canvas.style.width = `${(renderer.VIEW_W * scale) / dpr}px`;
  canvas.style.height = `${(renderer.VIEW_H * scale) / dpr}px`;
}
fitCanvas();
window.addEventListener('resize', fitCanvas);
if (window.matchMedia) {
  const watchDpr = () => {
    const mq = window.matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`);
    mq.addEventListener('change', () => { fitCanvas(); watchDpr(); }, { once: true });
  };
  watchDpr();
}

const audio = createAudio();
const sfx = (name, restart = false) => audio.play([{ name, pitch: 1, gain: 1, restart }]);

const cueSound = (name, o = {}) => audio.play([{
  name, pitch: o.pitch ?? 1, gain: o.gain ?? 1,
  restart: !!o.restart, loop: !!o.loop, stop: !!o.stop, tune: !!o.tune,
}]);
const audioSink = { cue: (name, opts) => cueSound(name, opts) };

const keyboard = bindKeyboard(window);
const gamepad = bindGamepad();

let syncOpenedLink = null;
blockPageZoom();
const touch = bindTouch({
  pad: document.getElementById('dpad'),
  buttons: [
    { el: document.getElementById('btnZ'), actions: ['confirm'] },
    { el: document.getElementById('btnX'), actions: ['focus', 'cancel'] },
    { el: document.getElementById('btnR'), actions: ['reset'] },
  ],
  onReset: () => { if (title.mode !== null) reset(); },
  onExit: () => exitRun(),
  onAction: (a) => {
    if (a !== 'confirm' || title.mode !== null) return;
    const s = title.settings;
    if (!s || s.page !== 'credits') return;
    const href = creditLink(CREDITS[s.cursor] ?? {});
    if (!href) return;
    window.open(href, '_blank', 'noopener,noreferrer');
    syncOpenedLink = href;
  },
});
const keys = {
  read() {
    const k = keyboard.read();
    const g = gamepad.read();
    const t = touch.read();
    for (const a of Object.keys(g)) if (g[a]) k[a] = true;
    for (const a of Object.keys(t)) if (t[a]) k[a] = true;
    return k;
  },
};

let inputMask = {};
function gatedKeys() {
  const raw = keys.read();
  const out = { ...raw };
  for (const k of Object.keys(inputMask)) {
    if (!raw[k]) delete inputMask[k];
    else out[k] = false;
  }
  return out;
}
function maskHeldInput() {
  inputMask = {};
  const raw = keys.read();
  for (const k of Object.keys(raw)) if (raw[k]) inputMask[k] = true;
}

const params = new URLSearchParams(location.search);
const title = createTitle();

const SETTINGS_KEY = 'jokersim.settings';
try {
  const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null');
  if (Array.isArray(saved?.bag)) {
    const bag = saved.bag.map((v) => (ITEMS[v | 0] ? v | 0 : 0)).slice(0, INVENTORY_SIZE);
    while (bag.length < INVENTORY_SIZE) bag.push(0);
    title.bag = bag;
  }
  if (saved?.volumes) {
    title.volumes.music = Math.max(0, Math.min(100, saved.volumes.music | 0));
    title.volumes.sfx = Math.max(0, Math.min(100, saved.volumes.sfx | 0));
  }
  if (typeof saved?.shake === 'boolean') title.shake = saved.shake;
  if (saved?.scaling === 'fit' || saved?.scaling === 'pixel') title.scaling = saved.scaling;
  if (typeof saved?.swapZX === 'boolean') title.swapZX = saved.swapZX;
  if (saved?.gear && !isFreshFileGear(saved.gear)) title.gear = normalizeGear(saved.gear);
} catch {   }

const sharedCfg = decodeConfig(params.get('cfg'), {
  itemOk: (id) => !!ITEMS[id],
  modeCount: SHARE_MODES.length,
  attackCount: ATTACKS.length,
});
if (sharedCfg) {
  if (sharedCfg.bag) title.bag = sharedCfg.bag;
  if (sharedCfg.gear) title.gear = normalizeGear(sharedCfg.gear);
  if (sharedCfg.attack !== null) title.attackIndex = sharedCfg.attack;
  if (sharedCfg.mode !== null) {
    const id = SHARE_MODES[sharedCfg.mode].id;
    title.index = Math.max(0, MODES.findIndex((m) => m.id === id));
    title.mode = MODES[title.index].id;
  }
}

function applySettings() {
  audio.setVolumes(title.volumes.music / 100, title.volumes.sfx / 100);
  if (state) state.flag12 = title.shake ? 0 : 1;
  if (scalingMode !== title.scaling) {
    scalingMode = title.scaling;
    fitCanvas();
  }
  document.getElementById('touch')?.classList.toggle('swap', title.swapZX);
}

function persistSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      v: 1,
      bag: title.bag, gear: title.gear, volumes: title.volumes,
      shake: title.shake, scaling: title.scaling, swapZX: title.swapZX,
    }));
  } catch {   }
  applySettings();
}

function shareUrl() {
  const modeIndex = title.mode ? SHARE_MODES.findIndex((m) => m.id === title.mode) : NONE;
  const cfg = encodeConfig({ mode: modeIndex < 0 ? NONE : modeIndex, attack: title.attackIndex, bag: title.bag, gear: title.gear });
  const url = new URL(location.href);
  url.search = '';
  url.searchParams.set('cfg', cfg);
  return url.toString();
}

function copyText(text) {
  const fallback = () => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch {   }
    ta.remove();
  };
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(fallback);
  else fallback();
}

let replay = null;
{
  const t = params.get('replay');
  if (t) {
    try {
      replay = decodeReplay(t);
    } catch (err) {
      void 0;
    }
  }
}
let firstSeed = params.has('seed') ? Number(params.get('seed')) : null;
if (replay) {
  const single = replay.meta.mode !== 'fight';
  title.mode = single ? 'single' : 'normal';
  title.attackIndex = Math.min(ATTACKS.length - 1, Math.max(0, Number(replay.meta.attack || 0)));
  firstSeed = replay.meta.seed;
} else if (params.get('mode') === 'practice') {
  title.mode = 'single';
  title.attackIndex = Math.min(ATTACKS.length - 1, Math.max(0, Number(params.get('attack') ?? 0)));
} else if (params.get('mode') === 'fight') {
  title.mode = 'normal';
}

let acc = 0;
let last = performance.now();
let state = null;
let runMode = null;
let recorder = null;

let runInputs = [];

let rewindFrame = 0;
let prevMnfight = 0;
let over = null;
let defeatedAt = -1;

let closeFade = -1;
let tvOff = null;

let introSeq = null;

const simKind = () => (runMode === 'single' ? 'practice' : 'fight');

function newSeed() {
  if (firstSeed !== null) {
    const s = firstSeed;
    firstSeed = null;
    return s;
  }
  return (Math.random() * 1e9) | 0;
}

function build(seed) {
  const st = createState({ seed, traceBulletSlots: 0 });
  if (simKind() === 'practice') {
    buildSingleScene(st, { jattack: ATTACKS[title.attackIndex].jattack, inventory: title.bag, gear: title.gear });
  } else {
    buildFightScene(st, { inventory: title.bag, gear: title.gear });
  }
  st.flag12 = title.shake ? 0 : 1;
  return st;
}

function partyHp(st) {
  const p = st.party;
  if (!p) return 0;
  return [0, 1, 2].reduce((sum, i) => sum + Math.max(0, p.hp[p.char[i]] ?? 0), 0);
}

function startMusic() {
  audio.play([{ name: 'mus_joker', pitch: 1, gain: 1, loop: true }]);
}

function reset() {

  const kept = audio.stopAll(runMode === 'single' ? 'mus_joker' : null);
  maskHeldInput();
  introSeq = null;
  resetBattleUI();
  resetJokerBody();
  over = null;
  defeatedAt = -1;
  closeFade = -1;
  tvOff = null;
  runInputs = [];
  rewindFrame = 0;
  prevMnfight = 0;
  state = build(newSeed());
  state.audio = audioSink;
  recorder = createRecorder({ seed: state.seed, mode: simKind(), attack: String(title.attackIndex) });
  window.__state = state;
  acc = 0;
  if (!kept) startMusic();
}

function rewind() {
  audio.stopAll();
  maskHeldInput();
  const seed = state.seed;
  const inputs = runInputs.slice(0, rewindFrame);
  const st = build(seed);
  for (const input of inputs) stepFrame(st, input);
  st.audio = audioSink;
  state = st;
  runInputs = inputs;
  recorder = createRecorder({ seed, mode: simKind(), attack: String(title.attackIndex) });
  for (const input of inputs) recordInput(recorder, input);
  prevMnfight = state.mnfight;
  window.__state = state;
  acc = 0;
  startMusic();
}

function exitRun() {
  if (title.mode === null) return;
  over = null;
  closeFade = -1;
  tvOff = null;
  title.mode = null;
  title.pickingAttack = false;
  runMode = null;
  introSeq = null;
  audio.stopAll();
  maskHeldInput();
  titleMusic();
}

function startRun() {
  runMode = title.mode;
  reset();

  if ((runMode === 'normal' || runMode === 'hitless') && !replay && !params.get('frames')) {
    audio.stopAll();
    introSeq = createIntroScene();
  }
}

function titleMusic() {
  audio.play([{ name: 'mus_prejoker', pitch: 1, gain: 1, loop: true }]);
}

window.addEventListener('keydown', (e) => {
  if (e.repeat) return;
  if (e.code === 'KeyR' && title.mode !== null) reset();
  if (e.code === 'Escape') exitRun();

  if (e.code === 'KeyC' && runMode === 'single') exitRun();

  if (runMode === 'single' && (e.code === 'BracketLeft' || e.code === 'BracketRight')) {
    const n = ATTACKS.length;
    title.attackIndex = (title.attackIndex + (e.code === 'BracketLeft' ? n - 1 : 1)) % n;
    reset();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.code !== 'KeyB' || e.repeat || !recorder || title.mode === null) return;
  const u = new URL(location.href);
  u.search = '';
  u.searchParams.set('replay', encodeReplay(recorder));
  copyText(u.toString());
  void 0;
});

persistSettings();
if (title.mode !== null) startRun();
else titleMusic();

{
  const ff = Number(params.get('frames') ?? 0);
  for (let i = 0; i < ff && state; i++) stepRun(replay ? replay.inputAt(state.frame) : {});
}

function stepRun(input) {
  const hpBefore = partyHp(state);
  runInputs.push(input);
  recordInput(recorder, input);
  stepFrame(state, input);

  if (state.mnfight === 1 && prevMnfight !== 1) rewindFrame = state.frame;
  prevMnfight = state.mnfight;

  const hpNow = partyHp(state);
  if (runMode === 'hitless' && hpNow < hpBefore) {
    reset();
    return 'restart';
  }

  if (state.jokerDefeated && defeatedAt < 0) {
    defeatedAt = state.frame;
    audio.stopAll();
  }
  if (defeatedAt >= 0 && state.frame - defeatedAt >= 30) {
    maskHeldInput();
    closeFade = 0;
    return 'end';
  }

  if (runMode === 'single' && state.turntimer <= 0) { reset(); return 'restart'; }

  if (state.gameOver) {
    if (runMode === 'hitless' || runMode === 'single') { reset(); return 'restart'; }
    if (runMode === 'practice') { rewind(); return 'restart'; }

    audio.stopAll();
    sfx('snd_hurt1');
    renderer.draw(state);
    const shot = document.createElement('canvas');
    shot.width = renderer.VIEW_W;
    shot.height = renderer.VIEW_H;
    shot.getContext('2d').drawImage(canvas, 0, 0);
    maskHeldInput();
    over = makeGameOver(
      shot,
      (state.soul?.x ?? 320) - (state.view?.x ?? 0),
      (state.soul?.y ?? 170) - (state.view?.y ?? 0),
    );
    return 'over';
  }
  return null;
}

function frame(now) {
  const elapsed = now - last;
  last = now;

  {
    const pe = gamepad.driverEdges();
    if (pe.reset && title.mode !== null) reset();
    if (pe.exit) exitRun();
  }

  const { steps, accumulator } = drain(acc, elapsed);
  acc = accumulator;

  if (!title.mode) {
    for (let i = 0; i < steps; i++) {
      const r = stepTitle(title, gatedKeys(), ATTACKS);
      if (r.moved) sfx('snd_menumove');
      if (r.selected) sfx('snd_select');
      if (r.error) sfx('snd_error');
      if (r.link) {
        if (r.link === syncOpenedLink) syncOpenedLink = null;
        else window.open(r.link, '_blank', 'noopener,noreferrer');
      }
      if (r.share) copyText(shareUrl());
      if (title.dirty) {
        title.dirty = false;
        persistSettings();
      }
      if (r.chosen) { startRun(); break; }
    }
    if (!title.mode) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, renderer.VIEW_W, renderer.VIEW_H);
      drawTitle(ctx, title, sprites, ATTACKS);
      scheduleFrame();
      return;
    }
  }

  if (introSeq) {
    for (let i = 0; i < steps && introSeq; i++) {
      const input = gatedKeys();
      if (input.cancel) introSeq.done = true;
      const cues = [];
      if (!introSeq.done) stepIntroScene(introSeq, input, cues);
      if (cues.length) audio.play(cues);
      if (introSeq.done) {
        audio.stopAll();
        introSeq = null;
        maskHeldInput();
        acc = 0;
        startMusic();
      }
    }
    if (introSeq) {
      drawIntroScene(ctx, introSeq, sprites);
      scheduleFrame();
      return;
    }
  }

  if (closeFade >= 0) {
    for (let i = 0; i < steps && !tvOff; i++) {
      closeFade += 1;
      if (closeFade >= 15) tvOff = createTvTurnoff();
    }
    if (tvOff) {
      for (let i = 0; i < steps; i++) {
        const cues = [];
        stepTvTurnoff(tvOff, cues);
        if (cues.length) audio.play(cues.map((c) => ({ pitch: 1, gain: 1, ...c })));
        if (tvOff.done) break;
      }
      drawTvTurnoff(ctx, tvOff, sprites);
      if (tvOff.done) {
        exitRun();
      }
    } else {
      renderer.draw(state);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = Math.min(1, closeFade / 15);
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, renderer.VIEW_W, renderer.VIEW_H);
      ctx.globalAlpha = 1;
    }
    scheduleFrame();
    return;
  }

  if (over) {
    for (let i = 0; i < steps; i++) {
      const r = stepGameOver(over, gatedKeys());
      if (r.cues.length) audio.play(r.cues.map((c) => ({ pitch: 1, gain: 1, ...c })));
      if (r.retry) { reset(); break; }
      if (r.quit) { exitRun(); break; }
    }
    if (over) drawGameOver(ctx, over, sprites);
    scheduleFrame();
    return;
  }

  for (let i = 0; i < steps; i++) {
    const input = replay ? replay.inputAt(state.frame) : gatedKeys();
    const r = stepRun(input);
    if (r) break;
  }
  if (!over && closeFade < 0) renderer.draw(state);
  scheduleFrame();
}

let rafId = 0;
function scheduleFrame() {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(frame);
}
scheduleFrame();
let rafTick = performance.now();
let probeId = 0;
const rafProbe = () => { rafTick = performance.now(); probeId = requestAnimationFrame(rafProbe); };
function scheduleProbe() {
  if (probeId) cancelAnimationFrame(probeId);
  probeId = requestAnimationFrame(rafProbe);
}
scheduleProbe();
let fallback = null;
function disarmFallback() {
  if (fallback) {
    clearInterval(fallback);
    fallback = null;
  }
}
setInterval(() => {
  const stale = performance.now() - rafTick > 500;
  const visible = document.visibilityState === 'visible';
  if (stale && visible && !fallback) {
    fallback = setInterval(() => frame(performance.now()), 33);
  } else if (!stale) {
    disarmFallback();
  }
}, 250);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    rafTick = performance.now();
    last = performance.now();
    scheduleProbe();
    scheduleFrame();
  }
  disarmFallback();
});

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  navigator.serviceWorker.register(new URL('./sw.js', import.meta.url)).catch(() => {});
}

window.__sim = { get state() { return state; }, stepFrame, title };

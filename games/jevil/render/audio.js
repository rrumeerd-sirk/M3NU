

const BASE = new URL('../assets/audio/', import.meta.url).href;

export function createAudio({ overrides } = {}) {

  const buffers = new Map();

  const pending = new Map();
  const missing = new Set();
  let enabled = true;

  let available = null;

  let ctx = null;
  function audioCtx() {
    if (ctx) return ctx;
    const C = window.AudioContext ?? window.webkitAudioContext;
    if (!C) return null;
    ctx = new C();
    return ctx;
  }

  const streams = new Set();

  const resume = () => {
    const c = audioCtx();
    if (c && c.state === 'suspended') c.resume().catch(() => {});

    for (const el of streams) if (el.paused) el.play().catch(() => {});
  };
  window.addEventListener('keydown', resume, { passive: true });
  window.addEventListener('pointerdown', resume, { passive: true });

  fetch(`${BASE}index.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((list) => {
      if (Array.isArray(list)) {

        available = new Map(list.map((n) => [n, `${n}.ogg`]));
      } else if (list && typeof list === 'object') {
        available = new Map(Object.entries(list));
      } else {
        available = new Map();
      }

      if (overrides) for (const [k, v] of Object.entries(overrides)) available.set(k, v);
      preloadAll();
    })
    .catch(() => {
      available = new Map();
    });

  function preloadAll() {
    if (!available) return;
    for (const name of available.keys()) {

      if (name.startsWith('mus_')) continue;
      buffer(name);
    }
  }

  function buffer(name) {
    if (buffers.has(name)) return buffers.get(name);

    if (available === null || !available.has(name)) {
      missing.add(name);
      return null;
    }
    if (pending.has(name)) return null;
    const c = audioCtx();
    if (!c) return null;

    const file = available.get(name);
    const url = /^(?:[a-z]+:)?\/\//i.test(file) || file.startsWith('/') ? file : `${BASE}${file}`;
    const p = fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error('404'))))
      .then((buf) => c.decodeAudioData(buf))
      .then((decoded) => {
        buffers.set(name, decoded);
        pending.delete(name);

        if (wantedLoops.has(name)) startLoop(name, wantedLoops.get(name));
      })
      .catch(() => {
        buffers.set(name, null);
        missing.add(name);
        pending.delete(name);
      });
    pending.set(name, p);
    return null;
  }

  const loops = new Map();

  const wantedLoops = new Map();

  function startLoop(name, opts) {
    wantedLoops.delete(name);
    if (loops.has(name)) return;

    const src = fire(name, opts.pitch, opts.gain, true);
    if (src) loops.set(name, src);
  }

  function stopLoop(name) {
    wantedLoops.delete(name);
    const node = loops.get(name);
    if (!node) return;
    try {
      node.stop();
    } catch {

    }
    loops.delete(name);
  }

  let musicVol = 1;
  let sfxVol = 1;
  const liveGains = new Set();

  const MASTER = 0.5;

  const levelFor = (entry) => (
    Math.min(1, entry.base) * (entry.music ? musicVol : sfxVol) * MASTER
  );

  function setVolumes(music, sfx) {
    musicVol = music;
    sfxVol = sfx;
    for (const entry of liveGains) {
      entry.g.gain.value = levelFor(entry);
    }
  }

  function fireStream(name, pitch, gain, loop) {
    const c = audioCtx();
    const file = available?.get(name);
    if (!c || !file) return null;
    const url = /^(?:[a-z]+:)?\/\//i.test(file) || file.startsWith('/') ? file : `${BASE}${file}`;
    const el = new Audio();
    el.src = url;
    el.loop = !!loop;
    el.preload = 'auto';
    el.playbackRate = pitch ?? 1;

    let node;
    try {
      node = c.createMediaElementSource(el);
    } catch {
      return null;
    }

    const g = c.createGain();
    const entry = { g, base: gain ?? 1, loop: !!loop, music: name.startsWith('mus_') };
    g.gain.value = levelFor(entry);
    liveGains.add(entry);
    node.connect(g).connect(c.destination);

    streams.add(el);
    el.play().catch(() => {   });

    return {
      gainEntry: entry,
      playbackRate: {
        get value() { return el.playbackRate; },
        set value(v) { el.playbackRate = v; },
      },
      addEventListener: (...a) => el.addEventListener(...a),
      stop() {
        streams.delete(el);
        liveGains.delete(entry);
        try { el.pause(); } catch {   }

        el.removeAttribute('src');
        try { el.load(); } catch {   }
        try { node.disconnect(); g.disconnect(); } catch {   }
      },
    };
  }

  function fire(name, pitch, gain, loop) {

    if (name.startsWith('mus_')) {
      const streamed = fireStream(name, pitch, gain, loop);
      if (streamed) return streamed;
    }
    const buf = buffer(name);
    const c = audioCtx();
    if (!buf || !c) {

      if (loop && c) wantedLoops.set(name, { pitch, gain });
      return null;
    }
    const src = c.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = pitch ?? 1;
    src.loop = !!loop;
    const g = c.createGain();
    const base = gain ?? 1;

    const entry = { g, base, loop: !!loop, music: name.startsWith('mus_') };
    g.gain.value = levelFor(entry);
    liveGains.add(entry);
    src.onended = () => liveGains.delete(entry);
    src.connect(g).connect(c.destination);
    src.start();
    src.gainEntry = entry;
    return src;
  }

  const lastShot = new Map();

  function play(cues) {
    if (!enabled || !cues.length) return;
    for (const c of cues) {
      if (c.stop) {
        stopLoop(c.name);
        continue;
      }
      if (c.tune) {
        const node = loops.get(c.name);
        if (node && c.pitch != null) node.playbackRate.value = c.pitch;

        const entry = node?.gainEntry;
        if (entry && c.gain != null) {
          entry.base = Math.max(0, c.gain);
          entry.g.gain.value = levelFor(entry);
        }
        continue;
      }
      if (c.sustain) {

        stopLoop(c.name);
        const src = fire(c.name, c.pitch, c.gain, false);
        if (src) {
          loops.set(c.name, src);
          src.addEventListener('ended', () => {
            if (loops.get(c.name) === src) loops.delete(c.name);
          });
        }
        continue;
      }
      if (c.loop) {

        stopLoop(c.name);
        const src = fire(c.name, c.pitch, c.gain, true);
        if (src) loops.set(c.name, src);
        continue;
      }

      if (c.restart) {
        try { lastShot.get(c.name)?.stop(); } catch {   }
        const src = fire(c.name, c.pitch, c.gain, false);
        if (src) lastShot.set(c.name, src);
        continue;
      }
      fire(c.name, c.pitch, c.gain, false);
    }
  }

  function stopAll(keep = null) {
    for (const name of [...loops.keys()]) if (name !== keep) stopLoop(name);

    const kept = keep !== null && (loops.has(keep) || wantedLoops.has(keep));
    for (const name of [...wantedLoops.keys()]) if (name !== keep) wantedLoops.delete(name);
    return kept;
  }

  return {
    play,
    stopAll,

    stopLoop,

    setVolumes,
    get enabled() {
      return enabled;
    },
    set enabled(v) {
      enabled = v;
      if (!v) stopAll();
    },

    get missing() {
      return [...missing];
    },

    get loaded() {
      return [...buffers.keys()].filter((k) => buffers.get(k));
    },
  };
}

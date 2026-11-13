// The choreographer: turns MIRA's look on/off and holds the per-frame values every layer reads.
import { moment, MOMENT } from "./moments.js";
const MIRA_COLORS = {
  violet: "#a78bfa",
  bright: "#e9d5ff",
  magenta: "#c084fc",
  deep: "#7c3aed",
  matter: "#8b5cf6",
  light: "#ddd6fe",
  rgb: "221,214,254"
};
const MIRA_TIMING = {
  enter: {
    routes: [0, 0.6],
    orb: [0.4, 1.4],
    waves: [0.6, 1.8],
    matter: [1.2, 2],
    chrome: 1.6,
    sound: 0.5,
    total: 2.2
  },
  exit: {
    chrome: 0,
    matter: [0, 0.6],
    waves: [0.2, 1.2],
    orb: [0.6, 1.5],
    routes: [1, 1.7],
    sound: 0,
    total: 1.8
  }
};
const VAR = {
  routes: "--mira-routes",
  mira: "--mira"
};
const STORE_KEY = "mira_hud_on";
const stage = {
  mira: 0,
  orb: 0,
  matter: 0,
  routes: 1,
  live: false,
  voice: 0,
  talk: 0,
  listen: 0,
  pace: 1
};
const getMiraStage = () => stage;
function setMiraPace(x) {
  stage.pace = x > 0.2 && x < 6 ? x : 1;
}
let forced = null;
function tickMiraVoice(dt, {
  energy = 0,
  speaking = false,
  listening = false
} = {}) {
  if (forced) {
    stage.voice = forced.voice ?? 0;
    stage.talk = forced.talk ?? 0;
    stage.listen = forced.listen ?? 0;
    return stage;
  }
  const d = Math.min(Math.max(dt || 0, 0), 0.1);
  const raw = speaking ? Math.min(1, Math.max(0, energy)) : 0;
  stage.voice += (raw - stage.voice) * Math.min(1, d * (raw > stage.voice ? 28 : 7));
  const tk = speaking ? 1 : 0;
  stage.talk += (tk - stage.talk) * Math.min(1, d * (tk > stage.talk ? 10 : 2.2));
  const ls = listening && !speaking ? 1 : 0;
  stage.listen += (ls - stage.listen) * Math.min(1, d * 4);
  if (stage.voice < 0.01) stage.voice = 0;
  if (stage.talk < 0.01) stage.talk = 0;
  if (stage.listen < 0.01) stage.listen = 0;
  return stage;
}
function forceMiraVoice(values) {
  forced = values || null;
  stage.voice = forced ? forced.voice ?? 0 : 0;
  stage.talk = forced ? forced.talk ?? 0 : 0;
  stage.listen = forced ? forced.listen ?? 0 : 0;
}
let on = false;
let running = false;
const listeners = new Set();
let snap = {
  on: false,
  running: false
};
const isMira = () => on;
const getMiraSnapshot = () => snap;
function subscribeMira(fn) {
  listeners.add(fn);
  fn(snap);
  return () => listeners.delete(fn);
}
function push() {
  snap = {
    on,
    running
  };
  for (const fn of listeners) {
    try {
      fn(snap);
    } catch (e) {
      console.warn("[mira]", e);
    }
  }
}
const now = () => typeof performance !== "undefined" ? performance.now() : Date.now();
const hasRaf = typeof requestAnimationFrame === "function";
const nextFrame = fn => hasRaf ? requestAnimationFrame(fn) : setTimeout(fn, 16);
const stopFrame = h => {
  if (h == null) return;
  hasRaf ? cancelAnimationFrame(h) : clearTimeout(h);
};
const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
const easeOut = x => 1 - Math.pow(1 - x, 3);
const easeIn = x => x * x * x;
const easeInOut = x => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const seg = (t, [a, b], from, to, ease = easeInOut) => from + (to - from) * ease(clamp01((t - a) / Math.max(b - a, 1e-6)));
const root = () => typeof document !== "undefined" ? document.documentElement : null;
function setVar(name, v) {
  const r = root();
  if (r) r.style.setProperty(name, String(Math.round(v * 1e3) / 1e3));
}
function setAttr(flag) {
  const r = root();
  if (!r) return;
  if (flag) r.setAttribute("data-mira", "1");else r.removeAttribute("data-mira");
}
const log = (...a) => {
  try {
    console.log("[mira]", ...a);
  } catch (_) {}
};
let speed = 1;
function setMiraSpeed(x) {
  speed = x > 0 ? x : 1;
}
const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let raf = null;
let t0 = 0;
let dir = 0;
let chromeDone = false;
let soundDone = false;
let held = false;
function holdMiraLook(values) {
  if (!values) {
    if (!held) return;
    held = false;
    if (!running) {
      stage.mira = on ? 1 : 0;
      stage.orb = on ? 1 : 0;
      stage.matter = on ? 1 : 0;
    }
    return;
  }
  held = true;
  stage.mira = clamp01(values.waves ?? 0);
  stage.orb = clamp01(values.orb ?? 0);
  stage.matter = clamp01(values.matter ?? 0);
}
function apply(values) {
  if (!held) {
    stage.mira = values.waves;
    stage.orb = values.orb;
    stage.matter = values.matter;
  }
  stage.routes = values.routes;
  setVar(VAR.routes, values.routes);
  setVar(VAR.mira, values.waves);
}
function settle(target) {
  apply(target ? {
    waves: 1,
    orb: 1,
    matter: 1,
    routes: 0
  } : {
    waves: 0,
    orb: 0,
    matter: 0,
    routes: 1
  });
  setAttr(target);
  stage.live = false;
  running = false;
  on = target;
  try {
    localStorage.setItem(STORE_KEY, target ? "1" : "0");
  } catch (_) {}
  push();
}
function frame() {
  const T = dir > 0 ? MIRA_TIMING.enter : MIRA_TIMING.exit;
  const t = (now() - t0) / 1e3 * speed;
  if (dir > 0) {
    apply({
      routes: seg(t, T.routes, 1, 0, easeIn),
      waves: seg(t, T.waves, 0, 1),
      orb: seg(t, T.orb, 0, 1),
      matter: seg(t, T.matter, 0, 1, easeOut)
    });
    if (!chromeDone && t >= T.chrome) {
      chromeDone = true;
      setAttr(true);
    }
  } else {
    apply({
      matter: seg(t, T.matter, 1, 0, easeIn),
      orb: seg(t, T.orb, 1, 0),
      waves: seg(t, T.waves, 1, 0),
      routes: seg(t, T.routes, 0, 1, easeOut)
    });
    if (!chromeDone && t >= T.chrome) {
      chromeDone = true;
      setAttr(false);
    }
  }
  if (!soundDone && t >= T.sound) {
    soundDone = true;
    try {
      moment(dir > 0 ? MOMENT.MIRA_ENTER : MOMENT.MIRA_EXIT);
    } catch (_) {}
  }
  if (t >= T.total) {
    raf = null;
    settle(dir > 0);
    log(dir > 0 ? "entered" : "left");
    return;
  }
  raf = nextFrame(frame);
}
function start(target, {
  instant = false
} = {}) {
  if (raf != null) {
    stopFrame(raf);
    raf = null;
  }
  if (instant || prefersReducedMotion()) {
    settle(target);
    return;
  }
  dir = target ? 1 : -1;
  t0 = now();
  chromeDone = false;
  soundDone = false;
  stage.live = true;
  running = true;
  on = target;
  push();
  log(target ? "entering" : "leaving");
  raf = nextFrame(frame);
}
function enterMira(opts) {
  if (on && !running) return;
  start(true, opts);
}
function exitMira(opts) {
  if (!on && !running) return;
  start(false, opts);
}
function toggleMira(opts) {
  (on ? exitMira : enterMira)(opts);
}
function initMira() {
  let stored = false;
  try {
    stored = localStorage.getItem(STORE_KEY) === "1";
  } catch (_) {}
  settle(stored);
  return stored;
}
function _resetMira() {
  if (raf != null) {
    stopFrame(raf);
    raf = null;
  }
  stage.live = false;
  running = false;
  on = false;
  stage.voice = 0;
  stage.talk = 0;
  stage.listen = 0;
  stage.pace = 1;
  forced = null;
  held = false;
  apply({
    waves: 0,
    orb: 0,
    matter: 0,
    routes: 1
  });
  setAttr(false);
  push();
}
var stdin_default = {
  enterMira,
  exitMira,
  toggleMira,
  initMira,
  isMira,
  subscribeMira,
  getMiraStage,
  MIRA_TIMING,
  MIRA_COLORS
};
export { MIRA_COLORS, MIRA_TIMING, _resetMira, stdin_default as default, enterMira, exitMira, forceMiraVoice, getMiraSnapshot, getMiraStage, holdMiraLook, initMira, isMira, prefersReducedMotion, setMiraPace, setMiraSpeed, subscribeMira, tickMiraVoice, toggleMira };

// Every key number of the look in one table. Layers read dial(key) each frame.
const DIALS = [{
  key: "lines.count",
  group: "Centre lines",
  label: "How many lines",
  min: 2,
  max: 28,
  step: 1,
  def: 9
}, {
  key: "lines.width",
  group: "Centre lines",
  label: "Line thickness (px)",
  min: 0.5,
  max: 4,
  step: 0.1,
  def: 1.4
}, {
  key: "lines.glow",
  group: "Centre lines",
  label: "Line brightness",
  min: 0,
  max: 2.5,
  step: 0.05,
  def: 2.5
}, {
  key: "lines.glowVar",
  group: "Centre lines",
  label: "Bright and dark stretches",
  min: 0,
  max: 1,
  step: 0.05,
  def: 1
}, {
  key: "lines.hot",
  group: "Centre lines",
  label: "White hot spots",
  min: 0,
  max: 2.5,
  step: 0.05,
  def: 1.6
}, {
  key: "lines.gold",
  group: "Centre lines",
  label: "Share of warm gold lines",
  min: 0,
  max: 0.6,
  step: 0.05,
  def: 0.6
}, {
  key: "lines.rMin",
  group: "Centre lines",
  label: "Closest orbit (ring = 1)",
  min: 0.85,
  max: 1.6,
  step: 0.05,
  def: 0.95
}, {
  key: "lines.rMax",
  group: "Centre lines",
  label: "Farthest orbit (ring = 1)",
  min: 1.2,
  max: 3.2,
  step: 0.05,
  def: 2.05
}, {
  key: "lines.stretch",
  group: "Centre lines",
  label: "Oval stretch",
  min: 0,
  max: 1,
  step: 0.05,
  def: 0
}, {
  key: "lines.chaos",
  group: "Centre lines",
  label: "Chaos of the shape",
  min: 0,
  max: 1,
  step: 0.05,
  def: 0.6
}, {
  key: "lines.tilt",
  group: "Centre lines",
  label: "Tilt of the orbits (deg)",
  min: 0,
  max: 75,
  step: 1,
  def: 22
}, {
  key: "lines.speed",
  group: "Centre lines",
  label: "Speed of the movement",
  min: 0,
  max: 3,
  step: 0.05,
  def: 3
}, {
  key: "lines.cross",
  group: "Centre lines",
  label: "How deep lines cross the ring",
  min: 0.55,
  max: 1,
  step: 0.01,
  def: 0.86
}, {
  key: "lines.follow",
  group: "Centre lines",
  label: "How softly they follow the ring size",
  min: 0.3,
  max: 6,
  step: 0.1,
  def: 2.9
}, {
  key: "smoke.amount",
  group: "Smoke",
  label: "Smoke strength",
  min: 0,
  max: 2,
  step: 0.05,
  def: 0.95
}, {
  key: "smoke.width",
  group: "Smoke",
  label: "Smoke width (ring = 1)",
  min: 0.04,
  max: 0.6,
  step: 0.01,
  def: 0.27
}, {
  key: "dust.amount",
  group: "Star dust",
  label: "Grains per line",
  min: 0,
  max: 40,
  step: 1,
  def: 15
}, {
  key: "dust.size",
  group: "Star dust",
  label: "Grain size",
  min: 0.4,
  max: 3,
  step: 0.05,
  def: 1.05
}, {
  key: "dust.bright",
  group: "Star dust",
  label: "Grain brightness",
  min: 0,
  max: 2.5,
  step: 0.05,
  def: 2.5
}, {
  key: "dust.spread",
  group: "Star dust",
  label: "How far grains sit from the line",
  min: 0,
  max: 0.5,
  step: 0.01,
  def: 0.5
}, {
  key: "ring.diameter",
  group: "Ring and centre light",
  label: "Ring diameter (px)",
  min: 220,
  max: 420,
  step: 2,
  def: 310
}, {
  key: "ring.neon",
  group: "Ring and centre light",
  label: "White neon on the ring",
  min: 0,
  max: 2.5,
  step: 0.05,
  def: 0.1
}, {
  key: "ring.neonWidth",
  group: "Ring and centre light",
  label: "Neon thickness (px)",
  min: 0.6,
  max: 5,
  step: 0.1,
  def: 1.8
}, {
  key: "ring.spill",
  group: "Ring and centre light",
  label: "Violet glow outside the ring",
  min: 0,
  max: 3,
  step: 0.05,
  def: 1.65
}, {
  key: "light.bright",
  group: "Ring and centre light",
  label: "Centre light brightness",
  min: 0,
  max: 2.5,
  step: 0.05,
  def: 2
}, {
  key: "light.size",
  group: "Ring and centre light",
  label: "Centre light size",
  min: 0.6,
  max: 3,
  step: 0.05,
  def: 2.2
}, {
  key: "ring.listenWaves",
  group: "Ring and centre light",
  label: "Bright expanding circles while she listens (0 off, 1 on)",
  min: 0,
  max: 1,
  step: 1,
  def: 0
}, {
  key: "voice.ring",
  group: "Her voice",
  label: "Ring flare per syllable",
  min: 0,
  max: 2.5,
  step: 0.05,
  def: 2
}, {
  key: "voice.lines",
  group: "Her voice",
  label: "Lines react to her voice",
  min: 0,
  max: 2.5,
  step: 0.05,
  def: 1.95
}, {
  key: "waves.opacity",
  group: "Far waves",
  label: "Far waves strength",
  min: 0,
  max: 1,
  step: 0.01,
  def: 0.36
}, {
  key: "waves.width",
  group: "Far waves",
  label: "Far waves width",
  min: 0.2,
  max: 3,
  step: 0.05,
  def: 1.6
}, {
  key: "waves.speed",
  group: "Far waves",
  label: "Far waves speed",
  min: 0,
  max: 3,
  step: 0.05,
  def: 3
}, {
  key: "motes.opacity",
  group: "Floating particles",
  label: "Particle brightness",
  min: 0,
  max: 2,
  step: 0.05,
  def: 2
}, {
  key: "motes.size",
  group: "Floating particles",
  label: "Particle size",
  min: 0.4,
  max: 3,
  step: 0.05,
  def: 1
}, {
  key: "field.alpha",
  group: "Background",
  label: "Background field strength",
  min: 0,
  max: 1,
  step: 0.01,
  def: 1
}, {
  key: "field.near",
  group: "Background",
  label: "Background haze near the ring",
  min: 0,
  max: 3,
  step: 0.05,
  def: 1.45
}, {
  key: "field.spread",
  group: "Background",
  label: "Fog across the whole screen (0 = only near the ring)",
  min: 0,
  max: 1,
  step: 0.01,
  def: 0
}, {
  key: "bloom.strength",
  group: "Glow (whole picture)",
  label: "Glow strength",
  min: 0,
  max: 3,
  step: 0.05,
  def: 1.3
}, {
  key: "bloom.threshold",
  group: "Glow (whole picture)",
  label: "Only brighter than this glows",
  min: 0,
  max: 1,
  step: 0.01,
  def: 0.18
}, {
  key: "bloom.radius",
  group: "Glow (whole picture)",
  label: "Glow reach",
  min: 0.1,
  max: 1,
  step: 0.01,
  def: 0.62
}];
const MAX_LINES = 28,
  MAX_GRAINS = 40;
const STORE_KEY = "mira_ui_dial_v1";
const byKey = new Map(DIALS.map(d => [d.key, d]));
const values = {};
for (const d of DIALS) values[d.key] = d.def;
const listeners = new Set();
let version = 0;
const clampTo = (d, v) => {
  let n = Number(v);
  if (!Number.isFinite(n)) n = d.def;
  n = Math.min(d.max, Math.max(d.min, n));
  return +(Math.round(n / d.step) * d.step).toFixed(6);
};
const store = () => {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch (_) {
    return null;
  }
};
function load() {
  const s = store();
  if (!s) return;
  try {
    const saved = JSON.parse(s.getItem(STORE_KEY) || "{}");
    for (const k of Object.keys(saved)) {
      const d = byKey.get(k);
      if (d) values[k] = clampTo(d, saved[k]);
    }
  } catch (_) {}
}
function save() {
  const s = store();
  if (s) {
    try {
      s.setItem(STORE_KEY, JSON.stringify(changedDials()));
    } catch (_) {}
  }
  queueAccountSave();
}
let remote = null;
let saveTimer = null;
let account = "local";
const SAVE_DELAY_MS = 900;
const setAccount = st => {
  if (account !== st) {
    account = st;
    push();
  }
};
const accountState = () => account;
function queueAccountSave() {
  if (!remote) return;
  clearTimeout(saveTimer);
  setAccount("saving");
  saveTimer = setTimeout(flushAccountSave, SAVE_DELAY_MS);
}
async function flushAccountSave() {
  clearTimeout(saveTimer);
  saveTimer = null;
  if (!remote) return false;
  try {
    await remote.save(changedDials());
    setAccount("saved");
    return true;
  } catch (_) {
    setAccount("failed");
    return false;
  }
}
async function connectDialAccount(r) {
  remote = r || null;
  if (!remote) {
    setAccount("local");
    return "failed";
  }
  setAccount("loading");
  let got;
  try {
    got = await remote.load();
  } catch (_) {
    setAccount("failed");
    return "failed";
  }
  const vals = got && typeof got === "object" ? got : {};
  if (Object.keys(vals).some(k => byKey.has(k))) {
    for (const d of DIALS) values[d.key] = d.def;
    for (const k of Object.keys(vals)) {
      const d = byKey.get(k);
      if (d) values[k] = clampTo(d, vals[k]);
    }
    const s = store();
    if (s) {
      try {
        s.setItem(STORE_KEY, JSON.stringify(changedDials()));
      } catch (_) {}
    }
    account = "saved";
    push();
    return "account";
  }
  if (Object.keys(changedDials()).length) {
    const ok = await flushAccountSave();
    return ok ? "uploaded" : "failed";
  }
  setAccount("saved");
  return "empty";
}
const push = () => {
  version++;
  for (const fn of listeners) {
    try {
      fn(version);
    } catch (_) {}
  }
};
const standIns = new Map();
for (const d of DIALS) {
  if (!d.scope || !d.stands) continue;
  if (!byKey.has(d.stands)) throw new Error('miraDial: "' + d.key + '" stands for a dial that does not exist: ' + d.stands);
  if (!standIns.has(d.scope)) standIns.set(d.scope, new Map());
  standIns.get(d.scope).set(d.stands, d.key);
}
let scope = null;
function setDialScope(s) {
  const next = s || null;
  if (next === scope) return;
  scope = next;
  push();
}
const dialScope = () => scope;
function dial(key) {
  if (scope) {
    const m = standIns.get(scope);
    const k = m && m.get(key);
    if (k) return values[k];
  }
  const v = values[key];
  if (v === void 0) throw new Error('miraDial: no such dial "' + key + '"');
  return v;
}
function setDial(key, v) {
  const d = byKey.get(key);
  if (!d) throw new Error('miraDial: no such dial "' + key + '"');
  const n = clampTo(d, v);
  if (n === values[key]) return n;
  values[key] = n;
  save();
  push();
  return n;
}
function resetDials(group, scopeOf) {
  for (const d of DIALS) {
    if (group && d.group !== group) continue;
    if (!group && scopeOf !== void 0 && (d.scope || null) !== scopeOf) continue;
    values[d.key] = d.def;
  }
  save();
  push();
}
function changedDials() {
  const out = {};
  for (const d of DIALS) if (Math.abs(values[d.key] - d.def) > 1e-9) out[d.key] = +values[d.key].toFixed(4);
  return out;
}
function exportDials() {
  const all = {};
  for (const d of DIALS) all[d.key] = +values[d.key].toFixed(4);
  return "MIRA dial numbers\nchanged: " + JSON.stringify(changedDials(), null, 1) + "\nall: " + JSON.stringify(all);
}
function importDials(obj) {
  if (!obj || typeof obj !== "object") return 0;
  let n = 0;
  for (const k of Object.keys(obj)) {
    const d = byKey.get(k);
    if (d) {
      values[k] = clampTo(d, obj[k]);
      n++;
    }
  }
  save();
  push();
  return n;
}
function subscribeDials(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
const dialVersion = () => version;
function _resetDialModule() {
  for (const d of DIALS) values[d.key] = d.def;
  listeners.clear();
  version = 0;
  remote = null;
  clearTimeout(saveTimer);
  saveTimer = null;
  account = "local";
}
load();
export { DIALS, MAX_GRAINS, MAX_LINES, _resetDialModule, accountState, changedDials, connectDialAccount, dial, dialScope, dialVersion, exportDials, flushAccountSave, importDials, resetDials, setDial, setDialScope, subscribeDials };

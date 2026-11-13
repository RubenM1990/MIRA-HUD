// Optional debug views: add ?mira_debug=orb|mask|breakup|near|hot|nearhot|core|corehot to the URL.
const MIRA_DEBUG_MODES = ["", "orb", "mask", "breakup", "near", "hot", "nearhot", "core", "corehot"];
const HOT_THRESHOLD_DEFAULT = 0.5;
let mode = "";
let hotLo = HOT_THRESHOLD_DEFAULT;
function readUrl() {
  try {
    const q = new URLSearchParams(window.location.search);
    const m = String(q.get("mira_debug") || window.__MIRA_DEBUG || "").toLowerCase();
    mode = MIRA_DEBUG_MODES.includes(m) ? m : "";
    const h = Number(q.get("hot"));
    if (h > 0 && h < 1) hotLo = h;
  } catch (_) {}
}
if (typeof window !== "undefined") readUrl();
const getMiraDebug = () => ({
  mode,
  code: Math.max(0, MIRA_DEBUG_MODES.indexOf(mode)),
  hotLo
});
const miraDebugActive = () => mode !== "";
function setMiraDebug(m, opts = {}) {
  mode = MIRA_DEBUG_MODES.includes(m) ? m : "";
  if (opts.hotLo > 0 && opts.hotLo < 1) hotLo = opts.hotLo;
  return getMiraDebug();
}
function setMiraHotThreshold(v) {
  if (v > 0 && v < 1) hotLo = v;
  return hotLo;
}
export { HOT_THRESHOLD_DEFAULT, MIRA_DEBUG_MODES, getMiraDebug, miraDebugActive, setMiraDebug, setMiraHotThreshold };

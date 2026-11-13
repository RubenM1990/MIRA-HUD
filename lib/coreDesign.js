// Default design numbers for the ring, particles and backdrop.
import { useSyncExternalStore } from "react";
const FRONT_DESIGN_DEFAULTS = Object.freeze({
  particleSize: 1,
  particleAmount: 1200,
  particleGlow: 1,
  particleSpread: 1,
  coreLight: 0,
  particleIdleSpeed: 1,
  particleListeningSpeed: 1,
  particleSpeakingSpeed: 1,
  particleDirection: "outward",
  orbDiameter: 310,
  orbThickness: 2.5,
  orbGlow: 1,
  orbInnerGlow: 0,
  orbTraceStrength: 1,
  orbAxisStrength: 0,
  cyanWaves: 7,
  goldWaves: 3,
  waveThickness: 1,
  waveGlow: 1,
  waveDefinition: 1,
  waveAmplitude: 1,
  waveSpread: 1,
  waveSparkleDensity: 1,
  waveSparkleBrightness: 1,
  waveDustAmount: 0,
  waveDustSize: 1.5,
  waveDustDistance: 0,
  waveDustSpeed: 1,
  waveIdleSpeed: 1,
  waveListeningSpeed: 1,
  waveSpeakingSpeed: 1,
  backgroundLuminance: 1,
  shaderStrength: 1,
  backgroundColor: "#122c43",
  backgroundStars: 0,
  backgroundStarSpread: 1,
  backgroundHaze: 0
});
const FRONT_REFERENCE_PRESET = Object.freeze({
  particleSize: 0.8,
  particleSpread: 1.9,
  coreLight: 1.5,
  orbThickness: 2.8,
  orbGlow: 1.7,
  orbInnerGlow: 1.6,
  orbTraceStrength: 1.8,
  orbAxisStrength: 1.1,
  cyanWaves: 12,
  goldWaves: 5,
  waveThickness: 0.85,
  waveGlow: 1.15,
  waveDefinition: 1.8,
  waveAmplitude: 0.5,
  waveSpread: 0.5,
  waveSparkleDensity: 2.8,
  waveSparkleBrightness: 1.6,
  waveDustAmount: 60,
  waveDustSize: 1.3,
  waveDustDistance: 8,
  waveDustSpeed: 1,
  backgroundLuminance: 0.65,
  shaderStrength: 0.9,
  backgroundColor: "#071d2c",
  backgroundStars: 110,
  backgroundStarSpread: 1,
  backgroundHaze: 1.2
});
const FRONT_DESIGN_FIELDS = [["Cyan particles", "particleSize", "Size", 0.4, 2.5, 0.05, "x"], ["Cyan particles", "particleAmount", "Amount", 0, 1200, 10, ""], ["Cyan particles", "particleGlow", "Glow", 0, 2.5, 0.05, "x"], ["Cyan particles", "particleSpread", "Cloud spread", 0.5, 2.3, 0.05, "x"], ["Cyan particles", "coreLight", "Center light", 0, 2.5, 0.05, "x"], ["Cyan particles", "particleIdleSpeed", "Idle speed", 0, 3, 0.05, "x"], ["Cyan particles", "particleListeningSpeed", "Listening speed", 0, 3, 0.05, "x"], ["Cyan particles", "particleSpeakingSpeed", "Speaking speed", 0, 3, 0.05, "x"], ["Central orb", "orbDiameter", "Diameter", 220, 420, 2, "px"], ["Central orb", "orbThickness", "Line thickness", 0, 7, 0.1, "px"], ["Central orb", "orbGlow", "Glow", 0, 2.5, 0.05, "x"], ["Central orb", "orbInnerGlow", "Inner glow", 0, 2.5, 0.05, "x"], ["Central orb", "orbTraceStrength", "Fine rings", 0, 2.5, 0.05, "x"], ["Central orb", "orbAxisStrength", "Compass marks", 0, 2.5, 0.05, "x"], ["Waves", "cyanWaves", "Cyan lines", 0, 16, 1, ""], ["Waves", "goldWaves", "Gold lines", 0, 8, 1, ""], ["Waves", "waveThickness", "Thickness", 0.3, 2.5, 0.05, "x"], ["Waves", "waveGlow", "Glow", 0, 2.5, 0.05, "x"], ["Waves", "waveDefinition", "Sharp line", 0.3, 2.5, 0.05, "x"], ["Waves", "waveAmplitude", "Curve height", 0.3, 2, 0.05, "x"], ["Waves", "waveSpread", "Vertical spread", 0.3, 2, 0.05, "x"], ["Waves", "waveSparkleDensity", "Sparkle frequency", 0, 4, 0.05, "x"], ["Waves", "waveSparkleBrightness", "Sparkle brightness", 0, 2.5, 0.05, "x"], ["Waves", "waveDustAmount", "Star dust amount", 0, 100, 5, "%"], ["Waves", "waveDustSize", "Star dust size", 0.5, 4, 0.1, "px"], ["Waves", "waveDustDistance", "Distance from waves", 0, 60, 1, "px"], ["Waves", "waveDustSpeed", "Star dust speed", 0, 3, 0.05, "x"], ["Waves", "waveIdleSpeed", "Idle speed", 0, 3, 0.05, "x"], ["Waves", "waveListeningSpeed", "Listening speed", 0, 3, 0.05, "x"], ["Waves", "waveSpeakingSpeed", "Speaking speed", 0, 3, 0.05, "x"], ["Background", "backgroundLuminance", "Luminance", 0.3, 2, 0.05, "x"], ["Background", "shaderStrength", "Shader strength", 0, 2, 0.05, "x"], ["Background", "backgroundStars", "Star points", 0, 800, 10, ""], ["Background", "backgroundStarSpread", "Star spread", 0.5, 3, 0.05, "x"], ["Background", "backgroundHaze", "Cyan haze", 0, 2.5, 0.05, "x"]];
const STORAGE_KEY = "mira_ui.coreDesign.v1";
const listeners = new Set();
const numeric = new Map(FRONT_DESIGN_FIELDS.map(([, key,, min, max]) => [key, [min, max]]));
let current = FRONT_DESIGN_DEFAULTS;
let preview = null;
function clean(candidate) {
  const next = {
    ...FRONT_DESIGN_DEFAULTS
  };
  if (!candidate || typeof candidate !== "object") return next;
  for (const [key, [min, max]] of numeric) {
    const value = Number(candidate[key]);
    if (Number.isFinite(value)) next[key] = Math.max(min, Math.min(max, value));
  }
  if (["outward", "inward", "orbit", "mixed"].includes(candidate.particleDirection)) next.particleDirection = candidate.particleDirection;
  if (/^#[0-9a-fA-F]{6}$/.test(candidate.backgroundColor || "")) next.backgroundColor = candidate.backgroundColor;
  return next;
}
try {
  current = clean(JSON.parse(localStorage.getItem(STORAGE_KEY)));
} catch {}
function applyBackground() {
  if (typeof document === "undefined") return;
  const tint = (hex, factor) => "#" + [1, 3, 5].map(i => Math.min(255, Math.round(parseInt(hex.slice(i, i + 2), 16) * factor)).toString(16).padStart(2, "0")).join("");
  document.documentElement.style.setProperty("--front-background-center", tint(current.backgroundColor, current.backgroundLuminance));
  document.documentElement.style.setProperty("--front-background-edge", current.backgroundColor === FRONT_DESIGN_DEFAULTS.backgroundColor && current.backgroundLuminance === 1 ? "#050b14" : tint(current.backgroundColor, current.backgroundLuminance * 0.24));
  document.documentElement.style.setProperty("--front-orb-radius", `${current.orbDiameter / 2}px`);
}
applyBackground();
function emit() {
  for (const fn of listeners) fn();
}
const getFrontDesign = () => current;
const subscribeFrontDesign = fn => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const useFrontDesign = () => useSyncExternalStore(subscribeFrontDesign, getFrontDesign);
const getFrontPreview = () => preview;
function setFrontPreview(value) {
  preview = ["idle", "listening", "speaking"].includes(value) ? value : null;
  emit();
}
function setFrontDesign(key, value) {
  current = clean({
    ...current,
    [key]: value
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {}
  applyBackground();
  emit();
}
function resetFrontDesign() {
  current = FRONT_DESIGN_DEFAULTS;
  preview = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
  applyBackground();
  emit();
}
function applyFrontReferencePreset() {
  current = clean({
    ...FRONT_DESIGN_DEFAULTS,
    ...FRONT_REFERENCE_PRESET
  });
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {}
  applyBackground();
  emit();
}
export { FRONT_DESIGN_DEFAULTS, FRONT_DESIGN_FIELDS, FRONT_REFERENCE_PRESET, applyFrontReferencePreset, getFrontDesign, getFrontPreview, resetFrontDesign, setFrontDesign, setFrontPreview, subscribeFrontDesign, useFrontDesign };

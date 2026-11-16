"use client";

// MiraWorld - stacks every layer of the MIRA HUD in the order the look needs them:
//   ground -> wave backdrop -> MIRA field -> gold ring -> particle core (+ centre lines)
//   -> status bar -> the tap target over the ring.
// There is no voice call in this repo. Tapping the orb cycles her state
// (standby -> listening -> processing -> speaking) and a simulated voice level
// drives the ring, lines, field and equalizer exactly as a real voice would.
// While listening, the visitor's real microphone drives it (falls back to the demo voice if refused).
// To wire a real voice, call setVoiceEnergy('output' | 'input', 0..1) every frame
// and set the state yourself.
// The Design dial button opens MiraDial: every number of the look as a slider.

import { useEffect, useRef, useState } from "react";
import ShaderBackground from "./ShaderBackground";
import MiraField from "./MiraField";
import MiraRing from "./MiraRing";
import MiraCore3D from "./MiraCore3D";
import MiraStatusBar from "./MiraStatusBar";
import MiraDial from "./MiraDial";
import { enterMira, tickMiraVoice } from "../lib/miraStage";
import { setVoiceEnergy, getVoiceEnergy } from "../lib/voiceEnergy";
import { startMic, stopMic, micLevel } from "../lib/micLevel";
import "./mira-ring.css";

const CYCLE = ["idle", "listening", "thinking", "speaking"];
const LABEL = { idle: "standby", listening: "listening", thinking: "processing", speaking: "speaking" };

// A voice-like level: syllables (fast bumps) inside phrases (slow swells) with short pauses.
function fakeVoice(t, seed) {
  const phrase = Math.max(0, Math.sin(t * 0.9 + seed) * 0.6 + 0.55);
  const syll = Math.max(0, Math.sin(t * 11.3 + seed * 3) * Math.sin(t * 7.1 + 1.7));
  const jitter = (Math.sin(t * 37.0 + seed) + 1) * 0.08;
  return Math.min(1, phrase * (0.25 + syll * 0.9) + jitter * phrase);
}

export default function MiraWorld() {
  const [state, setState] = useState("idle");
  const [reducedMotion, setReducedMotion] = useState(false);
  const [dialOpen, setDialOpen] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // MIRA's look is on from the first frame (no entrance animation from another palette).
  useEffect(() => { enterMira({ instant: true }); }, []);

  // One loop feeds the simulated voice and her envelope (voice / talk / listen) every frame.
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      const t = now / 1000;
      const s = stateRef.current;
      setVoiceEnergy("output", s === "speaking" ? fakeVoice(t, 0.3) : 0);
      const mic = s === "listening" ? micLevel() : null;
      setVoiceEnergy("input", s !== "listening" ? 0 : mic != null ? mic : fakeVoice(t * 0.8, 2.1) * 0.7);
      tickMiraVoice(dt, { energy: getVoiceEnergy("output"), speaking: s === "speaking", listening: s === "listening" });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Listening uses the visitor's real microphone (asked on the tap); any other state lets it go.
  useEffect(() => {
    if (state === "listening") startMic(); else stopMic();
  }, [state]);
  useEffect(() => () => stopMic(), []);

  const next = () => setState((s) => CYCLE[(CYCLE.indexOf(s) + 1) % CYCLE.length]);

  return (
    <>
      <div aria-hidden="true" style={{
        position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 80% 70% at 50% 46%, #0d0718 0%, #06030d 55%, #030108 100%)",
      }} />

      <ShaderBackground opacity={0.12} voiceActive={state === "speaking" || state === "listening"} />

      {!reducedMotion && <MiraField state={state} />}

      <div style={{ position: "fixed", inset: 0, zIndex: 15, pointerEvents: "none" }}>
        <div data-mira-orb style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
          <div className="mira-orb-scale"><MiraRing state={state} /></div>
        </div>
      </div>

      {!reducedMotion && (
        <div style={{ position: "fixed", inset: 0, zIndex: 15, pointerEvents: "none" }}>
          <MiraCore3D state="idle" />
        </div>
      )}

      <MiraStatusBar state={state} />

      <button
        type="button"
        onClick={next}
        aria-label={`MIRA is ${LABEL[state]}. Tap to change her state.`}
        title="Tap to change her state"
        className="mira-tap"
      />

      {dialOpen
        ? <MiraDial onClose={() => setDialOpen(false)} state={state} onState={setState} />
        : <button type="button" className="dial-pill" onClick={() => setDialOpen(true)} aria-label="Open the design dial">Design dial</button>}
    </>
  );
}

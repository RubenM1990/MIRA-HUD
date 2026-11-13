"use client";
// The design dial: every key number of MIRA's look as a slider, drawn from lib/miraDial (DIALS).
// A move takes effect at once and is kept in this browser. COPY MY NUMBERS / LOAD NUMBERS move a
// full set between browsers; to ship your own look, paste your numbers into the `def` column.
import { useEffect, useMemo, useRef, useState } from "react";
import { DIALS, dial, setDial, resetDials, changedDials, exportDials, importDials, subscribeDials } from "../lib/miraDial";

const V = "#a78bfa", V2 = "#e9d5ff", DIM = "rgba(221,214,254,0.55)";
const MONO = "'Share Tech Mono', monospace", HEAD = "'Space Grotesk', sans-serif";
const fmt = (d, v) => (d.step >= 1 ? String(Math.round(v)) : v.toFixed(d.step >= 0.1 ? 1 : 2));

// state / onState: her real state, the same one tapping the orb changes.
const STATES = [["idle", "standby"], ["listening", "listening"], ["thinking", "processing"], ["speaking", "speaking"]];

export default function MiraDial({ onClose, state, onState }) {
  const [, bump] = useState(0);
  const [side, setSide] = useState(() => { try { return localStorage.getItem("mira_hud_dial_side") || "left"; } catch (_) { return "left"; } });
  const [open, setOpen] = useState({ "Centre lines": true });
  const [note, setNote] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const pasteRef = useRef(null);
  useEffect(() => subscribeDials(() => bump((n) => n + 1)), []);
  useEffect(() => { try { localStorage.setItem("mira_hud_dial_side", side); } catch (_) {} }, [side]);

  const groups = useMemo(() => {
    const m = new Map();
    for (const d of DIALS) { if (!m.has(d.group)) m.set(d.group, []); m.get(d.group).push(d); }
    return [...m.entries()];
  }, []);
  const changed = changedDials();
  const nChanged = Object.keys(changed).length;
  const flash = (s) => { setNote(s); setTimeout(() => setNote(""), 2600); };

  const copy = async () => {
    const text = exportDials();
    try { await navigator.clipboard.writeText(text); flash("Copied to the clipboard."); }
    catch (_) { setPasteOpen(true); setTimeout(() => { if (pasteRef.current) { pasteRef.current.value = text; pasteRef.current.select(); } }, 30); flash("Select all and copy."); }
  };
  const paste = () => {
    const raw = pasteRef.current ? pasteRef.current.value : "";
    try {
      const m = raw.match(/all:\s*(\{[\s\S]*\})\s*$/) || raw.match(/(\{[\s\S]*\})/);
      const n = importDials(JSON.parse(m ? m[1] : raw));
      flash(n + " numbers loaded."); setPasteOpen(false);
    } catch (_) { flash("Could not read those numbers."); }
  };

  const btn = (active) => ({
    fontFamily: MONO, fontSize: 10.5, letterSpacing: 1.2, padding: "6px 9px", cursor: "pointer", borderRadius: 3,
    border: "1px solid " + (active ? V : "rgba(167,139,250,0.35)"), color: active ? "#0b0614" : V2,
    background: active ? V : "rgba(167,139,250,0.08)", textTransform: "uppercase",
  });

  return (
    <div role="dialog" aria-label="MIRA design dial" style={{
      position: "fixed", top: 64, bottom: 18, [side]: 14, width: "min(340px, calc(100vw - 28px))", zIndex: 4000, display: "flex", flexDirection: "column",
      background: "linear-gradient(180deg, rgba(14,8,28,0.93), rgba(8,4,18,0.95))", border: "1px solid rgba(167,139,250,0.4)",
      borderRadius: 6, boxShadow: "0 0 34px rgba(124,58,237,0.28), inset 0 0 0 1px rgba(167,139,250,0.06)", backdropFilter: "blur(6px)", color: V2,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 12px", borderBottom: "1px solid rgba(167,139,250,0.22)" }}>
        <div style={{ fontFamily: HEAD, fontWeight: 600, fontSize: 14, letterSpacing: 2.5, color: V, textShadow: "0 0 12px rgba(167,139,250,0.7)", flex: 1 }}>MIRA DIAL</div>
        <button aria-label="Move the panel to the other side" style={btn(false)} onClick={() => setSide(side === "left" ? "right" : "left")}>{side === "left" ? "to right" : "to left"}</button>
        <button aria-label="Close the dial" style={btn(false)} onClick={onClose}>close</button>
      </div>

      <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(167,139,250,0.14)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: DIM, letterSpacing: 1 }}>HER STATE</span>
        {STATES.map(([k, l]) => (
          <button key={k} aria-pressed={state === k} style={btn(state === k)} onClick={() => onState(k)}>{l}</button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "4px 12px 10px" }}>
        {groups.map(([g, rows]) => {
          const isOpen = !!open[g];
          const moved = rows.filter((d) => d.key in changed).length;
          return (
            <div key={g} style={{ borderBottom: "1px solid rgba(167,139,250,0.12)" }}>
              <div role="button" tabIndex={0} aria-expanded={isOpen} style={{ display: "flex", alignItems: "center", padding: "9px 0 7px", cursor: "pointer" }}
                onClick={() => setOpen({ ...open, [g]: !isOpen })}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen({ ...open, [g]: !isOpen }); } }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: V, width: 14 }}>{isOpen ? "-" : "+"}</span>
                <span style={{ fontFamily: HEAD, fontSize: 12.5, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", flex: 1 }}>{g}</span>
                {moved > 0 && <span style={{ fontFamily: MONO, fontSize: 10, color: "#f5a623", marginRight: 8 }}>{moved} moved</span>}
                {isOpen && moved > 0 && <button style={{ ...btn(false), padding: "3px 7px", fontSize: 9.5 }} onClick={(e) => { e.stopPropagation(); resetDials(g); }}>reset</button>}
              </div>
              {isOpen && rows.map((d) => {
                const v = dial(d.key), isMoved = d.key in changed;
                return (
                  <div key={d.key} style={{ padding: "3px 0 9px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <label htmlFor={"dial-" + d.key} style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: isMoved ? V2 : DIM, flex: 1, lineHeight: 1.25 }}>{d.label}</label>
                      <span style={{ fontFamily: MONO, fontSize: 12.5, color: isMoved ? "#f5a623" : V, minWidth: 38, textAlign: "right" }}>{fmt(d, v)}</span>
                    </div>
                    <input id={"dial-" + d.key} type="range" min={d.min} max={d.max} step={d.step} value={v}
                      onChange={(e) => setDial(d.key, e.target.value)} onDoubleClick={() => setDial(d.key, d.def)}
                      title={"Ships at " + fmt(d, d.def) + ". Double-click to go back to it."}
                      style={{ width: "100%", accentColor: isMoved ? "#f5a623" : V, cursor: "pointer", margin: "4px 0 0" }} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {pasteOpen && (
        <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(167,139,250,0.22)" }}>
          <textarea ref={pasteRef} rows={4} placeholder="Paste numbers here" style={{ width: "100%", boxSizing: "border-box", background: "rgba(0,0,0,0.4)", color: V2, border: "1px solid rgba(167,139,250,0.35)", borderRadius: 3, fontFamily: MONO, fontSize: 10.5, padding: 6 }} />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            <button style={btn(false)} onClick={paste}>load these</button>
            <button style={btn(false)} onClick={() => setPasteOpen(false)}>cancel</button>
          </div>
        </div>
      )}
      <div style={{ padding: "9px 12px", borderTop: "1px solid rgba(167,139,250,0.22)", display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <button style={btn(true)} onClick={copy}>copy my numbers</button>
        <button style={btn(false)} onClick={() => setPasteOpen(!pasteOpen)}>load numbers</button>
        <button style={btn(false)} onClick={() => resetDials()}>reset all</button>
        <span style={{ fontFamily: MONO, fontSize: 10.5, color: note ? "#f5a623" : DIM, flexBasis: "100%" }}>
          {note || ((nChanged ? nChanged + " numbers moved. " : "Everything is at the shipped numbers. ") + "Kept in this browser.")}
        </span>
      </div>
    </div>
  );
}

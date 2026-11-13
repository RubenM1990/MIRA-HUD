// The gold ring frame around the core (pure SVG). Its size comes from the dial ("ring.diameter").
import { useSyncExternalStore } from "react";
import { dial, subscribeDials } from "../lib/miraDial";
const GOLD = "#f5a623";
function SoundWaves({
  cx,
  cy,
  R,
  active
}) {
  const waves = [0, 1, 2, 3];
  return <g>
      {waves.map(i => <circle key={i} cx={cx} cy={cy} r={R} stroke={GOLD} strokeWidth={active ? 1.5 : 0.8} fill="none" opacity={active ? 0.55 : 0.18} className={`sound-wave wave-${i}`} style={{
      transformOrigin: `${cx}px ${cy}px`
    }} />)}
    </g>;
}
const readDiameter = () => dial("ring.diameter");
function MiraRing({ state = "idle" }) {
  const diameter = useSyncExternalStore(subscribeDials, readDiameter, readDiameter);
  const W = 900,
    H = 520;
  const cx = W / 2,
    cy = H / 2;
  const R = diameter / 2;
  const OUTER = [23, 39, 57, 75, 95].map(offset => Math.min(250, R + offset));
  const thickness = 2.5;
  const isActive = state !== "idle";
  const isListening = state === "listening";
  const isThinking = state === "thinking";
  return <div className="mira-ring-wrap" data-state={state} style={{
    width: W,
    height: H,
    "--front-orb-radius": `${R}px`
  }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" style={{
      overflow: "visible"
    }}>
        <defs>
          <linearGradient id="orbLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffc45e" />
            <stop offset="25%" stopColor="#fff3c4" />
            <stop offset="55%" stopColor="#ffbd4e" />
            <stop offset="82%" stopColor="#ffe5a0" />
            <stop offset="100%" stopColor={GOLD} />
          </linearGradient>
          <filter id="orbLineHalo" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={4} />
          </filter>
        </defs>

        {OUTER.map((r, i) => <circle key={i} cx={cx} cy={cy} r={r} stroke={GOLD} strokeWidth={i === 0 ? 0.8 : 0.4} strokeOpacity={0.15 - i * 0.02} fill="none" strokeDasharray={i % 2 ? "3 7" : "none"} />)}

        <SoundWaves cx={cx} cy={cy} R={R} active={isActive || isListening} />

        {isThinking && <circle cx={cx} cy={cy} r={R + 22} stroke={GOLD} strokeWidth="1" strokeOpacity="0.45" strokeDasharray="8 14" fill="none" className="orb-orbit-cw" style={{
          transformOrigin: `${cx}px ${cy}px`
        }} />}

        <circle cx={cx} cy={cy} r={R} stroke={GOLD} strokeWidth={thickness * 1.5} strokeOpacity={0.6} fill="none" filter="url(#orbLineHalo)" className="orb-ring-glow" />
        <circle data-orb-ring cx={cx} cy={cy} r={R} stroke="url(#orbLine)" strokeWidth={thickness} strokeOpacity="0.98" fill="none" className="orb-ring-bright" />

        <circle cx={cx} cy={cy} r={R * 0.58} stroke={GOLD} strokeWidth="1.5" strokeOpacity={isActive ? 0.45 : 0.15} fill="none" strokeDasharray="55 25" className="orb-orbit-cw" style={{
          transformOrigin: `${cx}px ${cy}px`
        }} />
        <circle cx={cx} cy={cy} r={R * 0.35} stroke={GOLD} strokeWidth="1" strokeOpacity={isActive ? 0.3 : 0.1} fill="none" strokeDasharray="28 18" className="orb-orbit-ccw" style={{
          transformOrigin: `${cx}px ${cy}px`
        }} />
      </svg>
    </div>;
}
export { MiraRing as default };

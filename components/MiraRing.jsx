// The gold ring frame around the core (pure SVG).
import { useSyncExternalStore } from "react";
import LiveWaveform from "./LiveWaveform";
import { useFrontDesign } from "../lib/coreDesign";
import { dial, subscribeDials } from "../lib/miraDial";
const GOLD = "#f5a623";
const GOLD_BRIGHT = "#ffd080";
function OrbitDot({
  cx,
  cy,
  r,
  angleDeg,
  size = 4
}) {
  const rad = angleDeg * Math.PI / 180;
  const x = cx + r * Math.cos(rad);
  const y = cy + r * Math.sin(rad);
  return <circle cx={x} cy={y} r={size} fill={GOLD} style={{
    filter: `drop-shadow(0 0 ${size * 2}px ${GOLD})`
  }} />;
}
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
function MiraRing({
  state = "idle",
  onRingClick,
  variant,
  designable = false,
  miraDesign = true
}) {
  const design = useFrontDesign();
  const miraDiameter = useSyncExternalStore(subscribeDials, () => dial("ring.diameter"));
  const frameOnly = variant === "frame";
  const W = 900,
    H = 520;
  const cx = W / 2,
    cy = frameOnly ? H / 2 : H / 2 - 20;
  const R = designable ? design.orbDiameter / 2 : miraDesign ? miraDiameter / 2 : 155;
  const atmosphereRadius = Math.min(R + 180, 360);
  const OUTER = [23, 39, 57, 75, 95].map(offset => Math.min(250, R + offset));
  const thickness = designable ? design.orbThickness : 2.5;
  const glow = designable ? design.orbGlow : 1;
  const innerGlow = frameOnly && designable ? design.orbInnerGlow : 0;
  const ringVisible = thickness > 0 || glow > 0;
  const isActive = state !== "idle";
  const isListening = state === "listening";
  const isSpeaking = state === "speaking";
  const isThinking = state === "thinking";
  const label = isListening ? "LISTENING" : isSpeaking ? "SPEAKING" : isThinking ? "PROCESSING" : "STANDBY";
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
          <radialGradient id="ambBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.08" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </radialGradient>
          <radialGradient id="frontCyanHaze" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00dfff" stopOpacity="0.26" />
            <stop offset="45%" stopColor="#00aadd" stopOpacity="0.09" />
            <stop offset="100%" stopColor="#00aadd" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="frontCoreLight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#efffff" stopOpacity="0.9" />
            <stop offset="12%" stopColor="#43eaff" stopOpacity="0.42" />
            <stop offset="45%" stopColor="#00bbeb" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#00bbeb" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="frontOrbInnerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffc45e" stopOpacity="0" />
            <stop offset="52%" stopColor="#ffc45e" stopOpacity="0.015" />
            <stop offset="76%" stopColor="#ffc45e" stopOpacity="0.14" />
            <stop offset="92%" stopColor="#ffd080" stopOpacity="0.42" />
            <stop offset="100%" stopColor="#ffd080" stopOpacity="0.55" />
          </radialGradient>
          <filter id="ringBlur" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="7" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="orbLineHalo" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation={2 + glow * 2} />
          </filter>
          <filter id="dotF" x="-300%" y="-300%" width="700%" height="700%">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="txtF" x="-30%" y="-80%" width="160%" height="260%">
            <feGaussianBlur stdDeviation="5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {frameOnly && designable && design.backgroundHaze > 0 && <circle cx={cx} cy={cy} r={atmosphereRadius} fill="url(#frontCyanHaze)" opacity={Math.min(1, design.backgroundHaze * 0.6)} />}
        {frameOnly && designable && design.coreLight > 0 && <circle cx={cx} cy={cy} r={R * 0.78} fill="url(#frontCoreLight)" opacity={Math.min(1, design.coreLight * 0.58)} />}
        {innerGlow > 0 && <circle cx={cx} cy={cy} r={R} fill="url(#frontOrbInnerGlow)" opacity={Math.min(1, innerGlow * 0.55)} />}

        <g opacity={ringVisible ? 1 : 0}>
        
        {!frameOnly && <ellipse cx={cx} cy={cy} rx={R + 130} ry={R + 90} fill="url(#ambBg)" className="orb-ambient" />}

        
        {OUTER.map((r, i) => <circle key={i} cx={cx} cy={cy} r={r} stroke={GOLD} strokeWidth={i === 0 ? 0.8 : 0.4} strokeOpacity={Math.min(1, (0.15 - i * 0.02) * (designable ? design.orbTraceStrength : 1))} fill="none" strokeDasharray={i % 2 ? "3 7" : "none"} />)}

        

        
        <SoundWaves cx={cx} cy={cy} R={R} active={isActive || isListening} />

        
        {isThinking && <circle cx={cx} cy={cy} r={R + 22} stroke={GOLD} strokeWidth="1" strokeOpacity="0.45" strokeDasharray="8 14" fill="none" className="orb-orbit-cw" style={{
          transformOrigin: `${cx}px ${cy}px`
        }} />}

        {frameOnly && designable && design.orbAxisStrength > 0 && <g opacity={Math.min(1, design.orbAxisStrength * 0.65)}>
          <line x1={cx} y1={cy - R - 100} x2={cx} y2={cy - R - 12} stroke={GOLD_BRIGHT} strokeWidth="0.8" strokeDasharray="2 6" />
          <line x1={cx} y1={cy + R + 12} x2={cx} y2={cy + R + 100} stroke={GOLD_BRIGHT} strokeWidth="0.8" strokeDasharray="2 6" />
          <line x1={cx - R - 95} y1={cy} x2={cx - R - 12} y2={cy} stroke="#41d9ef" strokeWidth="0.7" strokeDasharray="2 6" />
          <line x1={cx + R + 12} y1={cy} x2={cx + R + 95} y2={cy} stroke="#41d9ef" strokeWidth="0.7" strokeDasharray="2 6" />
          <circle cx={cx} cy={cy - R - 103} r="1.5" fill={GOLD_BRIGHT} />
          <circle cx={cx} cy={cy + R + 103} r="1.5" fill={GOLD_BRIGHT} />
        </g>}

        
        <circle cx={cx} cy={cy} r={R} stroke={GOLD} strokeWidth={Math.max(0.8, thickness * 1.5)} strokeOpacity={Math.min(1, 0.6 * glow)} fill="none" filter="url(#orbLineHalo)" className="orb-ring-glow" />
        
        <circle data-orb-ring cx={cx} cy={cy} r={R} stroke="url(#orbLine)" strokeWidth={thickness} strokeOpacity="0.98" fill="none" className="orb-ring-bright" />

        
        <circle cx={cx} cy={cy} r={R * 0.58} stroke={GOLD} strokeWidth="1.5" strokeOpacity={Math.min(1, (isActive ? 0.45 : 0.15) * (designable ? design.orbTraceStrength : 1))} fill="none" strokeDasharray="55 25" className="orb-orbit-cw" style={{
          transformOrigin: `${cx}px ${cy}px`
        }} />
        <circle cx={cx} cy={cy} r={R * 0.35} stroke={GOLD} strokeWidth="1" strokeOpacity={Math.min(1, (isActive ? 0.3 : 0.1) * (designable ? design.orbTraceStrength : 1))} fill="none" strokeDasharray="28 18" className="orb-orbit-ccw" style={{
          transformOrigin: `${cx}px ${cy}px`
        }} />
        </g>

        
        {!frameOnly && <g>
            
            <line x1={cx - R - 90} y1={cy} x2={cx - R + 15} y2={cy} stroke={GOLD} strokeWidth="1" opacity={isActive ? 0.55 : 0.15} strokeDasharray="4 3" />
            <line x1={cx + R - 15} y1={cy} x2={cx + R + 90} y2={cy} stroke={GOLD} strokeWidth="1" opacity={isActive ? 0.55 : 0.15} strokeDasharray="4 3" />

            
            <LiveWaveform state={state} cx={cx} cy={cy} width={200} />

            
            <circle cx={cx} cy={cy} r={20} stroke={GOLD} strokeWidth="1.5" strokeOpacity="0.7" fill="#030200" filter="url(#ringBlur)" className="orb-center-ring" />
            <circle cx={cx} cy={cy} r={6} fill={GOLD_BRIGHT} opacity="0.95" className="orb-center" style={{
          filter: `drop-shadow(0 0 10px ${GOLD})`
        }} />

            
            <text x={cx} y={cy + R * 0.52} textAnchor="middle" fill={GOLD} fontSize="12" fontFamily="'Inter',monospace" fontWeight="400" letterSpacing="0.28em" opacity="0.55" filter="url(#txtF)">
              {label}
            </text>

            
            {[0, 1, 2].map(i => <circle key={i} cx={cx + (i - 1) * 12} cy={cy + R * 0.52 + 18} r={2.5} fill={GOLD} className={`orb-dot-blink blink-${i}`} />)}
          </g>}

        
        {onRingClick && <circle cx={cx} cy={cy} r={R + 20} fill="transparent" style={{
        cursor: "pointer",
        pointerEvents: "all"
      }} onClick={onRingClick} />}

      </svg>
    </div>;
}
export { MiraRing as default };

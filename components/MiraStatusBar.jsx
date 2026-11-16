// The equalizer + state label along the bottom of the screen.
import LiveWaveform from "./LiveWaveform";
const VIO = "#c084fc";
const VIO_BRIGHT = "#ede9fe";
function MiraStatusBar({
  state = "idle"
}) {
  const W = 420,
    H = 130;
  const A = VIO,
    B = VIO_BRIGHT;
  const cx = W / 2,
    cy = 48;
  const isActive = state !== "idle";
  const label = state === "listening" ? "LISTENING" : state === "speaking" ? "SPEAKING" : state === "thinking" ? "PROCESSING" : "STANDBY";
  return <div className="mira-status" style={{
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 26,
    display: "flex",
    justifyContent: "center",
    zIndex: 18,
    pointerEvents: "none"
  }}>
      <svg className="orb-status-bar" width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" style={{
      transition: "filter .8s ease"
    }}>
        <style>{`.orb-status-bar * { transition: fill .8s ease, stroke .8s ease; }`}</style>
        <defs>
          <filter id="sbBlur" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        
        <line x1={cx - 150} y1={cy} x2={cx - 28} y2={cy} stroke={A} strokeWidth="1" opacity={isActive ? 0.5 : 0.18} strokeDasharray="4 3" />
        <line x1={cx + 28} y1={cy} x2={cx + 150} y2={cy} stroke={A} strokeWidth="1" opacity={isActive ? 0.5 : 0.18} strokeDasharray="4 3" />

        
        <LiveWaveform state={state} cx={cx} cy={cy} width={170} color={A} />

        
        <circle cx={cx} cy={cy} r={20} stroke={A} strokeWidth="1.5" strokeOpacity="0.7" fill="#030200" filter="url(#sbBlur)" className="orb-center-ring" />
        <circle cx={cx} cy={cy} r={6} fill={B} opacity="0.95" className="orb-center" style={{
        filter: `drop-shadow(0 0 10px ${A})`
      }} />

        
        <text x={cx} y={cy + 44} textAnchor="middle" fill={A} fontSize="13" fontFamily="'Share Tech Mono', monospace" letterSpacing="0.4em" opacity="0.75">{label}</text>

        
        {[0, 1, 2].map(i => <circle key={i} cx={cx + (i - 1) * 12} cy={cy + 62} r={2.5} fill={A} className={`orb-dot-blink blink-${i}`} />)}

        
        {!isActive && <text x={cx} y={cy + 80} textAnchor="middle" fill={A} fontSize="9" fontFamily="'Share Tech Mono', monospace" letterSpacing="0.14em" opacity="0.32">{"TAP THE ORB TO CHANGE HER STATE"}</text>}
      </svg>
    </div>;
}
export { MiraStatusBar as default };

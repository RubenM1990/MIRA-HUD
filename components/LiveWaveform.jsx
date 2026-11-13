// Equalizer bars that follow the voice level in lib/voiceEnergy.
import { useEffect, useRef } from "react";
import { getVoiceEnergy } from "../lib/voiceEnergy";
function LiveWaveform({
  state,
  cx,
  cy,
  width = 200,
  color = "#f5a623"
}) {
  const bars = useRef([]);
  const active = state === "speaking" || state === "listening";
  const count = 28;
  const barW = 3;
  const gap = (width - count * barW) / (count - 1);
  useEffect(() => {
    if (!active) {
      bars.current.forEach(bar => {
        if (!bar) return;
        bar.setAttribute("y", String(cy - 1.5));
        bar.setAttribute("height", "3");
      });
      return;
    }
    let frame;
    let envelope = 0;
    const motion = Array.from({
      length: count
    }, () => ({
      height: 3,
      target: 3,
      next: 0
    }));
    const maxHeight = width < 190 ? 38 : 52;
    const tick = now => {
      const energy = getVoiceEnergy(state === "speaking" ? "output" : "input");
      const strength = Math.pow(Math.min(1, energy * 1.8), 0.7);
      envelope += (strength - envelope) * (strength > envelope ? 0.5 : 0.2);
      bars.current.forEach((bar, i) => {
        if (!bar) return;
        const item = motion[i];
        if (now >= item.next) {
          const variation = 0.18 + Math.random() * 1.15;
          const center = 0.72 + 0.28 * (1 - Math.abs(i - (count - 1) / 2) / ((count - 1) / 2));
          item.target = 3 + Math.min(1, envelope * variation * center) * (maxHeight - 3);
          item.next = now + 45 + Math.random() * 115;
        }
        item.height += (item.target - item.height) * (item.target > item.height ? 0.36 : 0.22);
        bar.setAttribute("y", String(cy - item.height / 2));
        bar.setAttribute("height", String(item.height));
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, state, cy, width]);
  return <g>{Array.from({
      length: count
    }, (_, i) => {
      const x = cx - width / 2 + i * (barW + gap);
      return <rect key={i} ref={el => {
        bars.current[i] = el;
      }} x={x} y={cy - 1.5} width={barW} height={3} rx={1.5} fill={color} opacity={active ? 0.85 : 0.3} />;
    })}</g>;
}
export { LiveWaveform as default };

// The visitor's real microphone level (0..1) while MIRA is listening.
// Starts only when asked (after a tap, so the browser allows it) and stops when she stops listening.
// If the visitor says no, or there is no mic, level() stays null and the demo voice is used instead.
let stream = null, ctx = null, analyser = null, buf = null, smooth = 0, starting = null;

export async function startMic() {
  if (analyser || starting) return starting;
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return null;
  starting = (async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      buf = new Float32Array(analyser.fftSize);
      src.connect(analyser);
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
    } catch (_) { stopMic(); }
    starting = null;
  })();
  return starting;
}

export function stopMic() {
  stream?.getTracks().forEach((t) => t.stop());
  ctx?.close().catch(() => {});
  stream = ctx = analyser = buf = null;
  smooth = 0;
}

// null = no live mic; otherwise a smoothed 0..1 loudness.
export function micLevel() {
  if (!analyser) return null;
  analyser.getFloatTimeDomainData(buf);
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  const rms = Math.sqrt(sum / buf.length);
  const target = Math.min(1, Math.max(0, (rms - 0.008) * 9));
  smooth += (target - smooth) * (target > smooth ? 0.5 : 0.15);
  return smooth;
}

// The current voice level (0..1), input and output. The demo feeds it a simulated voice.
const levels = {
  input: 0,
  output: 0
};
const clamp = value => Math.max(0, Math.min(1, Number(value) || 0));
function setVoiceEnergy(kind, value) {
  if (!(kind in levels)) return;
  levels[kind] = clamp(value);
}
function getVoiceEnergy(kind) {
  return levels[kind] || 0;
}
function clearVoiceEnergy(kind) {
  if (kind in levels) levels[kind] = 0;
}
export { clearVoiceEnergy, getVoiceEnergy, setVoiceEnergy };

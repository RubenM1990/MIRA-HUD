// Hides a WebGL canvas while its drawing is lost (a lost canvas would show white).
function hideWhileLost(canvas, {
  name = "canvas",
  onLost,
  onRestored
} = {}) {
  if (!canvas || typeof canvas.addEventListener !== "function") return () => {};
  const lost = e => {
    try {
      e.preventDefault();
    } catch (_) {}
    canvas.style.visibility = "hidden";
    try {
      console.warn(`[gl] ${name}: drawing lost - hidden until it comes back (a lost canvas shows white)`);
    } catch (_) {}
    if (onLost) onLost(e);
  };
  const restored = e => {
    canvas.style.visibility = "";
    try {
      console.warn(`[gl] ${name}: drawing restored - shown again`);
    } catch (_) {}
    if (onRestored) onRestored(e);
  };
  canvas.addEventListener("webglcontextlost", lost, false);
  canvas.addEventListener("webglcontextrestored", restored, false);
  return () => {
    canvas.removeEventListener("webglcontextlost", lost, false);
    canvas.removeEventListener("webglcontextrestored", restored, false);
  };
}
function hideIfLost(canvas, gl) {
  if (canvas && gl && typeof gl.isContextLost === "function" && gl.isContextLost()) canvas.style.visibility = "hidden";
}
export { hideIfLost, hideWhileLost };

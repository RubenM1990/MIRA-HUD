// Where the ring sits on screen and how big it is (measured from the DOM).
const ORB_SVG = {
  W: 900,
  H: 520,
  R: 155
};
let anchor = null;
function setOrbAnchor(a) {
  anchor = a && Number.isFinite(a.cx) && Number.isFinite(a.cy) && a.r > 0 ? {
    cx: a.cx,
    cy: a.cy,
    r: a.r,
    source: "anchor"
  } : null;
}
function readOrbScreen() {
  if (anchor) return anchor;
  if (typeof document === "undefined") return null;
  const svg = document.querySelector("[data-orb-ring]");
  if (svg) {
    const b = svg.getBoundingClientRect();
    if (b.width > 0) return {
      cx: b.left + b.width / 2,
      cy: b.top + b.height / 2,
      r: b.width / 2,
      source: "ring"
    };
  }
  const el = document.querySelector("[data-mira-orb]");
  if (el) {
    const b = el.getBoundingClientRect();
    if (b.width > 0) return {
      cx: b.left + b.width / 2,
      cy: b.top + b.height / 2,
      r: ORB_SVG.R,
      source: "wrapper"
    };
  }
  return null;
}
export { ORB_SVG, readOrbScreen, setOrbAnchor };

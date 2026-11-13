// A flag the render loops can read to lower their per-frame work.
let _calm = false;
function setRenderCalm(v) {
  _calm = !!v;
}
function isRenderCalm() {
  return _calm;
}
export { isRenderCalm, setRenderCalm };

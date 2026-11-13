// Star-dust grains that ride along the lines.
import * as THREE from "three";
const ADD_RGB_ONLY = {
  blending: THREE.CustomBlending,
  blendEquation: THREE.AddEquation,
  blendSrc: THREE.SrcAlphaFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.ZeroFactor,
  blendDstAlpha: THREE.OneFactor
};
const vs = `
  attribute float aPhase;
  attribute float aSize;
  uniform float uTime, uPx;
  varying float vTw;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);

    float tw = 0.55 + 0.45 * sin(uTime * (1.2 + aPhase * 0.9) + aPhase * 6.2831);
    vTw = tw;
    gl_PointSize = aSize * uPx * (0.7 + 0.5 * tw) * (4.8 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const fs = `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vTw;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float a = (1.0 - d); a *= a;
    gl_FragColor = vec4(uColor * (0.7 + 0.9 * vTw), a * (0.35 + 0.65 * vTw) * uOpacity);
  }
`;
function createDust(perRibbon, ribbons, {
  color = [0.94, 0.84, 1],
  size = 3.2,
  seed = 1
} = {}) {
  const n = perRibbon * ribbons;
  const pos = new Float32Array(n * 3),
    phase = new Float32Array(n),
    sz = new Float32Array(n);
  const u = new Float32Array(n),
    speed = new Float32Array(n),
    v = new Float32Array(n);
  const h = (i, k) => {
    const x = Math.sin(i * 12.9898 + k * 78.233 + seed * 3.7) * 43758.5453;
    return x - Math.floor(x);
  };
  for (let i = 0; i < n; i++) {
    u[i] = h(i, 1);
    speed[i] = (8e-3 + 0.028 * h(i, 2)) * (h(i, 3) < 0.5 ? -1 : 1);
    v[i] = h(i, 4) * 2 - 1;
    phase[i] = h(i, 5);
    sz[i] = size * (0.45 + 1.1 * Math.pow(h(i, 6), 2.2));
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute("aPhase", new THREE.BufferAttribute(phase, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sz, 1));
  const material = new THREE.ShaderMaterial({
    vertexShader: vs,
    fragmentShader: fs,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    ...ADD_RGB_ONLY,
    uniforms: {
      uTime: {
        value: 0
      },
      uPx: {
        value: 1
      },
      uOpacity: {
        value: 0
      },
      uColor: {
        value: new THREE.Color(color[0], color[1], color[2])
      }
    }
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  points.visible = false;
  return {
    points,
    geometry,
    material,
    n,
    perRibbon,
    u,
    speed,
    v,
    pos
  };
}
const P = new THREE.Vector3(),
  Q = new THREE.Vector3();
function stepDust(dust, dt, t, curveOf, {
  px = 1,
  opacity = 0,
  spread = 0.6
} = {}) {
  const {
    u,
    speed,
    v,
    pos,
    perRibbon,
    n
  } = dust;
  for (let i = 0; i < n; i++) {
    const rib = curveOf(Math.floor(i / perRibbon));
    if (!rib) continue;
    let uu = u[i] + speed[i] * dt;
    uu -= Math.floor(uu);
    u[i] = uu;
    rib.curve.getPoint(uu, P);
    rib.curve.getPoint(Math.min(uu + 0.01, 1), Q);
    let tx = Q.x - P.x,
      ty = Q.y - P.y;
    const len = Math.hypot(tx, ty) || 1e-4;
    tx /= len;
    ty /= len;
    const off = v[i] * rib.width * spread;
    const k = i * 3;
    pos[k] = P.x + -ty * off;
    pos[k + 1] = P.y + tx * off;
    pos[k + 2] = P.z;
  }
  dust.geometry.attributes.position.needsUpdate = true;
  dust.material.uniforms.uTime.value = t;
  dust.material.uniforms.uPx.value = px;
  dust.material.uniforms.uOpacity.value = opacity;
}
export { ADD_RGB_ONLY, createDust, stepDust };

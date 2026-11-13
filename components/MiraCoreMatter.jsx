// The thin glowing lines orbiting the ring on tilted, wandering paths, with smoke and star dust.
import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { getMiraStage } from "../lib/miraStage";
import { getMiraDebug } from "../lib/miraDebug";
import { readOrbScreen } from "../lib/orbScreen";
import { orbWorld } from "../lib/orbWorld";
import { createDust, ADD_RGB_ONLY } from "../lib/ribbonDust";
import { dial, MAX_LINES, MAX_GRAINS } from "../lib/miraDial";
const SEG = 192;
const CAM_Z = 4.8,
  HALF_H = CAM_Z * Math.tan(25 * Math.PI / 180);
const TAU = Math.PI * 2;
const rad = deg => deg * Math.PI / 180;
const frac = x => x - Math.floor(x);
const hash = (i, k) => frac(Math.sin(i * 12.9898 + k * 78.233 + 4.1) * 43758.5453);
const lineVS = `
  attribute vec3 aDir;
  uniform vec2 uRes;
  uniform float uHalfPx;
  uniform float uOrbZ;
  varying vec2 vUv;
  varying float vZ;
  void main() {
    vUv = uv; vZ = position.z - uOrbZ;
    mat4 pm = projectionMatrix * modelViewMatrix;
    vec4 c0 = pm * vec4(position, 1.0);
    vec4 c1 = pm * vec4(position + aDir, 1.0);
    vec2 dv = (c1.xy / c1.w - c0.xy / c0.w) * uRes;
    float l = length(dv);
    vec2 dir = l > 1e-5 ? dv / l : vec2(1.0, 0.0);
    c0.xy += vec2(-dir.y, dir.x) * uv.y * uHalfPx * 2.0 / uRes * c0.w;
    gl_Position = c0;
  }
`;
const common = `
  precision highp float;
  uniform float uTime, uOpacity, uSeed, uCross, uRw;
  uniform vec2 uOrbPx;
  uniform float uOrbR;
  varying vec2 vUv;
  varying float vZ;
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }

  float lit() {
    vec2 c = vec2(cos(vUv.x * 6.28318), sin(vUv.x * 6.28318));
    float a = noise(c * 1.6 + uSeed + vec2(uTime * 0.050, -uTime * 0.035));
    float b = noise(c * 4.1 + uSeed * 1.7 + vec2(-uTime * 0.080, uTime * 0.060));
    return smoothstep(0.28, 0.82, a * 0.65 + b * 0.35);
  }

  float ringMask() {
    float inner = mix(0.97, uCross, smoothstep(-0.15, 0.35, vZ));
    return smoothstep(uOrbR * inner, uOrbR * (inner + 0.2), distance(gl_FragCoord.xy, uOrbPx));
  }

  float depthLight() { return mix(0.45, 1.15, smoothstep(-0.9, 0.9, vZ / max(uRw, 1e-4))); }
`;
const coreFS = common + `
  uniform float uGlow, uGlowVar, uCoreFrac, uGold;
  uniform float uHot, uHotK, uHotStrength;
  void main() {
    float v = abs(vUv.y);
    float wire = exp(-pow(v / uCoreFrac, 2.0));
    float halo = exp(-v * v * 7.0) * 0.10;
    float p = lit();
    float b = mix(1.0, 0.07 + pow(p, 1.7) * 2.1, uGlowVar);
    vec3 violet = vec3(0.50, 0.20, 1.0), magenta = vec3(0.88, 0.38, 1.0), white = vec3(1.7, 1.35, 1.9);
    vec3 warm = vec3(1.0, 0.52, 0.20);
    vec3 col = mix(mix(violet, magenta, p), warm * 0.8, uGold) * b;
    col += white * smoothstep(0.62, 1.0, p) * 0.55 * uGlowVar * (1.0 - 0.5 * uGold);
    float d = abs(vUv.x - uHot); d = min(d, 1.0 - d);
    col += white * exp(-d * d * uHotK) * uHotStrength;
    col += vec3(0.85, 0.60, 1.0) * exp(-d * d * uHotK * 0.2) * 0.18 * uHotStrength;
    gl_FragColor = vec4(col * (wire + halo) * uGlow * depthLight(), ringMask() * uOpacity);
  }
`;
const smokeFS = common + `
  uniform float uSmoke;
  void main() {
    float v = vUv.y;
    float fall = max(0.0, exp(-v * v * 3.2) - 0.0408) / 0.9592;
    vec2 c = vec2(cos(vUv.x * 6.28318), sin(vUv.x * 6.28318)) * 2.7;
    vec2 q = c + vec2(v * 0.9, -v * 0.7) + uSeed * 2.3;
    float w = noise(q + vec2(uTime * 0.045, uTime * 0.03)) * 0.62 + noise(q * 2.3 - vec2(uTime * 0.06, -uTime * 0.04)) * 0.38;
    w = smoothstep(0.32, 0.80, w);
    vec3 col = mix(vec3(0.34, 0.12, 0.85), vec3(0.62, 0.26, 1.0), w);
    float a = fall * w * (0.30 + 0.70 * lit()) * uSmoke * 0.34 * depthLight();
    gl_FragColor = vec4(col * a, ringMask() * uOpacity);
  }
`;
function makeGlowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.12, "rgba(238,220,255,0.70)");
  g.addColorStop(0.35, "rgba(160,96,255,0.22)");
  g.addColorStop(0.7, "rgba(110,50,220,0.05)");
  g.addColorStop(1, "rgba(80,30,180,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
const ringGlowVS = `
  void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const ringGlowFS = `
  precision highp float;
  uniform float uOpacity, uTime, uVoice, uTalk, uNeon, uNeonW, uSpill;
  uniform vec2 uOrbPx;
  uniform float uOrbR;
  void main() {
    float d = distance(gl_FragCoord.xy, uOrbPx) / uOrbR;

    float neon = exp(-pow((d - 1.0) * uOrbR / (uNeonW + 1.2 * uVoice), 2.0));
    float outer = smoothstep(1.6, 1.0, d) * step(1.0, d);
    vec3 white = vec3(1.7, 1.6, 1.8), violet = vec3(0.60, 0.28, 1.0);
    vec3 col = white * neon * uNeon * (0.9 + 0.7 * uVoice)
             + violet * outer * outer * uSpill * (0.18 + 0.20 * uVoice + 0.05 * uTalk) * (0.9 + 0.1 * sin(uTime * 0.5));
    gl_FragColor = vec4(col, uOpacity);
  }
`;
function buildLine(i) {
  const h = k => hash(i + 1, k);
  const count = (SEG + 1) * 2;
  const pos = new Float32Array(count * 3),
    dir = new Float32Array(count * 3),
    uvs = new Float32Array(count * 2),
    idx = [];
  for (let s = 0; s <= SEG; s++) {
    uvs[s * 2 * 2] = s / SEG;
    uvs[s * 2 * 2 + 1] = -1;
    uvs[(s * 2 + 1) * 2] = s / SEG;
    uvs[(s * 2 + 1) * 2 + 1] = 1;
    if (s < SEG) {
      const a = s * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geometry.setAttribute("aDir", new THREE.BufferAttribute(dir, 3));
  geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geometry.setIndex(idx);
  const seed = i * 5.17 + 2.3;
  const shared = () => ({
    uTime: {
      value: 0
    },
    uOpacity: {
      value: 0
    },
    uSeed: {
      value: seed
    },
    uOrbZ: {
      value: 0
    },
    uCross: {
      value: 0.8
    },
    uRw: {
      value: 1
    },
    uOrbPx: {
      value: new THREE.Vector2(-9999, -9999)
    },
    uOrbR: {
      value: 1
    },
    uRes: {
      value: new THREE.Vector2(1, 1)
    },
    uHalfPx: {
      value: 1
    }
  });
  const mk = (fs, extra) => new THREE.ShaderMaterial({
    vertexShader: lineVS,
    fragmentShader: fs,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
    ...ADD_RGB_ONLY,
    uniforms: {
      ...shared(),
      ...extra
    }
  });
  const core = mk(coreFS, {
    uGlow: {
      value: 1
    },
    uGlowVar: {
      value: 0.8
    },
    uCoreFrac: {
      value: 0.33
    },
    uGold: {
      value: 0
    },
    uHot: {
      value: 0
    },
    uHotK: {
      value: 120
    },
    uHotStrength: {
      value: 0
    }
  });
  const smoke = mk(smokeFS, {
    uSmoke: {
      value: 0
    }
  });
  const harm = [];
  for (let k = 1; k <= 5; k++) harm.push({
    k,
    amp: [0.1, 0.17, 0.11, 0.07, 0.045][k - 1] * (0.5 + h(10 + k)),
    ph: h(20 + k) * TAU,
    w: (0.02 + 0.05 * h(30 + k)) * (h(40 + k) < 0.5 ? -1 : 1)
  });
  const lift = [2, 3].map((k, j) => ({
    k,
    amp: [0.22, 0.13][j] * (0.4 + 0.9 * h(50 + k)),
    ph: h(60 + k) * TAU,
    w: (0.015 + 0.04 * h(70 + k)) * (h(80 + k) < 0.5 ? -1 : 1)
  }));
  return {
    i,
    seed,
    geometry,
    core,
    smoke,
    pos,
    dir,
    c: new Float32Array((SEG + 1) * 3),
    harm,
    lift,
    rank: frac((i + 1) * 0.618034),
    oval: 0.25 + 0.75 * h(1),
    th0: (h(2) - 0.5) * rad(70),
    thA: 0.3 + 0.45 * h(3),
    thW: 0.018 + 0.03 * h(4),
    thP: h(5) * TAU,
    tilt: 0.25 + 0.75 * h(6),
    az: h(7) * TAU,
    prec: (0.012 + 0.03 * h(8)) * (h(9) < 0.5 ? -1 : 1),
    lag: 0.45 + 1.3 * h(90),
    goldPick: h(91),
    smokePick: 0.35 + 0.65 * h(92),
    bright: 0.16 + 1.05 * Math.pow(h(93), 2),
    hotDir: h(94) < 0.5 ? -1 : 1,
    hotSpeed: 0.03 + 0.07 * h(95),
    hotK: 70 + 160 * h(96),
    hotGain: 0.6 + 0.6 * h(97),
    phase: h(98),
    jumps: 0,
    R: 0,
    U: new THREE.Vector3(),
    V: new THREE.Vector3(),
    N: new THREE.Vector3()
  };
}
function buildSeats(n) {
  const ox = new Float32Array(n),
    oy = new Float32Array(n),
    oz = new Float32Array(n),
    far = new Float32Array(n),
    wob = new Float32Array(n);
  for (let g = 0; g < n; g++) {
    const a = hash(g, 101) * TAU,
      z = hash(g, 102) * 2 - 1,
      s = Math.sqrt(1 - z * z);
    ox[g] = Math.cos(a) * s;
    oy[g] = Math.sin(a) * s;
    oz[g] = z * 0.6;
    far[g] = Math.pow(hash(g, 103), 2.6);
    wob[g] = hash(g, 104) * TAU;
  }
  return {
    ox,
    oy,
    oz,
    far,
    wob
  };
}
function MiraCoreMatter() {
  const cores = useRef([]),
    smokes = useRef([]);
  const orbPx = useRef({
    tick: 0,
    seen: false,
    tx: -9999,
    ty: -9999,
    tr: 1,
    trw: 0.88,
    x: -9999,
    y: -9999,
    r: 1
  });
  const clock = useRef(0);
  const lines = useMemo(() => {
    const a = [];
    for (let i = 0; i < MAX_LINES; i++) a.push(buildLine(i));
    return a;
  }, []);
  const light = useRef(),
    ringGlow = useRef();
  const glowTex = useMemo(makeGlowTexture, []);
  const ringMat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: ringGlowVS,
    fragmentShader: ringGlowFS,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    ...ADD_RGB_ONLY,
    uniforms: {
      uOpacity: {
        value: 0
      },
      uTime: {
        value: 0
      },
      uVoice: {
        value: 0
      },
      uTalk: {
        value: 0
      },
      uNeon: {
        value: 1
      },
      uNeonW: {
        value: 1.6
      },
      uSpill: {
        value: 1
      },
      uOrbPx: {
        value: new THREE.Vector2(-9999, -9999)
      },
      uOrbR: {
        value: 1
      }
    }
  }), []);
  const dust = useMemo(() => createDust(MAX_GRAINS, MAX_LINES, {
    size: 3,
    seed: 2
  }), []);
  const seats = useMemo(() => buildSeats(MAX_GRAINS * MAX_LINES), []);
  useFrame((frame, dt) => {
    const mi = getMiraStage();
    const mode = getMiraDebug().mode;
    const alive = mi.matter > 1e-3 && (mode === "" || mode === "core" || mode === "corehot");
    const hotOn = mode !== "core";
    const d = Math.min(dt, 0.05);
    const speed = dial("lines.speed");
    clock.current += d * speed;
    const t = clock.current;
    const vLines = dial("voice.lines"),
      vRing = dial("voice.ring");
    const voice = mi.voice,
      talk = mi.talk;
    const op = orbPx.current;
    if (alive && op.tick++ % 10 === 0 && frame.gl) {
      const o = readOrbScreen();
      const cv2 = frame.gl.domElement;
      if (o && cv2) {
        const b = cv2.getBoundingClientRect();
        const sx = cv2.width / b.width,
          sy = cv2.height / b.height;
        op.tx = (o.cx - b.left) * sx;
        op.ty = (b.bottom - o.cy) * sy;
        op.tr = o.r * sx;
        op.trw = o.r / b.height * 2 * HALF_H;
        op.figure = o.source === "anchor";
      } else {
        op.tx = -9999;
        op.ty = -9999;
        op.tr = 1;
        op.trw = orbWorld.scale * 1.6;
      }
      if (!op.seen) {
        op.seen = true;
        op.x = op.tx;
        op.y = op.ty;
        op.r = op.tr;
      }
    }
    const kf = Math.min(1, d * 14);
    op.x += (op.tx - op.x) * kf;
    op.y += (op.ty - op.y) * kf;
    op.r += (op.tr - op.r) * kf;
    const Rt = op.trw;
    const cv = frame.gl ? frame.gl.domElement : null;
    const resX = cv ? cv.width : 1,
      resY = cv ? cv.height : 1;
    const px = cv ? cv.width / Math.max(1, cv.clientWidth || window.innerWidth) : 1;
    if (light.current) {
      light.current.visible = alive && !op.figure;
      light.current.position.copy(orbWorld.pos);
      light.current.position.z -= 0.05;
      const ls = Rt * dial("light.size") * (1 + 0.1 * voice * vRing);
      light.current.scale.set(ls, ls, 1);
      light.current.material.opacity = Math.min(1, mi.orb * dial("light.bright") * (0.34 + (0.3 * voice + 0.06 * talk) * vRing));
    }
    if (ringGlow.current) {
      ringGlow.current.visible = alive;
      ringGlow.current.position.copy(orbWorld.pos);
      ringGlow.current.position.z += 0.02;
      ringGlow.current.scale.set(Rt * 4.4, Rt * 4.4, 1);
      const U = ringMat.uniforms;
      U.uOpacity.value = mi.orb * 0.75;
      U.uTime.value = t;
      U.uVoice.value = voice * vRing;
      U.uTalk.value = talk * vRing;
      U.uNeon.value = dial("ring.neon");
      U.uNeonW.value = dial("ring.neonWidth") * px;
      U.uSpill.value = dial("ring.spill");
      U.uOrbPx.value.set(op.x, op.y);
      U.uOrbR.value = op.r;
    }
    const count = Math.round(dial("lines.count"));
    const rMin = dial("lines.rMin"),
      rMax = Math.max(rMin + 0.05, dial("lines.rMax"));
    const stretch = dial("lines.stretch"),
      chaos = dial("lines.chaos"),
      tiltMax = rad(dial("lines.tilt"));
    const widthPx = dial("lines.width") * px * (1 + 0.25 * voice * vLines);
    const glow = dial("lines.glow") * (1 + (0.55 * voice + 0.1 * talk) * vLines);
    const glowVar = dial("lines.glowVar"),
      hotGainAll = dial("lines.hot"),
      goldShare = dial("lines.gold");
    const cross = dial("lines.cross"),
      follow = dial("lines.follow");
    const smokeAmt = dial("smoke.amount"),
      smokeHalfPx = dial("smoke.width") * op.r;
    const grains = Math.round(dial("dust.amount")),
      dustSpread = dial("dust.spread");
    const ox = orbWorld.pos.x,
      oy = orbWorld.pos.y,
      oz = orbWorld.pos.z;
    for (let i = 0; i < lines.length; i++) {
      const ln = lines[i],
        cm = cores.current[i],
        sm = smokes.current[i];
      if (!cm || !sm) continue;
      const on = alive && i < count;
      cm.visible = on;
      sm.visible = on && smokeAmt * ln.smokePick > 0.02;
      if (!on) {
        ln.R = 0;
        continue;
      }
      if (ln.R <= 0) ln.R = Rt;
      ln.R += (Rt - ln.R) * Math.min(1, d * follow * ln.lag);
      const R = ln.R;
      const az = ln.az + ln.prec * t + 0.4 * Math.sin(t * 0.013 + ln.seed);
      const tilt = tiltMax * ln.tilt * (0.8 + 0.2 * Math.sin(t * 0.017 + ln.seed * 1.3));
      ln.N.set(Math.sin(tilt) * Math.sin(az), -Math.sin(tilt) * Math.cos(az), Math.cos(tilt));
      ln.U.set(0, 1, 0).cross(ln.N).normalize();
      ln.V.crossVectors(ln.N, ln.U);
      const th = ln.th0 + ln.thA * (0.7 * Math.sin(t * ln.thW + ln.thP) + 0.3 * Math.sin(t * ln.thW * 2.3 + ln.thP * 1.7));
      const cth = Math.cos(th),
        sth = Math.sin(th);
      const rb = rMin + (rMax - rMin) * ln.rank;
      const ex = 1 + stretch * ln.oval * 0.85;
      const c = ln.c;
      for (let s = 0; s <= SEG; s++) {
        const a = s % SEG / SEG * TAU;
        let rr = 1;
        for (let k = 0; k < 5; k++) {
          const hm = ln.harm[k];
          rr += chaos * hm.amp * Math.sin(hm.k * a + hm.ph + hm.w * t);
        }
        const fl = 0.86;
        rr = rb * rr;
        rr = fl + Math.log(1 + Math.exp((rr - fl) * 9)) / 9;
        let no = 0;
        for (let k = 0; k < 2; k++) {
          const lf = ln.lift[k];
          no += lf.amp * Math.sin(lf.k * a + lf.ph + lf.w * t);
        }
        no *= chaos * rb;
        const lx = Math.cos(a) * rr * ex,
          ly = Math.sin(a) * rr;
        const ux = (lx * cth - ly * sth) * R,
          vy = (lx * sth + ly * cth) * R,
          nz = no * R;
        const q = s * 3;
        c[q] = ox + ux * ln.U.x + vy * ln.V.x + nz * ln.N.x;
        c[q + 1] = oy + ux * ln.U.y + vy * ln.V.y + nz * ln.N.y;
        c[q + 2] = oz + ux * ln.U.z + vy * ln.V.z + nz * ln.N.z;
      }
      const pos = ln.pos,
        dir = ln.dir;
      for (let s = 0; s <= SEG; s++) {
        const q = s * 3,
          n = (s + 1) % SEG * 3,
          m = (s - 1 + SEG) % SEG * 3;
        const dx = c[n] - c[m],
          dy = c[n + 1] - c[m + 1],
          dz = c[n + 2] - c[m + 2];
        const w = s * 6;
        pos[w] = pos[w + 3] = c[q];
        pos[w + 1] = pos[w + 4] = c[q + 1];
        pos[w + 2] = pos[w + 5] = c[q + 2];
        dir[w] = dir[w + 3] = dx;
        dir[w + 1] = dir[w + 4] = dy;
        dir[w + 2] = dir[w + 5] = dz;
      }
      ln.geometry.attributes.position.needsUpdate = true;
      ln.geometry.attributes.aDir.needsUpdate = true;
      const wander = 0.75 + 0.25 * Math.sin(t * 0.17 + ln.seed);
      const dwell = Math.sin(t * 0.05 + ln.seed * 3) < -0.6 ? 0.15 : 1;
      ln.phase += ln.hotDir * ln.hotSpeed * wander * dwell * d * speed * (1 + 1.5 * talk * vLines);
      if (ln.phase >= 1 || ln.phase < 0) {
        ln.jumps++;
        ln.phase = frac(Math.sin(ln.seed * 12.9898 + ln.jumps * 78.233) * 43758.5453);
      }
      const envelope = Math.min(1, Math.max(0, (Math.sin(t * 0.08 + ln.seed * 1.9) + 0.2) / 0.7));
      const isGold = ln.goldPick < goldShare ? 1 : 0;
      for (const mat of [ln.core, ln.smoke]) {
        const U = mat.uniforms;
        U.uTime.value = t;
        U.uOpacity.value = mi.matter;
        U.uOrbPx.value.set(op.x, op.y);
        U.uOrbR.value = op.r;
        U.uOrbZ.value = oz;
        U.uCross.value = cross;
        U.uRw.value = R;
        U.uRes.value.set(resX, resY);
      }
      const CU = ln.core.uniforms;
      CU.uHalfPx.value = Math.max(2.5 * px, widthPx * 3);
      CU.uCoreFrac.value = Math.min(0.9, widthPx * 0.5 / CU.uHalfPx.value * 1.2);
      CU.uGlow.value = glow * ln.bright * (isGold ? 0.7 : 1);
      CU.uGlowVar.value = glowVar;
      CU.uGold.value = isGold;
      CU.uHot.value = ln.phase;
      CU.uHotK.value = ln.hotK;
      CU.uHotStrength.value = hotOn ? hotGainAll * ln.hotGain * envelope * (isGold ? 0.4 : 1) * (1 + 0.9 * voice * vLines) : 0;
      const SU = ln.smoke.uniforms;
      SU.uHalfPx.value = Math.max(4, smokeHalfPx);
      SU.uSmoke.value = smokeAmt * ln.smokePick * (isGold ? 0.5 : 1) * (1 + 0.35 * voice * vLines);
    }
    dust.points.visible = alive && grains > 0;
    if (dust.points.visible) {
      const {
        u,
        speed: gs,
        pos
      } = dust;
      for (let i = 0; i < MAX_LINES; i++) {
        const ln = lines[i],
          lit = i < count;
        for (let j = 0; j < MAX_GRAINS; j++) {
          const g = i * MAX_GRAINS + j,
            k = g * 3;
          if (!lit || j >= grains) {
            pos[k] = 1e6;
            pos[k + 1] = 1e6;
            pos[k + 2] = 0;
            continue;
          }
          let uu = u[g] + gs[g] * d * speed * (1 + 0.8 * talk * vLines);
          uu -= Math.floor(uu);
          u[g] = uu;
          const f = uu * SEG,
            s0 = Math.floor(f),
            fr = f - s0,
            a = s0 * 3,
            b = (s0 + 1) % (SEG + 1) * 3;
          const c = ln.c;
          const off = ln.R * dustSpread * (0.04 + seats.far[g]) * (0.8 + 0.2 * Math.sin(t * 0.3 + seats.wob[g]));
          pos[k] = c[a] + (c[b] - c[a]) * fr + seats.ox[g] * off;
          pos[k + 1] = c[a + 1] + (c[b + 1] - c[a + 1]) * fr + seats.oy[g] * off;
          pos[k + 2] = c[a + 2] + (c[b + 2] - c[a + 2]) * fr + seats.oz[g] * off;
        }
      }
      dust.geometry.attributes.position.needsUpdate = true;
      const DU = dust.material.uniforms;
      DU.uTime.value = t;
      DU.uPx.value = px * dial("dust.size");
      DU.uOpacity.value = Math.min(1.5, mi.matter * 0.9 * dial("dust.bright") * (1 + 0.4 * voice * vLines));
    }
  });
  return <group>
      
      <sprite ref={light} visible={false} renderOrder={-3}>
        <spriteMaterial map={glowTex} color={new THREE.Color(1, 0.97, 1.1)} transparent opacity={0} depthWrite={false} depthTest={false} {...ADD_RGB_ONLY} />
      </sprite>
      
      <mesh ref={ringGlow} material={ringMat} visible={false} frustumCulled={false} renderOrder={4}>
        <planeGeometry args={[1, 1]} />
      </mesh>
      
      <primitive object={dust.points} renderOrder={7} />
      {lines.map((ln, i) => <group key={i}>
          
          <mesh ref={el => {
        smokes.current[i] = el;
      }} geometry={ln.geometry} material={ln.smoke} visible={false} frustumCulled={false} renderOrder={5} />
          <mesh ref={el => {
        cores.current[i] = el;
      }} geometry={ln.geometry} material={ln.core} visible={false} frustumCulled={false} renderOrder={6} />
        </group>)}
    </group>;
}
export { MiraCoreMatter as default };

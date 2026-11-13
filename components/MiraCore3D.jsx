// The particle core inside the ring, plus MIRA's centre lines and far waves (react-three-fiber + bloom).
import React, { useRef, useMemo, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { isRenderCalm } from "../lib/renderCalm";
import { getMiraStage, subscribeMira } from "../lib/miraStage";
import { miraDebugActive } from "../lib/miraDebug";
import { readOrbScreen } from "../lib/orbScreen";
import { orbWorld } from "../lib/orbWorld";
import MiraCoreMatter from "./MiraCoreMatter";
import { hideWhileLost } from "../lib/glLoss";
import { dial, subscribeDials } from "../lib/miraDial";
import { createDust, stepDust } from "../lib/ribbonDust";
import { getVoiceEnergy } from "../lib/voiceEnergy";
class OrbBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      dead: false
    };
    this._tries = 0;
  }
  static getDerivedStateFromError() {
    return {
      dead: true
    };
  }
  componentDidCatch(err) {
    try {
      console.warn("[orb] 3D crashed — hiding orb:", err?.message);
    } catch {}
    clearTimeout(this._t);
    if (this._tries < 3) {
      this._tries += 1;
      this._t = setTimeout(() => this.setState({
        dead: false
      }), 8e3);
    }
  }
  componentWillUnmount() {
    clearTimeout(this._t);
  }
  render() {
    return this.state.dead ? null : this.props.children;
  }
}
const CYAN = "#00e5ff";
const VIOLET = "#d8b4fe";
const MPOOLS = [{
  n: 220,
  size: 0.012,
  color: "#8B5CFF",
  alpha: 0.55
}, {
  n: 56,
  size: 0.026,
  color: "#C084FC",
  alpha: 0.75
}, {
  n: 12,
  size: 0.05,
  color: "#F4E8FF",
  alpha: 0.95
}];
const M = MPOOLS.reduce((a, p) => a + p.n, 0);
const N = 1200;
// The particle core's own numbers: size, amount, glow, cloud spread, speed per state, direction.
const CORE = {
  particleSize: 1,
  particleAmount: 1200,
  particleGlow: 1,
  particleSpread: 1,
  particleIdleSpeed: 1,
  particleListeningSpeed: 1,
  particleSpeakingSpeed: 1,
  particleDirection: "outward"
};
function normalizeState(state) {
  const s = String(state || "").toLowerCase();
  if (s.includes("think") || s.includes("process")) return "processing";
  if (s.includes("listen")) return "listening";
  if (s.includes("speak")) return "speaking";
  return "standby";
}
function makeSprite() {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.55)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
const RIBBON_N = 3,
  RIBBON_SEG = 64;
const ribbonVS = `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const ribbonFS = `
  precision highp float;
  uniform float uTime, uOpacity, uEnergy, uSeed;
  uniform vec2 uOrbPx;
  uniform float uOrbR;
  varying vec2 vUv;
  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm3(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return v; }
  void main() {

    float bright = 1.0 - smoothstep(0.0, 0.16, vUv.y);
    float body = (1.0 - smoothstep(0.10, 0.95, vUv.y)) * 0.55 + 0.10;
    float endFade = smoothstep(0.0, 0.14, vUv.x) * (1.0 - smoothstep(0.86, 1.0, vUv.x));
    vec2 q = vec2(vUv.x * 9.0 + uSeed, vUv.y * 2.5);

    float f = fbm3(q + vec2(uTime * 0.05, -uTime * 0.03));
    float fold = pow(1.0 - abs(f * 2.0 - 1.0), 8.0);

    float holes = smoothstep(0.25, 0.65, fbm3(q * 0.7 + 3.1 + vec2(-uTime * 0.02, uTime * 0.035)));

    float light = fbm3(vec2(vUv.x * 3.5, vUv.y * 0.8) + uSeed * 1.7 + vec2(uTime * 0.045, uTime * 0.02));
    float lit = smoothstep(0.40, 0.72, light);
    float hot = pow(smoothstep(0.66, 0.84, light), 1.5) * max(bright, fold);
    vec3 dark = vec3(0.24, 0.08, 0.52), violet = vec3(0.48, 0.20, 1.00), brightV = vec3(0.72, 0.38, 1.00);
    vec3 lav = vec3(0.88, 0.72, 1.00), white = vec3(1.00, 0.92, 1.00);
    vec3 col = mix(dark, violet, lit);
    col = mix(col, brightV, bright * (0.4 + 0.6 * lit));
    col = mix(col, lav, clamp(fold * 0.8 + bright * lit * 0.5, 0.0, 1.0));
    col = mix(col, white, clamp(hot * 1.4, 0.0, 1.0));
    float a = (0.05 * body * holes + 0.30 * bright * (0.5 + 0.5 * lit) + 0.45 * fold * holes) * endFade * uOpacity * (1.0 + uEnergy * 0.12);
    a += hot * 0.22 * endFade * uOpacity;

    float behind = smoothstep(uOrbR * 0.92, uOrbR * 1.28, distance(gl_FragCoord.xy, uOrbPx));
    a *= behind;
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;
function DialBloom() {
  const [, bump] = useState(0);
  const [mira, setMira] = useState(false);
  useEffect(() => {
    let timer = null;
    const off = subscribeDials(() => {
      if (!timer) timer = setTimeout(() => {
        timer = null;
        bump(n => n + 1);
      }, 160);
    });
    return () => {
      off();
      if (timer) clearTimeout(timer);
    };
  }, []);
  useEffect(() => subscribeMira(m => setMira(!!(m.on || m.running))), []);
  const k = mira ? {
    i: dial("bloom.strength"),
    t: dial("bloom.threshold"),
    r: dial("bloom.radius")
  } : {
    i: 1.3,
    t: 0.18,
    r: 0.62
  };
  return <Bloom intensity={k.i} luminanceThreshold={k.t} luminanceSmoothing={0.9} mipmapBlur radius={k.r} />;
}
function MiraRibbons() {
  const meshes = useRef([]);
  const dust = useMemo(() => createDust(56, RIBBON_N, {
    size: 2.8,
    seed: 5,
    color: [0.9, 0.78, 1]
  }), []);
  const orbPx = useRef({
    tick: 0,
    x: -9999,
    y: -9999,
    r: 1
  });
  const wclock = useRef(0);
  const data = useMemo(() => {
    const rib = [];
    for (let i = 0; i < RIBBON_N; i++) {
      const seed = i * 7.31 + 1.7;
      const n = 6 + i % 2;
      const pts = [];
      const y0 = -3 + i / (RIBBON_N - 1) * 6 + Math.sin(seed) * 0.8;
      const tilt = Math.sin(seed * 1.9) * 0.55;
      const z = -2.2 - i % 3 * 0.6;
      for (let k = 0; k < n; k++) {
        const u = k / (n - 1);
        pts.push({
          base: new THREE.Vector3(-9 + u * 18, y0 + (u - 0.5) * tilt * 6, z),
          off: seed * 3.1 + k * 1.37,
          freq: 0.045 + 0.025 * ((k * 3 + i) % 5) / 4,
          amp: 0.9 + 1.3 * ((k * 7 + i * 3) % 6 / 5),
          cur: new THREE.Vector3()
        });
      }
      const geometry = new THREE.BufferGeometry();
      const count = (RIBBON_SEG + 1) * 2;
      const pos = new Float32Array(count * 3),
        uvs = new Float32Array(count * 2),
        idx = [];
      for (let s = 0; s <= RIBBON_SEG; s++) {
        uvs[s * 2 * 2] = s / RIBBON_SEG;
        uvs[s * 2 * 2 + 1] = 0;
        uvs[(s * 2 + 1) * 2] = s / RIBBON_SEG;
        uvs[(s * 2 + 1) * 2 + 1] = 1;
        if (s < RIBBON_SEG) {
          const a = s * 2;
          idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      geometry.setIndex(idx);
      const material = new THREE.ShaderMaterial({
        vertexShader: ribbonVS,
        fragmentShader: ribbonFS,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
        blending: THREE.NormalBlending,
        uniforms: {
          uTime: {
            value: 0
          },
          uOpacity: {
            value: 0
          },
          uEnergy: {
            value: 0
          },
          uSeed: {
            value: seed
          },
          uOrbPx: {
            value: new THREE.Vector2(-9999, -9999)
          },
          uOrbR: {
            value: 1
          }
        }
      });
      const curve = new THREE.CatmullRomCurve3(pts.map(p => p.cur), false, "centripetal", 0.5);
      rib.push({
        pts,
        geometry,
        material,
        curve,
        seed,
        width: 0.2 + 0.14 * (i * 5 % 3) / 2,
        pos
      });
    }
    return rib;
  }, []);
  useFrame((frame, dt) => {
    const mi = getMiraStage();
    const alive = mi.matter > 1e-3 && !miraDebugActive();
    wclock.current += Math.min(dt, 0.05) * dial("waves.speed") * (mi.pace || 1);
    const t = wclock.current;
    const wWidth = dial("waves.width");
    const voice = getVoiceEnergy("output");
    const op = orbPx.current;
    if (alive && op.tick++ % 10 === 0 && frame.gl) {
      const o = readOrbScreen();
      const cv = frame.gl.domElement;
      if (o && cv) {
        const b = cv.getBoundingClientRect();
        const sx = cv.width / b.width,
          sy = cv.height / b.height;
        op.x = (o.cx - b.left) * sx;
        op.y = (b.bottom - o.cy) * sy;
        op.r = o.r * sx;
      }
    }
    for (let i = 0; i < data.length; i++) {
      const r = data[i],
        mesh = meshes.current[i];
      if (!mesh) continue;
      mesh.visible = alive;
      if (!alive) continue;
      for (const p of r.pts) {
        const a = t * p.freq;
        p.cur.set(p.base.x + Math.sin(a * 0.7 + p.off) * p.amp * 0.6, p.base.y + Math.sin(a + p.off) * p.amp + Math.sin(a * 2.3 + p.off * 1.7) * p.amp * 0.35, p.base.z + Math.sin(a * 0.5 + p.off * 0.6) * 0.3);
      }
      mesh.position.copy(orbWorld.pos);
      mesh.scale.setScalar(orbWorld.scale);
      const pts = r.curve.getPoints(RIBBON_SEG);
      const arr = r.pos;
      for (let s = 0; s <= RIBBON_SEG; s++) {
        const c = pts[s],
          n = pts[Math.min(s + 1, RIBBON_SEG)],
          m = pts[Math.max(s - 1, 0)];
        let tx = n.x - m.x,
          ty = n.y - m.y;
        const len = Math.hypot(tx, ty) || 1e-4;
        tx /= len;
        ty /= len;
        const u = s / RIBBON_SEG;
        const w = r.width * wWidth * (0.55 + 0.45 * Math.sin(u * 6.28 * 1.3 + t * 0.11 + r.seed)) * (0.7 + 0.3 * Math.sin(u * 6.28 * 0.6 - t * 0.07 + r.seed * 2));
        const e1 = w * (0.5 + 0.35 * Math.sin(u * 6.28 * 2.1 + t * 0.09 + r.seed * 1.3));
        const e2 = w * (0.5 + 0.35 * Math.sin(u * 6.28 * 1.7 - t * 0.13 + r.seed * 0.7 + 2));
        const k = s * 6;
        arr[k] = c.x - -ty * e1;
        arr[k + 1] = c.y - tx * e1;
        arr[k + 2] = c.z;
        arr[k + 3] = c.x + -ty * e2;
        arr[k + 4] = c.y + tx * e2;
        arr[k + 5] = c.z;
      }
      r.geometry.attributes.position.needsUpdate = true;
      r.material.uniforms.uTime.value = t;
      r.material.uniforms.uOpacity.value = mi.matter * dial("waves.opacity");
      r.material.uniforms.uEnergy.value = voice;
      r.material.uniforms.uOrbPx.value.set(op.x, op.y);
      r.material.uniforms.uOrbR.value = op.r;
    }
    dust.points.visible = alive;
    if (alive) {
      dust.points.position.copy(orbWorld.pos);
      dust.points.scale.setScalar(orbWorld.scale);
      const px = frame.gl ? frame.gl.domElement.width / window.innerWidth : 1;
      stepDust(dust, Math.min(dt, 0.05), t, i => ({
        curve: data[i].curve,
        width: data[i].width * wWidth
      }), {
        px,
        opacity: mi.matter * 0.7 * Math.min(1, dial("waves.opacity") / 0.3),
        spread: 0.8
      });
    }
  });
  return <group>
      <primitive object={dust.points} renderOrder={-9} />
      {data.map((r, i) => <mesh key={i} ref={el => {
      meshes.current[i] = el;
    }} geometry={r.geometry} material={r.material} visible={false} frustumCulled={false} renderOrder={-10} />)}
    </group>;
}
function Core({ state }) {
  const group = useRef();
  const points = useRef();
  const rtRef = useRef(0.85);
  const motionClockRef = useRef(null);
  const st = normalizeState(state);
  const sprite = useMemo(makeSprite, []);
  const data = useMemo(() => {
    const dir = new Float32Array(N * 3);
    const phase = new Float32Array(N);
    const speed = new Float32Array(N);
    const ballR = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      dir[i * 3] = Math.sin(phi) * Math.cos(theta);
      dir[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
      dir[i * 3 + 2] = Math.cos(phi);
      phase[i] = Math.random() * Math.PI * 2;
      speed[i] = 0.7 + Math.random() * 1.7;
      ballR[i] = 0.16 + Math.pow(Math.random(), 0.6) * 0.84;
    }
    return { dir, phase, speed, ballR };
  }, []);
  const positions = useMemo(() => new Float32Array(N * 3), []);
  const matterRefs = useRef([]);
  const md = useMemo(() => MPOOLS.map(pool => {
    const n = pool.n;
    const home = new Float32Array(n),
      vel = new Float32Array(n * 3),
      pos = new Float32Array(n * 3),
      seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const h = 1.2 + Math.pow(Math.random(), 0.8) * (pool.size < 0.02 ? 2.2 : 1.3);
      home[i] = h;
      pos[i * 3] = Math.cos(a) * h;
      pos[i * 3 + 1] = Math.sin(a) * h * 0.9;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.6;
      vel[i * 3] = 0;
      vel[i * 3 + 1] = 0;
      vel[i * 3 + 2] = 0;
      seed[i] = Math.random() * 6.283;
    }
    return {
      ...pool,
      home,
      vel,
      pos,
      seed
    };
  }), []);
  const colCyan = useMemo(() => new THREE.Color(CYAN), []);
  const colViolet = useMemo(() => new THREE.Color(VIOLET), []);
  const calmFrameRef = useRef(0);
  const calmStartRef = useRef(0);
  const calmCarryRef = useRef(0);
  useFrame((frame, dt) => {
    if (isRenderCalm()) {
      const nowT = frame.clock.elapsedTime;
      if (!calmStartRef.current) calmStartRef.current = nowT;
      if (nowT - calmStartRef.current < 10) {
        calmFrameRef.current++;
        if (calmFrameRef.current & 1) {
          calmCarryRef.current += dt;
          return;
        }
      }
    } else {
      calmStartRef.current = 0;
    }
    const d = Math.min(dt + calmCarryRef.current, 0.1);
    calmCarryRef.current = 0;
    const t = frame.clock.elapsedTime;
    const { dir, phase, speed, ballR } = data;
    const pos = positions;
    const mi = getMiraStage();
    const design = CORE;
    const sleeping = st === "standby",
      speaking = st === "speaking";
    const speedFactor = speaking ? design.particleSpeakingSpeed : st === "listening" ? design.particleListeningSpeed : design.particleIdleSpeed;
    if (motionClockRef.current === null) motionClockRef.current = t;else motionClockRef.current += d * speedFactor * (design.particleDirection === "inward" ? -1 : 1);
    const motionTime = motionClockRef.current;
    if (group.current) {
      orbWorld.pos.copy(group.current.position);
      orbWorld.scale = group.current.scale.x;
    }
    const baseTarget = sleeping ? 0.58 : speaking ? 1.2 : 1.5;
    rtRef.current = THREE.MathUtils.lerp(rtRef.current, baseTarget * design.particleSpread, 0.05);
    const Rt = rtRef.current;
    const bubbleAmp = sleeping ? 0.17 : 0.1 + 0.08 * Rt;
    const waveAmp = 0.5;
    if (group.current) {
      group.current.rotation.x = 0.3;
      group.current.rotation.y += d * 0.07 * speedFactor;
      group.current.rotation.z = 0;
      group.current.position.set(0, 0, 0);
      group.current.scale.setScalar(0.55);
    }
    for (let i = 0; i < N; i++) {
      let r = ballR[i] * Rt + Math.sin(motionTime * speed[i] + phase[i]) * bubbleAmp;
      if (speaking) r += Math.sin(ballR[i] * 5.5 - motionTime * 5) * waveAmp;else if (!sleeping) r += Math.sin(ballR[i] * 3 - motionTime * 1.7) * (waveAmp * 0.22);
      let dx = dir[i * 3] * r,
        dy = dir[i * 3 + 1] * r;
      const dz = dir[i * 3 + 2] * r;
      if (design.particleDirection === "orbit" || design.particleDirection === "mixed") {
        const angle = motionTime * speed[i] * (design.particleDirection === "mixed" ? 0.12 : 0.3);
        const c = Math.cos(angle),
          s = Math.sin(angle);
        const x = dx;
        dx = x * c - dy * s;
        dy = x * s + dy * c;
      }
      const k = i * 3;
      pos[k] += (dx - pos[k]) * 0.38;
      pos[k + 1] += (dy - pos[k + 1]) * 0.38;
      pos[k + 2] += (dz - pos[k + 2]) * 0.38;
    }
    if (points.current) {
      points.current.geometry.attributes.position.needsUpdate = true;
      points.current.geometry.setDrawRange(0, Math.min(design.particleAmount, N));
      points.current.material.size = (sleeping ? 0.026 : 0.018) * design.particleSize;
      points.current.material.opacity = sleeping ? 1 : 0.92;
      points.current.material.color.copy(colCyan).lerp(colViolet, mi.orb).multiplyScalar(design.particleGlow);
    }
      {
        const alive = mi.matter > 1e-3 && !miraDebugActive();
        const listening = st === "listening",
          processing = st === "processing";
        const voice = getVoiceEnergy("output");
        const spd = (sleeping ? 0.35 : listening ? 0.5 : processing ? 0.45 : 0.55 + voice * 0.12);
        const ddt = Math.min(dt, 0.05);
        const tt = t * 0.11;
        for (let pi = 0; pi < md.length; pi++) {
          const pool = md[pi],
            ref = matterRefs.current[pi];
          if (!ref) continue;
          ref.visible = alive;
          if (!alive) continue;
          const mp = pool.pos,
            mv = pool.vel,
            mh = pool.home,
            sd = pool.seed,
            n = pool.n;
          for (let i = 0; i < n; i++) {
            const k = i * 3;
            const x0 = mp[k],
              y0 = mp[k + 1];
            const fx = Math.sin(y0 * 1.3 + tt * 0.9 + sd[i]) * 0.55 + Math.cos(x0 * 0.7 - tt * 0.6) * 0.35 - y0 * 0.12;
            const fy = Math.cos(x0 * 1.1 - tt * 0.7 + sd[i] * 0.5) * 0.55 + Math.sin(y0 * 0.8 + tt * 0.5) * 0.35 + x0 * 0.12;
            mv[k] += (fx - mv[k]) * 0.6 * ddt + Math.sin(tt * 1.7 + sd[i] * 3) * 0.12 * ddt;
            mv[k + 1] += (fy - mv[k + 1]) * 0.6 * ddt + Math.cos(tt * 1.3 + sd[i] * 2) * 0.12 * ddt;
            let x = x0 + mv[k] * spd * ddt,
              y = y0 + mv[k + 1] * spd * ddt,
              z = mp[k + 2];
            const r = Math.sqrt(x * x + y * y) || 1e-4;
            const pull = (mh[i] - r) * 0.55 * ddt;
            x += x / r * pull;
            y += y / r * pull;
            z += (Math.sin(tt * 0.3 + sd[i]) * 0.25 - z) * 0.3 * ddt;
            mp[k] = x;
            mp[k + 1] = y;
            mp[k + 2] = z;
          }
          ref.geometry.attributes.position.needsUpdate = true;
          ref.material.opacity = Math.min(1, pool.alpha * mi.matter * dial("motes.opacity"));
          ref.material.size = MPOOLS[pi].size * dial("motes.size");
        }
      }
  });
  return <group ref={group}>
      <points ref={points}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={N} array={positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.026} map={sprite} color={CYAN} transparent opacity={0.95} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} alphaTest={0.01} />
      </points>
      {md.map((pool, i) => <points key={i} ref={el => {
      matterRefs.current[i] = el;
    }} visible={false}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={pool.n} array={pool.pos} itemSize={3} />
          </bufferGeometry>
          <pointsMaterial size={pool.size} map={sprite} color={pool.color} transparent opacity={0} sizeAttenuation depthWrite={false} blending={THREE.AdditiveBlending} alphaTest={0.01} />
        </points>)}
    </group>;
}
function MiraCore3D({ state = "idle" }) {
  return <div style={{ position: "fixed", inset: 0, zIndex: 15, pointerEvents: "none", background: "transparent" }}>
      <OrbBoundary>
      <Canvas camera={{
        position: [0, 0, 4.8],
        fov: 50
      }} dpr={[1, 1.5]} gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
      }} style={{
        background: "transparent",
        pointerEvents: "none"
      }} onCreated={({
        gl,
        setFrameloop
      }) => {
        const canvas = gl.domElement;
        hideWhileLost(canvas, {
          name: "orb"
        });
        canvas.addEventListener("webglcontextlost", e => {
          e.preventDefault();
          try {
            setFrameloop("never");
          } catch {}
        }, false);
        canvas.addEventListener("webglcontextrestored", () => {
          try {
            setFrameloop("always");
          } catch {}
        }, false);
      }}>
        <MiraRibbons />
        <MiraCoreMatter />
        <Core state={state} />
        <EffectComposer>
          <DialBloom />
        </EffectComposer>
      </Canvas>
      </OrbBoundary>
    </div>;
}
export { MiraRibbons, MiraCore3D as default };

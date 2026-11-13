// MIRA's violet field: thin folded ridges, soft membranes and smoke around the ring (one fragment shader).
import { useEffect, useRef, useState } from "react";
import { getMiraStage } from "../lib/miraStage";
import { getVoiceEnergy } from "../lib/voiceEnergy";
import { isRenderCalm } from "../lib/renderCalm";
import { getMiraDebug } from "../lib/miraDebug";
import { dial } from "../lib/miraDial";
import { readOrbScreen } from "../lib/orbScreen";
import { hideWhileLost, hideIfLost } from "../lib/glLoss";
const vs = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;
const LOSE_EXT = new WeakMap();
const fs = `
  precision highp float;
  uniform vec2  iRes;
  uniform float iTime;
  uniform float iField;
  uniform float iMatter;
  uniform vec2  iCenter;
  uniform float iRing;
  uniform float iClear;
  uniform float iSpread;
  uniform float iState;
  uniform float iEnergy;
  uniform float iDebug;
  uniform float iAlpha;
  uniform float iNear;
  uniform float iHotLo;

  float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
    float a = hash(i), b = hash(i + vec2(1.0, 0.0)), c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return v; }
  float fbm3(vec2 p) { float v = 0.0, a = 0.5; for (int i = 0; i < 3; i++) { v += a * noise(p); p = p * 2.03 + vec2(17.1, 9.2); a *= 0.5; } return v; }

  vec2 domainWarp(vec2 p, float t) {
    vec2 q = vec2(fbm(p + vec2(0.0, t * 0.045)), fbm(p + vec2(5.2, -t * 0.037)));
    vec2 r = vec2(fbm(p + 3.8 * q + vec2(1.7, t * 0.027)), fbm(p + 3.2 * q + vec2(8.3, -t * 0.031)));
    return p + 1.4 * r;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / iRes;
    vec2 asp = vec2(iRes.x / iRes.y, 1.0);

    float slowT = iTime * 0.035, medT = iTime * 0.08, fineT = iTime * 0.14;
    float listening = step(0.5, iState) * (1.0 - step(1.5, iState));
    float thinking  = step(1.5, iState) * (1.0 - step(2.5, iState));
    float speaking  = step(2.5, iState);
    float audioBoost = 1.0 + iEnergy * 0.20 * speaking;

    float nearSlowT = iTime * 0.02, nearMedT = iTime * 0.05, hotT = iTime * 0.11 * (1.0 + 0.35 * thinking);
    float debugOn = step(0.5, iDebug);

    vec2 toOrb = (uv - iCenter) * asp;
    float distanceToOrb = length(toOrb);
    vec2 dir = toOrb / (distanceToOrb + 0.0001);
    vec2 tangent = vec2(-dir.y, dir.x);
    float orbInfluence = 1.0 - smoothstep(iRing * 0.9, iRing * 3.0, distanceToOrb);

    vec2 p = (uv - 0.5) * asp * 2.0;

    vec2 warped = domainWarp(p, iTime);
    warped += tangent * orbInfluence * sin(distanceToOrb * 17.0 + medT * 4.6) * 0.035;
    float distortion = fbm(warped * 1.7 + slowT);
    float irregularDistance = distanceToOrb + distortion * 0.09;

    float fieldL = fbm(warped * 0.45 + vec2(slowT * 0.6, -slowT * 0.4));
    float fieldA = fbm(warped * 1.15 + vec2(medT * 0.3, 0.0));
    float fieldB = fbm(warped * 2.1 + 7.4 + vec2(0.0, fineT * 0.25));

    float ridgeA = pow(1.0 - abs(fieldA * 2.0 - 1.0), 6.0);
    float ridgeB = pow(1.0 - abs(fieldB * 2.0 - 1.0), 10.0);
    float ridgeL = pow(1.0 - abs(fieldL * 2.0 - 1.0), 5.0);
    float membrane = smoothstep(0.48, 0.72, fieldA) * 0.12;
    float membraneL = smoothstep(0.52, 0.80, fieldL) * 0.07;

    float energyRaw = fbm(warped * 0.65 + vec2(slowT * 0.6 * (1.0 + 0.5 * thinking), -slowT * 0.5));
    float energy = smoothstep(0.58, 0.78, energyRaw);
    ridgeA *= mix(0.4, 1.7, energy) * audioBoost;
    ridgeB *= mix(0.6, 1.5, energy) * audioBoost;

    float farHot = pow(smoothstep(0.80, 0.92, energyRaw), 1.5) * max(ridgeA, ridgeB);

    float near = (1.0 - smoothstep(iRing * 1.1, iRing * 3.2, irregularDistance)) * smoothstep(iRing * 0.85, iRing * 1.15, irregularDistance);
    ridgeB *= 1.0 + 0.6 * near;
    ridgeA *= 1.0 + 0.3 * near;

    float clear = mix(1.0, smoothstep(iRing * 0.80, iRing * 1.05, distanceToOrb), iClear);

    float innerMask = smoothstep(iRing * 0.90, iRing * 1.10, distanceToOrb);
    float outerMask = 1.0 - smoothstep(iRing * 2.0, iRing * 2.7, distanceToOrb);
    float rawMask = innerMask * outerMask;
    float nearOrbMask = rawMask;
    float breakupS = 0.0;
    float nearRidgeA = 0.0, nearRidgeB = 0.0, nearBody = 0.0, hotspot = 0.0, hotGlow = 0.0;
    if (nearOrbMask > 0.002) {

      float breakup = fbm3(warped * 1.9 + vec2(nearSlowT * 1.05, -nearSlowT * 0.8));
      breakupS = smoothstep(0.22, 0.62, breakup);
      nearOrbMask *= breakupS;
      float nearFieldA = fbm(warped * 1.4 + vec2(nearMedT * 0.4, nearMedT * 0.25));
      float nearFieldB = fbm(warped * 2.7 + 8.7 + vec2(-nearMedT * 0.3, nearMedT * 0.5));
      nearRidgeA = pow(1.0 - abs(nearFieldA * 2.0 - 1.0), 7.0) * nearOrbMask;
      nearRidgeB = pow(1.0 - abs(nearFieldB * 2.0 - 1.0), 12.0) * nearOrbMask;
      nearBody = smoothstep(0.50, 0.78, nearFieldA) * nearOrbMask;

      float energyField = fbm3(warped * 1.5 + vec2(hotT * 0.28, -hotT * 0.21));

      float energyHot = smoothstep(iHotLo, iHotLo + 0.07, energyField);
      float matterPresence = min(1.0, max(max(nearRidgeA, nearRidgeB), nearBody * 0.6) * 1.6);
      hotspot = energyHot * matterPresence;

      hotGlow = energyHot * pow(1.0 - abs(nearFieldA * 2.0 - 1.0), 2.0) * nearOrbMask;
    }

    vec3 violetDeep   = vec3(0.18, 0.05, 0.38);
    vec3 violetMain   = vec3(0.48, 0.20, 1.00);
    vec3 violetBright = vec3(0.72, 0.38, 1.00);
    vec3 lavender     = vec3(0.88, 0.72, 1.00);
    vec3 baseViolet   = vec3(0.40, 0.12, 0.92);
    vec3 whiteViolet  = vec3(1.00, 0.95, 1.00);
    vec3 color = mix(violetDeep, violetMain, fieldA);
    color = mix(color, violetBright, clamp(ridgeA, 0.0, 1.0));
    color = mix(color, lavender, clamp(ridgeB * energy, 0.0, 1.0));

    float alpha = iAlpha * (membraneL * 0.5 * iField + membrane * 0.26 * iMatter + ridgeL * 0.07 * iField
                + ridgeA * 0.30 * iMatter + ridgeB * 0.42 * iField);
    float visibility = smoothstep(0.32, 0.70, fbm(warped * 0.6 + 12.0 + vec2(slowT * 0.3, -slowT * 0.2)));

    visibility = mix(visibility, 0.55 + 0.45 * visibility, iSpread);
    alpha *= visibility * clear;
    float quiet = 1.0 - 0.18 * (1.0 - step(0.5, iState));
    alpha *= quiet;

    vec3 nearCol = mix(baseViolet, violetBright, clamp(nearRidgeA * 1.4, 0.0, 1.0));
    nearCol = mix(nearCol, lavender, clamp(nearRidgeB, 0.0, 1.0));
    nearCol = mix(nearCol, whiteViolet, clamp(hotspot * 1.5, 0.0, 1.0));

    float nearAlpha = (nearBody * 0.30 + nearRidgeA * 1.00 + nearRidgeB * 0.95) * iMatter * quiet * audioBoost * iNear;

    vec3 ground = mix(vec3(0.012, 0.011, 0.030), vec3(0.005, 0.004, 0.013), smoothstep(0.35, 1.25, length((uv - 0.5) * asp)));
    float atmo = smoothstep(0.40, 0.9, fbm(p * 0.28 + vec2(slowT * 0.25, slowT * 0.15) + 30.0)) * 0.09 * iField;

    if (debugOn > 0.5) {
      vec3 dbg = ground;
      if (iDebug < 1.5) { }
      else if (iDebug < 2.5) dbg = vec3(rawMask);
      else if (iDebug < 3.5) dbg = vec3(rawMask * breakupS);
      else if (iDebug < 4.5) dbg += vec3(1.0, 0.0, 0.0) * clamp((nearRidgeA + nearRidgeB) * 3.0 + nearBody * 1.5, 0.0, 1.0);
      else if (iDebug < 5.5) dbg += vec3(1.0) * clamp(hotspot * 2.5 + hotGlow * 0.35, 0.0, 1.0);
      else if (iDebug < 6.5) {
        dbg = mix(dbg, nearCol, clamp(nearAlpha, 0.0, 1.0));
        dbg += lavender * hotGlow * 0.5 * iMatter + whiteViolet * hotspot * 1.6 * iMatter;
      }

      gl_FragColor = vec4(dbg, 1.0);
      return;
    }

    vec3 col = ground + violetDeep * atmo;

    float haze = (0.35 + 0.65 * smoothstep(0.25, 0.85, fieldL)) * (0.6 + 0.4 * visibility);
    col += mix(violetDeep, violetMain, fieldL * 0.8) * haze * 0.30 * iSpread * iField * iAlpha;
    col = col + color * clamp(alpha, 0.0, 1.0);

    vec3 nearFaint = mix(baseViolet, violetBright, clamp(nearRidgeA * 1.4, 0.0, 1.0));
    col = mix(col, nearFaint, clamp(nearAlpha * 0.18, 0.0, 1.0));

    gl_FragColor = vec4(col, 1.0);
  }
`;
const REVIVE_MS = 1200,
  MAX_REVIVES = 5;
function MiraField({
  state = "idle"
}) {
  const canvasRef = useRef(null);
  const stateRef = useRef(state);
  const [gen, setGen] = useState(0);
  stateRef.current = state;
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return void 0;
    let gl = null,
      prog = null,
      U = {},
      raf = 0,
      disposed = false,
      revive = 0;
    const watchRevive = () => {
      if (revive || gen >= MAX_REVIVES) return;
      revive = setTimeout(() => {
        revive = 0;
        if (disposed || !gl || !gl.isContextLost()) return;
        try {
          console.warn("[mira] field: still lost - a fresh canvas");
        } catch (_) {}
        setGen(g => g + 1);
      }, REVIVE_MS);
    };
    let last = performance.now(),
      time = 0,
      frame = 0;
    let center = [0.5, 0.58],
      ring = 0.28,
      clearCore = 1;
    let energySm = 0;
    const resize = () => {
      const k = 0.7 * Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(320, Math.floor(window.innerWidth * k));
      canvas.height = Math.max(180, Math.floor(window.innerHeight * k));
      if (gl && !gl.isContextLost()) gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const build = () => {
      gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        premultipliedAlpha: false
      });
      if (!gl) {
        try {
          console.warn("[mira] field: no WebGL context");
        } catch (_) {}
        return false;
      }
      hideIfLost(canvas, gl);
      if (gl.isContextLost()) {
        try {
          console.warn("[mira] field: context was lost at mount - waiting to restore");
        } catch (_) {}
        askBack();
        watchRevive();
        return false;
      }
      try {
        const ext = gl.getExtension("WEBGL_lose_context");
        if (ext) LOSE_EXT.set(canvas, ext);
      } catch (_) {}
      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          try {
            console.warn("[mira] field shader failed:", gl.getShaderInfoLog(s) || (gl.isContextLost() ? "context lost" : "no log"));
          } catch (_) {}
        }
        return s;
      };
      prog = gl.createProgram();
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        try {
          console.warn("[mira] field program failed:", gl.getProgramInfoLog(prog));
        } catch (_) {}
        ;
        return false;
      }
      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const aLoc = gl.getAttribLocation(prog, "a");
      gl.enableVertexAttribArray(aLoc);
      gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
      U = {};
      for (const n of ["iRes", "iTime", "iField", "iMatter", "iCenter", "iRing", "iClear", "iSpread", "iState", "iEnergy", "iDebug", "iHotLo", "iAlpha", "iNear"]) U[n] = gl.getUniformLocation(prog, n);
      resize();
      return true;
    };
    const readOrb = () => {
      const o = readOrbScreen();
      if (!o) return;
      center = [o.cx / window.innerWidth, 1 - o.cy / window.innerHeight];
      ring = o.r / window.innerHeight;
      clearCore = o.source === "anchor" ? 0 : 1;
    };
    readOrb();
    const render = () => {
      if (disposed || !gl || gl.isContextLost()) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(render);
      const st = getMiraStage();
      const presence = Math.max(st.mira, st.matter);
      canvas.style.opacity = presence > 1e-3 ? String(Math.min(1, st.mira * 1.6)) : "0";
      if (presence <= 1e-3) return;
      if (isRenderCalm() && ++frame & 1) return;
      const now = performance.now();
      const dt = Math.min((now - last) / 1e3, 0.05);
      last = now;
      if (frame++ % 10 === 0) readOrb();
      const s = stateRef.current;
      const stateNo = s === "speaking" ? 3 : s === "thinking" ? 2 : s === "listening" ? 1 : 0;
      const e = s === "speaking" ? Math.max(st.talk > 0 ? st.voice : 0, st.talk > 0 ? 0 : getVoiceEnergy("output")) : 0;
      energySm += (e - energySm) * Math.min(dt * 6, 1);
      time += dt * (st.pace || 1);
      gl.uniform2f(U.iRes, canvas.width, canvas.height);
      gl.uniform1f(U.iTime, time);
      gl.uniform1f(U.iField, st.mira);
      gl.uniform1f(U.iMatter, st.matter);
      gl.uniform2f(U.iCenter, center[0], center[1]);
      gl.uniform1f(U.iRing, ring);
      gl.uniform1f(U.iClear, clearCore);
      gl.uniform1f(U.iSpread, dial("field.spread"));
      gl.uniform1f(U.iState, stateNo);
      gl.uniform1f(U.iEnergy, energySm);
      const dbg = getMiraDebug();
      gl.uniform1f(U.iDebug, dbg.code);
      gl.uniform1f(U.iHotLo, dbg.hotLo);
      gl.uniform1f(U.iAlpha, dial("field.alpha"));
      gl.uniform1f(U.iNear, dial("field.near"));
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };
    const askBack = () => setTimeout(() => {
      if (disposed || !gl || !gl.isContextLost()) return;
      const ext = LOSE_EXT.get(canvas);
      if (!ext) {
        try {
          console.warn("[mira] field: no lose-context handle for this canvas - cannot ask it back");
        } catch (_) {}
        ;
        return;
      }
      try {
        ext.restoreContext();
      } catch (e) {
        try {
          console.warn("[mira] field: restoreContext failed", e);
        } catch (_) {}
      }
    }, 0);
    const onLost = ev => {
      ev.preventDefault();
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      try {
        console.warn("[mira] field context lost - waiting for restore");
      } catch (_) {}
      askBack();
      watchRevive();
    };
    const onRestored = () => {
      if (disposed) return;
      if (build()) {
        try {
          console.log("[mira] field context restored");
        } catch (_) {}
        ;
        last = performance.now();
        raf = requestAnimationFrame(render);
      }
    };
    const unhide = hideWhileLost(canvas, {
      name: "mira field"
    });
    canvas.addEventListener("webglcontextlost", onLost, false);
    canvas.addEventListener("webglcontextrestored", onRestored, false);
    window.addEventListener("resize", resize);
    if (build()) raf = requestAnimationFrame(render);
    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      if (revive) clearTimeout(revive);
      window.removeEventListener("resize", resize);
      unhide();
      canvas.removeEventListener("webglcontextlost", onLost, false);
      canvas.removeEventListener("webglcontextrestored", onRestored, false);
      try {
        (LOSE_EXT.get(canvas) || gl?.getExtension("WEBGL_lose_context"))?.loseContext();
      } catch (_) {}
    };
  }, [gen]);
  return <canvas key={gen} ref={canvasRef} aria-hidden="true" style={{
    position: "fixed",
    inset: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
    pointerEvents: "none",
    opacity: 0,
    transition: "opacity .25s linear"
  }} />;
}
export { MiraField as default };

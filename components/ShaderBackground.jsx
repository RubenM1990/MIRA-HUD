// Animated WebGL wave backdrop (MIT community component from 21st.dev, see CREDITS.md), tinted violet in MIRA mode.
import { useEffect, useRef } from "react";
import { getMiraStage } from "../lib/miraStage";
import { isRenderCalm } from "../lib/renderCalm";
import { readOrbScreen } from "../lib/orbScreen";
import { hideWhileLost, hideIfLost } from "../lib/glLoss";
const vsSource = `
  attribute vec4 aVertexPosition;
  void main() {
    gl_Position = aVertexPosition;
  }
`;
const fsSource = `
  precision highp float;
  uniform vec2 iResolution;
  uniform float iFlow;
  uniform float iShineTime;
  uniform float iVoiceIntensity;
  uniform float iMira;
  uniform float iAccents;
  uniform float iOpacity;
  uniform float iCyanCount, iGoldCount, iWaveThickness, iWaveGlow, iShaderStrength;
  uniform float iWaveDefinition, iWaveAmplitude, iWaveSpread;
  uniform float iSparkleDensity, iSparkleBrightness;
  uniform float iDustAmount, iDustSize, iDustDistance, iDustSpeed;
  uniform float iWaveOrbRadius;

  uniform vec2  iWaveCenter;
  uniform float iWaveLevel;
  uniform float iWaveBurst;
  uniform float iWavePhase;
  uniform float iWaveActive;
  uniform float iWaveRing;
  uniform float iFieldOpen;

  const float overallSpeed    = 0.11;
  const float gridSmoothWidth = 0.015;
  const float axisWidth       = 0.05;
  const float majorLineWidth  = 0.025;
  const float minorLineWidth  = 0.0125;
  const float majorLineFreq   = 5.0;
  const float minorLineFreq   = 1.0;
  const float scale           = 5.0;
  const float minLineWidth    = 0.025;
  const float maxLineWidth    = 0.32;
  const float lineSpeed       = 1.0 * overallSpeed;
  const float baseAmplitude   = 0.65;
  const float lineFrequency   = 0.14;
  const float warpSpeed       = 0.3 * overallSpeed;
  const float warpFrequency   = 0.4;
  const float warpAmplitude   = 1.6;
  const float offsetFrequency = 0.45;
  const float offsetSpeed     = 1.1 * overallSpeed;
  const float minOffsetSpread = 0.7;
  const float maxOffsetSpread = 2.4;
  const int   linesPerGroup   = 24;

  #define drawCircle(pos, radius, coord) smoothstep(radius + gridSmoothWidth, radius, length(coord - (pos)))
  #define drawSmoothLine(pos, halfWidth, t) smoothstep(halfWidth, 0.0, abs(pos - (t)))
  #define drawCrispLine(pos, halfWidth, t) smoothstep(halfWidth + gridSmoothWidth, halfWidth, abs(pos - (t)))
  #define drawPeriodicLine(freq, width, t) drawCrispLine(freq / 2.0, width, abs(mod(t, freq) - (freq) / 2.0))

  float hash(float n) {
    return fract(sin(n) * 43758.5453);
  }

  float random(float t) {
    return (cos(t) + cos(t * 1.3 + 1.3) + cos(t * 1.4 + 1.4)) / 3.0;
  }

  float getPlasmaY(float x, float horizontalFade, float offset, float amp) {
    return random(x * lineFrequency + iFlow * lineSpeed) * horizontalFade * amp + offset;
  }

  void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec2 uv = fragCoord.xy / iResolution.xy;

    float voiceBoost = iVoiceIntensity;
    vec4 lineColorBase = mix(vec4(0.06, 0.45, 0.55, 1.0), vec4(0.50, 0.20, 0.78, 1.0), iMira);
    vec4 lineColorCool = mix(vec4(0.03, 0.28, 0.38, 1.0), vec4(0.26, 0.08, 0.50, 1.0), iMira);
    float lineAmplitude = baseAmplitude * iWaveAmplitude * (1.0 + voiceBoost * 2.8);
    float brightnessBoost = (1.0 + voiceBoost * 2.2) * (1.0 + iMira * 0.45);

    vec2 space = (fragCoord - iResolution.xy / 2.0) / iResolution.x * 2.0 * scale;

    float horizontalFade = 1.0 - (cos(uv.x * 6.28) * 0.5 + 0.5);
    float verticalFade   = 1.0 - (cos(uv.y * 6.28) * 0.5 + 0.5);

    space.y += random(space.x * warpFrequency + iFlow * warpSpeed) * warpAmplitude * iShaderStrength * (0.5 + horizontalFade);
    space.x += random(space.y * warpFrequency + iFlow * warpSpeed + 2.0) * warpAmplitude * iShaderStrength * horizontalFade;

    vec2 centerUv = uv - vec2(0.5, 0.48);
    float centerDist = length(centerUv * vec2(1.0, iResolution.x / iResolution.y));

    float edgeGlow  = smoothstep(0.15, 0.55, centerDist);

    float bottomGlow = smoothstep(0.65, 0.0, uv.y) * 0.35;

    float cornerDark = smoothstep(0.4, 0.8, length((uv - vec2(0.5, 0.5)) * 1.6));

    vec4 bgCenter = vec4(0.001, 0.002, 0.003, 1.0);
    vec4 bgEdge   = mix(vec4(0.001, 0.006, 0.010, 1.0), vec4(0.014, 0.004, 0.024, 1.0), iMira);
    vec4 fragColor = mix(bgCenter, bgEdge, edgeGlow * 0.45 + bottomGlow * 0.6);
    fragColor *= verticalFade * 0.92 + 0.08;
    fragColor.a = 1.0;

    vec4 lines = vec4(0.0);
    vec3 shineAcc = vec3(0.0);
    float shineMask = 0.0;
    vec3 dustAcc = vec3(0.0);
    float dustMask = 0.0;
    for (int l = 0; l < linesPerGroup; l++) {
      if (float(l) >= iCyanCount + iGoldCount) break;
      float normalizedIdx = float(l) / max(iCyanCount + iGoldCount, 1.0);
      float offsetTime     = iFlow * offsetSpeed;
      float offsetPos      = float(l) + space.x * offsetFrequency;
      float rand = random(offsetPos + offsetTime) * 0.5 + 0.5;
      float halfWidth = mix(minLineWidth, maxLineWidth, rand * horizontalFade) * iWaveThickness / 2.0;
      float offset    = random(offsetPos + offsetTime * (1.0 + normalizedIdx)) * mix(minOffsetSpread, maxOffsetSpread, horizontalFade) * iWaveSpread;
      float linePos   = getPlasmaY(space.x, horizontalFade, offset, lineAmplitude);
      float line = drawSmoothLine(linePos, halfWidth, space.y) / 2.0
                 + drawCrispLine(linePos, halfWidth * 0.15 / iWaveDefinition, space.y) * iWaveDefinition;

      if (iAccents < 0.5) {
        float circleX = mod(float(l) + iFlow * lineSpeed, 25.0) - 12.0;
        vec2 circlePos = vec2(circleX, getPlasmaY(circleX, horizontalFade, offset, lineAmplitude));
        line += drawCircle(circlePos, 0.01, space) * 4.0;
      }

      float depthTint = uv.y * 0.4 + normalizedIdx * 0.3;
      vec4  lineColor = mix(lineColorCool, lineColorBase, depthTint);
      float goldLine = iAccents * ((iCyanCount == 7.0 && iGoldCount == 3.0) ? ((l == 1 || l == 5 || l == 8) ? 1.0 : 0.0) : floor((float(l) + 1.0) * iGoldCount / max(iCyanCount + iGoldCount, 1.0)) - floor(float(l) * iGoldCount / max(iCyanCount + iGoldCount, 1.0)));
      vec4 goldColor = mix(vec4(0.42, 0.27, 0.04, 1.0), vec4(0.62, 0.40, 0.06, 1.0), depthTint);
      vec4 violetColor = mix(vec4(0.26, 0.08, 0.50, 1.0), vec4(0.50, 0.20, 0.78, 1.0), depthTint);
      goldColor = mix(goldColor, violetColor, iMira);
      lineColor = mix(lineColor, goldColor, goldLine);
      lines += line * lineColor * rand;

      if (iAccents > 0.5 && iOpacity > 0.0 && iSparkleDensity > 0.001) {

        float shineClock = iShineTime * (0.17 + mod(float(l), 3.0) * 0.012) * iSparkleDensity + float(l) * 0.47;
        float shineCycle = floor(shineClock);
        float shineLife = fract(shineClock);
        float shineOn = step(0.18, hash(shineCycle * 3.1 + float(l) * 9.7));
        float shineSide = hash(shineCycle * 1.7 + float(l) * 4.9) < 0.5 ? -1.0 : 1.0;
        float shineX = shineSide * mix(1.7, 2.8, hash(shineCycle + float(l) * 6.3));
        float px = 2.0 * scale / iResolution.x;
        float shineLen = mix(55.0, 90.0, hash(shineCycle * 2.3 + float(l))) * px;
        float along = (space.x - shineX) / shineLen;
        float shineTime = smoothstep(0.0, 0.08, shineLife) * (1.0 - smoothstep(0.28, 0.50, shineLife));
        float shine = exp(-along * along) * shineTime * shineOn;
        if (iSparkleDensity > 1.5) {
          float clock2 = iShineTime * (0.21 + mod(float(l), 4.0) * 0.013) * iSparkleDensity + float(l) * 0.73;
          float life2 = fract(clock2);
          float side2 = hash(floor(clock2) * 2.1 + float(l) * 6.7) < 0.5 ? -1.0 : 1.0;
          float x2 = side2 * mix(0.35, 2.7, hash(floor(clock2) + float(l) * 3.7));
          float along2 = (space.x - x2) / shineLen;
          shine += exp(-along2 * along2) * smoothstep(0.0, 0.08, life2) * (1.0 - smoothstep(0.24, 0.48, life2)) * min(1.0, iSparkleDensity - 1.5);
        }
        float lineDist = abs(linePos - space.y);
        float shineCore = smoothstep(2.2 * px, 0.0, lineDist);
        float shineGlow = smoothstep(12.0 * px, 0.0, lineDist) * 0.55;
        vec3 shineColor = mix(vec3(0.20, 0.85, 1.0), vec3(1.0, 0.72, 0.20), goldLine);
        shineColor = mix(shineColor, vec3(0.72, 0.40, 1.0), iMira);
        shineAcc += (shineColor * shineGlow + mix(shineColor, vec3(1.0), 0.75) * shineCore) * shine * iSparkleBrightness;
        shineMask += (shineGlow + shineCore) * shine * iSparkleBrightness;
      }
      if (iAccents > 0.5 && iOpacity > 0.0 && iDustAmount > 0.0) {

        float dustPx = 2.0 * scale / iResolution.x;
        if (abs(space.y - linePos) > (iDustDistance + iDustSize * 5.0) * dustPx) continue;
        for (int d = 0; d < 3; d++) {
            float seed = float(l) * 17.13 + float(d) * 41.71;
            if (hash(seed + 2.4) * 100.0 >= iDustAmount) continue;
            float rate = 0.05 * iDustSpeed * mix(0.72, 1.28, hash(seed + 8.1));
            float dustX = (fract(hash(seed + 3.7) + iShineTime * rate) * 2.0 - 1.0) * scale;
            float side = hash(seed + 5.2) < 0.5 ? -1.0 : 1.0;
            float offsetY = side * hash(seed + 6.6) * iDustDistance * dustPx;
            float radius = max(0.5, iDustSize) * dustPx;
            if (abs(space.x - dustX) > radius * 5.0) continue;
            float dx = (space.x - dustX) / radius;
            float dy = (space.y - linePos - offsetY) / radius;
            float distance2 = dx * dx + dy * dy;
            float point = exp(-distance2 * 1.8);
            float halo = exp(-distance2 * 0.11) * 0.24;
            vec3 dustColor = mix(vec3(0.22, 0.83, 1.0), vec3(1.0, 0.73, 0.27), goldLine);
            dustColor = mix(dustColor, vec3(0.72, 0.40, 1.0), iMira);
            dustAcc += (dustColor * halo + mix(dustColor, vec3(1.0), 0.68) * point);
            dustMask += halo + point;
        }
      }
    }

    float glossRing = smoothstep(0.38, 0.42, centerDist) * smoothstep(0.58, 0.42, centerDist);
    fragColor += mix(vec4(0.06, 0.42, 0.55, 0.0), vec4(0.55, 0.25, 0.85, 0.0), iMira) * glossRing * 0.03;

    float aspect = iResolution.x / max(iResolution.y, 1.0);
    float wdist = length((uv - iWaveCenter) * vec2(aspect, 1.0));

    float fieldMask = 1.0;
    if (iWaveActive > 0.5) {
      float rr = 0.05 + iWaveLevel * 1.55 + iWaveBurst * 0.55;
      fieldMask = mix(smoothstep(rr + 0.22, rr - 0.06, wdist), 1.0, iFieldOpen);
    }
    fragColor += lines * brightnessBoost * fieldMask * iWaveGlow * iShaderStrength;

    if (iWaveRing > 0.001 || iWaveBurst > 0.001) {
      float dist = wdist;

      float reach = 0.10 + iWaveLevel * 0.85 + iWaveBurst * 1.35;
      float env = smoothstep(reach, reach * 0.30, dist);
      float ring = pow(max(sin(dist * 26.0 - iWavePhase * 3.6), 0.0), 3.0) * env;

      ring += smoothstep(0.085, 0.0, abs(dist - reach * 0.93)) * (0.55 + iWaveBurst * 1.1);
      ring *= (0.30 + iWaveRing * 0.75 + iWaveBurst * 2.4) * min(1.0, iWaveRing * 3.0 + iWaveBurst);
      fragColor += mix(vec4(0.05, 0.52, 0.70, 0.0), vec4(0.62, 0.30, 0.95, 0.0), iMira) * ring * 0.15 * iWaveGlow * iShaderStrength;
    }

    float miraFade = 1.0 - iMira;
    if (iAccents > 0.5) {

      float orbDistance = length(fragCoord - iWaveCenter * iResolution);
      float clearOfOrb = smoothstep(iWaveOrbRadius + 18.0, iWaveOrbRadius + 60.0, orbDistance);
      float burstMask = fieldMask * clearOfOrb * miraFade;
      vec3 field = fragColor.rgb * iOpacity * miraFade;
      float dustField = fieldMask * miraFade;
      float alpha = clamp(iOpacity + shineMask * burstMask * 0.78 + dustMask * dustField * 0.9, 0.0, 1.0);
      gl_FragColor = vec4(field + shineAcc * burstMask * 0.95 * iWaveGlow * iShaderStrength + dustAcc * dustField * iWaveGlow * iShaderStrength, alpha);
    } else {
      fragColor.rgb *= miraFade;
      gl_FragColor = fragColor;
    }
  }
`;
function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}
function initShaderProgram(gl, vs, fs) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vs);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fs);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("Shader link error:", gl.getProgramInfoLog(program));
    return null;
  }
  return program;
}
function ShaderBackground({
  opacity = 0.18,
  voiceActive = false,
  accents = true,
  maxFps = 60
}) {
  const canvasRef = useRef(null);
  const voiceRef = useRef(0);
  const voiceTargetRef = useRef(0);
  const centerRef = useRef([0.5, 0.5]);
  const orbRadiusRef = useRef(120);
  const accentsRef = useRef(accents ? 1 : 0);
  accentsRef.current = accents ? 1 : 0;
  const opacityRef = useRef(opacity);
  opacityRef.current = opacity;
  const frameNo = useRef(0);
  const wavePhaseRef = useRef(0);
  const flowRef = useRef(0);
  useEffect(() => {
    voiceTargetRef.current = voiceActive ? 1 : 0;
  }, [voiceActive]);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;
    hideIfLost(canvas, gl);
    const unhideLost = hideWhileLost(canvas, {
      name: "wave background"
    });
    const program = initShaderProgram(gl, vsSource, fsSource);
    if (!program) return;
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const programInfo = {
      program,
      attribLocations: {
        vertexPosition: gl.getAttribLocation(program, "aVertexPosition")
      },
      uniformLocations: {
        resolution: gl.getUniformLocation(program, "iResolution"),
        time: gl.getUniformLocation(program, "iFlow"),
        shineTime: gl.getUniformLocation(program, "iShineTime"),
        voiceIntensity: gl.getUniformLocation(program, "iVoiceIntensity"),
        mira: gl.getUniformLocation(program, "iMira"),
        accents: gl.getUniformLocation(program, "iAccents"),
        opacity: gl.getUniformLocation(program, "iOpacity"),
        cyanCount: gl.getUniformLocation(program, "iCyanCount"),
        goldCount: gl.getUniformLocation(program, "iGoldCount"),
        waveThickness: gl.getUniformLocation(program, "iWaveThickness"),
        waveGlow: gl.getUniformLocation(program, "iWaveGlow"),
        shaderStrength: gl.getUniformLocation(program, "iShaderStrength"),
        waveDefinition: gl.getUniformLocation(program, "iWaveDefinition"),
        waveAmplitude: gl.getUniformLocation(program, "iWaveAmplitude"),
        waveSpread: gl.getUniformLocation(program, "iWaveSpread"),
        sparkleDensity: gl.getUniformLocation(program, "iSparkleDensity"),
        sparkleBrightness: gl.getUniformLocation(program, "iSparkleBrightness"),
        dustAmount: gl.getUniformLocation(program, "iDustAmount"),
        dustSize: gl.getUniformLocation(program, "iDustSize"),
        dustDistance: gl.getUniformLocation(program, "iDustDistance"),
        dustSpeed: gl.getUniformLocation(program, "iDustSpeed"),
        orbRadius: gl.getUniformLocation(program, "iWaveOrbRadius"),
        waveCenter: gl.getUniformLocation(program, "iWaveCenter"),
        waveLevel: gl.getUniformLocation(program, "iWaveLevel"),
        waveBurst: gl.getUniformLocation(program, "iWaveBurst"),
        wavePhase: gl.getUniformLocation(program, "iWavePhase"),
        waveActive: gl.getUniformLocation(program, "iWaveActive"),
        waveRing: gl.getUniformLocation(program, "iWaveRing"),
        fieldOpen: gl.getUniformLocation(program, "iFieldOpen")
      }
    };
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    window.addEventListener("resize", resize);
    resize();
    let rafId;
    const startTime = Date.now();
    let lastFrame = Date.now();
    let calmFrame = 0;
    let lastDraw = 0;
    const render = () => {
      if (maxFps < 60 && (document.hidden || performance.now() - lastDraw < 1e3 / maxFps)) {
        rafId = requestAnimationFrame(render);
        return;
      }
      lastDraw = performance.now();
      if (isRenderCalm() && ++calmFrame & 1) {
        rafId = requestAnimationFrame(render);
        return;
      }
      const now = Date.now();
      const dt = Math.min((now - lastFrame) / 1e3, 0.05);
      lastFrame = now;
      const rate = voiceTargetRef.current > voiceRef.current ? dt * 2 : dt * 0.67;
      voiceRef.current += (voiceTargetRef.current - voiceRef.current) * Math.min(rate * 4, 1);
      const intensity = voiceRef.current;
      flowRef.current += dt * (1 + intensity * 2.4);
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(programInfo.program);
      gl.uniform2f(programInfo.uniformLocations.resolution, canvas.width, canvas.height);
      gl.uniform1f(programInfo.uniformLocations.time, flowRef.current);
      gl.uniform1f(programInfo.uniformLocations.shineTime, (now - startTime) / 1e3);
      gl.uniform1f(programInfo.uniformLocations.voiceIntensity, intensity);
      gl.uniform1f(programInfo.uniformLocations.mira, getMiraStage().mira);
      gl.uniform1f(programInfo.uniformLocations.accents, accentsRef.current);
      gl.uniform1f(programInfo.uniformLocations.opacity, opacityRef.current);
      gl.uniform1f(programInfo.uniformLocations.cyanCount, 7);
      gl.uniform1f(programInfo.uniformLocations.goldCount, 3);
      gl.uniform1f(programInfo.uniformLocations.waveThickness, 1);
      gl.uniform1f(programInfo.uniformLocations.waveGlow, 1);
      gl.uniform1f(programInfo.uniformLocations.shaderStrength, 1);
      gl.uniform1f(programInfo.uniformLocations.waveDefinition, 1);
      gl.uniform1f(programInfo.uniformLocations.waveAmplitude, 1);
      gl.uniform1f(programInfo.uniformLocations.waveSpread, 1);
      gl.uniform1f(programInfo.uniformLocations.sparkleDensity, 1);
      gl.uniform1f(programInfo.uniformLocations.sparkleBrightness, 1);
      gl.uniform1f(programInfo.uniformLocations.dustAmount, 0);
      gl.uniform1f(programInfo.uniformLocations.dustSize, 1.5);
      gl.uniform1f(programInfo.uniformLocations.dustDistance, 0);
      gl.uniform1f(programInfo.uniformLocations.dustSpeed, 1);
      wavePhaseRef.current += dt * 0.55;
      if (frameNo.current++ % 10 === 0) {
        const orb = readOrbScreen();
        if (orb) {
          centerRef.current[0] = orb.cx / window.innerWidth;
          centerRef.current[1] = 1 - orb.cy / window.innerHeight;
          orbRadiusRef.current = orb.r;
        }
      }
      gl.uniform2f(programInfo.uniformLocations.waveCenter, centerRef.current[0], centerRef.current[1]);
      gl.uniform1f(programInfo.uniformLocations.orbRadius, orbRadiusRef.current);
      gl.uniform1f(programInfo.uniformLocations.waveLevel, 0);
      gl.uniform1f(programInfo.uniformLocations.waveBurst, 0);
      gl.uniform1f(programInfo.uniformLocations.wavePhase, wavePhaseRef.current);
      gl.uniform1f(programInfo.uniformLocations.waveActive, 0);
      gl.uniform1f(programInfo.uniformLocations.waveRing, 0);
      gl.uniform1f(programInfo.uniformLocations.fieldOpen, 1);
      gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
      gl.vertexAttribPointer(programInfo.attribLocations.vertexPosition, 2, gl.FLOAT, false, 0, 0);
      gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      unhideLost();
    };
  }, []);
  return <canvas ref={canvasRef} style={{
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 0,
    opacity: accents ? opacity > 0 ? 1 : 0 : opacity,
    transition: "opacity 0.5s ease",
    pointerEvents: "none"
  }} />;
}
export { ShaderBackground as default };

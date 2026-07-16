'use client';
import { useEffect, useRef } from 'react';
import { startBlackHoleSynth, stopBlackHoleSynth, updateBlackHoleSynthProgress } from '@/lib/audio';

// ── Vertex Shader ────────────────────────────────────────────────────────────
const VS = `
  attribute vec2 pos;
  void main() { gl_Position = vec4(pos, 0.0, 1.0); }
`;

// ── Fragment Shader — Realistic Gravitational Lensing of background Galaxy ────
// This shader does high-fidelity raymarching around a Schwarzschild black hole
// bending rays from a procedurally generated realistic Milky Way and nebula.
const FS = `
  precision highp float;
  uniform vec2  u_res;
  uniform float u_time;
  uniform float u_yaw;
  uniform float u_pitch;

  const int   MAX_STEPS = 160;
  const float STEP      = 0.045;
  const float Rs        = 0.36;   // Schwarzschild Radius
  const float PI        = 3.14159265359;

  mat3 rotY(float a){ float c=cos(a),s=sin(a); return mat3(c,0,-s, 0,1,0, s,0,c); }
  mat3 rotX(float a){ float c=cos(a),s=sin(a); return mat3(1,0,0, 0,c,-s, 0,s,c); }

  // High quality hash and value noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for(int i = 0; i < 6; i++) {
      v += a * noise(p);
      p = p * 2.2 + vec2(1.1, 9.3);
      a *= 0.5;
    }
    return v;
  }

  // Realistic Procedural Milky Way and Dust Lanes
  vec3 getGalaxyColor(vec3 rd) {
    // Map sphere to 2D polar projection for galaxy texture mapping
    float phi = atan(rd.z, rd.x);
    float theta = acos(rd.y);
    vec2 uv = vec2(phi / (2.0 * PI) + 0.5, theta / PI);

    // Nebula dust lane noise
    vec2 gasUV = uv * vec2(8.0, 4.0);
    float gasVal = fbm(gasUV + vec2(u_time * 0.015, 0.0));
    float dustVal = fbm(gasUV * 2.3 - vec2(u_time * 0.01, 0.0)) * 1.1;

    // Base galactic gas belt (denser near equator)
    float belt = exp(-pow(abs(uv.y - 0.5) * 6.5, 2.0));
    
    // Milky Way central core glow
    float core = exp(-length(uv - vec2(0.5, 0.5)) * 9.0) * 1.6;

    // Detailed gas nebulae colors (brown/gold, deep space blue/indigo)
    vec3 gasCol = mix(vec3(0.05, 0.03, 0.08), vec3(0.55, 0.42, 0.32), gasVal);
    gasCol = mix(gasCol, vec3(0.08, 0.12, 0.28), belt * 0.4);
    
    // Dark dust lanes carving through the light (creating the Interstellar/NASA look)
    float dustMask = smoothstep(0.35, 0.75, dustVal) * belt;
    vec3 finalGas = mix(gasCol * (belt * 1.5 + core), vec3(0.005, 0.003, 0.008), dustMask * 0.92);

    // Stars overlay
    float starDensity = 0.9986;
    float starSeed = sin(rd.x * 123.0) * sin(rd.y * 311.0) * sin(rd.z * 187.0);
    float starVal = step(starDensity, fract(starSeed * 43758.545));
    
    // Star color variation
    vec3 starCol = mix(vec3(0.7, 0.85, 1.0), vec3(1.0, 0.9, 0.75), hash(rd.xy * 88.0));
    starCol *= starVal * (0.35 + 0.65 * hash(rd.zy * 44.0));

    return finalGas + starCol * 1.3;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;

    // Full 360 camera rotation
    mat3 cam = rotY(u_yaw) * rotX(u_pitch);
    vec3 rd = cam * normalize(vec3(uv * 1.0, 1.3));
    vec3 ro = vec3(0.0, 0.0, -3.2);

    vec3 col = vec3(0.0);
    vec3 p = ro;
    bool hitHorizon = false;

    // Einstein raytracer loop
    for (int i = 0; i < MAX_STEPS; i++) {
      float r = length(p);
      if (r < Rs * 0.95) {
        hitHorizon = true;
        break;
      }
      if (r > 16.0) break;

      // Einstein metric gravitational lens deflection
      float r5 = r*r*r*r*r;
      vec3 grav = -1.5 * Rs * p / r5;
      rd = normalize(rd + grav * STEP);
      p += rd * STEP;
    }

    if (hitHorizon) {
      col = vec3(0.001, 0.0, 0.002); // Pure pitch black singularity hole
    } else {
      col = getGalaxyColor(rd);
    }

    // High quality color grading & vignette
    col = pow(clamp(col, 0.0, 1.0), vec3(0.92));
    float vig = 1.0 - length(uv) * 0.42;
    col *= vig * vig;

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function ExhibitGargantua() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef(0);
  const timeRef   = useRef(0);
  const yawRef    = useRef(0.0);
  const pitchRef  = useRef(0.0);
  const targetYawRef   = useRef(0.0);
  const targetPitchRef = useRef(0.0);
  const dragRef   = useRef({ active: false, lastX: 0, lastY: 0 });
  const velRef    = useRef({ yaw: 0, pitch: 0 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = (canvas.getContext('webgl', { antialias: false, powerPreference: 'high-performance' }) ||
                canvas.getContext('experimental-webgl')) as WebGLRenderingContext;
    if (!gl) { console.error('WebGL not supported'); return; }

    startBlackHoleSynth();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const compile = (src: string, type: number) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error('Shader error:', gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };

    const vs = compile(VS, gl.VERTEX_SHADER);
    const fs = compile(FS, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(prog, 'pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes   = gl.getUniformLocation(prog, 'u_res');
    const uTime  = gl.getUniformLocation(prog, 'u_time');
    const uYaw   = gl.getUniformLocation(prog, 'u_yaw');
    const uPitch = gl.getUniformLocation(prog, 'u_pitch');

    // Drag tracking
    const onMouseDown = (e: MouseEvent) => {
      dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY };
      velRef.current  = { yaw: 0, pitch: 0 };
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      const dx = e.clientX - dragRef.current.lastX;
      const dy = e.clientY - dragRef.current.lastY;
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;
      targetYawRef.current   += dx * 0.006;
      targetPitchRef.current += dy * 0.005;
      targetPitchRef.current  = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, targetPitchRef.current));
      velRef.current = { yaw: dx * 0.006, pitch: dy * 0.005 };
    };
    const onMouseUp = () => { dragRef.current.active = false; };

    let lastTouchX = 0, lastTouchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      velRef.current = { yaw: 0, pitch: 0 };
    };
    const onTouchMove = (e: TouchEvent) => {
      const dx = e.touches[0].clientX - lastTouchX;
      const dy = e.touches[0].clientY - lastTouchY;
      lastTouchX = e.touches[0].clientX;
      lastTouchY = e.touches[0].clientY;
      targetYawRef.current   += dx * 0.006;
      targetPitchRef.current += dy * 0.005;
      targetPitchRef.current  = Math.max(-Math.PI*0.45, Math.min(Math.PI*0.45, targetPitchRef.current));
    };

    canvas.addEventListener('mousedown',  onMouseDown);
    canvas.addEventListener('mousemove',  onMouseMove);
    canvas.addEventListener('mouseup',    onMouseUp);
    canvas.addEventListener('mouseleave', onMouseUp);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: true });

    const drawLoop = () => {
      timeRef.current += 0.006;

      if (!dragRef.current.active) {
        velRef.current.yaw   *= 0.95;
        velRef.current.pitch *= 0.95;
        targetYawRef.current   += velRef.current.yaw;
        targetPitchRef.current += velRef.current.pitch;
      }

      yawRef.current   += (targetYawRef.current   - yawRef.current)   * 0.05;
      pitchRef.current += (targetPitchRef.current - pitchRef.current) * 0.05;

      // Map progress to camera movement speed to modulate NASA sound
      updateBlackHoleSynthProgress(Math.abs(velRef.current.yaw) * 15.0);

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, timeRef.current);
      gl.uniform1f(uYaw,  yawRef.current);
      gl.uniform1f(uPitch, pitchRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animRef.current = requestAnimationFrame(drawLoop);
    };
    drawLoop();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown',  onMouseDown);
      canvas.removeEventListener('mousemove',  onMouseMove);
      canvas.removeEventListener('mouseup',    onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseUp);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      cancelAnimationFrame(animRef.current);
      stopBlackHoleSynth();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#010105' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'grab' }}
      />

      <div style={{
        position: 'absolute', bottom: '2rem', left: '2rem',
        fontFamily: 'Space Mono, monospace', fontSize: '0.62rem',
        color: 'rgba(255,255,255,0.4)', lineHeight: 2.0, pointerEvents: 'none',
      }}>
        <div style={{ color: '#fff', fontSize: '0.68rem', marginBottom: '0.3rem', letterSpacing: '0.12em' }}>
          ◉ GARGANTUA SINGULARITY
        </div>
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.55rem', letterSpacing: '0.08em' }}>
          Schwarzschild geodesic ray deflection · Einstein gravitational lensing<br />
          Drag horizontally and vertically to orbit space around the horizon.
        </div>
      </div>
    </div>
  );
}

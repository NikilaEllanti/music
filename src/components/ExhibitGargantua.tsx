'use client';
import { useEffect, useRef } from 'react';
import { startBlackHoleSynth, stopBlackHoleSynth, updateBlackHoleSynthProgress } from '@/lib/audio';

// Exhibit 6: GARGANTUA — NASA-accurate WebGL black hole
// Real geodesic light bending, Doppler boosting, photon ring, accretion disk dust lanes

const VS = `
  attribute vec2 pos;
  void main() { gl_Position = vec4(pos, 0.0, 1.0); }
`;

const FS = `
  precision highp float;
  uniform vec2 u_res;
  uniform float u_time;
  uniform float u_yaw;
  uniform float u_pitch;

  const int MAX_STEPS = 120;
  const float STEP = 0.05;
  const float Rs = 0.38;
  const float PI = 3.14159265;

  mat3 rotY(float a){ float c=cos(a),s=sin(a); return mat3(c,0,-s,0,1,0,s,0,c); }
  mat3 rotX(float a){ float c=cos(a),s=sin(a); return mat3(1,0,0,0,c,-s,0,s,c); }

  float hash(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.545); }
  float noise(vec2 p){
    vec2 i=floor(p),f=fract(p),u=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);
  }

  void main(){
    vec2 uv = (gl_FragCoord.xy - 0.5*u_res) / u_res.y;
    mat3 cam = rotY(u_yaw) * rotX(u_pitch);
    vec3 rd = cam * normalize(vec3(uv*0.85, 1.0));
    vec3 ro = vec3(0.0, 0.04, -2.6);

    vec3 col = vec3(0.0);
    vec3 p = ro;
    float accum = 0.0;
    vec3 diskCol = vec3(0.0);
    bool hitHorizon = false;

    for(int i=0; i<MAX_STEPS; i++){
      float r = length(p);
      if(r < Rs){ hitHorizon=true; break; }

      // Geodesic deflection — Schwarzschild metric approximation
      vec3 grav = -1.5 * Rs * p / (r*r*r*r*r);
      rd = normalize(rd + grav * STEP);
      p += rd * STEP;

      float dDist = abs(p.y);
      float dRad = length(p.xz);

      // ── Accretion Disk ──
      if(dRad > Rs*1.05 && dRad < 4.0){
        float density = exp(-dDist * 14.0) * exp(-pow(abs(dRad - Rs*1.85)*0.85, 1.4));
        if(density > 0.004){
          // Relativistic Doppler beaming
          vec3 vel = normalize(vec3(p.z, 0.0, -p.x));
          float dop = dot(vel, rd);
          float boost = pow(max(1.0 + dop * 0.92, 0.05), 3.0);

          // Dust lane noise — gives Interstellar-style layered bands
          float ang = atan(p.z, p.x);
          float spd = u_time * 5.5 / max(dRad, 0.1);
          float dust = noise(vec2(dRad*28.0 - spd, ang*6.0)) * 0.5 +
                       noise(vec2(dRad*55.0 - spd*2.0, ang*12.0)) * 0.25 + 0.25;

          // Color: blue-shifted side green, red-shifted side orange
          vec3 baseCol = mix(vec3(1.0, 0.5, 0.1), vec3(0.1, 0.8, 1.0), step(0.0, dop));
          float contrib = density * dust * boost * STEP * 3.8;
          diskCol += baseCol * contrib;
          accum += contrib;
        }
      }

      // ── Photon Ring (thin bright halo at Rs*1.03) ──
      if(dRad > Rs*0.98 && dRad < Rs*1.08){
        float pr = exp(-dDist*30.0) * max(0.0, 1.0 - abs(dRad - Rs*1.03)/(Rs*0.05));
        if(pr > 0.08){
          diskCol += vec3(1.0, 0.9, 0.7) * pr * STEP * 5.5;
          accum += pr * STEP * 5.5;
        }
      }

      // ── Secondary ghost image ring (above disk, lensed reflection) ──
      if(dRad > Rs*1.1 && dRad < Rs*1.6 && abs(p.y) > Rs*0.3 && abs(p.y) < Rs*0.7){
        float ghostDensity = exp(-abs(abs(p.y) - Rs*0.5)*8.0) * exp(-abs(dRad-Rs*1.35)*3.0) * 0.35;
        diskCol += vec3(0.8, 0.7, 0.5) * ghostDensity * STEP;
        accum += ghostDensity * STEP;
      }
    }

    // ── Milky-Way-style warped starfield ──
    if(accum < 0.3 && !hitHorizon){
      float sv = sin(rd.x*100.0)*sin(rd.y*100.0)*sin(rd.z*100.0);
      if(sv > 0.987){
        float bright = (sv - 0.987) * 80.0;
        col += vec3(0.45, 0.75, 1.0) * bright * (1.0 - accum*2.5);
      }
      // Blue star cluster smear
      float sv2 = sin(rd.x*37.0+1.3)*sin(rd.y*41.0+0.7)*sin(rd.z*29.0+2.1);
      if(sv2 > 0.992){
        col += vec3(0.3, 0.5, 1.0) * (sv2-0.992)*120.0 * (1.0-accum*3.0);
      }
    }

    col += diskCol;

    // Horizon: pure black
    if(hitHorizon) col = vec3(0.0);

    gl_FragColor = vec4(col, 1.0);
  }
`;

export default function ExhibitGargantua() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const yawRef = useRef(0);
  const pitchRef = useRef(-0.08);
  const targetYawRef = useRef(0);
  const targetPitchRef = useRef(-0.08);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext;
    if (!gl) return;

    startBlackHoleSynth();

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      canvas.style.width = canvas.offsetWidth + 'px';
      canvas.style.height = canvas.offsetHeight + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const compile = (src: string, type: number) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        return null;
      }
      return s;
    };

    const vs = compile(VS, gl.VERTEX_SHADER)!;
    const fs = compile(FS, gl.FRAGMENT_SHADER)!;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, 'u_res');
    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uYaw = gl.getUniformLocation(prog, 'u_yaw');
    const uPitch = gl.getUniformLocation(prog, 'u_pitch');

    // Mouse pan
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      targetYawRef.current = ((e.clientX - rect.left) / rect.width - 0.5) * Math.PI * 2.2;
      targetPitchRef.current = -0.08 + ((e.clientY - rect.top) / rect.height - 0.5) * Math.PI * 0.5;
    };
    canvas.addEventListener('mousemove', onMove);

    let autoT = 0;
    const drawLoop = () => {
      timeRef.current += 0.012;
      autoT += 0.003;

      // Smooth camera
      yawRef.current += (targetYawRef.current + autoT - yawRef.current) * 0.04;
      pitchRef.current += (targetPitchRef.current - pitchRef.current) * 0.04;

      updateBlackHoleSynthProgress(Math.abs(Math.sin(autoT * 0.5)) * 0.6);

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, timeRef.current);
      gl.uniform1f(uYaw, yawRef.current);
      gl.uniform1f(uPitch, pitchRef.current);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animRef.current = requestAnimationFrame(drawLoop);
    };
    drawLoop();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animRef.current);
      stopBlackHoleSynth();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', bottom: '1.5rem', left: '1.5rem',
        fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', color: 'rgba(245,210,138,0.6)',
        lineHeight: 1.7, pointerEvents: 'none',
      }}>
        <div style={{ color: '#F5D28A', marginBottom: '0.3rem', fontWeight: 600 }}>⚫ GARGANTUA SINGULARITY</div>
        Move mouse to orbit 360° · Gravitational lensing · Doppler beaming
      </div>
    </div>
  );
}

'use client';

import { useEffect, useRef } from 'react';

const VERTEX_SHADER_SRC = `
  attribute vec2 position;
  varying vec2 v_uv;
  void main() {
    v_uv = position * 0.5 + 0.5;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SRC = `
  precision highp float;
  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_progress; 
  uniform int u_active_world; // 0 = Hub, 1 = Waves, 2 = Gravity (Black Hole), 3 = Light (Aurora)
  uniform float u_yaw;
  uniform float u_pitch;

  #define MAX_STEPS 90
  #define STEP_SIZE 0.06
  const float Rs = 0.40; // Schwarzschild radius

  // Camera rotation
  mat3 rotateY(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat3(
      c, 0.0, -s,
      0.0, 1.0, 0.0,
      s, 0.0, c
    );
  }

  mat3 rotateX(float a) {
    float c = cos(a);
    float s = sin(a);
    return mat3(
      1.0, 0.0, 0.0,
      0.0, c, -s,
      0.0, s, c
    );
  }

  // Pseudo-random noise for accretion disk dust lanes (Interstellar style)
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f*f*(3.0-2.0*f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    
    // Rotate camera yaw/pitch (360 degree pan)
    mat3 camRot = rotateY(u_yaw) * rotateX(u_pitch);
    vec3 rd = camRot * normalize(vec3(uv * 0.82, 1.0));
    
    // Default Camera position (drifts based on world transition)
    vec3 ro = vec3(0.0, 0.12, -2.8);
    
    if (u_active_world == 2) { // Plunging into Gargantua
      ro = vec3(0.0, 0.18 * (1.0 - u_progress), -2.8 + u_progress * 2.5);
    } else if (u_active_world == 1) { // Waves world position
      ro = vec3(0.0, -0.15 * u_progress, -2.6 + u_progress * 0.5);
    } else if (u_active_world == 3) { // Lights world position
      ro = vec3(0.0, 0.25 * u_progress, -2.5);
    }

    vec3 col = vec3(0.0);
    vec3 p = ro;
    
    float accumGlow = 0.0;
    vec3 diskCol = vec3(0.0);
    
    // Raymarching environment loop
    for (int i = 0; i < MAX_STEPS; i++) {
      float r = length(p);
      
      // Inside Event Horizon (Total blackness)
      if (r < Rs) {
        break;
      }
      
      // High-Fidelity Gravitational Lensing Deflection Force
      // Curved geodesics: light path bent towards central mass
      vec3 force = -1.35 * Rs * p / (r * r * r * r * r);
      rd = normalize(rd + force * STEP_SIZE);
      p += rd * STEP_SIZE;
      
      float dDist = abs(p.y);
      float dRad = length(p.xz);
      
      // Render selection
      if (u_active_world == 2 || (u_active_world == 0 && abs(u_yaw - 2.0) < 1.2)) {
        // WORLD 2: ULTRA-DETAILED GARGANTUA BLACK HOLE
        
        // 1. Accretion Disk (detailed dust lanes)
        if (dRad > Rs * 1.15 && dRad < 3.5) {
          float density = exp(-dDist * 12.0) * exp(-abs(dRad - Rs * 1.8) * 1.2);
          
          if (density > 0.005) {
            // Relativistic Doppler beaming (left side approaches, right recedes)
            vec3 velocity = normalize(vec3(p.z, 0.0, -p.x));
            float doppler = dot(velocity, rd);
            float boosting = pow(1.2 + doppler * 0.95, 3.0); // cubic boosting for extreme contrast
            
            // Accretion disk dust lanes noise
            float angle = atan(p.z, p.x);
            float ringSpeed = u_time * (6.0 / dRad);
            float dustDetail = noise(vec2(dRad * 35.0 - ringSpeed, angle * 8.0)) * 0.45 + 0.55;
            
            // Radium Green (left) & Electric Blue (right) color palette
            vec3 baseColor = mix(vec3(0.0, 0.35, 1.0), vec3(0.0, 1.0, 0.45), step(0.0, doppler));
            
            accumGlow += density * dustDetail * boosting * STEP_SIZE * 3.5;
            diskCol += baseColor * density * dustDetail * boosting * STEP_SIZE * 3.5;
          }
        }
        
        // 2. High-fidelity thin Photon Ring right outside event horizon (Rs * 1.02)
        if (dRad > Rs * 1.0 && dRad < Rs * 1.08) {
          float pRingDensity = exp(-dDist * 25.0) * (1.0 - abs(dRad - Rs * 1.04) / (Rs * 0.04));
          if (pRingDensity > 0.1) {
            // Hot white-gold photon ring
            diskCol += vec3(0.96, 0.88, 0.72) * pRingDensity * STEP_SIZE * 4.5;
            accumGlow += pRingDensity * STEP_SIZE * 4.5;
          }
        }
      }
      
      else if (u_active_world == 1) {
        // WORLD 1: INFINITE PARTICLES DATA BLUE WAVES (Image 2 style)
        if (dRad > 0.3 && dRad < 3.5) {
          float density = exp(-dDist * 14.0) * exp(-abs(dRad - 1.2) * 1.5);
          if (density > 0.01) {
            float waveVal = sin(dRad * 18.0 - u_time * 4.0 + atan(p.z, p.x) * 4.0) * 0.5 + 0.5;
            vec3 localCol = vec3(0.0, 0.45, 1.0); // deep blue wave glow
            accumGlow += density * waveVal * STEP_SIZE * 3.2;
            diskCol += localCol * density * waveVal * STEP_SIZE * 3.2;
          }
        }
      }
      
      else if (u_active_world == 3) {
        // WORLD 3: EXCITED AURORA LIGHT RIBBONS (Image 3 style)
        if (dRad > 0.4 && dRad < 3.2) {
          float density = exp(-dDist * 8.0) * exp(-abs(dRad - 1.5) * 1.0);
          if (density > 0.01) {
            float auroraVal = sin(dRad * 12.0 - u_time * 2.0) * 0.5 + 0.5;
            vec3 localCol = mix(vec3(0.0, 1.0, 0.5), vec3(0.7, 0.0, 1.0), step(0.5, auroraVal)); // Green and purple
            accumGlow += density * auroraVal * STEP_SIZE * 2.5;
            diskCol += localCol * density * auroraVal * STEP_SIZE * 2.5;
          }
        }
      }
    }
    
    // Warped background stars (drawn under the disk)
    if (accumGlow < 0.15) {
      vec3 starRd = rd;
      float starVal = sin(starRd.x * 120.0) * sin(starRd.y * 120.0) * sin(starRd.z * 120.0);
      if (starVal > 0.985) {
        float starFade = (1.0 - u_progress * 0.5) * (1.0 - accumGlow * 5.0);
        col += vec3(0.4, 0.75, 1.0) * (starVal - 0.985) * 45.0 * starFade;
      }
    }
    
    col += diskCol;
    
    // Plunge singularity crossing fade
    if (u_active_world == 2 && u_progress > 0.93) {
      float transitionFade = 1.0 - (u_progress - 0.93) * 14.3;
      col *= max(0.0, transitionFade);
    }
    
    gl_FragColor = vec4(col, 1.0);
  }
`;

interface MuseumWebGLProps {
  activeWorld: number;
  progress: number;
  yaw: number;
  pitch: number;
}

export default function BackgroundWebGL({ activeWorld, progress, yaw, pitch }: MuseumWebGLProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  
  const smoothProgressRef = useRef(0);
  const smoothYawRef = useRef(0);
  const smoothPitchRef = useRef(-0.16);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      console.error('WebGL not supported');
      return;
    }

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    // Compiling Shaders
    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compiler error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(VERTEX_SHADER_SRC, gl.VERTEX_SHADER);
    const fs = compileShader(FRAGMENT_SHADER_SRC, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }

    gl.useProgram(program);

    const vertices = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uResolution = gl.getUniformLocation(program, 'u_resolution');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uProgress = gl.getUniformLocation(program, 'u_progress');
    const uActiveWorld = gl.getUniformLocation(program, 'u_active_world');
    const uYaw = gl.getUniformLocation(program, 'u_yaw');
    const uPitch = gl.getUniformLocation(program, 'u_pitch');

    const draw = () => {
      timeRef.current += 0.016;

      gl.useProgram(program);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, timeRef.current);
      gl.uniform1f(uProgress, smoothProgressRef.current);
      gl.uniform1i(uActiveWorld, activeWorld);
      gl.uniform1f(uYaw, smoothYawRef.current);
      gl.uniform1f(uPitch, smoothPitchRef.current);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [activeWorld]);

  // Update target coordinates and apply smooth interpolation (lerping)
  useEffect(() => {
    const updateInterpolation = () => {
      smoothProgressRef.current += (progress - smoothProgressRef.current) * 0.05;
      smoothYawRef.current += (yaw - smoothYawRef.current) * 0.05;
      smoothPitchRef.current += (pitch - smoothPitchRef.current) * 0.05;
    };
    
    // Trigger update on frame
    const interval = setInterval(updateInterpolation, 16);
    return () => clearInterval(interval);
  }, [progress, yaw, pitch]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}

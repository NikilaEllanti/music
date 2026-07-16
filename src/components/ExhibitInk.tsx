'use client';
import { useEffect, useRef } from 'react';
import { playNote, freqToColor, PENTATONIC } from '@/lib/audio';

// Exhibit 3: SMOKE & INK — Perlin-noise flow-field ink diffusion
// Ink follows a curl-noise velocity field, accumulates permanently on offscreen canvas

export default function ExhibitInk() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const animRef      = useRef(0);
  const timeRef      = useRef(0);
  const mouseRef     = useRef({ x: 0, y: 0, prev: { x: 0, y: 0 }, down: false });
  const lastNoteRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d', { willReadFrequently: false })!;

    // Persistent accumulation canvas
    const off    = document.createElement('canvas');
    offscreenRef.current = off;
    const octx   = off.getContext('2d')!;

    const resize = () => {
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      canvas.width = W; canvas.height = H;
      off.width = W; off.height = H;
      octx.fillStyle = '#010108';
      octx.fillRect(0, 0, W, H);
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Hash / Noise helpers ───────────────────────────────────────────────
    const hash2 = (x: number, y: number) =>
      Math.sin(x * 127.1 + y * 311.7) * 43758.545 % 1;

    const smoothNoise = (x: number, y: number) => {
      const ix = Math.floor(x), iy = Math.floor(y);
      const fx = x - ix, fy = y - iy;
      const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
      const a = hash2(ix,   iy),   b = hash2(ix+1, iy);
      const c = hash2(ix,   iy+1), d = hash2(ix+1, iy+1);
      return a + (b-a)*ux + (c-a)*uy + (a-b-c+d)*ux*uy;
    };

    const fbm = (x: number, y: number, oct = 4) => {
      let v = 0, a = 0.5, fx = x, fy = y;
      for (let i = 0; i < oct; i++) {
        v  += a * smoothNoise(fx, fy);
        fx *= 2.1; fy *= 2.1 + 0.3;
        a  *= 0.5;
      }
      return v;
    };

    // Curl noise: perpendicular gradient → incompressible flow field
    const curl = (x: number, y: number, t: number, eps = 0.01) => {
      const n  = fbm(x * 0.004 + t * 0.12,  y * 0.004 + t * 0.08);
      const nx = fbm((x+eps) * 0.004 + t * 0.12, y * 0.004 + t * 0.08);
      const ny = fbm(x * 0.004 + t * 0.12,  (y+eps) * 0.004 + t * 0.08);
      return { vx: (ny - n) / eps, vy: -(nx - n) / eps };
    };

    // ── Ink particle pool ─────────────────────────────────────────────────
    interface InkParticle {
      x: number; y: number;
      h: number; s: number; l: number;   // HSL
      alpha: number; size: number; life: number; maxLife: number;
      vx: number; vy: number;
    }

    const particles: InkParticle[] = [];
    const MAX_PARTICLES = 800;

    const spawnInk = (x: number, y: number, hue: number, count = 30) => {
      for (let i = 0; i < count && particles.length < MAX_PARTICLES; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.3 + Math.random() * 2.5;
        const ml    = 80 + Math.random() * 180;
        particles.push({
          x, y,
          h: hue + (Math.random() - 0.5) * 30,
          s: 70 + Math.random() * 25,
          l: 45 + Math.random() * 25,
          alpha: 0.35 + Math.random() * 0.55,
          size:  1.5 + Math.random() * 4.5,
          life: 0, maxLife: ml,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        });
      }
    };

    // Spawn initial ambient ink
    const initInk = () => {
      const W = canvas.width, H = canvas.height;
      const initPositions = [
        { x: W * 0.2, y: H * 0.35, hue: 185 },
        { x: W * 0.75, y: H * 0.55, hue: 200 },
        { x: W * 0.5,  y: H * 0.65, hue: 170 },
      ];
      for (const pos of initPositions) spawnInk(pos.x, pos.y, pos.hue, 40);
    };
    setTimeout(initInk, 100);

    // ── Mouse events ──────────────────────────────────────────────────────
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.prev = { x: mouseRef.current.x, y: mouseRef.current.y };
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;

      if (mouseRef.current.down) {
        const now = performance.now();
        if (now - lastNoteRef.current > 80) {
          const noteIdx = Math.floor(Math.random() * PENTATONIC.length);
          const freq    = PENTATONIC[noteIdx];
          playNote(freq, 'sine', 0.7, 0.06);
          const hue = ((freq - 260) / 280) * 180 + 160;
          spawnInk(mouseRef.current.x, mouseRef.current.y, hue, 18);
          lastNoteRef.current = now;
        }
      }
    };
    const onDown = (e: MouseEvent) => {
      mouseRef.current.down = true;
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      const noteIdx = Math.floor(Math.random() * PENTATONIC.length);
      const freq    = PENTATONIC[noteIdx];
      playNote(freq, 'sine', 1.0, 0.1);
      const hue = ((freq - 260) / 280) * 180 + 160;
      spawnInk(mouseRef.current.x, mouseRef.current.y, hue, 40);
    };
    const onUp = () => { mouseRef.current.down = false; };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onDown);
    canvas.addEventListener('mouseup',   onUp);

    // ── Periodic ambient spawning ─────────────────────────────────────────
    let lastSpawn = 0;

    const draw = () => {
      timeRef.current += 1;
      const t = timeRef.current * 0.01;
      const W = canvas.width, H = canvas.height;

      // Ambient spawn
      if (timeRef.current - lastSpawn > 60 && particles.length < MAX_PARTICLES * 0.6) {
        const hue = 170 + Math.random() * 40;
        spawnInk(Math.random() * W, Math.random() * H * 0.8 + H * 0.1, hue, 8);
        lastSpawn = timeRef.current;
      }

      // ── Render particles to offscreen ─────────────────────────────────
      let i = 0;
      while (i < particles.length) {
        const p = particles[i];

        // Flow field velocity
        const { vx: fx, vy: fy } = curl(p.x, p.y, t);
        p.vx += fx * 0.12;
        p.vy += fy * 0.12;
        // Drag
        p.vx *= 0.96;
        p.vy *= 0.96;
        // Gravity nudge
        p.vy += 0.015;

        p.x += p.vx;
        p.y += p.vy;
        p.life++;

        const progress = p.life / p.maxLife;
        const fade     = progress < 0.15
          ? progress / 0.15
          : 1 - (progress - 0.15) / 0.85;
        const alpha    = p.alpha * fade;
        const size     = p.size * (1 + progress * 0.5);

        if (alpha > 0.005) {
          octx.beginPath();
          const grd = octx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size);
          grd.addColorStop(0, `hsla(${p.h},${p.s}%,${p.l}%,${alpha})`);
          grd.addColorStop(1, `hsla(${p.h},${p.s}%,${p.l - 10}%,0)`);
          octx.fillStyle = grd;
          octx.arc(p.x, p.y, size, 0, Math.PI * 2);
          octx.fill();
        }

        if (p.life >= p.maxLife || p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
          particles.splice(i, 1);
        } else {
          i++;
        }
      }

      // ── Compose to display canvas ─────────────────────────────────────
      // Very slightly fade the offscreen to let old ink slowly dissipate
      octx.fillStyle = 'rgba(1,1,8,0.004)';
      octx.fillRect(0, 0, W, H);

      ctx.clearRect(0, 0, W, H);
      ctx.drawImage(off, 0, 0);

      // Live particle glow on top
      for (const p of particles) {
        const progress = p.life / p.maxLife;
        const fade     = progress < 0.15 ? progress / 0.15 : 1 - (progress - 0.15) / 0.85;
        if (fade < 0.05) continue;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.h},90%,80%,${p.alpha * fade * 0.4})`;
        ctx.shadowBlur  = 8;
        ctx.shadowColor = `hsla(${p.h},90%,70%,0.5)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // ── Instruction overlay ────────────────────────────────────────────
      if (timeRef.current < 160) {
        const oa = timeRef.current > 120 ? 1 - (timeRef.current - 120) / 40 : 1;
        ctx.fillStyle = `rgba(140,200,255,${oa * 0.45})`;
        ctx.font = '0.72rem Space Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Click and drag to release ink', W / 2, H - 28);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onDown);
      canvas.removeEventListener('mouseup',   onUp);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#010108' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }}
      />
      <div style={{
        position: 'absolute', bottom: '1.5rem', right: '1.5rem',
        fontFamily: 'Space Mono, monospace', fontSize: '0.58rem',
        color: 'rgba(0,229,255,0.4)', lineHeight: 1.8, pointerEvents: 'none', textAlign: 'right',
      }}>
        <div style={{ color: '#00e5ff', marginBottom: '0.2rem' }}>◬ SMOKE & INK</div>
        <div>Curl-noise flow field · Permanent diffusion</div>
        <div>Click & drag to paint</div>
      </div>
    </div>
  );
}

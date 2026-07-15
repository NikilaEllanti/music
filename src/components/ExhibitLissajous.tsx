'use client';
import { useEffect, useRef } from 'react';
import { playNote } from '@/lib/audio';

// Exhibit 13: LISSAJOUS FIGURES — Harmonic pendulum drawing
// Two perpendicular oscillations create beautiful geometry

const PRESETS = [
  { a: 1, b: 1, delta: Math.PI / 4, label: '1:1 Circle', freq: 261.63 },
  { a: 1, b: 2, delta: 0, label: '1:2 Bow', freq: 329.63 },
  { a: 2, b: 3, delta: 0, label: '2:3 Trefoil', freq: 392.00 },
  { a: 3, b: 4, delta: Math.PI / 6, label: '3:4 Knot', freq: 440.00 },
  { a: 3, b: 5, delta: 0, label: '3:5 Star', freq: 523.25 },
  { a: 5, b: 6, delta: Math.PI / 8, label: '5:6 Lace', freq: 587.33 },
  { a: 7, b: 8, delta: 0, label: '7:8 Web', freq: 659.25 },
];

export default function ExhibitLissajous() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const presetRef = useRef(0);
  const trailRef = useRef<{ x: number; y: number; hue: number }[]>([]);
  const transitionRef = useRef(0);
  const targetRef = useRef({ a: 1, b: 1, delta: Math.PI / 4 });
  const currentRef = useRef({ a: 1, b: 1, delta: Math.PI / 4 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const selectPreset = (idx: number) => {
      presetRef.current = idx;
      const p = PRESETS[idx];
      targetRef.current = { a: p.a, b: p.b, delta: p.delta };
      transitionRef.current = 0;
      trailRef.current = [];
      playNote(p.freq, 'triangle', 1.5, 0.14);
      playNote(p.freq * p.b / p.a, 'sine', 1.5, 0.1);
    };

    // Auto-cycle presets
    let cycleIdx = 0;
    const cycleInterval = setInterval(() => {
      cycleIdx = (cycleIdx + 1) % PRESETS.length;
      selectPreset(cycleIdx);
    }, 4000);

    const onClick = (e: MouseEvent) => {
      cycleIdx = (cycleIdx + 1) % PRESETS.length;
      selectPreset(cycleIdx);
    };
    canvas.addEventListener('click', onClick);

    const draw = () => {
      timeRef.current += 0.015;
      const t = timeRef.current;
      const W = canvas.width, H = canvas.height;
      const cx = W / 2, cy = H / 2;
      const R = Math.min(W, H) * 0.38;

      transitionRef.current = Math.min(transitionRef.current + 0.02, 1);
      const lerp = transitionRef.current;
      currentRef.current.a += (targetRef.current.a - currentRef.current.a) * 0.05;
      currentRef.current.b += (targetRef.current.b - currentRef.current.b) * 0.05;
      currentRef.current.delta += (targetRef.current.delta - currentRef.current.delta) * 0.05;

      const { a, b, delta } = currentRef.current;

      ctx.fillStyle = 'rgba(2, 2, 12, 0.08)';
      ctx.fillRect(0, 0, W, H);

      // Compute current point
      const x = cx + R * Math.sin(a * t + delta);
      const y = cy + R * Math.cos(b * t);

      const hue = (t * 30) % 360;
      trailRef.current.push({ x, y, hue });
      if (trailRef.current.length > 1200) trailRef.current.shift();

      // Draw trail
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      for (let i = 1; i < trailRef.current.length; i++) {
        const p0 = trailRef.current[i - 1];
        const p1 = trailRef.current[i];
        const alpha = (i / trailRef.current.length) * 0.9;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `hsl(${p1.hue}, 80%, 65%)`;
        ctx.shadowBlur = alpha > 0.6 ? 12 : 0;
        ctx.shadowColor = `hsl(${p1.hue}, 80%, 60%)`;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Drawing head
      ctx.globalAlpha = 1;
      const headGrd = ctx.createRadialGradient(x, y, 0, x, y, 10);
      headGrd.addColorStop(0, `hsl(${hue}, 90%, 95%)`);
      headGrd.addColorStop(1, `hsla(${hue}, 90%, 70%, 0)`);
      ctx.fillStyle = headGrd;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, Math.PI * 2);
      ctx.fill();

      // Preset label
      const preset = PRESETS[presetRef.current];
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '500 14px Cormorant Garamond, serif';
      ctx.textAlign = 'center';
      ctx.fillText(preset.label, cx, H * 0.06);
      ctx.font = '400 11px Space Mono, monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.fillText(`x = sin(${preset.a}t + δ)    y = cos(${preset.b}t)`, cx, H * 0.06 + 20);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', onClick);
      clearInterval(cycleInterval);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }} />
      <div style={{
        position: 'absolute', bottom: '1.5rem', left: '1.5rem',
        fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', color: 'rgba(200,180,255,0.6)',
        lineHeight: 1.7, pointerEvents: 'none',
      }}>
        <div style={{ color: '#cc99ff', marginBottom: '0.3rem', fontWeight: 600 }}>∞ LISSAJOUS FIGURES</div>
        Click to cycle harmonics · Two oscillations create geometry
      </div>
    </div>
  );
}

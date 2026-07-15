'use client';

import { useEffect, useRef } from 'react';

export default function Chapter1({ isActive }: { isActive: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    };
    window.addEventListener('mousemove', onMove);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      timeRef.current += 0.025;
      const t = timeRef.current;

      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;

      // Mouse influence
      const mx = mouseRef.current.x || cx;
      const my = mouseRef.current.y || cy;
      const dx = (mx - cx) / W;
      const dy = (my - cy) / H;
      const distInfluence = Math.sqrt(dx * dx + dy * dy) * 3;

      // Draw expanding wave rings
      for (let ring = 0; ring < 5; ring++) {
        const ringProgress = ((t * 0.4 + ring * 0.2) % 1);
        const r = ringProgress * Math.min(W, H) * 0.45;
        const alpha = (1 - ringProgress) * 0.15;
        ctx.strokeStyle = `rgba(0,255,255,${alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Central vibrating particle cluster
      const numParticles = 8;
      for (let i = 0; i < numParticles; i++) {
        const angle = (i / numParticles) * Math.PI * 2 + t * 0.5;
        const vibrate = Math.sin(t * 8 + i * 0.8) * (8 + distInfluence * 20);
        const orbitR = 4 + Math.abs(Math.sin(t * 2 + i)) * vibrate;
        const px = cx + Math.cos(angle) * orbitR;
        const py = cy + Math.sin(angle) * orbitR;

        const grd = ctx.createRadialGradient(px, py, 0, px, py, 8);
        grd.addColorStop(0, 'rgba(0,255,255,0.9)');
        grd.addColorStop(0.4, 'rgba(0,128,255,0.4)');
        grd.addColorStop(1, 'rgba(0,128,255,0)');

        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(px, py, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core dot
      const corePulse = 1 + Math.sin(t * 6) * 0.3 * (1 + distInfluence);
      const coreGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 12 * corePulse);
      coreGrd.addColorStop(0, 'rgba(255,255,255,1)');
      coreGrd.addColorStop(0.3, 'rgba(0,255,255,0.8)');
      coreGrd.addColorStop(1, 'rgba(0,128,255,0)');
      ctx.fillStyle = coreGrd;
      ctx.beginPath();
      ctx.arc(cx, cy, 12 * corePulse, 0, Math.PI * 2);
      ctx.fill();

      // Wave across screen (triggered by scroll)
      if (isActive) {
        const waveY = cy;
        const waveAmp = 30 + distInfluence * 40;
        ctx.strokeStyle = 'rgba(0,255,255,0.25)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x < W; x += 2) {
          const distFromCenter = Math.abs(x - cx) / (W / 2);
          const envelope = Math.exp(-distFromCenter * 2);
          const y = waveY + Math.sin((x - cx) * 0.04 + t * 3) * waveAmp * envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Connection lines from center to particles
      for (let i = 0; i < numParticles; i++) {
        const angle = (i / numParticles) * Math.PI * 2 + t * 0.5;
        const vibrate = Math.sin(t * 8 + i * 0.8) * (8 + distInfluence * 20);
        const orbitR = 4 + Math.abs(Math.sin(t * 2 + i)) * vibrate;
        const px = cx + Math.cos(angle) * orbitR;
        const py = cy + Math.sin(angle) * orbitR;

        ctx.strokeStyle = `rgba(0,255,255,${0.05 + distInfluence * 0.1})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(px, py);
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animRef.current);
    };
  }, [isActive]);

  return (
    <section id="chapter-1" className="chapter" style={{ minHeight: '100vh', background: '#000' }}>
      <canvas
        ref={canvasRef}
        className="canvas-wrapper"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      <div className="section-content" style={{ zIndex: 10 }}>
        <span className="chapter-num">Chapter I</span>
        <h1
          className="chapter-title"
          style={{
            color: 'transparent',
            backgroundImage: 'linear-gradient(135deg, #fff 0%, #00FFFF 50%, #0080FF 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            marginBottom: '1.5rem',
          }}
        >
          Everything<br />Vibrates
        </h1>
        <p className="chapter-subtitle" style={{ marginBottom: '2rem' }}>
          Move your cursor · Feel the resonance
        </p>
        <div className="divider" />
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 200,
          fontSize: 'clamp(0.9rem, 1.8vw, 1.1rem)',
          color: 'rgba(255,255,255,0.5)',
          maxWidth: '480px',
          margin: '0 auto',
          lineHeight: 1.8,
          letterSpacing: '0.03em',
        }}>
          At the smallest scale, everything in the universe is in motion.
          Atoms oscillate. Strings vibrate. Even silence has frequency.
        </p>
      </div>
    </section>
  );
}

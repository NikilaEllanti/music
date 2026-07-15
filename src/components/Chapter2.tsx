'use client';

import { useEffect, useRef, useState } from 'react';
import { playNote } from '@/lib/audio';

const FREQ_STOPS = [5, 20, 50, 110, 220, 440];

export default function Chapter2() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [currentFreq, setCurrentFreq] = useState(5);
  const [showNote, setShowNote] = useState(false);
  const freqRef = useRef(5);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      timeRef.current += 0.016;
      const t = timeRef.current;
      const freq = freqRef.current;

      ctx.clearRect(0, 0, W, H);

      // Normalized frequency (0..1)
      const normFreq = Math.min(freq / 440, 1);
      const waveFreq = 0.01 + normFreq * 0.05;
      const amplitude = H * 0.25 * (0.3 + normFreq * 0.7);

      // Number of wave layers
      const layers = Math.floor(1 + normFreq * 4);
      for (let layer = 0; layer < layers; layer++) {
        const alpha = 0.6 - layer * 0.12;
        const layerFreqMul = 1 + layer * 0.5;
        const hue = 180 + layer * 15;

        ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${alpha})`;
        ctx.lineWidth = 2 - layer * 0.3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${hue}, 100%, 65%, 0.5)`;

        ctx.beginPath();
        for (let x = 0; x <= W; x += 2) {
          const y = H / 2 + Math.sin(x * waveFreq * layerFreqMul + t * (2 + normFreq * 6)) * (amplitude / (layer + 1));
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      // Frequency markers on the wave
      if (freq >= 440) {
        const cx = W / 2;
        const cy = H / 2;
        const burst = ctx.createRadialGradient(cx, cy, 0, cx, cy, 100);
        burst.addColorStop(0, 'rgba(0,255,255,0.08)');
        burst.addColorStop(1, 'rgba(0,128,255,0)');
        ctx.fillStyle = burst;
        ctx.beginPath();
        ctx.arc(cx, cy, 100, 0, Math.PI * 2);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animRef.current);
  }, []);

  // Auto-animate frequency upward
  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < FREQ_STOPS.length) {
        const f = FREQ_STOPS[i];
        setCurrentFreq(f);
        freqRef.current = f;
        if (f === 440) {
          setTimeout(() => setShowNote(true), 600);
          playNote(440, 'sine', 3, 0.12);
        }
        i++;
      } else {
        clearInterval(interval);
      }
    }, 1400);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="chapter-2"
      className="chapter"
      style={{ minHeight: '100vh', background: 'transparent' }}
    >
      <canvas
        ref={canvasRef}
        className="canvas-wrapper"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      <div className="section-content" style={{ zIndex: 10 }}>
        <span className="chapter-num">Chapter II</span>
        <h2
          className="chapter-title"
          style={{
            color: 'transparent',
            backgroundImage: 'linear-gradient(135deg, #fff 0%, #00FFFF 60%, #00FF88 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            marginBottom: '2rem',
          }}
        >
          Frequency
        </h2>

        {/* Big frequency counter */}
        <div style={{ position: 'relative', margin: '2rem 0' }}>
          <span className="freq-display mono">
            {currentFreq}
          </span>
          <span className="freq-unit mono">Hz</span>
        </div>

        {/* Frequency stops */}
        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {FREQ_STOPS.map(f => (
            <div
              key={f}
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.7rem',
                letterSpacing: '0.15em',
                color: currentFreq >= f ? 'var(--cyan)' : 'rgba(255,255,255,0.2)',
                textShadow: currentFreq >= f ? 'var(--glow-cyan)' : 'none',
                transition: 'all 0.5s',
              }}
            >
              {f} Hz
            </div>
          ))}
        </div>

        {/* Note reveal at 440 Hz */}
        {showNote && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.5rem',
              animation: 'fadeInUp 1s ease forwards',
            }}
          >
            <div className="divider" />
            <span style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(5rem, 15vw, 12rem)',
              fontWeight: 300,
              color: 'var(--cyan)',
              textShadow: 'var(--glow-cyan)',
              lineHeight: 1,
              animation: 'pulseGlow 2s ease infinite',
            }}>
              A
            </span>
            <span style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '3rem',
              color: 'rgba(0,255,255,0.7)',
            }}>
              ♪
            </span>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 200,
              fontSize: '0.85rem',
              letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.4)',
              textTransform: 'uppercase',
            }}>
              440 Hz · Concert A · The anchor of modern tuning
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

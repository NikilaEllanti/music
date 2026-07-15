'use client';

import { useEffect, useRef, useState } from 'react';
import { playChord, NOTE_FREQS } from '@/lib/audio';

const HARMONICS = [
  { label: 'A₁', freq: 110, ratio: '1:1', color: '#00FFFF', width: 280 },
  { label: 'A₂', freq: 220, ratio: '2:1', color: '#20DFFF', width: 240 },
  { label: 'A₃', freq: 330, ratio: '3:1', color: '#40BFFF', width: 190 },
  { label: 'A₄', freq: 440, ratio: '4:1', color: '#60A0FF', width: 140 },
  { label: 'A₅', freq: 550, ratio: '5:1', color: '#8080FF', width: 100 },
  { label: 'A₆', freq: 660, ratio: '6:1', color: '#A060FF', width: 65 },
];

export default function Chapter4() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [revealed, setRevealed] = useState(false);
  const [visibleHarmonics, setVisibleHarmonics] = useState(0);

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
      timeRef.current += 0.015;
      const t = timeRef.current;

      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, W, H);

      // Draw standing waves for each harmonic
      const count = Math.min(visibleHarmonics || 1, HARMONICS.length);
      for (let h = 0; h < count; h++) {
        const harmonic = HARMONICS[h];
        const n = h + 1; // harmonic number
        const yOffset = H * 0.5 + (h - count / 2 + 0.5) * 60;
        const amplitude = 20 - h * 2.5;
        const alpha = 0.5 - h * 0.05;

        ctx.strokeStyle = harmonic.color;
        ctx.lineWidth = 1.5 - h * 0.15;
        ctx.globalAlpha = alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = harmonic.color;

        ctx.beginPath();
        for (let x = 0; x < W; x += 2) {
          const phase = x / W * Math.PI * 2 * n;
          const standing = Math.sin(phase) * Math.cos(t * (1.5 + n * 0.4));
          const y = yOffset + standing * amplitude;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => cancelAnimationFrame(animRef.current);
  }, [visibleHarmonics]);

  const handleReveal = () => {
    if (revealed) return;
    setRevealed(true);
    // Stagger harmonic reveal
    HARMONICS.forEach((h, i) => {
      setTimeout(() => {
        setVisibleHarmonics(i + 1);
        import('@/lib/audio').then(({ playNote }) => {
          playNote(h.freq, 'sine', 1.5, 0.06);
        });
      }, i * 350);
    });

    // Play full chord at end
    setTimeout(() => {
      playChord([110, 220, 330, 440, 550, 660], 'sine');
    }, HARMONICS.length * 350 + 500);
  };

  return (
    <section
      id="chapter-4"
      className="chapter"
      style={{ minHeight: '110vh', background: '#000410' }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      <div className="section-content" style={{ zIndex: 10 }}>
        <span className="chapter-num">Chapter IV</span>
        <h2
          className="chapter-title"
          style={{
            color: 'transparent',
            backgroundImage: 'linear-gradient(135deg, #fff 0%, #40A0FF 40%, #00FF88 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            marginBottom: '2rem',
          }}
        >
          Harmonics
        </h2>
        <p className="chapter-subtitle" style={{ marginBottom: '2.5rem' }}>
          One wave contains many frequencies
        </p>

        {/* Harmonic stack */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          maxWidth: '500px',
          margin: '0 auto 2.5rem',
        }}>
          {HARMONICS.slice(0, Math.max(visibleHarmonics, 1)).map((h, i) => (
            <div
              key={h.label}
              className="harmonic-row visible"
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              <span className="harmonic-note-label" style={{ color: h.color, minWidth: 36 }}>
                {h.label}
              </span>
              <div
                className="harmonic-bar"
                style={{
                  width: `${h.width}px`,
                  background: `linear-gradient(to right, ${h.color}, ${h.color}88)`,
                  boxShadow: `0 0 10px ${h.color}66`,
                  height: '2px',
                  borderRadius: '1px',
                  transition: 'width 0.8s ease',
                }}
              />
              <span className="harmonic-freq">{h.freq} Hz</span>
              <span style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.6rem',
                color: 'rgba(255,255,255,0.25)',
                marginLeft: '0.5rem',
              }}>
                {h.ratio}
              </span>
            </div>
          ))}
        </div>

        {!revealed ? (
          <button
            onClick={handleReveal}
            style={{
              padding: '0.8rem 2.5rem',
              border: '1px solid rgba(0,255,255,0.4)',
              borderRadius: '100px',
              background: 'transparent',
              color: 'var(--cyan)',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.background = 'rgba(0,255,255,0.1)';
              (e.target as HTMLElement).style.boxShadow = '0 0 20px rgba(0,255,255,0.3)';
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.background = 'transparent';
              (e.target as HTMLElement).style.boxShadow = 'none';
            }}
          >
            Reveal Overtones
          </button>
        ) : (
          <div style={{ animation: 'fadeInUp 0.8s ease forwards' }}>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 200,
              fontSize: '0.9rem',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.8,
              letterSpacing: '0.03em',
              maxWidth: '420px',
              margin: '0 auto',
            }}>
              Every musical note is a symphony of overtones. The ratios between
              harmonics define timbre — why a violin sounds different from a flute
              at the same pitch.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { playNote } from '@/lib/audio';

const MODES = [
  { label: 'Fundamental', harmonic: 1, freq: 110, ratio: '1:1', note: 'A2' },
  { label: 'Second Harmonic', harmonic: 2, freq: 220, ratio: '2:1', note: 'A3' },
  { label: 'Third Harmonic', harmonic: 3, freq: 330, ratio: '3:1', note: 'E4' },
  { label: 'Fourth Harmonic', harmonic: 4, freq: 440, ratio: '4:1', note: 'A4' },
];

export default function ChapterStandingWaves() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  
  const [activeHarmonic, setActiveHarmonic] = useState(1);
  const [showMath, setShowMath] = useState(false);
  const pluckIntensityRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = canvas.offsetWidth  || 800;
      canvas.height = canvas.offsetHeight || 400;
    };
    requestAnimationFrame(resize);
    window.addEventListener('resize', resize);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      if (W === 0 || H === 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      timeRef.current += 0.02;
      const t = timeRef.current;

      ctx.clearRect(0, 0, W, H);

      const cy = H / 2;
      const n = activeHarmonic;

      // Damp pluck intensity over time via ref
      pluckIntensityRef.current = Math.max(0, pluckIntensityRef.current * 0.96);

      // Draw active standing wave
      ctx.strokeStyle = '#00FF88';
      ctx.shadowBlur = 15;
      ctx.shadowColor = '#00FF88';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      
      const amplitude = 30 * pluckIntensityRef.current + 8 * Math.sin(t * 2);

      for (let x = 0; x <= W; x += 3) {
        const factor = x / W;
        // Standing wave boundary condition: y=0 at ends x=0 and x=W
        const standing = Math.sin(factor * Math.PI * n) * Math.cos(t * (3 + n * 1.5));
        const y = cy + standing * amplitude;
        
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw node points (where the string is stationary / y = 0)
      if (n > 1) {
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffffff';
        for (let i = 1; i < n; i++) {
          const nx = (i / n) * W;
          ctx.beginPath();
          ctx.arc(nx, cy, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // Draw division guides if math is enabled
      if (showMath) {
        ctx.strokeStyle = 'rgba(245, 210, 138, 0.15)';
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 4]);
        for (let i = 1; i < n; i++) {
          const nx = (i / n) * W;
          ctx.beginPath();
          ctx.moveTo(nx, 0);
          ctx.lineTo(nx, H);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [activeHarmonic, showMath]);

  const pluckString = (h: number, freq: number) => {
    setActiveHarmonic(h);
    pluckIntensityRef.current = 1.5;
    playNote(freq, 'triangle', 2.0, 0.15);
  };

  return (
    <section 
      id="chapter-standingwaves" 
      className="chapter-container"
      style={{ background: 'transparent' }}
    >
      <div className="chapter-inner">
        <div style={{ position: 'relative', height: '400px', width: '100%' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
            onClick={() => pluckString(activeHarmonic, MODES[activeHarmonic - 1].freq)}
          />
          <div style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.65rem',
            color: 'rgba(255,255,255,0.4)',
            letterSpacing: '0.15em',
            pointerEvents: 'none'
          }}>
            CLICK WAVE TO PLUCK STRING
          </div>
        </div>

        <div className="cosmic-card">
          <span className="chapter-num" style={{ color: 'var(--aurora-green)', textShadow: 'var(--glow-green)' }}>
            Acoustic Resonance
          </span>
          <h2 className="chapter-title" style={{ fontSize: '3rem', marginBottom: '1.2rem' }}>
            Standing Waves
          </h2>
          
          <p style={{ color: 'var(--white-dim)', lineHeight: 1.8, marginBottom: '2rem' }}>
            When waves reflect back and forth, they combine into standing waves. 
            Dividing a string into integer ratios creates perfect musical intervals—octaves and fifths.
          </p>

          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {MODES.map(m => (
              <button
                key={m.harmonic}
                onClick={() => pluckString(m.harmonic, m.freq)}
                style={{
                  padding: '0.6rem 1.4rem',
                  border: `1px solid ${activeHarmonic === m.harmonic ? '#00FF88' : 'rgba(255,255,255,0.12)'}`,
                  background: activeHarmonic === m.harmonic ? 'rgba(0, 255, 136, 0.06)' : 'transparent',
                  color: activeHarmonic === m.harmonic ? '#00FF88' : 'rgba(255,255,255,0.5)',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  borderRadius: '100px',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: activeHarmonic === m.harmonic ? '0 0 15px rgba(0,255,136,0.2)' : 'none',
                }}
              >
                {m.ratio} ({m.note})
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn-primary" onClick={() => setShowMath(prev => !prev)}>
              {showMath ? 'Conceal Theorem' : 'Resolve Equation'}
            </button>
          </div>

          {showMath && (
            <div className="math-equation" style={{ animation: 'mathReveal 0.6s ease forwards' }}>
              {`y(x,t) = 2A \\sin(k x) \\cos(\\omega t) \\quad f_n = n \\frac{v}{2L}`}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

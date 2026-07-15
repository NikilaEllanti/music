'use client';

import { useEffect, useRef, useState } from 'react';
import { playNote } from '@/lib/audio';

export default function ChapterFourier() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  
  const [harmonicsCount, setHarmonicsCount] = useState(4);
  const [showMath, setShowMath] = useState(false);
  const wavePointsRef = useRef<number[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      if (W === 0 || H === 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      timeRef.current += 0.025;
      const t = timeRef.current;

      ctx.clearRect(0, 0, W, H);

      // Epicycle center coordinate
      let cx = W * 0.28;
      let cy = H * 0.5;

      let x = cx;
      let y = cy;

      // Draw planetary orbit epicycles (Fourier circles)
      ctx.lineWidth = 1.0;
      
      const count = harmonicsCount;
      const r_base = 65; // base circle radius

      for (let i = 0; i < count; i++) {
        // Square wave fourier components: odd harmonics only (1, 3, 5, 7, ...)
        const n = i * 2 + 1;
        const radius = r_base * (4 / (Math.PI * n));
        
        ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 - i * 0.05})`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.stroke();

        // Draw rotating vector line
        const theta = n * t;
        const nextX = x + Math.cos(theta) * radius;
        const nextY = y + Math.sin(theta) * radius;

        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        vec3_line: {
          ctx.moveTo(x, y);
          ctx.lineTo(nextX, nextY);
        }
        ctx.stroke();

        // Core joint node
        ctx.fillStyle = '#00FFFF';
        ctx.beginPath();
        ctx.arc(nextX, nextY, 2, 0, Math.PI * 2);
        ctx.fill();

        x = nextX;
        y = nextY;
      }

      // Track y-coordinate to draw wave on the right (mutate ref instead of state)
      wavePointsRef.current.unshift(y);
      if (wavePointsRef.current.length > 300) {
        wavePointsRef.current.pop();
      }

      // Draw connection line from epicycle tip to wave start
      const waveStartX = W * 0.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 0.8;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(waveStartX, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw output wave pattern
      ctx.strokeStyle = '#00FFFF';
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00FFFF';
      ctx.lineWidth = 2.0;
      ctx.beginPath();
      
      const pts = wavePointsRef.current;
      for (let j = 0; j < pts.length; j++) {
        const wx = waveStartX + j * 1.5;
        const wy = pts[j];
        if (wx > W) break;
        if (j === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [harmonicsCount]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setHarmonicsCount(val);
    
    // Play frequency addition chord component
    // Higher n produces higher harmonic overtone pitches
    const baseFreq = 110;
    const n = (val - 1) * 2 + 1;
    playNote(baseFreq * n, 'sine', 1.0, 0.05);
  };

  return (
    <section 
      id="chapter-fourier" 
      className="chapter-container"
      style={{ background: 'transparent' }}
    >
      <div className="chapter-inner">
        <div style={{ position: 'relative', height: '400px', width: '100%' }}>
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block' }}
          />
        </div>

        <div className="cosmic-card">
          <span className="chapter-num" style={{ color: 'var(--aurora-teal)', textShadow: 'var(--glow-teal)' }}>
            Wave Synthesis
          </span>
          <h2 className="chapter-title" style={{ fontSize: '3rem', marginBottom: '1.2rem' }}>
            Fourier Series
          </h2>
          
          <p style={{ color: 'var(--white-dim)', lineHeight: 1.8, marginBottom: '2rem' }}>
            Any complex sound wave—like a violin, a voice, or a synthesizer—is constructed out of 
            infinite simple sine waves. Adding harmonics shapes the geometry of sound.
          </p>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.7rem',
              color: 'rgba(255,255,255,0.4)',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              marginBottom: '0.8rem'
            }}>
              <span>Number of Orbits</span>
              <span style={{ color: 'var(--aurora-teal)' }}>{harmonicsCount}</span>
            </label>
            <input
              type="range"
              min="1"
              max="12"
              value={harmonicsCount}
              onChange={handleSliderChange}
              className="cosmic-slider"
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="btn-primary" onClick={() => setShowMath(prev => !prev)}>
              {showMath ? 'Conceal Theorem' : 'Resolve Equation'}
            </button>
          </div>

          {showMath && (
            <div className="math-equation" style={{ animation: 'mathReveal 0.6s ease forwards' }}>
              {`f(t) = \\frac{4}{\\pi} \\sum_{n=1,3,5}^{\\infty} \\frac{\\sin(n \\omega t)}{n}`}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

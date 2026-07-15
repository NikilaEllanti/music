'use client';

import { useEffect, useRef, useState } from 'react';
import { playNote } from '@/lib/audio';

export default function ChapterFibonacci() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [showMath, setShowMath] = useState(false);

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

      timeRef.current += 0.005;
      const t = timeRef.current;

      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;

      // Draw the Fibonacci/Golden Spiral in stardust gold
      ctx.strokeStyle = 'rgba(245, 210, 138, 0.18)';
      ctx.lineWidth = 1.2;

      // Golden ratio phi
      const phi = 1.6180339887;
      
      // Draw grid squares if math is enabled
      if (showMath) {
        let size = 2.5;
        let x = cx;
        let y = cy;
        const fib = [1, 1, 2, 3, 5, 8, 13, 21, 34];
        
        ctx.strokeStyle = 'rgba(245, 210, 138, 0.15)';
        ctx.lineWidth = 0.8;
        
        for (let i = 0; i < fib.length; i++) {
          const s = fib[i] * size;
          ctx.strokeRect(x - s, y - s, s * 2, s * 2);
          
          // Move layout anchor in spiral grid directions
          const angle = i * Math.PI * 0.5;
          x += Math.cos(angle) * s * 0.5;
          y += Math.sin(angle) * s * 0.5;
        }
      }

      // Draw the main spiral curve
      ctx.strokeStyle = 'rgba(245, 210, 138, 0.7)';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#F5D28A';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      
      const steps = 400;
      for (let i = 0; i < steps; i++) {
        // Spiral equations: r = a * e^(b * theta)
        const theta = (i / steps) * Math.PI * 8.0 - t * 0.5;
        const r = 2.2 * Math.pow(phi, theta / (Math.PI * 0.5));
        
        if (r > Math.min(W, H) * 0.45) break;

        const x = cx + Math.cos(theta) * r;
        const y = cy + Math.sin(theta) * r;

        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw glowing gold particles floating along the spiral
      const numParticles = 35;
      for (let k = 0; k < numParticles; k++) {
        const progress = ((k / numParticles) + t * 0.05) % 1;
        const theta = progress * Math.PI * 8.0;
        const r = 2.2 * Math.pow(phi, theta / (Math.PI * 0.5));
        
        if (r < Math.min(W, H) * 0.45) {
          const x = cx + Math.cos(theta) * r;
          const y = cy + Math.sin(theta) * r;
          
          ctx.fillStyle = '#F5D28A';
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#F5D28A';
          ctx.beginPath();
          ctx.arc(x, y, 2.5 + Math.sin(t * 5 + k) * 1.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [showMath]);

  const triggerMathResolve = () => {
    setShowMath(prev => !prev);
    
    // Play warm Golden Ratio pitch cascade
    // 220Hz * 1.618^n
    const baseFreq = 220;
    const phi = 1.618034;
    const cascade = [0, 1, 2, 3, 4].map(n => baseFreq * Math.pow(phi, n));
    
    cascade.forEach((freq, idx) => {
      setTimeout(() => {
        playNote(freq, 'sine', 1.8, 0.08);
      }, idx * 250);
    });
  };

  return (
    <section 
      id="chapter-fibonacci" 
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
          <span className="chapter-num" style={{ color: 'var(--gold)', textShadow: 'var(--glow-gold)' }}>
            Cosmic Geometry
          </span>
          <h2 className="chapter-title" style={{ fontSize: '3rem', marginBottom: '1.2rem' }}>
            The Fibonacci Spiral
          </h2>
          
          <p style={{ color: 'var(--white-dim)', lineHeight: 1.8, marginBottom: '2rem' }}>
            Nature speaks in geometric expansion. The spiral coordinates of pinecones, sunflowers, 
            and cosmic galaxies follow a continuous golden ratio curve—music scaled in visual space.
          </p>

          <div style={{ marginBottom: '2rem' }}>
            <button className="btn-primary" onClick={triggerMathResolve}>
              {showMath ? 'Conceal Math' : 'Resolve Math Theorem'}
            </button>
          </div>

          {showMath && (
            <div className="math-equation">
              {`F_n = F_{n-1} + F_{n-2} \\quad \\varphi = \\frac{1 + \\sqrt{5}}{2} \\approx 1.618`}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

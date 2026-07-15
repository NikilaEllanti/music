'use client';

import { useEffect, useRef, useState } from 'react';
import { playNote } from '@/lib/audio';

interface StarNode {
  x: number;
  y: number;
  r: number;
  targetY: number;
  baseY: number;
  phase: number;
}

export default function ChapterNorthernLights() {
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

    // 2 hot white stars acting as gravity/light anchors (Image 3 style)
    const anchors = [
      { x: canvas.width * 0.22, y: canvas.height * 0.32 },
      { x: canvas.width * 0.82, y: canvas.height * 0.32 }
    ];

    // Star cluster node filaments
    const stars: StarNode[] = [];
    const numFilaments = 40;
    
    for (let i = 0; i < numFilaments; i++) {
      const anchorIdx = i % 2;
      const anchor = anchors[anchorIdx];
      const angle = Math.PI * 0.2 + (Math.random() * Math.PI * 0.6); // draped downwards
      const dist = 60 + Math.pow(Math.random(), 1.5) * 280;
      
      const x = anchor.x + Math.cos(angle) * dist;
      const y = anchor.y + Math.sin(angle) * (dist * 0.7);

      stars.push({
        x,
        y,
        r: 1 + Math.random() * 2,
        targetY: y,
        baseY: y,
        phase: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      if (W === 0 || H === 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      timeRef.current += 0.006;
      const t = timeRef.current;

      // Update anchors on resize dynamically
      anchors[0].x = W * 0.22;
      anchors[0].y = H * 0.32;
      anchors[1].x = W * 0.82;
      anchors[1].y = H * 0.32;

      ctx.clearRect(0, 0, W, H);

      // Draw the Aurora Borealis background ribbons (Image 3 style)
      const auroraColors = [
        { c: 'rgba(0, 255, 136, 0.045)', blur: 40, offset: 0 },   // Aurora green
        { c: 'rgba(0, 255, 255, 0.035)', blur: 50, offset: 1.5 }, // Aurora teal
        { c: 'rgba(176, 38, 255, 0.025)', blur: 60, offset: 3.0 }  // Aurora purple
      ];

      for (const col of auroraColors) {
        ctx.fillStyle = col.c;
        ctx.shadowBlur = col.blur;
        ctx.shadowColor = col.c;
        
        ctx.beginPath();
        // Top boundary curve
        for (let x = 0; x <= W; x += 10) {
          const waveY = H * 0.25 + 
                        Math.sin(x * 0.0025 + t + col.offset) * 80 + 
                        Math.cos(x * 0.001 - t * 0.4) * 30;
          if (x === 0) ctx.moveTo(x, waveY); else ctx.lineTo(x, waveY);
        }
        // Bottom boundary curve to fill ribbon
        for (let x = W; x >= 0; x -= 10) {
          const waveY = H * 0.45 + 
                        Math.sin(x * 0.0025 + t + col.offset) * 80 + 
                        Math.cos(x * 0.001 - t * 0.4) * 30;
          ctx.lineTo(x, waveY);
        }
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw flowing filament bezier lines connecting to anchors (Image 3 style)
      ctx.lineWidth = 0.6;
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        const anchor = anchors[i % 2];

        // Wave motion on star height
        star.y = star.baseY + Math.sin(t * 2 + star.phase) * 12;

        ctx.strokeStyle = i % 2 === 0 ? 'rgba(0, 255, 136, 0.12)' : 'rgba(176, 38, 255, 0.08)';
        ctx.beginPath();
        ctx.moveTo(anchor.x, anchor.y);
        
        // Bezier curve to simulate physical wire drapery
        const cp1x = anchor.x + (star.x - anchor.x) * 0.5;
        const cp1y = anchor.y + (star.y - anchor.y) * 1.3; // bend down
        
        ctx.quadraticCurveTo(cp1x, cp1y, star.x, star.y);
        ctx.stroke();

        // Draw small glowing filament points
        ctx.fillStyle = i % 2 === 0 ? '#00FF88' : '#B026FF';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw the hot white core stars (energy emitters)
      for (const anchor of anchors) {
        // Outer halo
        const outerHalo = ctx.createRadialGradient(anchor.x, anchor.y, 0, anchor.x, anchor.y, 35);
        outerHalo.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        outerHalo.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = outerHalo;
        ctx.beginPath();
        ctx.arc(anchor.x, anchor.y, 35, 0, Math.PI * 2);
        ctx.fill();

        // White core star
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#ffffff';
        ctx.beginPath();
        ctx.arc(anchor.x, anchor.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const triggerCelestialCascade = () => {
    setShowMath(prev => !prev);

    // Play high-pitch celestial bell sweep
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
    notes.forEach((f, i) => {
      setTimeout(() => {
        playNote(f, 'sine', 2.2, 0.05);
      }, i * 160);
    });
  };

  return (
    <section 
      id="chapter-northernlights" 
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
          <span className="chapter-num" style={{ color: 'var(--aurora-purple)', textShadow: '0 0 10px rgba(176,38,255,0.4)' }}>
            Quantum Emissions
          </span>
          <h2 className="chapter-title" style={{ fontSize: '3rem', marginBottom: '1.2rem' }}>
            Northern Lights
          </h2>
          
          <p style={{ color: 'var(--white-dim)', lineHeight: 1.8, marginBottom: '2rem' }}>
            When cosmic solar winds collide with the earth&apos;s magnetic shield, oxygen and nitrogen 
            atoms excite, vibrating at quantum levels. They release energy as light—the aurora.
          </p>

          <div style={{ marginBottom: '2rem' }}>
            <button className="btn-primary" onClick={triggerCelestialCascade}>
              {showMath ? 'Conceal Theorem' : 'Resolve Spectral Math'}
            </button>
          </div>

          {showMath && (
            <div className="math-equation" style={{ animation: 'mathReveal 0.6s ease forwards' }}>
              {`\\Delta E = h \\nu = \\frac{h c}{\\lambda} \\quad \\text{Oxygen: 557.7 nm (Green)}`}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

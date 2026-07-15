'use client';

import { useEffect, useRef } from 'react';

export default function Chapter1() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    window.addEventListener('resize', resize);

    // Particle nodes flowing on the wave
    interface WaveNode {
      x: number;
      speed: number;
      size: number;
      waveIndex: number;
    }
    const nodes: WaveNode[] = [];
    for (let i = 0; i < 25; i++) {
      nodes.push({
        x: Math.random() * canvas.width,
        speed: 0.8 + Math.random() * 1.5,
        size: 2 + Math.random() * 3,
        waveIndex: Math.floor(Math.random() * 4),
      });
    }

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      if (W === 0 || H === 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      timeRef.current += 0.008;
      const t = timeRef.current;

      ctx.clearRect(0, 0, W, H);

      // Render the particles data blue wave grid (Image 2 style)
      // 4 offset parallel waves running horizontally
      const numWaves = 4;
      for (let w = 0; w < numWaves; w++) {
        ctx.strokeStyle = `rgba(0, 80, 255, ${0.35 - w * 0.08})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        
        const phaseOffset = w * 1.5;
        const amplitude = 65 - w * 10;
        const frequency = 0.0035;

        for (let x = 0; x <= W; x += 4) {
          // Complex wavy sine calculation
          const y = H * 0.5 + 
                    Math.sin(x * frequency + t + phaseOffset) * amplitude + 
                    Math.cos(x * 0.001 - t * 0.5) * 20;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Draw secondary support curves (thin dusk lines)
      ctx.strokeStyle = 'rgba(0, 50, 150, 0.15)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 10) {
        const y = H * 0.5 + Math.sin(x * 0.002 + t * 0.8) * 80;
        ctx.moveTo(x, y - 40);
        ctx.lineTo(x, y + 40);
      }
      ctx.stroke();

      // Update and draw floating node particles sliding along waves
      for (const node of nodes) {
        node.x += node.speed;
        if (node.x > W) node.x = 0;

        const phaseOffset = node.waveIndex * 1.5;
        const amplitude = 65 - node.waveIndex * 10;
        const frequency = 0.0035;
        const ny = H * 0.5 + 
                   Math.sin(node.x * frequency + t + phaseOffset) * amplitude + 
                   Math.cos(node.x * 0.001 - t * 0.5) * 20;

        // Glow
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#ffffff';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(node.x, ny, node.size, 0, Math.PI * 2);
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

  return (
    <section 
      id="chapter-1" 
      className="chapter" 
      style={{ 
        minHeight: '100vh', 
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      <div className="section-content" style={{ zIndex: 10 }}>
        <span className="chapter-num" style={{ color: '#00FFFF', textShadow: '0 0 10px rgba(0,255,255,0.4)' }}>
          Chapter I
        </span>
        <h1 className="chapter-title" style={{
          color: 'transparent',
          backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #0080FF 50%, #00FFFF 100%)',
          backgroundClip: 'text', WebkitBackgroundClip: 'text',
          marginBottom: '1.5rem',
        }}>
          Prime<br />Resonance
        </h1>
        <p className="chapter-subtitle" style={{ marginBottom: '2rem' }}>
          Move your cursor · Induce fluctuations
        </p>
        <div className="divider" style={{ background: 'linear-gradient(to right, transparent, #0080FF, transparent)' }} />
        <p style={{
          fontWeight: 200, fontSize: 'clamp(0.9rem, 1.8vw, 1.05rem)',
          color: 'rgba(255,255,255,0.5)', maxWidth: '460px', margin: '0 auto',
          lineHeight: 1.9, letterSpacing: '0.04em',
        }}>
          At the smallest scale, everything in the universe is in motion.
          Atoms oscillate. Strings vibrate. Even silence has a frequency.
        </p>
      </div>
    </section>
  );
}

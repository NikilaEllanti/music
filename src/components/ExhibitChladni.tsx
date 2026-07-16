'use client';
import { useEffect, useRef, useState } from 'react';
import { playNote } from '@/lib/audio';

// Exhibit 5: CHLADNI SAND PATTERNS (3D Metallic Plate Vibrations)
// Emulates a premium square bronze plate with physical sand acoustics.
// Sand grains are rendered with 3D depth, micro-shadows, and organic accumulation.

const CHLADNI_PRESETS = [
  { m: 2, n: 2, label: 'Mode (2,2)', freq: 220 },
  { m: 3, n: 1, label: 'Mode (3,1)', freq: 330 },
  { m: 4, n: 2, label: 'Mode (4,2)', freq: 440 },
  { m: 3, n: 3, label: 'Mode (3,3)', freq: 550 },
  { m: 5, n: 1, label: 'Mode (5,1)', freq: 660 },
  { m: 5, n: 3, label: 'Mode (5,3)', freq: 740 },
  { m: 6, n: 2, label: 'Mode (6,2)', freq: 920 },
  { m: 7, n: 3, label: 'Mode (7,3)', freq: 1100 },
];

interface SandParticle {
  x: number; y: number;
  vx: number; vy: number;
  settled: boolean;
  colorOffset: number;
  size: number;
}

export default function ExhibitChladni() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<SandParticle[]>([]);
  const currentModeRef = useRef({ m: 2, n: 2 });
  const [activePreset, setActivePreset] = useState(0);
  const transitionRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
      initParticles();
    };

    const initParticles = () => {
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      const size = Math.min(W, H) * 0.72;
      const px = (W - size) / 2;
      const py = (H - size) / 2;

      // Spawn 8000 detailed sand grains randomly on the plate
      particlesRef.current = Array.from({ length: 8000 }, () => ({
        x: px + Math.random() * size,
        y: py + Math.random() * size,
        vx: 0, vy: 0,
        settled: false,
        colorOffset: Math.random() * 30, // slight shade variance
        size: 0.85 + Math.random() * 1.3,
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    // Chladni displacement equation
    const chladniDisplacement = (x: number, y: number, m: number, n: number, W: number, H: number): number => {
      const size = Math.min(W, H) * 0.72;
      const px = (W - size) / 2;
      const py = (H - size) / 2;

      const nx = (x - px) / size;
      const ny = (y - py) / size;
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return 1;

      // Standard Chladni boundary conditions for a free square plate
      return Math.sin(m * Math.PI * nx) * Math.cos(n * Math.PI * ny) +
             Math.cos(m * Math.PI * nx) * Math.sin(n * Math.PI * ny);
    };

    const draw = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      const { m, n } = currentModeRef.current;

      const size = Math.min(W, H) * 0.72;
      const px = (W - size) / 2;
      const py = (H - size) / 2;

      // Dark background clearing
      ctx.fillStyle = '#030308';
      ctx.fillRect(0, 0, W, H);

      // ── Draw 3D Brushed Metal Plate ──
      ctx.save();
      // Plate Drop Shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.75)';
      ctx.shadowBlur = 45;
      ctx.shadowOffsetX = 10;
      ctx.shadowOffsetY = 18;
      
      // Bronze plate base
      const metalGrd = ctx.createLinearGradient(px, py, px + size, py + size);
      metalGrd.addColorStop(0, '#15131a');
      metalGrd.addColorStop(0.3, '#1c1924');
      metalGrd.addColorStop(0.5, '#221e2c');
      metalGrd.addColorStop(0.7, '#1c1924');
      metalGrd.addColorStop(1, '#0e0c12');
      ctx.fillStyle = metalGrd;
      ctx.fillRect(px, py, size, size);
      ctx.restore();

      // Plate bevel border
      ctx.strokeStyle = 'rgba(245, 210, 138, 0.12)';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(px, py, size, size);

      // Plate center screw (gives structure)
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#2d2836';
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.fill();
      ctx.stroke();

      const vibrAmp = Math.max(0.6 - transitionRef.current * 0.6, 0);
      transitionRef.current = Math.min(transitionRef.current + 0.0035, 1);

      // Update and draw sand particles
      particlesRef.current.forEach(p => {
        const d = chladniDisplacement(p.x, p.y, m, n, W, H);
        const absD = Math.abs(d);

        // Physics: move towards nodal lines
        if (absD < 0.045 && !p.settled) {
          p.vx *= 0.75;
          p.vy *= 0.75;
          p.settled = true;
        } else if (!p.settled) {
          const eps = 1.0;
          const dx = chladniDisplacement(p.x + eps, p.y, m, n, W, H);
          const dy = chladniDisplacement(p.x, p.y + eps, m, n, W, H);
          const gx = dx - d;
          const gy = dy - d;

          const force = 0.35 + vibrAmp * 2.8;
          p.vx -= gx * d * force;
          p.vy -= gy * d * force;

          // Plate vibration acoustics noise
          p.vx += (Math.random() - 0.5) * vibrAmp * 3.5;
          p.vy += (Math.random() - 0.5) * vibrAmp * 3.5;
          
          p.vx *= 0.82;
          p.vy *= 0.82;
          p.x += p.vx;
          p.y += p.vy;

          // Contain particles on plate
          p.x = Math.max(px + 4, Math.min(px + size - 4, p.x));
          p.y = Math.max(py + 4, Math.min(py + size - 4, p.y));
        }

        // Draw sand grains with subtle depth (gold/brass sand)
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        
        if (p.settled) {
          // Glow and high intensity for settled lines
          ctx.fillStyle = `hsla(38, 75%, ${65 - p.colorOffset * 0.4}%, 0.95)`;
        } else {
          // Dimmer moving particles
          ctx.fillStyle = `hsla(38, 40%, ${45 - p.colorOffset * 0.3}%, 0.45)`;
        }
        ctx.fill();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const selectPreset = (idx: number) => {
    const preset = CHLADNI_PRESETS[idx];
    setActivePreset(idx);
    currentModeRef.current = { m: preset.m, n: preset.n };
    transitionRef.current = 0;
    
    // Reset particles on new mode selection
    const canvas = canvasRef.current!;
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    const size = Math.min(W, H) * 0.72;
    const px = (W - size) / 2;
    const py = (H - size) / 2;

    particlesRef.current = Array.from({ length: 8000 }, () => ({
      x: px + Math.random() * size,
      y: py + Math.random() * size,
      vx: 0, vy: 0, settled: false,
      colorOffset: Math.random() * 30,
      size: 0.85 + Math.random() * 1.3,
    }));

    playNote(preset.freq, 'sine', 1.8, 0.18);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Modern floating sidebar controls (safely out of the way of the top header) */}
      <div style={{
        position: 'absolute', right: '2rem', top: '5.5rem', zIndex: 50,
        display: 'flex', flexDirection: 'column', gap: '0.5rem',
        background: 'rgba(8, 8, 16, 0.85)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px', padding: '1.2rem 1rem',
        WebkitBackdropFilter: 'blur(16px)',
        backdropFilter: 'blur(16px)',
        width: '180px',
      }}>
        <div style={{
          fontFamily: 'Space Mono, monospace', fontSize: '0.52rem',
          color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em',
          textTransform: 'uppercase', marginBottom: '0.4rem',
        }}>
          Plate Frequencies
        </div>
        
        {CHLADNI_PRESETS.map((p, i) => (
          <button key={i} onClick={() => selectPreset(i)} style={{
            padding: '0.45rem 0.6rem', fontSize: '0.62rem',
            background: activePreset === i ? 'rgba(245, 210, 138, 0.15)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${activePreset === i ? 'rgba(245, 210, 138, 0.45)' : 'rgba(255,255,255,0.05)'}`,
            borderRadius: '6px', color: activePreset === i ? '#F5D28A' : 'rgba(255,255,255,0.6)',
            cursor: 'pointer', fontFamily: 'Space Mono, monospace', textAlign: 'left',
            transition: 'all 0.3s',
          }}
          onMouseEnter={e => {
            if (activePreset !== i) e.currentTarget.style.border = '1px solid rgba(255,255,255,0.15)';
          }}
          onMouseLeave={e => {
            if (activePreset !== i) e.currentTarget.style.border = '1px solid rgba(255,255,255,0.05)';
          }}
          >
            {p.label} · {p.freq}Hz
          </button>
        ))}
      </div>

      <div style={{
        position: 'absolute', bottom: '1.5rem', left: '1.5rem',
        fontFamily: 'Space Mono, monospace', fontSize: '0.58rem',
        color: 'rgba(245,210,138,0.45)', lineHeight: 1.8, pointerEvents: 'none',
      }}>
        <div style={{ color: '#F5D28A', marginBottom: '0.2rem' }}>◈ CHLADNI FIGURES</div>
        <div>Standing waves on a free metallic resonance plate</div>
        <div>Sand accumulates on zero-displacement nodal lines</div>
      </div>
    </div>
  );
}

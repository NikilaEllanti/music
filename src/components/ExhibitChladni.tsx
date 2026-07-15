'use client';
import { useEffect, useRef, useState } from 'react';
import { playNote } from '@/lib/audio';

// Exhibit 5: CHLADNI SAND PATTERNS
// Real Chladni figure math: sand settles on nodal lines of vibrating plate.
// Standing wave modes: sin(m*pi*x)*sin(n*pi*y) where (m,n) are mode numbers.

const CHLADNI_PRESETS = [
  { m: 2, n: 2, label: 'Mode (2,2)', freq: 220 },
  { m: 3, n: 1, label: 'Mode (3,1)', freq: 330 },
  { m: 4, n: 2, label: 'Mode (4,2)', freq: 440 },
  { m: 3, n: 3, label: 'Mode (3,3)', freq: 550 },
  { m: 5, n: 1, label: 'Mode (5,1)', freq: 660 },
  { m: 4, n: 4, label: 'Mode (4,4)', freq: 880 },
  { m: 5, n: 3, label: 'Mode (5,3)', freq: 740 },
  { m: 6, n: 2, label: 'Mode (6,2)', freq: 920 },
];

interface SandParticle {
  x: number; y: number;
  vx: number; vy: number;
  settled: boolean;
}

export default function ExhibitChladni() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const particlesRef = useRef<SandParticle[]>([]);
  const currentModeRef = useRef({ m: 2, n: 2 });
  const [activePreset, setActivePreset] = useState(0);
  const [customM, setCustomM] = useState(2);
  const [customN, setCustomN] = useState(2);
  const transitionRef = useRef(0); // for mode morphing

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initParticles();
    };

    const initParticles = () => {
      const W = canvas.width, H = canvas.height;
      particlesRef.current = Array.from({ length: 6000 }, () => ({
        x: W * 0.15 + Math.random() * W * 0.7,
        y: H * 0.1 + Math.random() * H * 0.8,
        vx: 0, vy: 0, settled: false,
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    // Chladni standing wave displacement at (x, y) with mode (m, n)
    const chladniDisplacement = (x: number, y: number, m: number, n: number, W: number, H: number): number => {
      const nx = (x - W * 0.1) / (W * 0.8);
      const ny = (y - H * 0.1) / (H * 0.8);
      if (nx < 0 || nx > 1 || ny < 0 || ny > 1) return 1;
      return Math.sin(m * Math.PI * nx) * Math.cos(n * Math.PI * ny) +
             Math.cos(m * Math.PI * nx) * Math.sin(n * Math.PI * ny);
    };

    const draw = () => {
      timeRef.current += 0.016;
      const t = timeRef.current;
      const W = canvas.width, H = canvas.height;
      const { m, n } = currentModeRef.current;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fillRect(0, 0, W, H);

      // Draw plate outline
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.strokeRect(W * 0.1, H * 0.1, W * 0.8, H * 0.8);

      // Plate shiver amplitude (fades as particles settle)
      const vibrAmp = Math.max(0.5 - transitionRef.current * 0.5, 0);
      transitionRef.current = Math.min(transitionRef.current + 0.004, 1);

      // Update and draw particles
      const pts: [number, number, boolean][] = [];

      particlesRef.current.forEach(p => {
        const d = chladniDisplacement(p.x, p.y, m, n, W, H);
        const absD = Math.abs(d);

        if (absD < 0.06 && !p.settled) {
          // On nodal line — sand accumulates here
          p.vx *= 0.8;
          p.vy *= 0.8;
          p.settled = true;
        } else if (!p.settled) {
          // Force towards nearest nodal line: gradient of displacement
          const eps = 1.5;
          const dx = chladniDisplacement(p.x + eps, p.y, m, n, W, H);
          const dy = chladniDisplacement(p.x, p.y + eps, m, n, W, H);
          const gx = dx - d;
          const gy = dy - d;
          // Move towards zero crossing (nodal line)
          const force = 0.3 + vibrAmp * 2.0;
          p.vx -= gx * d * force;
          p.vy -= gy * d * force;
          // Vibration noise
          p.vx += (Math.random() - 0.5) * vibrAmp * 4;
          p.vy += (Math.random() - 0.5) * vibrAmp * 4;
          p.vx *= 0.88;
          p.vy *= 0.88;
          p.x += p.vx;
          p.y += p.vy;
          // Clamp to plate
          p.x = Math.max(W * 0.1, Math.min(W * 0.9, p.x));
          p.y = Math.max(H * 0.1, Math.min(H * 0.9, p.y));
        }

        pts.push([p.x, p.y, p.settled]);
      });

      // Draw sand particles
      pts.forEach(([px, py, settled]) => {
        if (settled) {
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = '#e8e8e0';
          ctx.shadowBlur = 3;
          ctx.shadowColor = '#ffffff';
        } else {
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = '#888880';
          ctx.shadowBlur = 0;
        }
        ctx.fillRect(px, py, 1.5, 1.5);
      });

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Mode label overlay
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '600 14px Space Grotesk, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Mode (${m}, ${n})  —  f = ${Math.round(m * m * 55 + n * n * 55)} Hz`, W / 2, H * 0.07);

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
    setCustomM(preset.m);
    setCustomN(preset.n);
    currentModeRef.current = { m: preset.m, n: preset.n };
    transitionRef.current = 0;
    // Reset particles
    const canvas = canvasRef.current!;
    const W = canvas.width, H = canvas.height;
    particlesRef.current = Array.from({ length: 6000 }, () => ({
      x: W * 0.15 + Math.random() * W * 0.7,
      y: H * 0.1 + Math.random() * H * 0.8,
      vx: 0, vy: 0, settled: false,
    }));
    playNote(preset.freq, 'sine', 2.0, 0.15);
  };

  const applyCustom = () => {
    currentModeRef.current = { m: customM, n: customN };
    transitionRef.current = 0;
    const canvas = canvasRef.current!;
    const W = canvas.width, H = canvas.height;
    particlesRef.current = Array.from({ length: 6000 }, () => ({
      x: W * 0.15 + Math.random() * W * 0.7,
      y: H * 0.1 + Math.random() * H * 0.8,
      vx: 0, vy: 0, settled: false,
    }));
    playNote(customM * customM * 55 + customN * customN * 55, 'sine', 2.0, 0.15);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Controls */}
      <div style={{ padding: '0.8rem 1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', background: 'rgba(0,0,0,0.5)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {CHLADNI_PRESETS.map((p, i) => (
          <button key={i} onClick={() => selectPreset(i)} style={{
            padding: '0.3rem 0.7rem', fontSize: '0.65rem',
            background: activePreset === i ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${activePreset === i ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '4px', color: '#fff', cursor: 'pointer', fontFamily: 'Space Mono, monospace',
          }}>
            {p.label}
          </button>
        ))}
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginLeft: 'auto' }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontFamily: 'Space Mono, monospace' }}>m=</span>
          <input type="number" min={1} max={8} value={customM} onChange={e => setCustomM(+e.target.value)}
            style={{ width: '40px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', padding: '0.2rem', fontSize: '0.7rem', textAlign: 'center' }} />
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontFamily: 'Space Mono, monospace' }}>n=</span>
          <input type="number" min={1} max={8} value={customN} onChange={e => setCustomN(+e.target.value)}
            style={{ width: '40px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '4px', padding: '0.2rem', fontSize: '0.7rem', textAlign: 'center' }} />
          <button onClick={applyCustom} style={{
            padding: '0.3rem 0.8rem', fontSize: '0.65rem',
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '4px', color: '#fff', cursor: 'pointer', fontFamily: 'Space Mono, monospace',
          }}>Apply</button>
        </div>
      </div>
      <canvas ref={canvasRef} style={{ flex: 1, width: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', bottom: '1.5rem', left: '1.5rem',
        fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', color: 'rgba(220,220,220,0.5)',
        lineHeight: 1.7, pointerEvents: 'none',
      }}>
        <div style={{ color: '#ffffff', marginBottom: '0.3rem', fontWeight: 600 }}>◈ CHLADNI SAND PATTERNS</div>
        Select a mode · Sand migrates to nodal lines · Real vibration geometry
      </div>
    </div>
  );
}

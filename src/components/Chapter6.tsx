'use client';

import { useEffect, useRef } from 'react';

function LissajousCanvas({ a, b, delta, color }: { a: number; b: number; delta: number; color: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const S = 120;
    canvas.width = S;
    canvas.height = S;

    const draw = () => {
      tRef.current += 0.012;
      const t = tRef.current;
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, 0, S, S);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.shadowBlur = 8;
      ctx.shadowColor = color;
      ctx.beginPath();
      const steps = 300;
      for (let i = 0; i <= steps; i++) {
        const phase = (i / steps) * Math.PI * 2;
        const x = S / 2 + Math.sin(a * phase + delta + t * 0.3) * (S * 0.42);
        const y = S / 2 + Math.sin(b * phase + t * 0.15) * (S * 0.42);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [a, b, delta, color]);

  return (
    <canvas
      ref={ref}
      className="lissajous-canvas"
      style={{ width: '120px', height: '120px' }}
    />
  );
}

function FourierCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 120;
    canvas.height = 120;

    const draw = () => {
      tRef.current += 0.025;
      const t = tRef.current;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, 120, 120);

      // Draw epicycles
      let x = 60;
      let y = 60;
      const harmonics = [1, 3, 5, 7];
      for (let hi = 0; hi < harmonics.length; hi++) {
        const n = harmonics[hi];
        const r = 20 / n;
        ctx.strokeStyle = `rgba(0,255,255,${0.3 - hi * 0.05})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
        x += Math.cos(n * t) * r;
        y += Math.sin(n * t) * r;
      }
      // Final point
      ctx.fillStyle = '#00FFFF';
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#00FFFF';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas
      ref={ref}
      className="lissajous-canvas"
      style={{ width: '120px', height: '120px' }}
    />
  );
}

function SpiralCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 120;
    canvas.height = 120;

    const draw = () => {
      tRef.current += 0.008;
      const t = tRef.current;
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(0, 0, 120, 120);

      const phi = 1.618033;
      ctx.strokeStyle = '#00FF88';
      ctx.lineWidth = 1;
      ctx.shadowBlur = 6;
      ctx.shadowColor = '#00FF88';
      ctx.beginPath();
      for (let i = 0; i < 200; i++) {
        const angle = i * 0.15 + t;
        const r = Math.sqrt(i) * 4;
        if (r > 55) break;
        const x = 60 + Math.cos(angle * phi) * r;
        const y = 60 + Math.sin(angle * phi) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas
      ref={ref}
      className="lissajous-canvas"
      style={{ width: '120px', height: '120px' }}
    />
  );
}

function InterferenceCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const tRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = 120;
    canvas.height = 120;

    const draw = () => {
      tRef.current += 0.02;
      const t = tRef.current;
      const imageData = ctx.createImageData(120, 120);
      const data = imageData.data;
      for (let py = 0; py < 120; py++) {
        for (let px = 0; px < 120; px++) {
          const dx1 = px - 40;
          const dy1 = py - 60;
          const dx2 = px - 80;
          const dy2 = py - 60;
          const d1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
          const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
          const wave = Math.sin(d1 * 0.5 - t * 3) + Math.sin(d2 * 0.5 - t * 3);
          const intensity = (wave + 2) / 4;
          const idx = (py * 120 + px) * 4;
          data[idx] = 0;
          data[idx + 1] = Math.floor(intensity * 200);
          data[idx + 2] = Math.floor(intensity * 255);
          data[idx + 3] = Math.floor(intensity * 200 + 30);
        }
      }
      ctx.putImageData(imageData, 0, 0);
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <canvas
      ref={ref}
      className="lissajous-canvas"
      style={{ width: '120px', height: '120px' }}
    />
  );
}

const GEO_ITEMS = [
  { label: 'Lissajous 1:2', component: <LissajousCanvas a={1} b={2} delta={Math.PI / 4} color="#00FFFF" /> },
  { label: 'Lissajous 3:4', component: <LissajousCanvas a={3} b={4} delta={Math.PI / 3} color="#40A0FF" /> },
  { label: 'Lissajous 5:6', component: <LissajousCanvas a={5} b={6} delta={Math.PI / 6} color="#8060FF" /> },
  { label: 'Fourier Series', component: <FourierCanvas /> },
  { label: 'Golden Spiral', component: <SpiralCanvas /> },
  { label: 'Wave Interference', component: <InterferenceCanvas /> },
];

export default function Chapter6() {
  return (
    <section
      id="chapter-6"
      className="chapter"
      style={{ minHeight: '110vh', background: '#010005', flexDirection: 'column', gap: '3rem' }}
    >
      <div className="section-content" style={{ zIndex: 10 }}>
        <span className="chapter-num">Chapter VI</span>
        <h2
          className="chapter-title"
          style={{
            color: 'transparent',
            backgroundImage: 'linear-gradient(135deg, #fff 0%, #00FF88 50%, #00FFFF 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            marginBottom: '1.5rem',
          }}
        >
          Geometry
        </h2>
        <p className="chapter-subtitle" style={{ marginBottom: '2.5rem' }}>
          Music is mathematics made audible
        </p>

        <div className="geo-grid">
          {GEO_ITEMS.map(item => (
            <div key={item.label} className="geo-item">
              {item.component}
              <span className="geo-label">{item.label}</span>
            </div>
          ))}
        </div>

        <div className="divider" />
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 200,
          fontSize: '0.9rem',
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.8,
          letterSpacing: '0.04em',
          maxWidth: '480px',
          margin: '0 auto',
        }}>
          Lissajous curves reveal the mathematical relationship between two
          frequencies. Pure ratios create perfect, stable shapes.
          The golden ratio appears throughout musical harmony.
        </p>
      </div>
    </section>
  );
}

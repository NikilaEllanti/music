'use client';

import { useEffect, useRef, useState } from 'react';
import { playNote, NOTE_FREQS } from '@/lib/audio';

interface Instrument {
  name: string;
  type: OscillatorType;
  waveDesc: string;
  drawWave: (ctx: CanvasRenderingContext2D, W: number, H: number, t: number) => void;
  color: string;
}

const INSTRUMENTS: Instrument[] = [
  {
    name: 'Sine',
    type: 'sine',
    waveDesc: 'Pure tone · No overtones',
    color: '#00FFFF',
    drawWave: (ctx, W, H, t) => {
      ctx.strokeStyle = '#00FFFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < W; x += 2) {
        const y = H / 2 + Math.sin((x / W) * Math.PI * 4 + t * 3) * (H * 0.35);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
  },
  {
    name: 'Triangle',
    type: 'triangle',
    waveDesc: 'Mellow · Odd harmonics',
    color: '#40A0FF',
    drawWave: (ctx, W, H, t) => {
      ctx.strokeStyle = '#40A0FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < W; x += 2) {
        const phase = ((x / W * 4 + t * 2) % 2);
        const y = H / 2 + (phase < 1 ? phase * 2 - 1 : 3 - phase * 2) * H * 0.35;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
  },
  {
    name: 'Sawtooth',
    type: 'sawtooth',
    waveDesc: 'Bright · All harmonics',
    color: '#00FF88',
    drawWave: (ctx, W, H, t) => {
      ctx.strokeStyle = '#00FF88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < W; x += 2) {
        const phase = (x / W * 4 + t * 2) % 1;
        const y = H / 2 + (phase * 2 - 1) * H * 0.35;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
  },
  {
    name: 'Square',
    type: 'square',
    waveDesc: 'Hollow · Odd harmonics only',
    color: '#FF80FF',
    drawWave: (ctx, W, H, t) => {
      ctx.strokeStyle = '#FF80FF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = 0; x < W; x += 2) {
        const phase = (x / W * 4 + t * 2) % 1;
        const y = H / 2 + (phase < 0.5 ? 1 : -1) * H * 0.35;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    },
  },
];

export default function Chapter7() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

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

      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, 0, W, H);

      const inst = INSTRUMENTS[activeRef.current];
      ctx.shadowBlur = 20;
      ctx.shadowColor = inst.color;
      inst.drawWave(ctx, W, H, t);
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const selectInstrument = (i: number) => {
    setActive(i);
    activeRef.current = i;
    playNote(440, INSTRUMENTS[i].type, 1.2, 0.12);
  };

  return (
    <section
      id="chapter-7"
      className="chapter"
      style={{ minHeight: '100vh', background: '#000510', flexDirection: 'column', gap: '2rem' }}
    >
      <div className="section-content" style={{ zIndex: 10 }}>
        <span className="chapter-num">Chapter VII</span>
        <h2
          className="chapter-title"
          style={{
            color: 'transparent',
            backgroundImage: 'linear-gradient(135deg, #fff 0%, #FF80FF 50%, #00FFFF 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            marginBottom: '1.5rem',
          }}
        >
          Instruments
        </h2>
        <p className="chapter-subtitle" style={{ marginBottom: '2rem' }}>
          Every instrument shapes the wave differently
        </p>

        {/* Waveform display */}
        <div style={{ position: 'relative', marginBottom: '2rem' }}>
          <canvas
            ref={canvasRef}
            style={{
              width: 'min(600px, 90vw)',
              height: '140px',
              border: `1px solid ${INSTRUMENTS[active].color}33`,
              borderRadius: '12px',
              background: 'rgba(0,0,0,0.6)',
              display: 'block',
              margin: '0 auto',
              boxShadow: `0 0 30px ${INSTRUMENTS[active].color}22`,
              transition: 'box-shadow 0.5s',
            }}
          />
          <div style={{
            marginTop: '0.75rem',
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.15em',
            color: INSTRUMENTS[active].color,
            textTransform: 'uppercase',
            textShadow: `0 0 10px ${INSTRUMENTS[active].color}`,
            transition: 'all 0.5s',
          }}>
            {INSTRUMENTS[active].waveDesc}
          </div>
        </div>

        {/* Instrument buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {INSTRUMENTS.map((inst, i) => (
            <button
              key={inst.name}
              className={`instrument-btn ${active === i ? 'active' : ''}`}
              style={active === i ? {
                borderColor: inst.color,
                color: inst.color,
                background: `${inst.color}10`,
                boxShadow: `0 0 15px ${inst.color}44`,
              } : {}}
              onClick={() => selectInstrument(i)}
            >
              {inst.name}
            </button>
          ))}
        </div>

        <div className="divider" />
        <p style={{
          fontFamily: 'Inter, sans-serif',
          fontWeight: 200,
          fontSize: '0.9rem',
          color: 'rgba(255,255,255,0.4)',
          lineHeight: 1.8,
          letterSpacing: '0.03em',
          maxWidth: '440px',
          margin: '0 auto',
        }}>
          The waveform determines timbre. Mixing harmonics in different proportions
          creates every sound you&apos;ve ever heard.
        </p>
      </div>
    </section>
  );
}

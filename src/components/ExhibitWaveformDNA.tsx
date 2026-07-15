'use client';
import { useEffect, useRef } from 'react';
import { playNote, C_MAJOR } from '@/lib/audio';

// Exhibit 15: WAVEFORM DNA — Oscilloscope showing every sound's hidden structure
// Real-time waveform visualization like oscilloscope traces

export default function ExhibitWaveformDNA() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const waveTypeRef = useRef<OscillatorType>('sine');
  const freqRef = useRef(261.63);
  const harmonicsRef = useRef(1);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const waveTypes: OscillatorType[] = ['sine', 'triangle', 'sawtooth', 'square'];
    let typeIdx = 0;

    const onClick = () => {
      typeIdx = (typeIdx + 1) % waveTypes.length;
      waveTypeRef.current = waveTypes[typeIdx];
      playNote(freqRef.current, waveTypeRef.current, 1.0, 0.14);
    };
    canvas.addEventListener('click', onClick);

    // Mouse Y controls frequency
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const ny = 1 - (e.clientY - rect.top) / rect.height;
      freqRef.current = 80 + ny * 800;
      harmonicsRef.current = 1 + Math.floor((e.clientX - rect.left) / rect.width * 8);
    };
    canvas.addEventListener('mousemove', onMove);

    // Auto play
    const autoInterval = setInterval(() => {
      playNote(freqRef.current, waveTypeRef.current, 0.6, 0.06);
    }, 500);

    const computeWave = (x: number, type: OscillatorType, harmonics: number): number => {
      let val = 0;
      for (let h = 0; h < harmonics; h++) {
        const n = h * 2 + 1;
        const amp = 1 / n;
        switch (type) {
          case 'sine':
            val += Math.sin(x * (h + 1)) * (h === 0 ? 1 : 0.3 / (h + 1));
            break;
          case 'triangle':
            val += Math.sin(x * n) * amp * (h % 2 === 0 ? 1 : -1);
            break;
          case 'sawtooth':
            val += Math.sin(x * (h + 1)) / (h + 1) * (h % 2 === 0 ? 1 : -1);
            break;
          case 'square':
            val += Math.sin(x * n) * amp;
            break;
        }
      }
      return val;
    };

    const draw = () => {
      timeRef.current += 0.02;
      const t = timeRef.current;
      const W = canvas.width, H = canvas.height;
      const cy = H / 2;

      ctx.fillStyle = 'rgba(2, 4, 15, 0.15)';
      ctx.fillRect(0, 0, W, H);

      // Grid lines
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const gy = (i / 10) * H;
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }
      for (let i = 0; i < 16; i++) {
        const gx = (i / 16) * W;
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();
      }

      // Center line
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke();

      // Main waveform
      const type = waveTypeRef.current;
      const harmonics = harmonicsRef.current;
      const amp = H * 0.35;
      const speed = freqRef.current / 261.63;

      const colors = ['#00ff88', '#00ccff', '#ff6688', '#ffaa33'];
      const colorIdx = waveTypes.indexOf(type);
      const color = colors[colorIdx];

      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.shadowBlur = 16;
      ctx.shadowColor = color;
      ctx.beginPath();
      for (let px = 0; px < W; px++) {
        const x = (px / W) * Math.PI * 8 * speed + t * 3;
        const y = cy - computeWave(x, type, harmonics) * amp;
        if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
      }
      ctx.stroke();

      // Ghost traces (previous harmonics)
      for (let ghost = 1; ghost < Math.min(harmonics, 4); ghost++) {
        ctx.globalAlpha = 0.15 / ghost;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        for (let px = 0; px < W; px++) {
          const x = (px / W) * Math.PI * 8 * speed + t * 3;
          const y = cy - computeWave(x, type, ghost) * amp;
          if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
        }
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      // Info
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '500 16px Cormorant Garamond, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${type.toUpperCase()} — ${Math.round(freqRef.current)} Hz — ${harmonics} harmonic${harmonics > 1 ? 's' : ''}`, W / 2, H * 0.06);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('mousemove', onMove);
      clearInterval(autoInterval);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }} />
      <div style={{
        position: 'absolute', bottom: '1.5rem', left: '1.5rem',
        fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', color: 'rgba(0,255,136,0.6)',
        lineHeight: 1.7, pointerEvents: 'none',
      }}>
        <div style={{ color: '#00ff88', marginBottom: '0.3rem', fontWeight: 600 }}>📊 WAVEFORM DNA</div>
        Click to change wave · Move Y for frequency · Move X for harmonics
      </div>
    </div>
  );
}

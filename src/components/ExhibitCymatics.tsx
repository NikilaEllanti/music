'use client';
import { useEffect, useRef } from 'react';
import { playNote } from '@/lib/audio';

// Exhibit 12: CYMATICS — Water droplet interference patterns
// Concentric wave rings from multiple sources creating interference

interface WaveSource {
  x: number; y: number; t0: number; freq: number; hue: number;
}

export default function ExhibitCymatics() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const sourcesRef = useRef<WaveSource[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const addSource = (x: number, y: number) => {
      const freq = 3 + Math.random() * 6;
      const hue = 180 + Math.random() * 60;
      sourcesRef.current.push({ x, y, t0: timeRef.current, freq, hue });
      if (sourcesRef.current.length > 12) sourcesRef.current.shift();
      playNote(200 + freq * 40, 'sine', 1.5, 0.12);
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      addSource(e.clientX - rect.left, e.clientY - rect.top);
    };
    canvas.addEventListener('click', onClick);

    // Auto-add sources
    let autoTimer = setInterval(() => {
      const W = canvas.width, H = canvas.height;
      addSource(W * 0.2 + Math.random() * W * 0.6, H * 0.2 + Math.random() * H * 0.6);
    }, 2200);

    // Pixel buffer for interference computation
    let imgData: ImageData | null = null;

    const draw = () => {
      timeRef.current += 0.03;
      const t = timeRef.current;
      const W = canvas.width, H = canvas.height;

      if (!imgData || imgData.width !== W || imgData.height !== H) {
        imgData = ctx.createImageData(W, H);
      }
      const data = imgData.data;

      // Compute interference pattern every 3rd pixel for performance, then stretch
      const step = 3;
      for (let py = 0; py < H; py += step) {
        for (let px = 0; px < W; px += step) {
          let totalAmp = 0;

          for (const src of sourcesRef.current) {
            const age = t - src.t0;
            if (age < 0) continue;
            const dx = px - src.x;
            const dy = py - src.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const wave = Math.sin(dist * 0.08 * src.freq - age * 8) * Math.exp(-dist * 0.004) * Math.exp(-age * 0.15);
            totalAmp += wave;
          }

          // Map amplitude to color
          const brightness = Math.abs(totalAmp);
          const isPositive = totalAmp > 0;

          const r = isPositive ? Math.floor(brightness * 20) : Math.floor(brightness * 80);
          const g = Math.floor(brightness * 180 + (isPositive ? 40 : 0));
          const b = Math.floor(brightness * 255);

          // Fill step x step block
          for (let sy = 0; sy < step && py + sy < H; sy++) {
            for (let sx = 0; sx < step && px + sx < W; sx++) {
              const idx = ((py + sy) * W + (px + sx)) * 4;
              data[idx] = r;
              data[idx + 1] = g;
              data[idx + 2] = b;
              data[idx + 3] = 255;
            }
          }
        }
      }

      ctx.putImageData(imgData, 0, 0);

      // Draw source points as bright dots
      sourcesRef.current.forEach(src => {
        const age = t - src.t0;
        const alpha = Math.max(0, 1 - age * 0.08);
        if (alpha <= 0) return;
        ctx.globalAlpha = alpha;
        const grd = ctx.createRadialGradient(src.x, src.y, 0, src.x, src.y, 12);
        grd.addColorStop(0, `hsla(${src.hue}, 100%, 90%, 1)`);
        grd.addColorStop(1, `hsla(${src.hue}, 100%, 70%, 0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(src.x, src.y, 12, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Clean old sources
      sourcesRef.current = sourcesRef.current.filter(s => (t - s.t0) < 12);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', onClick);
      clearInterval(autoTimer);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }} />
      <div style={{
        position: 'absolute', bottom: '1.5rem', left: '1.5rem',
        fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', color: 'rgba(0,220,200,0.6)',
        lineHeight: 1.7, pointerEvents: 'none',
      }}>
        <div style={{ color: '#00ddcc', marginBottom: '0.3rem', fontWeight: 600 }}>💧 CYMATICS</div>
        Click to drop wave sources · Watch interference patterns form
      </div>
    </div>
  );
}

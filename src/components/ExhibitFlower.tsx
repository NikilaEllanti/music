'use client';
import { useEffect, useRef } from 'react';
import { playNote } from '@/lib/audio';

// Exhibit 4: BLOOMING FLOWERS (Sacred Geometry Generative Botany)
// Music grows intricate, layered bioluminescent mandalas that pulse and breathe.

interface Flower {
  x: number; y: number;
  freq: number;
  hue: number;
  petalCount: number;
  r: number;
  maxR: number;
  bloom: number;
  age: number;
  pulsePhase: number;
  growthSpeed: number;
  swaySpeed: number;
}

const FLOWER_NOTES: { label: string; freq: number; key: string }[] = [
  { label: 'C3', freq: 130.81, key: 'q' },
  { label: 'E3', freq: 164.81, key: 'w' },
  { label: 'G3', freq: 196.00, key: 'e' },
  { label: 'C4', freq: 261.63, key: 'r' },
  { label: 'E4', freq: 329.63, key: 't' },
  { label: 'G4', freq: 392.00, key: 'y' },
  { label: 'C5', freq: 523.25, key: 'u' },
  { label: 'E5', freq: 659.25, key: 'i' },
];

export default function ExhibitFlower() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const flowersRef = useRef<Flower[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnFlower = (x: number, y: number, freq: number) => {
      // Map freq to size (lower freq = bigger, higher freq = smaller)
      const t = (freq - 130) / 530; // 0 to 1
      const maxR = 95 - clamp(t, 0, 1) * 65 + Math.random() * 12;
      const petalCount = 6 + Math.floor(Math.random() * 4) * 2; // symmetric petals
      const hue = 220 + Math.random() * 80; // beautiful cosmic blue-violet-pink range
      
      flowersRef.current.push({
        x, y, freq, hue, petalCount,
        r: 0, maxR,
        bloom: 0,
        age: 0,
        pulsePhase: Math.random() * Math.PI * 2,
        growthSpeed: 0.008 + Math.random() * 0.006,
        swaySpeed: 0.3 + Math.random() * 0.7
      });

      playNote(freq, 'sine', 1.5, 0.1);
    };

    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

    // Keyboard controls
    const onKey = (e: KeyboardEvent) => {
      const note = FLOWER_NOTES.find(n => n.key === e.key.toLowerCase());
      if (note) {
        const W = canvas.width, H = canvas.height;
        const x = W * 0.15 + FLOWER_NOTES.indexOf(note) * (W * 0.1);
        const y = H * 0.45 + (Math.random() - 0.5) * 100;
        spawnFlower(x, y, note.freq);
      }
    };

    // Click planting
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Map horizontal location to note freq
      const t = clickX / canvas.width;
      const freq = 130 + t * 530;
      spawnFlower(clickX, clickY, freq);
    };

    canvas.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);

    // Initial garden placement
    let autoIdx = 0;
    const interval = setInterval(() => {
      const W = canvas.width, H = canvas.height;
      const x = W * 0.2 + (autoIdx % 5) * (W * 0.15) + (Math.random() - 0.5) * 60;
      const y = H * 0.45 + (Math.random() - 0.5) * 80;
      const note = FLOWER_NOTES[autoIdx % FLOWER_NOTES.length];
      spawnFlower(x, y, note.freq);
      autoIdx++;
    }, 1200);

    const drawPetal = (cx: number, cy: number, length: number, angle: number, hue: number, alpha: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle);
      
      const width = length * 0.38;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      // Dual bezier curves for organic pointed petal
      ctx.bezierCurveTo(-width, -length * 0.35, -width * 0.4, -length, 0, -length);
      ctx.bezierCurveTo(width * 0.4, -length, width, -length * 0.35, 0, 0);
      
      const grd = ctx.createLinearGradient(0, 0, 0, -length);
      grd.addColorStop(0, `hsla(${hue}, 95%, 70%, ${alpha * 0.85})`);
      grd.addColorStop(0.5, `hsla(${hue + 30}, 90%, 65%, ${alpha * 0.6})`);
      grd.addColorStop(1, `hsla(${hue + 60}, 100%, 80%, 0)`);
      
      ctx.fillStyle = grd;
      ctx.shadowBlur = 10;
      ctx.shadowColor = `hsl(${hue}, 90%, 65%)`;
      ctx.fill();
      
      ctx.restore();
    };

    const draw = () => {
      timeRef.current += 0.01;
      const t = timeRef.current;
      const W = canvas.width, H = canvas.height;

      // Dark blue background clearing
      ctx.fillStyle = 'rgba(2, 3, 10, 0.14)';
      ctx.fillRect(0, 0, W, H);

      // Draw flowers
      let i = 0;
      while (i < flowersRef.current.length) {
        const f = flowersRef.current[i];
        f.age += 0.01;
        f.bloom = Math.min(f.bloom + f.growthSpeed, 1);
        f.r = f.bloom * f.maxR;

        // Breathe pulsation
        const pulse = 1 + Math.sin(t * 2 + f.pulsePhase) * 0.04;
        const currentR = f.r * pulse;

        ctx.save();
        
        // Sway in breeze
        const sway = Math.sin(t * f.swaySpeed + f.pulsePhase) * 4;
        ctx.translate(f.x + sway, f.y);

        // Draw layered geometric petals
        for (let layer = 0; layer < 3; layer++) {
          const layerR = currentR * (1 - layer * 0.28);
          const layerAlpha = (1 - layer * 0.25) * f.bloom * 0.65;
          const layerRotate = layer * 0.25 * Math.PI;

          for (let p = 0; p < f.petalCount; p++) {
            const angle = (p / f.petalCount) * Math.PI * 2 + layerRotate + Math.sin(t + f.pulsePhase) * 0.02;
            drawPetal(0, 0, layerR, angle, f.hue, layerAlpha);
          }
        }

        // Center glowing seed
        ctx.beginPath();
        const centerR = currentR * 0.18;
        const centerGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, centerR);
        centerGrd.addColorStop(0, '#ffffff');
        centerGrd.addColorStop(0.4, `hsl(${f.hue}, 95%, 75%)`);
        centerGrd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = centerGrd;
        ctx.arc(0, 0, centerR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Decay or clamp count
        if (flowersRef.current.length > 35) {
          flowersRef.current.shift();
        } else {
          i++;
        }
      }

      ctx.shadowBlur = 0;

      // Bottom keys styling
      const keyW = W / FLOWER_NOTES.length;
      FLOWER_NOTES.forEach((note, idx) => {
        ctx.globalAlpha = 0.25;
        ctx.fillStyle = `hsla(${200 + idx * 20}, 75%, 65%, 0.6)`;
        ctx.fillRect(idx * keyW, H - 30, keyW - 2, 30);
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#fff';
        ctx.font = '600 0.6rem Space Grotesk, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(note.key.toUpperCase(), idx * keyW + keyW / 2, H - 12);
      });
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('click', onClick);
      clearInterval(interval);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#030308' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', bottom: '3.5rem', right: '1.5rem',
        fontFamily: 'Space Mono, monospace', fontSize: '0.58rem',
        color: 'rgba(204, 119, 255, 0.45)', lineHeight: 1.8, pointerEvents: 'none', textAlign: 'right',
      }}>
        <div style={{ color: '#cc77ff', marginBottom: '0.2rem' }}>✿ BLOOMING FLOWERS</div>
        <div>Sacred Geometry botany · L-System mandalas</div>
        <div>Click or press keys Q-I to play and bloom</div>
      </div>
    </div>
  );
}

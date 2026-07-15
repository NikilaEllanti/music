'use client';
import { useEffect, useRef } from 'react';
import { playNote } from '@/lib/audio';

// Exhibit 4: BLOOMING FLOWERS
// Higher pitch = smaller petals. Lower pitch = large petals.
// Chords create entire gardens.

interface Flower {
  x: number; y: number;
  freq: number; // note frequency
  hue: number; petalCount: number;
  r: number; maxR: number; // current and target radius
  bloom: number; // 0 to 1
  age: number; swayPhase: number;
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
      const maxFreq = 800, minFreq = 100;
      const t = (freq - minFreq) / (maxFreq - minFreq);
      // Higher freq = smaller max radius, lower = bigger
      const maxR = 80 - t * 55 + Math.random() * 10;
      const petalCount = 5 + Math.round(t * 7); // more petals at higher pitch
      const hue = (1 - t) * 120 + t * 280; // green at low, purple at high

      flowersRef.current.push({
        x, y, freq, hue, petalCount,
        r: 0, maxR, bloom: 0, age: 0,
        swayPhase: Math.random() * Math.PI * 2,
      });
      playNote(freq, 'sine', 1.4, 0.16);
    };

    // Click to plant flower at position
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Map x to frequency
      const t = x / canvas.width;
      const freq = 130 + t * 700;
      spawnFlower(x, y, freq);
    };

    // Key presses for piano chord
    const onKey = (e: KeyboardEvent) => {
      const note = FLOWER_NOTES.find(n => n.key === e.key.toLowerCase());
      if (note) {
        const W = canvas.width, H = canvas.height;
        const x = W * 0.15 + FLOWER_NOTES.indexOf(note) * (W * 0.1);
        const y = H * 0.5 + (Math.random() - 0.5) * 120;
        spawnFlower(x, y, note.freq);
      }
    };

    canvas.addEventListener('click', onClick);
    window.addEventListener('keydown', onKey);

    // Auto bloom garden slowly
    let autoIdx = 0;
    const autoInterval = setInterval(() => {
      const W = canvas.width, H = canvas.height;
      const note = FLOWER_NOTES[autoIdx % FLOWER_NOTES.length];
      const x = W * 0.1 + (autoIdx % 8) * (W * 0.11) + (Math.random() - 0.5) * 40;
      const y = H * 0.45 + (Math.random() - 0.5) * 80;
      spawnFlower(x, y, note.freq);
      autoIdx++;
    }, 1000);

    const drawPetal = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, rx: number, ry: number, hue: number, alpha: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.globalAlpha = alpha;

      // Petal gradient
      const grd = ctx.createRadialGradient(0, -ry * 0.3, 0, 0, -ry * 0.5, ry);
      grd.addColorStop(0, `hsl(${hue + 20}, 80%, 85%)`);
      grd.addColorStop(0.5, `hsl(${hue}, 75%, 65%)`);
      grd.addColorStop(1, `hsl(${hue - 20}, 70%, 45%)`);

      ctx.fillStyle = grd;
      ctx.shadowBlur = 12;
      ctx.shadowColor = `hsl(${hue}, 80%, 65%)`;

      // Petal shape (ellipse)
      ctx.beginPath();
      ctx.ellipse(0, -ry * 0.5, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    };

    const draw = () => {
      timeRef.current += 0.012;
      const t = timeRef.current;
      const W = canvas.width, H = canvas.height;

      ctx.fillStyle = 'rgba(2, 1, 10, 0.15)';
      ctx.fillRect(0, 0, W, H);

      // Soft soil gradient at bottom
      const soilGrd = ctx.createLinearGradient(0, H * 0.75, 0, H);
      soilGrd.addColorStop(0, 'rgba(0,0,0,0)');
      soilGrd.addColorStop(1, 'rgba(10, 5, 20, 0.4)');
      ctx.fillStyle = soilGrd;
      ctx.fillRect(0, H * 0.75, W, H * 0.25);

      flowersRef.current.forEach(flower => {
        flower.age += 0.015;
        flower.bloom = Math.min(flower.bloom + 0.012, 1);
        flower.r = flower.bloom * flower.maxR;

        const sway = 0.06 * Math.sin(t * 1.2 + flower.swayPhase);
        const bloomEase = flower.bloom * flower.bloom * (3 - 2 * flower.bloom); // smoothstep

        ctx.save();
        ctx.translate(flower.x, flower.y);

        // Stem
        const stemH = Math.min(flower.maxR * 1.4, 70) * bloomEase;
        ctx.globalAlpha = bloomEase * 0.7;
        ctx.strokeStyle = `hsl(120, 60%, 40%)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(sway * 30, stemH * 0.5, 0, -stemH);
        ctx.stroke();

        ctx.translate(sway * 15, -stemH);
        ctx.rotate(sway);
        ctx.globalAlpha = 1;

        // Petals
        for (let p = 0; p < flower.petalCount; p++) {
          const angle = (p / flower.petalCount) * Math.PI * 2;
          const rx = flower.r * 0.35 * bloomEase;
          const ry = flower.r * 0.65 * bloomEase;
          const petalHue = flower.hue + p * (360 / flower.petalCount) * 0.15;
          drawPetal(ctx, 0, 0, angle, rx, ry, petalHue, 0.85 * bloomEase);
        }

        // Center
        const centerR = flower.r * 0.18 * bloomEase;
        ctx.shadowBlur = 0;
        const centerGrd = ctx.createRadialGradient(0, 0, 0, 0, 0, centerR);
        centerGrd.addColorStop(0, `hsl(${flower.hue + 60}, 90%, 90%)`);
        centerGrd.addColorStop(1, `hsl(${flower.hue + 30}, 80%, 60%)`);
        ctx.globalAlpha = bloomEase;
        ctx.fillStyle = centerGrd;
        ctx.beginPath();
        ctx.arc(0, 0, centerR, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Trim old flowers
      if (flowersRef.current.length > 60) {
        flowersRef.current = flowersRef.current.slice(-40);
      }

      // Piano keyboard hint at bottom
      const keyW = W / FLOWER_NOTES.length;
      FLOWER_NOTES.forEach((note, i) => {
        const kx = i * keyW + keyW * 0.5;
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = `hsl(${(1 - i / FLOWER_NOTES.length) * 120 + (i / FLOWER_NOTES.length) * 280}, 70%, 60%)`;
        ctx.fillRect(i * keyW, H - 36, keyW - 2, 36);
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#ffffff';
        ctx.font = '600 0.62rem Space Grotesk, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(note.key.toUpperCase(), kx, H - 14);
      });
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('keydown', onKey);
      canvas.removeEventListener('click', onClick);
      clearInterval(autoInterval);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }} />
      <div style={{
        position: 'absolute', bottom: '3.5rem', left: '1.5rem',
        fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', color: 'rgba(200,150,255,0.6)',
        lineHeight: 1.7, pointerEvents: 'none',
      }}>
        <div style={{ color: '#cc88ff', marginBottom: '0.3rem', fontWeight: 600 }}>🌸 BLOOMING FLOWERS</div>
        Click anywhere · Use keys Q-I for piano notes · Low pitch = large petals
      </div>
    </div>
  );
}

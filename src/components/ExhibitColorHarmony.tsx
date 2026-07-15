'use client';
import { useEffect, useRef } from 'react';
import { playNote, playChord, freqToColor } from '@/lib/audio';

// Exhibit 14: COLOR HARMONY — Chords mapped to synesthetic color palettes
// Each interval has a chromesthetic color. Chords paint the screen.

const CHORD_DEFS: { name: string; intervals: number[]; freqs: number[]; emotion: string }[] = [
  { name: 'C Major', intervals: [0, 4, 7], freqs: [261.63, 329.63, 392.00], emotion: 'Bright, Happy' },
  { name: 'A Minor', intervals: [0, 3, 7], freqs: [220.00, 261.63, 329.63], emotion: 'Melancholy' },
  { name: 'Cmaj7', intervals: [0, 4, 7, 11], freqs: [261.63, 329.63, 392.00, 493.88], emotion: 'Dreamy' },
  { name: 'Dm7', intervals: [2, 5, 9, 0], freqs: [293.66, 349.23, 440.00, 523.25], emotion: 'Wistful' },
  { name: 'G7', intervals: [7, 11, 2, 5], freqs: [392.00, 493.88, 293.66, 349.23], emotion: 'Tension' },
  { name: 'F Major', intervals: [5, 9, 0], freqs: [349.23, 440.00, 523.25], emotion: 'Warm, Open' },
  { name: 'E Minor', intervals: [4, 7, 11], freqs: [329.63, 392.00, 493.88], emotion: 'Longing' },
  { name: 'Bdim', intervals: [11, 2, 5], freqs: [493.88, 293.66, 349.23], emotion: 'Unresolved' },
];

const INTERVAL_COLORS: Record<number, string> = {
  0: '#FF4444', 1: '#FF6633', 2: '#FF9900', 3: '#FFCC00',
  4: '#88DD00', 5: '#00CC44', 6: '#009999', 7: '#0066FF',
  8: '#3333FF', 9: '#6600CC', 10: '#9900CC', 11: '#CC0066',
};

interface ColorBlast {
  x: number; y: number;
  colors: string[];
  r: number; maxR: number;
  alpha: number;
}

export default function ExhibitColorHarmony() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const blastsRef = useRef<ColorBlast[]>([]);
  const activeChordRef = useRef(-1);
  const bgHueRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const triggerChord = (idx: number) => {
      const chord = CHORD_DEFS[idx];
      activeChordRef.current = idx;
      playChord(chord.freqs, 'triangle', 0.12, 1.8);

      const W = canvas.width, H = canvas.height;
      const colors = chord.intervals.map(i => INTERVAL_COLORS[i]);
      // Central blast
      blastsRef.current.push({
        x: W / 2, y: H / 2,
        colors, r: 0, maxR: Math.min(W, H) * 0.55,
        alpha: 0.9,
      });
      // Scatter sub-blasts
      chord.intervals.forEach((interval, i) => {
        const angle = (i / chord.intervals.length) * Math.PI * 2 + timeRef.current;
        const dist = 50 + Math.random() * 100;
        blastsRef.current.push({
          x: W / 2 + Math.cos(angle) * dist,
          y: H / 2 + Math.sin(angle) * dist,
          colors: [INTERVAL_COLORS[interval]],
          r: 0, maxR: 60 + Math.random() * 80,
          alpha: 0.7,
        });
      });

      bgHueRef.current = chord.intervals[0] * 30;
    };

    // Auto cycle
    let autoIdx = 0;
    const autoInterval = setInterval(() => {
      triggerChord(autoIdx % CHORD_DEFS.length);
      autoIdx++;
    }, 2500);

    const onClick = () => {
      autoIdx++;
      triggerChord(autoIdx % CHORD_DEFS.length);
    };
    canvas.addEventListener('click', onClick);

    const draw = () => {
      timeRef.current += 0.01;
      const t = timeRef.current;
      const W = canvas.width, H = canvas.height;

      // Slowly fade background towards current chord color
      ctx.fillStyle = `hsla(${bgHueRef.current}, 30%, 4%, 0.12)`;
      ctx.fillRect(0, 0, W, H);

      // Draw color blasts
      blastsRef.current.forEach(blast => {
        blast.r += (blast.maxR - blast.r) * 0.04;
        blast.alpha *= 0.992;

        blast.colors.forEach((color, ci) => {
          const offset = ci * 8;
          ctx.globalAlpha = blast.alpha * (0.5 + 0.5 * Math.sin(t * 3 + ci));
          const grd = ctx.createRadialGradient(
            blast.x, blast.y, offset,
            blast.x, blast.y, blast.r + offset
          );
          grd.addColorStop(0, color + 'cc');
          grd.addColorStop(0.4, color + '44');
          grd.addColorStop(1, color + '00');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(blast.x, blast.y, blast.r + offset, 0, Math.PI * 2);
          ctx.fill();
        });
      });

      blastsRef.current = blastsRef.current.filter(b => b.alpha > 0.02);
      ctx.globalAlpha = 1;

      // Chord info overlay
      if (activeChordRef.current >= 0) {
        const chord = CHORD_DEFS[activeChordRef.current];
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.font = '300 32px Cormorant Garamond, serif';
        ctx.textAlign = 'center';
        ctx.fillText(chord.name, W / 2, H * 0.15);

        ctx.fillStyle = 'rgba(255,255,255,0.45)';
        ctx.font = '400 14px Space Grotesk, sans-serif';
        ctx.fillText(chord.emotion, W / 2, H * 0.15 + 30);

        // Color swatches
        const swatchW = 22;
        const totalW = chord.intervals.length * (swatchW + 6);
        const startX = W / 2 - totalW / 2;
        chord.intervals.forEach((interval, i) => {
          ctx.fillStyle = INTERVAL_COLORS[interval];
          ctx.shadowBlur = 10;
          ctx.shadowColor = INTERVAL_COLORS[interval];
          ctx.beginPath();
          ctx.arc(startX + i * (swatchW + 6) + swatchW / 2, H * 0.15 + 55, swatchW / 2, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', onClick);
      clearInterval(autoInterval);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }} />
      <div style={{
        position: 'absolute', bottom: '1.5rem', left: '1.5rem',
        fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', color: 'rgba(255,180,180,0.6)',
        lineHeight: 1.7, pointerEvents: 'none',
      }}>
        <div style={{ color: '#ffaaaa', marginBottom: '0.3rem', fontWeight: 600 }}>🎨 COLOR HARMONY</div>
        Click to cycle chords · Each interval has a synesthetic color
      </div>
    </div>
  );
}

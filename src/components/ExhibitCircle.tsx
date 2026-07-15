'use client';
import { useEffect, useRef } from 'react';
import { playNote, playChord } from '@/lib/audio';

// Exhibit 7: CIRCLE OF FIFTHS — interactive musical wheel
// Clicking a note plays it and shows harmonic relationships

const NOTES = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯', 'D♭', 'A♭', 'E♭', 'B♭', 'F'];
const FREQS = [261.63, 392.00, 293.66, 440.00, 329.63, 493.88, 369.99, 277.18, 415.30, 311.13, 466.16, 349.23];
const MINOR_NOTES = ['A', 'E', 'B', 'F♯', 'C♯', 'G♯', 'E♭', 'B♭', 'F', 'C', 'G', 'D'];
const MAJOR_KEYS_COLOR = ['#FF6B6B', '#FF8E53', '#FFC93C', '#A8E063', '#56D275', '#00C9A7', '#00B4D8', '#4CC9F0', '#7B88FF', '#C77DFF', '#F72585', '#FF477E'];

export default function ExhibitCircleOfFifths() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const activeNoteRef = useRef(-1);
  const glowRingsRef = useRef<{ noteIdx: number; alpha: number; r: number }[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const getRadius = () => Math.min(canvas.width, canvas.height) * 0.38;
    const getCenterX = () => canvas.width / 2;
    const getCenterY = () => canvas.height / 2;

    const hitTest = (mx: number, my: number): number => {
      const cx = getCenterX(), cy = getCenterY();
      const R = getRadius();
      const dx = mx - cx, dy = my - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < R * 0.25 || dist > R * 1.1) return -1;
      const angle = (Math.atan2(dy, dx) + Math.PI * 2.5) % (Math.PI * 2);
      return Math.floor(angle / (Math.PI * 2 / 12)) % 12;
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const idx = hitTest(e.clientX - rect.left, e.clientY - rect.top);
      if (idx < 0) return;
      activeNoteRef.current = idx;
      // Play note + its fifth + its third
      playNote(FREQS[idx], 'triangle', 1.8, 0.16);
      setTimeout(() => playNote(FREQS[(idx + 1) % 12], 'sine', 1.4, 0.08), 60);
      setTimeout(() => playNote(FREQS[(idx + 3) % 12] * 2, 'sine', 1.2, 0.06), 120);
      glowRingsRef.current.push({ noteIdx: idx, alpha: 1.0, r: getRadius() * 0.6 });
    };

    canvas.addEventListener('click', onClick);

    const draw = () => {
      timeRef.current += 0.008;
      const t = timeRef.current;
      const W = canvas.width, H = canvas.height;
      const cx = getCenterX(), cy = getCenterY();
      const R = getRadius();

      ctx.fillStyle = 'rgba(2, 2, 12, 0.25)';
      ctx.fillRect(0, 0, W, H);

      // Outer ring: major keys
      for (let i = 0; i < 12; i++) {
        const startAngle = (i / 12) * Math.PI * 2 - Math.PI / 2 - Math.PI / 12;
        const endAngle = startAngle + (Math.PI * 2 / 12);
        const isActive = activeNoteRef.current === i;
        const pulse = isActive ? 1 + 0.06 * Math.sin(t * 6) : 1;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R * pulse, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = isActive ? MAJOR_KEYS_COLOR[i] + 'cc' : MAJOR_KEYS_COLOR[i] + '22';
        ctx.strokeStyle = MAJOR_KEYS_COLOR[i] + (isActive ? 'ff' : '44');
        ctx.lineWidth = 1.5;
        if (isActive) {
          ctx.shadowBlur = 30;
          ctx.shadowColor = MAJOR_KEYS_COLOR[i];
        }
        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Note label
        const labelAngle = startAngle + Math.PI / 12;
        const labelR = R * 0.78;
        const lx = cx + Math.cos(labelAngle) * labelR;
        const ly = cy + Math.sin(labelAngle) * labelR;
        ctx.fillStyle = isActive ? '#ffffff' : 'rgba(255,255,255,0.7)';
        ctx.font = `${isActive ? 700 : 500} ${isActive ? 18 : 15}px Cormorant Garamond, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(NOTES[i], lx, ly);
      }

      // Inner ring: relative minor keys
      for (let i = 0; i < 12; i++) {
        const startAngle = (i / 12) * Math.PI * 2 - Math.PI / 2 - Math.PI / 12;
        const endAngle = startAngle + (Math.PI * 2 / 12);
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R * 0.55, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = MAJOR_KEYS_COLOR[i] + '12';
        ctx.strokeStyle = MAJOR_KEYS_COLOR[i] + '30';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        const labelAngle = startAngle + Math.PI / 12;
        const lx = cx + Math.cos(labelAngle) * R * 0.38;
        const ly = cy + Math.sin(labelAngle) * R * 0.38;
        ctx.fillStyle = 'rgba(180,180,255,0.55)';
        ctx.font = '400 11px Space Grotesk, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(MINOR_NOTES[i] + 'm', lx, ly);
      }

      // Center mandala dot
      const coreGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.22);
      coreGrd.addColorStop(0, 'rgba(255,220,150,0.95)');
      coreGrd.addColorStop(0.5, 'rgba(200,140,80,0.4)');
      coreGrd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = coreGrd;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 0.22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '300 13px Cormorant Garamond, serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Circle', cx, cy - 8);
      ctx.fillText('of Fifths', cx, cy + 8);

      // Glow rings (ripple on click)
      glowRingsRef.current.forEach(ring => {
        ring.r += 2.5;
        ring.alpha -= 0.015;
        if (ring.alpha <= 0) return;
        ctx.globalAlpha = ring.alpha;
        ctx.strokeStyle = MAJOR_KEYS_COLOR[ring.noteIdx];
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = MAJOR_KEYS_COLOR[ring.noteIdx];
        ctx.beginPath();
        ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      });
      glowRingsRef.current = glowRingsRef.current.filter(r => r.alpha > 0);
      ctx.globalAlpha = 1;

      // Connection line between active note and its fifth
      if (activeNoteRef.current >= 0) {
        const ai = activeNoteRef.current;
        const fi = (ai + 1) % 12;
        const getPos = (idx: number) => {
          const a = (idx / 12) * Math.PI * 2 - Math.PI / 2;
          return { x: cx + Math.cos(a) * R * 0.78, y: cy + Math.sin(a) * R * 0.78 };
        };
        const from = getPos(ai), to = getPos(fi);
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = MAJOR_KEYS_COLOR[ai];
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', onClick);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }} />
      <div style={{
        position: 'absolute', bottom: '1.5rem', left: '1.5rem',
        fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', color: 'rgba(200,200,255,0.5)',
        lineHeight: 1.7, pointerEvents: 'none',
      }}>
        <div style={{ color: '#ccbbff', marginBottom: '0.3rem', fontWeight: 600 }}>◎ CIRCLE OF FIFTHS</div>
        Click any key · Plays root, fifth, and third · See harmonic relationships
      </div>
    </div>
  );
}

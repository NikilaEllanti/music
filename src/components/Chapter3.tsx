'use client';

import { useEffect, useRef, useState } from 'react';
import { playNote, NOTE_FREQS } from '@/lib/audio';

const MUSIC_SYMBOLS = ['♩', '♪', '♫', '♬', '𝄞', '𝄢', '𝄡', '♭', '♯', '𝅘𝅥𝅮', '𝅗𝅥'];
const NOTES = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

interface FloatingSymbol {
  id: number;
  symbol: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  angle: number;
  angularV: number;
  alpha: number;
  glowing: boolean;
  note?: string;
}

export default function Chapter3() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const symbolsRef = useRef<FloatingSymbol[]>([]);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [hoveredNote, setHoveredNote] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const W = () => canvas.width;
    const H = () => canvas.height;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      // Re-init symbols on resize
      initSymbols();
    };

    const initSymbols = () => {
      symbolsRef.current = [];
      const count = Math.floor(W() * H() / 22000);
      for (let i = 0; i < Math.min(count, 55); i++) {
        symbolsRef.current.push(createSymbol(W(), H()));
      }
    };

    const createSymbol = (w: number, h: number): FloatingSymbol => ({
      id: Math.random(),
      symbol: MUSIC_SYMBOLS[Math.floor(Math.random() * MUSIC_SYMBOLS.length)],
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: 18 + Math.random() * 28,
      angle: Math.random() * 0.4 - 0.2,
      angularV: (Math.random() - 0.5) * 0.005,
      alpha: 0.15 + Math.random() * 0.3,
      glowing: false,
      note: NOTES[Math.floor(Math.random() * NOTES.length)],
    });

    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

      // Check hover
      let found: string | null = null;
      for (const s of symbolsRef.current) {
        const dx = e.clientX - rect.left - s.x;
        const dy = e.clientY - rect.top - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < s.size) {
          s.glowing = true;
          found = s.note || null;
        } else {
          s.glowing = false;
        }
      }
      setHoveredNote(found);
    };

    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      for (const s of symbolsRef.current) {
        const dx = e.clientX - rect.left - s.x;
        const dy = e.clientY - rect.top - s.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < s.size && s.note) {
          playNote(NOTE_FREQS[s.note] || 440, 'triangle', 1.2, 0.1);
          s.glowing = true;
          // Ripple nearby
          for (const other of symbolsRef.current) {
            const dx2 = other.x - s.x;
            const dy2 = other.y - s.y;
            const d2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
            if (d2 < 150) {
              other.glowing = true;
              other.vx += (dx2 / d2) * 1.5;
              other.vy += (dy2 / d2) * 1.5;
              setTimeout(() => { other.glowing = false; }, 600);
            }
          }
        }
      }
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('click', onClick);
    canvas.style.pointerEvents = 'auto';

    const draw = () => {
      const w = W();
      const h = H();
      timeRef.current += 0.012;
      const t = timeRef.current;

      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, 0, w, h);

      const symbols = symbolsRef.current;

      // Draw connection lines between nearby symbols
      for (let i = 0; i < symbols.length; i++) {
        for (let j = i + 1; j < symbols.length; j++) {
          const dx = symbols[j].x - symbols[i].x;
          const dy = symbols[j].y - symbols[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.06;
            const glowAlpha = (symbols[i].glowing || symbols[j].glowing) ? 0.25 : alpha;
            ctx.strokeStyle = `rgba(0,255,255,${glowAlpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(symbols[i].x, symbols[i].y);
            ctx.lineTo(symbols[j].x, symbols[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw each symbol
      for (const s of symbols) {
        // Update position
        const mx = mouseRef.current.x;
        const my = mouseRef.current.y;
        const dx = s.x - mx;
        const dy = s.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Repel from cursor
        if (dist < 100) {
          const force = (100 - dist) / 100 * 1.2;
          s.vx += (dx / dist) * force;
          s.vy += (dy / dist) * force;
        }

        s.vx *= 0.97;
        s.vy *= 0.97;
        s.x += s.vx + Math.sin(t * 0.5 + s.id) * 0.2;
        s.y += s.vy + Math.cos(t * 0.4 + s.id * 1.3) * 0.2;
        s.angle += s.angularV;

        // Wrap around
        if (s.x < -50) s.x = w + 50;
        if (s.x > w + 50) s.x = -50;
        if (s.y < -50) s.y = h + 50;
        if (s.y > h + 50) s.y = -50;

        const alpha = s.glowing ? 1 : s.alpha + Math.sin(t * 1.5 + s.id * 10) * 0.08;

        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.angle);
        ctx.globalAlpha = alpha;

        if (s.glowing) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = '#00FFFF';
          ctx.fillStyle = '#00FFFF';
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(180,230,255,0.7)';
        }

        ctx.font = `${s.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(s.symbol, 0, 0);
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('click', onClick);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <section
      id="chapter-3"
      className="chapter"
      style={{ minHeight: '110vh', background: '#000208' }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'none' }}
      />
      <div className="section-content" style={{ zIndex: 10, pointerEvents: 'none' }}>
        <span className="chapter-num">Chapter III</span>
        <h2
          className="chapter-title"
          style={{
            color: 'transparent',
            backgroundImage: 'linear-gradient(135deg, #fff 0%, #40A0FF 60%, #00FFFF 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            marginBottom: '1.5rem',
          }}
        >
          Birth of Notes
        </h2>
        <p className="chapter-subtitle" style={{ marginBottom: '2rem' }}>
          Hover to resonate · Click to play
        </p>
        {hoveredNote && (
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '4rem',
            color: 'var(--cyan)',
            textShadow: 'var(--glow-cyan)',
            animation: 'fadeInUp 0.3s ease',
            pointerEvents: 'none',
          }}>
            {hoveredNote}
          </div>
        )}
      </div>
    </section>
  );
}

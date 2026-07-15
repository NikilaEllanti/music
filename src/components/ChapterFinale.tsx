'use client';

import { useEffect, useRef, useState } from 'react';
import { playNote, playChord } from '@/lib/audio';

export default function ChapterFinale() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [started, setStarted] = useState(false);
  const [phase, setPhase] = useState(0); // 0=waiting, 1=assembling, 2=done

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    // Particle target: treble clef shape (sampled points)
    const CLEF_POINTS: Array<{ x: number; y: number }> = [];
    const steps = 300;
    for (let i = 0; i < steps; i++) {
      const t2 = (i / steps) * Math.PI * 2;
      // Approximate treble clef as overlapping spirals
      const r = 0.35 + Math.sin(t2 * 2) * 0.15;
      const x = 0.5 + Math.cos(t2 * 3 + 0.5) * r * 0.3;
      const y = 0.5 + Math.sin(t2 * 2) * r * 0.4 - Math.cos(t2) * 0.1;
      CLEF_POINTS.push({ x, y });
    }

    interface FinaleParticle {
      x: number; y: number;
      tx: number; ty: number;
      vx: number; vy: number;
      size: number;
      hue: number;
      alpha: number;
    }

    let particles: FinaleParticle[] = [];
    let assembling = false;

    const initParticles = (W: number, H: number) => {
      particles = CLEF_POINTS.map((pt, i) => {
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          tx: pt.x * W,
          ty: pt.y * H,
          vx: 0, vy: 0,
          size: 2 + Math.random() * 2,
          hue: 170 + i / CLEF_POINTS.length * 60,
          alpha: 0.7 + Math.random() * 0.3,
        };
      });
    };

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      timeRef.current += 0.012;
      const t = timeRef.current;

      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(0, 0, W, H);

      if (particles.length === 0 && W > 0) {
        initParticles(W, H);
      }

      for (const p of particles) {
        if (assembling) {
          // Spring toward target
          const dx = p.tx - p.x;
          const dy = p.ty - p.y;
          p.vx += dx * 0.04;
          p.vy += dy * 0.04;
          p.vx *= 0.88;
          p.vy *= 0.88;
        } else {
          // Float freely
          p.vx += Math.sin(t * 1.3 + p.tx) * 0.03;
          p.vy += Math.cos(t * 1.1 + p.ty) * 0.03;
          p.vx *= 0.97;
          p.vy *= 0.97;
        }

        p.x += p.vx;
        p.y += p.vy;

        const pulse = 1 + Math.sin(t * 3 + p.hue) * 0.2;
        ctx.fillStyle = `hsla(${p.hue}, 100%, 65%, ${p.alpha})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = `hsla(${p.hue}, 100%, 65%, 0.6)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Draw connecting lines in assembly phase
      if (assembling) {
        for (let i = 0; i < particles.length - 1; i += 3) {
          const p1 = particles[i];
          const p2 = particles[i + 1] || particles[0];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 60) {
            ctx.strokeStyle = `rgba(0,255,255,${(1 - dist / 60) * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    // Listen for assembly trigger
    const handleAssemble = () => {
      assembling = true;
    };
    canvas.addEventListener('assemble', handleAssemble);

    return () => {
      canvas.removeEventListener('assemble', handleAssemble);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handleStart = () => {
    setStarted(true);
    setPhase(1);

    // Play ascending chord progression
    const freqs = [261.63, 329.63, 392.00, 440.00, 523.25, 659.25, 783.99];
    freqs.forEach((f, i) => {
      setTimeout(() => playNote(f, 'sine', 2, 0.08), i * 200);
    });

    // Trigger assembly
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) canvas.dispatchEvent(new Event('assemble'));
    }, 800);

    setTimeout(() => {
      setPhase(2);
      playChord([261.63, 329.63, 392.00, 523.25, 659.25], 'sine');
    }, 3000);
  };

  return (
    <section
      id="finale"
      className="chapter"
      style={{ minHeight: '110vh', background: '#000', flexDirection: 'column' }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      <div className="section-content" style={{ zIndex: 10 }}>
        <span className="chapter-num" style={{ color: 'rgba(0,255,255,0.6)' }}>Finale</span>
        <h2
          className="chapter-title"
          style={{
            color: 'transparent',
            backgroundImage: 'linear-gradient(135deg, #fff 0%, #00FFFF 40%, #00FF88 80%, #0080FF 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            marginBottom: '1.5rem',
            fontSize: 'clamp(3rem, 8vw, 9rem)',
          }}
        >
          The Language<br />of Vibration
        </h2>

        {!started ? (
          <>
            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 200,
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.45)',
              lineHeight: 1.8,
              maxWidth: '440px',
              margin: '0 auto 2.5rem',
              letterSpacing: '0.04em',
            }}>
              Vibration becomes frequency.<br />
              Frequency becomes note.<br />
              Note becomes harmony.<br />
              Harmony becomes emotion.<br />
              Emotion becomes music.
            </p>
            <button
              onClick={handleStart}
              style={{
                padding: '1rem 3rem',
                border: '1px solid rgba(0,255,255,0.5)',
                borderRadius: '100px',
                background: 'rgba(0,255,255,0.05)',
                color: 'var(--cyan)',
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.1rem',
                letterSpacing: '0.15em',
                cursor: 'pointer',
                transition: 'all 0.4s',
                boxShadow: '0 0 0 rgba(0,255,255,0)',
              }}
              onMouseEnter={e => {
                const el = e.target as HTMLElement;
                el.style.boxShadow = '0 0 40px rgba(0,255,255,0.3)';
                el.style.background = 'rgba(0,255,255,0.12)';
              }}
              onMouseLeave={e => {
                const el = e.target as HTMLElement;
                el.style.boxShadow = '0 0 0 rgba(0,255,255,0)';
                el.style.background = 'rgba(0,255,255,0.05)';
              }}
            >
              Begin the Assembly
            </button>
          </>
        ) : phase >= 2 ? (
          <div style={{ animation: 'fadeInUp 1.5s ease forwards' }}>
            <div style={{
              fontFamily: 'serif',
              fontSize: 'clamp(8rem, 20vw, 18rem)',
              lineHeight: 0.9,
              color: 'var(--cyan)',
              textShadow: '0 0 60px rgba(0,255,255,0.6), 0 0 120px rgba(0,255,255,0.2)',
              animation: 'pulseGlow 3s ease infinite',
            }}>
              𝄞
            </div>
            <p style={{
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.65rem',
              letterSpacing: '0.3em',
              color: 'rgba(0,255,255,0.5)',
              textTransform: 'uppercase',
              marginTop: '1.5rem',
            }}>
              Made of vibration · Made of mathematics · Made of emotion
            </p>
          </div>
        ) : (
          <div style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.75rem',
            letterSpacing: '0.2em',
            color: 'rgba(0,255,255,0.5)',
            animation: 'pulseGlow 1s ease infinite',
          }}>
            Assembling...
          </div>
        )}
      </div>
    </section>
  );
}

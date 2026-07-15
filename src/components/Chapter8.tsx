'use client';

import { useEffect, useRef, useState } from 'react';
import { playChord, playNote, NOTE_FREQS } from '@/lib/audio';

type Mood = 'major' | 'minor' | 'dissonant' | 'harmony';

interface MoodConfig {
  label: string;
  desc: string;
  bgColor: string;
  particleColor: string;
  chord: number[];
  textColor: string;
  keyNote: string;
}

const MOODS: Record<Mood, MoodConfig> = {
  major: {
    label: 'Major',
    desc: 'Bright · Joyful · Triumphant',
    bgColor: 'radial-gradient(ellipse at center, #1a1000 0%, #000 70%)',
    particleColor: '#FFD700',
    chord: [261.63, 329.63, 392.00, 523.25],
    textColor: '#FFD700',
    keyNote: 'C Major',
  },
  minor: {
    label: 'Minor',
    desc: 'Melancholic · Introspective · Deep',
    bgColor: 'radial-gradient(ellipse at center, #000818 0%, #000 70%)',
    particleColor: '#4080FF',
    chord: [261.63, 311.13, 392.00, 523.25],
    textColor: '#4080FF',
    keyNote: 'C Minor',
  },
  dissonant: {
    label: 'Dissonant',
    desc: 'Tense · Unresolved · Unsettling',
    bgColor: 'radial-gradient(ellipse at center, #180008 0%, #000 70%)',
    particleColor: '#FF2D55',
    chord: [261.63, 277.18, 369.99, 415.30],
    textColor: '#FF2D55',
    keyNote: 'Tritone',
  },
  harmony: {
    label: 'Harmony',
    desc: 'Resolved · Complete · At peace',
    bgColor: 'radial-gradient(ellipse at center, #0a0a10 0%, #000 70%)',
    particleColor: '#FFFFFF',
    chord: [261.63, 329.63, 392.00, 440.00, 523.25],
    textColor: '#FFFFFF',
    keyNote: 'C Major 7',
  },
};

export default function Chapter8() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [mood, setMood] = useState<Mood>('major');
  const moodRef = useRef<Mood>('major');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    interface EmotionParticle {
      x: number; y: number;
      vx: number; vy: number;
      size: number; alpha: number;
      life: number;
    }

    const particles: EmotionParticle[] = [];

    const spawnParticles = (count: number) => {
      const W = canvas.width;
      const H = canvas.height;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5 - 0.3,
          size: Math.random() * 4 + 1,
          alpha: Math.random() * 0.6 + 0.2,
          life: 1,
        });
      }
    };

    spawnParticles(60);
    const interval = setInterval(() => spawnParticles(3), 300);

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      timeRef.current += 0.012;
      const t = timeRef.current;

      ctx.clearRect(0, 0, W, H);

      const config = MOODS[moodRef.current];
      const particleColor = config.particleColor;

      // Ambient wave
      ctx.strokeStyle = `${particleColor}20`;
      ctx.lineWidth = 1;
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath();
        for (let x = 0; x < W; x += 3) {
          const y = H * (0.4 + layer * 0.15) +
            Math.sin(x * 0.01 + t * (0.5 + layer * 0.3)) * 30;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.005;
        p.life -= 0.004;
        p.alpha = Math.min(p.life, 0.8) * 0.7;

        if (p.life <= 0 || p.y < -20) {
          particles.splice(i, 1);
          continue;
        }

        ctx.fillStyle = particleColor;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = particleColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      clearInterval(interval);
    };
  }, []);

  const selectMood = (m: Mood) => {
    setMood(m);
    moodRef.current = m;
    playChord(MOODS[m].chord, 'sine');
  };

  const config = MOODS[mood];

  return (
    <section
      id="chapter-8"
      className="chapter"
      style={{
        minHeight: '110vh',
        background: config.bgColor,
        transition: 'background 1.5s ease',
        flexDirection: 'column',
        gap: '2rem',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      <div className="section-content" style={{ zIndex: 10 }}>
        <span className="chapter-num">Chapter VIII</span>
        <h2
          className="chapter-title"
          style={{
            color: config.textColor,
            textShadow: `0 0 40px ${config.particleColor}66`,
            marginBottom: '1.5rem',
            transition: 'all 1s ease',
          }}
        >
          Emotion
        </h2>
        <p className="chapter-subtitle" style={{ marginBottom: '2.5rem' }}>
          Keys change the feeling · Click to feel
        </p>

        {/* Active mood display */}
        <div style={{
          marginBottom: '2rem',
          transition: 'all 0.8s ease',
        }}>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            color: config.textColor,
            textShadow: `0 0 30px ${config.particleColor}88`,
            transition: 'all 0.8s',
            letterSpacing: '0.05em',
          }}>
            {config.label}
          </div>
          <div style={{
            fontFamily: 'Space Mono, monospace',
            fontSize: '0.7rem',
            letterSpacing: '0.25em',
            color: `${config.particleColor}88`,
            textTransform: 'uppercase',
            marginTop: '0.4rem',
            transition: 'all 0.8s',
          }}>
            {config.keyNote} — {config.desc}
          </div>
        </div>

        {/* Mood buttons */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
          {(Object.keys(MOODS) as Mood[]).map(m => (
            <button
              key={m}
              onClick={() => selectMood(m)}
              style={{
                padding: '0.7rem 1.8rem',
                border: `1px solid ${mood === m ? MOODS[m].particleColor : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '100px',
                background: mood === m ? `${MOODS[m].particleColor}15` : 'transparent',
                color: mood === m ? MOODS[m].particleColor : 'rgba(255,255,255,0.4)',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.65rem',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.5s',
                boxShadow: mood === m ? `0 0 20px ${MOODS[m].particleColor}33` : 'none',
              }}
            >
              {MOODS[m].label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

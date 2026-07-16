'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ensureUnlocked, playNote, playChord, setMasterVolume } from '@/lib/audio';

// Dynamically imported exhibits (no SSR for canvas/WebGL)
const ExhibitGalaxy       = dynamic(() => import('@/components/ExhibitGalaxy'),       { ssr: false });
const ExhibitForest       = dynamic(() => import('@/components/ExhibitForest'),       { ssr: false });
const ExhibitInk          = dynamic(() => import('@/components/ExhibitInk'),          { ssr: false });
const ExhibitFlower       = dynamic(() => import('@/components/ExhibitFlower'),       { ssr: false });
const ExhibitGargantua    = dynamic(() => import('@/components/ExhibitGargantua'),    { ssr: false });
const ExhibitCymatics     = dynamic(() => import('@/components/ExhibitCymatics'),     { ssr: false });
const ExhibitWaveformDNA  = dynamic(() => import('@/components/ExhibitWaveformDNA'),  { ssr: false });

// Museum exhibit definitions — no emojis, clean geometric symbols
const EXHIBITS = [
  { id: 0,  sym: '✦',  title: 'Stellar Constellation', sub: 'Notes become stars · Chords become constellations', color: '#aaddff', cat: 'Cosmic' },
  { id: 1,  sym: '∿',  title: 'Growing Forest',        sub: 'Sound grows branches · Harmony blooms flowers',    color: '#00ff99', cat: 'Nature' },
  { id: 2,  sym: '◬',  title: 'Smoke & Ink',           sub: 'Every note stains the universe permanently',      color: '#00e5ff', cat: 'Flow' },
  { id: 3,  sym: '✿',  title: 'Blooming Flowers',      sub: 'Pitch shapes petals · Chords create gardens',     color: '#cc77ff', cat: 'Nature' },
  { id: 4,  sym: '◉',  title: 'Gargantua',             sub: 'NASA-accurate black hole · Gravitational rumble', color: '#F5D28A', cat: 'Cosmic' },
  { id: 5,  sym: '⊡',  title: 'Cymatics',              sub: 'Wave interference creates visible patterns',     color: '#00ddcc', cat: 'Physics' },
  { id: 6,  sym: '≈',  title: 'Waveform DNA',          sub: 'The hidden structure inside every sound',        color: '#00ff99', cat: 'Physics' },
];

function ExhibitRenderer({ idx }: { idx: number }) {
  switch (idx) {
    case 0:  return <ExhibitGalaxy />;
    case 1:  return <ExhibitForest />;
    case 2:  return <ExhibitInk />;
    case 3:  return <ExhibitFlower />;
    case 4:  return <ExhibitGargantua />;
    case 5:  return <ExhibitCymatics />;
    case 6:  return <ExhibitWaveformDNA />;
    default: return null;
  }
}

// ─── Particle Wave Canvas (Entry Page Background) ───────────────────────────
function ParticleWaveCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / canvas.width;
      mouseRef.current.y = e.clientY / canvas.height;
    };
    window.addEventListener('mousemove', onMove);

    let t = 0;

    // Wave layer definitions
    const waveLayers = [
      { amp: 0.22, freq: 0.8, speed: 0.4, yOff: 0.25, color: 'rgba(20, 60, 255, 0.55)', width: 1.2 },
      { amp: 0.18, freq: 1.1, speed: 0.55, yOff: 0.35, color: 'rgba(30, 80, 255, 0.45)', width: 0.9 },
      { amp: 0.15, freq: 1.5, speed: 0.7,  yOff: 0.50, color: 'rgba(50, 120, 255, 0.6)',  width: 1.5 },
      { amp: 0.20, freq: 0.6, speed: 0.3,  yOff: 0.60, color: 'rgba(20, 40, 220, 0.5)',   width: 1.0 },
      { amp: 0.12, freq: 2.0, speed: 0.9,  yOff: 0.70, color: 'rgba(60, 140, 255, 0.4)',  width: 0.7 },
      { amp: 0.25, freq: 0.5, speed: 0.25, yOff: 0.75, color: 'rgba(10, 30, 180, 0.5)',   width: 2.0 },
      { amp: 0.10, freq: 2.5, speed: 1.2,  yOff: 0.82, color: 'rgba(80, 160, 255, 0.3)',  width: 0.6 },
      { amp: 0.18, freq: 0.9, speed: 0.5,  yOff: 0.90, color: 'rgba(30, 70, 200, 0.45)',  width: 1.1 },
    ];

    // Particles drifting along waves
    interface WaveParticle {
      x: number; phase: number; layerIdx: number; alpha: number; size: number; speed: number;
    }
    const particles: WaveParticle[] = [];
    for (let i = 0; i < 180; i++) {
      particles.push({
        x: Math.random(),
        phase: Math.random() * Math.PI * 2,
        layerIdx: Math.floor(Math.random() * waveLayers.length),
        alpha: 0.2 + Math.random() * 0.7,
        size: 0.8 + Math.random() * 2.2,
        speed: 0.0003 + Math.random() * 0.0006,
      });
    }

    // Static stars
    const stars: { x: number; y: number; r: number; alpha: number; twinkleSpeed: number }[] = [];
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random(), y: Math.random(),
        r: 0.4 + Math.random() * 1.4,
        alpha: 0.1 + Math.random() * 0.5,
        twinkleSpeed: 0.5 + Math.random() * 2,
      });
    }

    const draw = () => {
      t += 0.006;
      const W = canvas.width, H = canvas.height;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;

      ctx.clearRect(0, 0, W, H);

      // Deep space background
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#02020c');
      bg.addColorStop(0.5, '#030318');
      bg.addColorStop(1, '#020210');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // Twinkling stars
      for (const s of stars) {
        const a = s.alpha * (0.5 + 0.5 * Math.sin(t * s.twinkleSpeed + s.x * 10));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200, 220, 255, ${a})`;
        ctx.fill();
      }

      // Glowing white spheres (like reference image)
      const spheres = [
        { x: 0.12, y: 0.18, r: 28, glow: 60 },
        { x: 0.52, y: 0.28, r: 36, glow: 80 },
      ];
      for (const sp of spheres) {
        const sx = sp.x * W + (mx - 0.5) * 25;
        const sy = sp.y * H + (my - 0.5) * 15;
        const grd = ctx.createRadialGradient(sx, sy, 0, sx, sy, sp.r * 2.5);
        grd.addColorStop(0, 'rgba(240,245,255,0.22)');
        grd.addColorStop(0.4, 'rgba(200,220,255,0.1)');
        grd.addColorStop(1, 'rgba(100,150,255,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(sx, sy, sp.r * 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Core
        const core = ctx.createRadialGradient(sx, sy, 0, sx, sy, sp.r);
        core.addColorStop(0, 'rgba(255,255,255,0.55)');
        core.addColorStop(0.5, 'rgba(220,235,255,0.25)');
        core.addColorStop(1, 'rgba(180,210,255,0)');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(sx, sy, sp.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // ── Wave ribbons ──
      for (const layer of waveLayers) {
        const mouseInfluence = (0.5 - my) * 0.08;
        ctx.beginPath();
        ctx.lineWidth = layer.width;
        ctx.strokeStyle = layer.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = layer.color;

        for (let px = 0; px <= W; px += 3) {
          const nx = px / W;
          const wave1 = Math.sin(nx * Math.PI * 5 * layer.freq + t * layer.speed * 5) * layer.amp;
          const wave2 = Math.sin(nx * Math.PI * 3 * layer.freq + t * layer.speed * 3.2 + 1) * layer.amp * 0.5;
          const mouseWave = Math.sin(nx * Math.PI * 4 + mx * 3) * 0.04;
          const y = (layer.yOff + wave1 + wave2 + mouseWave + mouseInfluence) * H;

          if (px === 0) ctx.moveTo(px, y); else ctx.lineTo(px, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // ── Wave particles drifting along ──
      for (const p of particles) {
        p.x += p.speed;
        if (p.x > 1) p.x -= 1;
        const layer = waveLayers[p.layerIdx];
        const nx = p.x;
        const wave1 = Math.sin(nx * Math.PI * 5 * layer.freq + t * layer.speed * 5) * layer.amp;
        const wave2 = Math.sin(nx * Math.PI * 3 * layer.freq + t * layer.speed * 3.2 + 1) * layer.amp * 0.5;
        const py = (layer.yOff + wave1 + wave2) * H;

        ctx.beginPath();
        ctx.arc(p.x * W, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(160, 200, 255, ${p.alpha * (0.5 + 0.5 * Math.sin(t * 2 + p.phase))})`;
        ctx.fill();
      }

      // Dot grid (reference image dots in upper right)
      const dotRows = 6, dotCols = 8;
      for (let dr = 0; dr < dotRows; dr++) {
        for (let dc = 0; dc < dotCols; dc++) {
          const dx = (0.58 + dc * 0.055) * W;
          const dy = (0.06 + dr * 0.07) * H;
          const da = 0.1 + 0.3 * Math.sin(t * 1.5 + dr * 0.8 + dc * 0.5);
          ctx.beginPath();
          ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100, 160, 255, ${da})`;
          ctx.fill();
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }}
    />
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [activeExhibit, setActiveExhibit] = useState(-1);
  const [soundOn, setSoundOn] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(-1);
  const [transitioning, setTransitioning] = useState(false);

  // Custom cursor refs
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const cursorXRef = useRef(0);
  const cursorYRef = useRef(0);
  const ringXRef = useRef(0);
  const ringYRef = useRef(0);
  const cursorAnimRef = useRef(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Spring cursor
  useEffect(() => {
    if (!mounted) return;
    const onMove = (e: MouseEvent) => {
      cursorXRef.current = e.clientX;
      cursorYRef.current = e.clientY;
    };
    window.addEventListener('mousemove', onMove);

    const animate = () => {
      ringXRef.current += (cursorXRef.current - ringXRef.current) * 0.1;
      ringYRef.current += (cursorYRef.current - ringYRef.current) * 0.1;
      if (dotRef.current) {
        dotRef.current.style.left = cursorXRef.current + 'px';
        dotRef.current.style.top = cursorYRef.current + 'px';
      }
      if (ringRef.current) {
        ringRef.current.style.left = ringXRef.current + 'px';
        ringRef.current.style.top = ringYRef.current + 'px';
      }
      cursorAnimRef.current = requestAnimationFrame(animate);
    };
    animate();
    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(cursorAnimRef.current);
    };
  }, [mounted]);

  const handleEnter = async () => {
    try { await ensureUnlocked(); } catch {}
    setTransitioning(true);
    try { playChord([130.81, 196.00, 261.63, 329.63, 392.00], 'sine', 0.08, 1.5); } catch {}
    setTimeout(() => {
      setEntered(true);
      setTransitioning(false);
    }, 600);
  };

  const openExhibit = (idx: number) => {
    setActiveExhibit(idx);
    try { playNote(261.63 + idx * 20, 'sine', 0.8, 0.08); } catch {}
  };

  const closeExhibit = () => {
    setActiveExhibit(-1);
    try { playNote(220, 'sine', 0.5, 0.06); } catch {}
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setMasterVolume(next ? 1 : 0);
  };

  if (!mounted) return <div style={{ position: 'fixed', inset: 0, background: '#030308' }} />;

  // ─── ENTRY PAGE ───────────────────────────────────────────────────────────
  if (!entered) {
    return (
      <>
        {/* Custom cursor */}
        <div id="cursor-dot" ref={dotRef} />
        <div id="cursor-ring" ref={ringRef} />

        <div style={{
          position: 'fixed', inset: 0, overflow: 'hidden',
          opacity: transitioning ? 0 : 1, transition: 'opacity 0.6s ease',
        }}>
          <ParticleWaveCanvas />

          {/* Content overlay */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'flex-start', justifyContent: 'flex-end',
            padding: '0 4rem 5rem',
            background: 'linear-gradient(to right, rgba(2,2,12,0.7) 0%, rgba(2,2,12,0.2) 60%, transparent 100%)',
          }}>
            {/* Label */}
            <div style={{
              fontFamily: 'Space Mono, monospace', fontSize: '0.58rem', letterSpacing: '0.45em',
              color: 'rgba(100,160,255,0.7)', textTransform: 'uppercase', marginBottom: '1rem',
              animation: 'fadeInUp 1s 0.2s both',
            }}>
              Interactive Sound Exhibition · 7 Exhibits
            </div>

            {/* Title */}
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 300,
              fontSize: 'clamp(3rem, 7vw, 7rem)', lineHeight: 1.05,
              letterSpacing: '-0.01em', marginBottom: '0.5rem',
              color: '#fff', animation: 'fadeInUp 1s 0.35s both',
            }}>
              Museum of<br />
              <span style={{
                background: 'linear-gradient(90deg, #4488ff 0%, #00e5ff 50%, #ffffff 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                Vibration
              </span>
            </h1>

            {/* Descriptor */}
            <p style={{
              fontFamily: 'Space Grotesk, sans-serif', fontWeight: 300,
              fontSize: '0.9rem', color: 'rgba(255,255,255,0.35)', maxWidth: '380px',
              lineHeight: 1.75, marginBottom: '2.5rem',
              animation: 'fadeInUp 1s 0.5s both',
            }}>
              Explore the physics of sound through black holes, galaxies, forests, 
              ink, flowers, sand patterns, and the geometry of harmony.
            </p>

            {/* CTA */}
            <button
              onClick={handleEnter}
              style={{
                position: 'relative', zIndex: 10,
                padding: '1rem 3rem',
                border: '1px solid rgba(68,136,255,0.5)',
                background: 'rgba(68,136,255,0.06)',
                color: '#8bbfff',
                fontFamily: 'Space Mono, monospace', fontSize: '0.7rem',
                letterSpacing: '0.3em', textTransform: 'uppercase',
                borderRadius: '3px', cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 0 30px rgba(68,136,255,0.08)',
                animation: 'fadeInUp 1s 0.65s both',
              }}
              onMouseEnter={e => {
                (e.target as HTMLButtonElement).style.background = 'rgba(68,136,255,0.14)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 0 50px rgba(68,136,255,0.2), 0 0 100px rgba(68,136,255,0.05)';
                (e.target as HTMLButtonElement).style.color = '#aaccff';
              }}
              onMouseLeave={e => {
                (e.target as HTMLButtonElement).style.background = 'rgba(68,136,255,0.06)';
                (e.target as HTMLButtonElement).style.boxShadow = '0 0 30px rgba(68,136,255,0.08)';
                (e.target as HTMLButtonElement).style.color = '#8bbfff';
              }}
            >
              Enter Museum
            </button>

            {/* Hint */}
            <div style={{
              fontFamily: 'Space Mono, monospace', fontSize: '0.55rem',
              color: 'rgba(255,255,255,0.18)', marginTop: '1.5rem', letterSpacing: '0.2em',
              animation: 'fadeInUp 1s 0.8s both',
            }}>
              Headphones recommended · Best experienced in the dark
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── FULLSCREEN EXHIBIT ───────────────────────────────────────────────────
  if (activeExhibit >= 0) {
    const ex = EXHIBITS[activeExhibit];
    return (
      <>
        <div id="cursor-dot" ref={dotRef} />
        <div id="cursor-ring" ref={ringRef} />
        <div className="exhibit-reveal" style={{
          position: 'fixed', inset: 0, background: '#030308', zIndex: 100,
        }}>
          {/* Exhibit fills screen */}
          <div style={{ position: 'absolute', inset: 0 }}>
            <ExhibitRenderer idx={activeExhibit} />
          </div>

          {/* Top gradient bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
            padding: '1.2rem 2rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'linear-gradient(to bottom, rgba(3,3,8,0.85) 0%, transparent 100%)',
            backdropFilter: 'blur(1px)',
          }}>
            <button
              onClick={closeExhibit}
              style={{
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '4px', padding: '0.5rem 1.4rem', cursor: 'pointer',
                color: 'rgba(255,255,255,0.55)', fontFamily: 'Space Mono, monospace',
                fontSize: '0.65rem', letterSpacing: '0.1em', transition: 'all 0.3s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
            >
              ← Museum
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', fontWeight: 300,
                color: ex.color, letterSpacing: '0.06em',
              }}>
                {ex.sym}  {ex.title}
              </div>
              <div style={{
                fontFamily: 'Space Mono, monospace', fontSize: '0.56rem',
                color: 'rgba(255,255,255,0.28)', marginTop: '0.25rem', letterSpacing: '0.1em',
              }}>
                {ex.sub}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
              <button
                onClick={() => openExhibit((activeExhibit - 1 + 7) % 7)}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '4px', padding: '0.4rem 0.9rem', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)', fontFamily: 'Space Mono, monospace', fontSize: '0.8rem',
                }}
              >‹</button>
              <span style={{
                color: 'rgba(255,255,255,0.25)', fontFamily: 'Space Mono, monospace', fontSize: '0.6rem',
                minWidth: '32px', textAlign: 'center',
              }}>
                {activeExhibit + 1}/7
              </span>
              <button
                onClick={() => openExhibit((activeExhibit + 1) % 7)}
                style={{
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '4px', padding: '0.4rem 0.9rem', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)', fontFamily: 'Space Mono, monospace', fontSize: '0.8rem',
                }}
              >›</button>

              <button
                onClick={toggleSound}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${soundOn ? 'rgba(245,210,138,0.25)' : 'rgba(255,50,80,0.25)'}`,
                  borderRadius: '4px', padding: '0.4rem 0.8rem', cursor: 'pointer',
                  color: soundOn ? '#F5D28A' : '#ff3050', fontSize: '0.9rem',
                  fontFamily: 'Space Mono, monospace',
                }}
              >
                {soundOn ? '♪' : '♩'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ─── GALLERY HUB ─────────────────────────────────────────────────────────
  return (
    <>
      <div id="cursor-dot" ref={dotRef} />
      <div id="cursor-ring" ref={ringRef} />

      <div style={{ position: 'fixed', inset: 0, background: '#030308', overflowY: 'auto', overflowX: 'hidden' }}>

        {/* Ambient particle wave background */}
        <div style={{ position: 'fixed', inset: 0, opacity: 0.35, pointerEvents: 'none' }}>
          <ParticleWaveCanvas />
        </div>

        {/* Fixed top header */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          padding: '1.5rem 3rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to bottom, rgba(3,3,8,0.95) 0%, transparent 100%)',
        }}>
          <div style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 300,
            color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em',
          }}>
            Museum of Vibration
          </div>
          <div style={{
            fontFamily: 'Space Mono, monospace', fontSize: '0.55rem',
            color: 'rgba(255,255,255,0.2)', letterSpacing: '0.3em', textTransform: 'uppercase',
          }}>
            7 Exhibits
          </div>
          <button
            onClick={toggleSound}
            style={{
              background: 'transparent',
              border: `1px solid ${soundOn ? 'rgba(245,210,138,0.2)' : 'rgba(255,50,80,0.2)'}`,
              borderRadius: '4px', padding: '0.35rem 0.8rem', cursor: 'pointer',
              color: soundOn ? 'rgba(245,210,138,0.6)' : 'rgba(255,50,80,0.6)',
              fontFamily: 'Space Mono, monospace', fontSize: '0.9rem',
            }}
          >
            {soundOn ? '♪' : '♩'}
          </button>
        </div>

        {/* Gallery scroll content */}
        <div style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '1400px', margin: '0 auto', padding: '120px 3rem 80px' }}>

          {/* Hero section */}
          <div style={{ textAlign: 'center', marginBottom: '6rem', paddingTop: '2rem' }}>
            <div style={{
              fontFamily: 'Space Mono, monospace', fontSize: '0.55rem',
              color: 'rgba(68,136,255,0.6)', letterSpacing: '0.5em', textTransform: 'uppercase',
              marginBottom: '1.5rem',
            }}>
              Sound · Physics · Geometry
            </div>
            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif', fontWeight: 200,
              fontSize: 'clamp(2.5rem, 5vw, 4.5rem)', color: 'rgba(255,255,255,0.85)',
              letterSpacing: '0.04em', lineHeight: 1.1, marginBottom: '1rem',
            }}>
              Choose Your Exhibit
            </h2>
            <p style={{
              fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.82rem',
              color: 'rgba(255,255,255,0.25)', maxWidth: '500px', margin: '0 auto',
              lineHeight: 1.8, letterSpacing: '0.02em',
            }}>
              Each exhibit is an interactive exploration of music as a physical force — 
              shaping light, matter, geometry, and color.
            </p>
          </div>

          {/* Exhibit grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}>
            {EXHIBITS.map((ex, i) => (
              <div
                key={ex.id}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(-1)}
                onClick={() => openExhibit(i)}
                style={{
                  position: 'relative',
                  background: hoveredCard === i
                    ? 'rgba(255,255,255,0.04)'
                    : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${hoveredCard === i ? ex.color + '30' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: '12px',
                  padding: '2rem 1.8rem',
                  cursor: 'pointer',
                  transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform: hoveredCard === i ? 'translateY(-4px)' : 'none',
                  boxShadow: hoveredCard === i
                    ? `0 20px 60px rgba(0,0,0,0.5), 0 0 40px ${ex.color}12`
                    : '0 4px 20px rgba(0,0,0,0.3)',
                  backdropFilter: 'blur(8px)',
                  overflow: 'hidden',
                }}
              >
                {/* Subtle top-left color glow */}
                {hoveredCard === i && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
                    background: `linear-gradient(90deg, transparent, ${ex.color}66, transparent)`,
                  }} />
                )}

                {/* Number + Category */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '1.5rem',
                }}>
                  <div style={{
                    fontFamily: 'Space Mono, monospace', fontSize: '0.55rem',
                    color: 'rgba(255,255,255,0.2)', letterSpacing: '0.2em',
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div style={{
                    fontFamily: 'Space Mono, monospace', fontSize: '0.5rem',
                    color: ex.color + 'aa', letterSpacing: '0.15em', textTransform: 'uppercase',
                    opacity: hoveredCard === i ? 1 : 0.5,
                    transition: 'opacity 0.3s',
                  }}>
                    {ex.cat}
                  </div>
                </div>

                {/* Symbol */}
                <div style={{
                  fontSize: '1.8rem', marginBottom: '1rem',
                  color: hoveredCard === i ? ex.color : 'rgba(255,255,255,0.3)',
                  transition: 'color 0.35s, text-shadow 0.35s',
                  textShadow: hoveredCard === i ? `0 0 20px ${ex.color}80` : 'none',
                  lineHeight: 1,
                }}>
                  {ex.sym}
                </div>

                {/* Title */}
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '1.25rem', fontWeight: 400,
                  color: hoveredCard === i ? '#fff' : 'rgba(255,255,255,0.75)',
                  marginBottom: '0.5rem',
                  transition: 'color 0.3s', lineHeight: 1.2,
                }}>
                  {ex.title}
                </div>

                {/* Subtitle */}
                <div style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)',
                  lineHeight: 1.5, letterSpacing: '0.02em',
                }}>
                  {ex.sub}
                </div>

                {/* Enter arrow */}
                <div style={{
                  position: 'absolute', bottom: '1.5rem', right: '1.5rem',
                  fontFamily: 'Space Mono, monospace', fontSize: '0.6rem',
                  color: ex.color,
                  opacity: hoveredCard === i ? 0.8 : 0,
                  transform: hoveredCard === i ? 'translateX(0)' : 'translateX(-8px)',
                  transition: 'opacity 0.3s, transform 0.3s',
                }}>
                  Enter →
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            textAlign: 'center', marginTop: '5rem', paddingBottom: '2rem',
            fontFamily: 'Space Mono, monospace', fontSize: '0.55rem',
            color: 'rgba(255,255,255,0.12)', letterSpacing: '0.3em', textTransform: 'uppercase',
          }}>
            Vibration · Harmony · Light · Form
          </div>
        </div>
      </div>
    </>
  );
}

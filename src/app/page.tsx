'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ensureUnlocked, playNote, playChord, setMasterVolume } from '@/lib/audio';

// All 15 exhibits loaded dynamically (no SSR for canvas/WebGL)
const ExhibitGalaxy = dynamic(() => import('@/components/ExhibitGalaxy'), { ssr: false });
const ExhibitForest = dynamic(() => import('@/components/ExhibitForest'), { ssr: false });
const ExhibitInk = dynamic(() => import('@/components/ExhibitInk'), { ssr: false });
const ExhibitFlower = dynamic(() => import('@/components/ExhibitFlower'), { ssr: false });
const ExhibitChladni = dynamic(() => import('@/components/ExhibitChladni'), { ssr: false });
const ExhibitGargantua = dynamic(() => import('@/components/ExhibitGargantua'), { ssr: false });
const ExhibitCircle = dynamic(() => import('@/components/ExhibitCircle'), { ssr: false });
const ChapterStandingWaves = dynamic(() => import('@/components/ChapterStandingWaves'), { ssr: false });
const ChapterFibonacci = dynamic(() => import('@/components/ChapterFibonacci'), { ssr: false });
const ChapterFourier = dynamic(() => import('@/components/ChapterFourier'), { ssr: false });
const ChapterNorthernLights = dynamic(() => import('@/components/ChapterNorthernLights'), { ssr: false });
const ExhibitCymatics = dynamic(() => import('@/components/ExhibitCymatics'), { ssr: false });
const ExhibitLissajous = dynamic(() => import('@/components/ExhibitLissajous'), { ssr: false });
const ExhibitColorHarmony = dynamic(() => import('@/components/ExhibitColorHarmony'), { ssr: false });
const ExhibitWaveformDNA = dynamic(() => import('@/components/ExhibitWaveformDNA'), { ssr: false });

// Exhibit definitions
const EXHIBITS = [
  { id: 0,  icon: '✦', title: 'Stellar Constellation', sub: 'Notes become stars, chords become constellations', color: '#aaddff' },
  { id: 1,  icon: '🌿', title: 'Growing Forest',       sub: 'Sound grows branches, harmony blooms flowers',   color: '#00ff88' },
  { id: 2,  icon: '🌊', title: 'Smoke & Ink',           sub: 'Every note stains the universe permanently',     color: '#00dcff' },
  { id: 3,  icon: '🌸', title: 'Blooming Flowers',      sub: 'Pitch shapes petals, chords create gardens',     color: '#cc88ff' },
  { id: 4,  icon: '◈',  title: 'Chladni Patterns',      sub: 'Vibration creates geometric sand figures',        color: '#e8e8e0' },
  { id: 5,  icon: '⚫', title: 'Gargantua',             sub: 'NASA-fidelity black hole with gravitational sound', color: '#F5D28A' },
  { id: 6,  icon: '◎',  title: 'Circle of Fifths',      sub: 'The fundamental map of musical harmony',         color: '#ccbbff' },
  { id: 7,  icon: '〰', title: 'Standing Waves',        sub: 'Pluck the string, split into harmonics',         color: '#00ff66' },
  { id: 8,  icon: '🐚', title: 'Fibonacci Spiral',      sub: 'The golden ratio hidden in frequency',           color: '#F5D28A' },
  { id: 9,  icon: '⊙',  title: 'Fourier Epicycles',     sub: 'Rotating vectors synthesize any wave',           color: '#00FFFF' },
  { id: 10, icon: '🌌', title: 'Northern Lights',       sub: 'Excited photon emission from atomic cascades',   color: '#44ff88' },
  { id: 11, icon: '💧', title: 'Cymatics',              sub: 'Wave interference creates visible patterns',     color: '#00ddcc' },
  { id: 12, icon: '∞',  title: 'Lissajous Figures',     sub: 'Harmonic pendulums draw infinite geometry',      color: '#cc99ff' },
  { id: 13, icon: '🎨', title: 'Color Harmony',         sub: 'Chords mapped to synesthetic color palettes',    color: '#ffaaaa' },
  { id: 14, icon: '📊', title: 'Waveform DNA',          sub: 'See the hidden structure inside every sound',    color: '#00ff88' },
];

// Render exhibit component by index
function ExhibitRenderer({ idx }: { idx: number }) {
  switch (idx) {
    case 0: return <ExhibitGalaxy />;
    case 1: return <ExhibitForest />;
    case 2: return <ExhibitInk />;
    case 3: return <ExhibitFlower />;
    case 4: return <ExhibitChladni />;
    case 5: return <ExhibitGargantua />;
    case 6: return <ExhibitCircle />;
    case 7: return <ChapterStandingWaves />;
    case 8: return <ChapterFibonacci />;
    case 9: return <ChapterFourier />;
    case 10: return <ChapterNorthernLights />;
    case 11: return <ExhibitCymatics />;
    case 12: return <ExhibitLissajous />;
    case 13: return <ExhibitColorHarmony />;
    case 14: return <ExhibitWaveformDNA />;
    default: return null;
  }
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [entered, setEntered] = useState(false);
  const [activeExhibit, setActiveExhibit] = useState(-1); // -1 = hub view
  const [soundOn, setSoundOn] = useState(true);
  const [carouselAngle, setCarouselAngle] = useState(0);
  const [hoveredCard, setHoveredCard] = useState(-1);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Drag-to-rotate state (all in refs to avoid re-render storms)
  const isDraggingRef = useRef(false);
  const lastMouseXRef = useRef(0);
  const carouselAngleRef = useRef(0);
  const velocityRef = useRef(0);
  const animRef = useRef(0);

  // Sync ref with state
  useEffect(() => {
    carouselAngleRef.current = carouselAngle;
  }, [carouselAngle]);

  // Physics loop for smooth carousel spin
  useEffect(() => {
    if (!entered || activeExhibit >= 0) return;
    const tick = () => {
      if (!isDraggingRef.current) {
        // Inertia decay
        velocityRef.current *= 0.96;
        // Slow auto-rotation
        velocityRef.current += 0.015;
        carouselAngleRef.current += velocityRef.current;
        setCarouselAngle(carouselAngleRef.current);
      }
      animRef.current = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(animRef.current);
  }, [entered, activeExhibit]);

  // Mouse/touch drag handlers
  useEffect(() => {
    if (!entered || activeExhibit >= 0) return;

    const onDown = (e: MouseEvent) => {
      isDraggingRef.current = true;
      lastMouseXRef.current = e.clientX;
      velocityRef.current = 0;
    };
    const onMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseXRef.current;
      lastMouseXRef.current = e.clientX;
      carouselAngleRef.current += dx * 0.3;
      velocityRef.current = dx * 0.3;
      setCarouselAngle(carouselAngleRef.current);
    };
    const onUp = () => { isDraggingRef.current = false; };

    window.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [entered, activeExhibit]);

  const handleEnter = async () => {
    try {
      await ensureUnlocked();
    } catch (e) {
      console.warn("Audio unlock failed, entering anyway:", e);
    }
    setEntered(true);
    try {
      playChord([130.81, 196.00, 261.63, 329.63, 392.00], 'sine', 0.1);
    } catch (e) {}
  };

  const openExhibit = (idx: number) => {
    setActiveExhibit(idx);
    playNote(261.63 + idx * 30, 'sine', 0.8, 0.1);
  };

  const closeExhibit = () => {
    setActiveExhibit(-1);
    playNote(392, 'sine', 0.5, 0.08);
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setMasterVolume(next ? 1 : 0);
  };

  if (!mounted) {
    return <div style={{ position: 'fixed', inset: 0, background: '#030308' }} />;
  }

  // ═══════════ PRELOADER ═══════════
  if (!entered) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#030308',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Cormorant Garamond, serif',
      }}>
        {/* Ambient particles */}
        <div style={{
          position: 'absolute', width: '100%', height: '100%', overflow: 'hidden', pointerEvents: 'none',
        }}>
          {Array.from({ length: 40 }).map((_, i) => (
            <div key={i} style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              borderRadius: '50%',
              background: `hsla(${200 + Math.random() * 60}, 80%, 75%, ${0.2 + Math.random() * 0.5})`,
              animation: `float ${5 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 5}s`,
            }} />
          ))}
        </div>

        <div style={{
          position: 'absolute', width: '500px', height: '500px',
          background: 'radial-gradient(circle, rgba(245,210,138,0.06) 0%, transparent 70%)',
          animation: 'pulseGlow 6s ease infinite',
          pointerEvents: 'none',
        }} />

        <span style={{
          fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.5em',
          color: '#F5D28A', textTransform: 'uppercase', marginBottom: '1.5rem', opacity: 0.8,
          textShadow: '0 0 20px rgba(245,210,138,0.4)',
          position: 'relative', zIndex: 5,
        }}>
          15 Interactive Exhibits
        </span>

        <h1 style={{
          fontSize: 'clamp(2.8rem, 6vw, 6rem)', fontWeight: 200, letterSpacing: '0.04em',
          background: 'linear-gradient(135deg, #fff 0%, #F5D28A 40%, #00dcff 70%, #cc88ff 100%)',
          backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent',
          textAlign: 'center', lineHeight: 1.15, marginBottom: '2.5rem',
          position: 'relative', zIndex: 5,
        }}>
          Museum of<br />Vibration
        </h1>

        <p style={{
          fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.82rem', fontWeight: 300,
          color: 'rgba(255,255,255,0.4)', maxWidth: '420px', textAlign: 'center',
          lineHeight: 1.7, marginBottom: '3rem',
          position: 'relative', zIndex: 5,
        }}>
          Explore the physics of music through black holes, galaxies, forests,
          ink, flowers, sand patterns, and the geometry of harmony.
        </p>

        <button onClick={handleEnter} style={{
          position: 'relative', zIndex: 10,
          padding: '1.3rem 4rem', border: '1px solid rgba(245,210,138,0.35)',
          borderRadius: '100px', background: 'rgba(245,210,138,0.03)', color: '#F5D28A',
          fontFamily: 'Space Mono, monospace', fontSize: '0.75rem', letterSpacing: '0.25em',
          textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.4s ease',
          boxShadow: '0 0 30px rgba(245,210,138,0.08)',
        }}>
          Enter Museum
        </button>

        <span style={{
          fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)',
          marginTop: '2rem', letterSpacing: '0.1em',
        }}>
          Drag to explore 360° · Click exhibits · Headphones recommended
        </span>
      </div>
    );
  }

  // ═══════════ FULLSCREEN EXHIBIT ═══════════
  if (activeExhibit >= 0) {
    const ex = EXHIBITS[activeExhibit];
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#030308', zIndex: 100 }}>
        {/* Exhibit canvas fills entire screen */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <ExhibitRenderer idx={activeExhibit} />
        </div>

        {/* Top bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
          padding: '1.2rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(to bottom, rgba(3,3,8,0.8) 0%, transparent 100%)',
        }}>
          <button onClick={closeExhibit} style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: '8px', padding: '0.5rem 1.2rem', cursor: 'pointer',
            color: 'rgba(255,255,255,0.7)', fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.75rem',
            transition: 'all 0.3s',
          }}>
            ← Back to Museum
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 300,
              color: ex.color, letterSpacing: '0.05em',
            }}>
              {ex.icon} {ex.title}
            </div>
            <div style={{
              fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.65rem',
              color: 'rgba(255,255,255,0.35)', marginTop: '0.2rem',
            }}>
              {ex.sub}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            {/* Prev / Next */}
            <button onClick={() => openExhibit((activeExhibit - 1 + 15) % 15)} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '6px', padding: '0.4rem 0.8rem', cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)', fontFamily: 'Space Mono, monospace', fontSize: '0.7rem',
            }}>‹</button>
            <span style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Space Mono, monospace', fontSize: '0.65rem' }}>
              {activeExhibit + 1}/15
            </span>
            <button onClick={() => openExhibit((activeExhibit + 1) % 15)} style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '6px', padding: '0.4rem 0.8rem', cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)', fontFamily: 'Space Mono, monospace', fontSize: '0.7rem',
            }}>›</button>

            <button onClick={toggleSound} style={{
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${soundOn ? 'rgba(245,210,138,0.3)' : 'rgba(255,0,85,0.3)'}`,
              borderRadius: '6px', padding: '0.4rem 0.8rem', cursor: 'pointer',
              color: soundOn ? '#F5D28A' : '#FF2D55', fontSize: '1rem',
            }}>
              {soundOn ? '🔊' : '🔇'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════ 3D CAROUSEL HUB ═══════════
  const cardAngle = 360 / EXHIBITS.length;
  const radius = Math.max(550, typeof window !== 'undefined' ? window.innerWidth * 0.42 : 600);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#030308', overflow: 'hidden',
      cursor: isDraggingRef.current ? 'grabbing' : 'grab',
    }}>
      {/* Starfield background */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 120 }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${0.5 + Math.random() * 2}px`,
            height: `${0.5 + Math.random() * 2}px`,
            borderRadius: '50%',
            background: `rgba(${180 + Math.random() * 75}, ${200 + Math.random() * 55}, 255, ${0.15 + Math.random() * 0.6})`,
            animation: `twinkle ${2 + Math.random() * 5}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }} />
        ))}
      </div>

      {/* Central nebula glow */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        width: '700px', height: '700px', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(100,60,200,0.06) 0%, rgba(0,180,255,0.03) 40%, transparent 70%)',
        animation: 'pulseGlow 8s ease infinite',
      }} />

      {/* Header */}
      <div style={{
        position: 'absolute', top: '2.5rem', left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', zIndex: 10, pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: 'Space Mono, monospace', fontSize: '0.55rem', letterSpacing: '0.5em',
          color: '#F5D28A', textTransform: 'uppercase', marginBottom: '0.5rem',
          textShadow: '0 0 15px rgba(245,210,138,0.4)',
        }}>
          𝄞 Museum of Vibration
        </div>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
          fontWeight: 200, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.06em',
        }}>
          15 Exhibits — Drag to Explore
        </h1>
      </div>

      {/* 3D Perspective Carousel */}
      <div style={{
        position: 'absolute', left: '50%', top: '52%',
        transformStyle: 'preserve-3d',
        perspective: '1200px',
        pointerEvents: 'none',
      }}>
        <div style={{
          transformStyle: 'preserve-3d',
          transform: `translateX(-50%) rotateY(${carouselAngle}deg)`,
          transition: isDraggingRef.current ? 'none' : undefined,
        }}>
          {EXHIBITS.map((ex, i) => {
            const angle = i * cardAngle;
            const isHovered = hoveredCard === i;
            return (
              <div
                key={ex.id}
                onMouseEnter={() => setHoveredCard(i)}
                onMouseLeave={() => setHoveredCard(-1)}
                onClick={(e) => { e.stopPropagation(); openExhibit(i); }}
                style={{
                  position: 'absolute',
                  width: '200px',
                  height: '260px',
                  transformStyle: 'preserve-3d',
                  transform: `rotateY(${angle}deg) translateZ(${radius}px) translateX(-100px) translateY(-130px)`,
                  background: isHovered
                    ? `linear-gradient(135deg, rgba(20,20,35,0.95) 0%, rgba(10,10,20,0.9) 100%)`
                    : 'rgba(10, 10, 20, 0.75)',
                  border: `1px solid ${isHovered ? ex.color + '66' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: '16px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isHovered
                    ? `0 0 40px ${ex.color}22, 0 20px 60px rgba(0,0,0,0.6)`
                    : '0 10px 40px rgba(0,0,0,0.4)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                }}
              >
                <div style={{
                  fontSize: '2rem', marginBottom: '0.8rem',
                  filter: isHovered ? `drop-shadow(0 0 10px ${ex.color})` : 'none',
                  transition: 'filter 0.3s',
                }}>
                  {ex.icon}
                </div>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '1rem', fontWeight: 400,
                  color: isHovered ? ex.color : 'rgba(255,255,255,0.85)',
                  marginBottom: '0.5rem', transition: 'color 0.3s',
                  lineHeight: 1.3,
                }}>
                  {ex.title}
                </div>
                <div style={{
                  fontFamily: 'Space Grotesk, sans-serif',
                  fontSize: '0.62rem', color: 'rgba(255,255,255,0.35)',
                  lineHeight: 1.5,
                }}>
                  {ex.sub}
                </div>
                {/* Bottom index */}
                <div style={{
                  position: 'absolute', bottom: '0.8rem',
                  fontFamily: 'Space Mono, monospace', fontSize: '0.55rem',
                  color: 'rgba(255,255,255,0.15)', letterSpacing: '0.15em',
                }}>
                  {String(i + 1).padStart(2, '0')}/15
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom hint */}
      <div style={{
        position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <span style={{
          fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.4em',
          color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase',
        }}>
          ← Drag to Rotate · Click to Enter →
        </span>
      </div>

      {/* Sound toggle */}
      <button onClick={toggleSound} style={{
        position: 'absolute', bottom: '2rem', right: '2rem',
        background: 'rgba(255,255,255,0.05)', border: `1px solid ${soundOn ? 'rgba(245,210,138,0.3)' : 'rgba(255,0,85,0.3)'}`,
        borderRadius: '50%', width: '44px', height: '44px', cursor: 'pointer',
        color: soundOn ? '#F5D28A' : '#FF2D55', fontSize: '1.1rem',
        boxShadow: soundOn ? '0 0 15px rgba(245,210,138,0.15)' : 'none',
        zIndex: 10,
      }}>
        {soundOn ? '🔊' : '🔇'}
      </button>
    </div>
  );
}

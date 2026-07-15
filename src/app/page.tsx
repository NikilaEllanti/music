'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useAudioUnlock, ensureUnlocked, playChord, setMasterVolume } from '@/lib/audio';

// Dynamic WebGL 3D Panorama Background
const BackgroundWebGL = dynamic(() => import('@/components/BackgroundWebGL'), { ssr: false });

// Interactive overlay HUDs
const CustomCursor = dynamic(() => import('@/components/CustomCursor'), { ssr: false });
const Chapter1 = dynamic(() => import('@/components/Chapter1'), { ssr: false });
const ChapterFibonacci = dynamic(() => import('@/components/ChapterFibonacci'), { ssr: false });
const ChapterStandingWaves = dynamic(() => import('@/components/ChapterStandingWaves'), { ssr: false });
const ChapterFourier = dynamic(() => import('@/components/ChapterFourier'), { ssr: false });
const ChapterBlackHole = dynamic(() => import('@/components/ChapterBlackHole'), { ssr: false });
const ChapterNorthernLights = dynamic(() => import('@/components/ChapterNorthernLights'), { ssr: false });

// Ex-chapters (re-wired to fit the themes)
const Chapter2 = dynamic(() => import('@/components/Chapter2'), { ssr: false });
const Chapter3 = dynamic(() => import('@/components/Chapter3'), { ssr: false });
const Chapter5 = dynamic(() => import('@/components/Chapter5'), { ssr: false });
const Chapter7 = dynamic(() => import('@/components/Chapter7'), { ssr: false });
const Chapter8 = dynamic(() => import('@/components/Chapter8'), { ssr: false });
const ChapterFinale = dynamic(() => import('@/components/ChapterFinale'), { ssr: false });

// 3 Thematic Worlds (from reference images)
const WORLDS = [
  {
    id: 1,
    label: 'Realm of Waves',
    subtitle: 'Reference Image 2 Theme',
    color: '#0080FF',
    glowColor: 'var(--glow-teal)',
    description: 'Resonance, frequencies, and note coordinates mapped on infinite particle waves.',
    chapters: [
      { id: 'resonance', label: 'Prime Resonance' },
      { id: 'frequency', label: 'Hz Frequencies' },
      { id: 'notes', label: 'Birth of Notes' },
      { id: 'fibonacci', label: 'Fibonacci Spiral' },
    ]
  },
  {
    id: 2,
    label: 'Realm of Gravity',
    subtitle: 'Reference Image 1 Theme',
    color: '#F5D28A',
    glowColor: 'var(--glow-gold)',
    description: 'Relativistic standing waves, Circle of Fifths, and the Gargantua singularity.',
    chapters: [
      { id: 'harmonics', label: 'Standing Waves' },
      { id: 'fifths', label: 'Circle of Fifths' },
      { id: 'gargantua', label: 'Gargantua Plunge' },
    ]
  },
  {
    id: 3,
    label: 'Realm of Light',
    subtitle: 'Reference Image 3 Theme',
    color: '#B026FF',
    glowColor: '0 0 20px rgba(176,38,255,0.4)',
    description: 'Excited photon ribbons, Fourier decomposition, wave geometry, and instruments.',
    chapters: [
      { id: 'fourier', label: 'Fourier Decomposition' },
      { id: 'geometry', label: 'Instruments & Timbre' },
      { id: 'emotion', label: 'Key Emotions' },
      { id: 'aurora', label: 'Excited Spectra' },
      { id: 'finale', label: ' Treble Clef Finale' },
    ]
  }
];

export default function Home() {
  const [activeWorld, setActiveWorld] = useState(0); // 0 = Hub, 1-3 = Focused Worlds
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [hasEntered, setHasEntered] = useState(false);
  const [isPreloading, setIsPreloading] = useState(true);

  // Panorama yaw/pitch state (only updated on click or slow intervals to prevent infinite rendering)
  const [yaw, setYaw] = useState(0);
  const [pitch, setPitch] = useState(-0.16);

  const yawBaseRef = useRef(0);
  const mouseOffsetRef = useRef({ x: 0, y: 0 });

  useAudioUnlock();

  // Mouse move 360-degree panorama steering
  useEffect(() => {
    if (!hasEntered) return;
    const onMove = (e: MouseEvent) => {
      const xOffset = ((e.clientX / window.innerWidth) - 0.5) * Math.PI * 1.8;
      const yOffset = -0.16 + ((e.clientY / window.innerHeight) - 0.5) * Math.PI * 0.4;
      mouseOffsetRef.current = { x: xOffset, y: yOffset };
    };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, [hasEntered]);

  // Slowly orbit base yaw over time
  useEffect(() => {
    if (!hasEntered) return;
    const timer = setInterval(() => {
      yawBaseRef.current += 0.005;
      // Do not trigger React state updates if focused in a world, only update at the hub
      setYaw(yawBaseRef.current + mouseOffsetRef.current.x);
      setPitch(mouseOffsetRef.current.y);
    }, 32);
    return () => clearInterval(timer);
  }, [hasEntered]);

  const handleEnterExperience = async () => {
    await ensureUnlocked();
    setHasEntered(true);
    setIsPreloading(false);
    playChord([130.81, 196.00, 261.63, 329.63, 392.00, 493.88], 'sine', 0.12);
  };

  const toggleSound = () => {
    const nextState = !soundOn;
    setSoundOn(nextState);
    setMasterVolume(nextState ? 1 : 0);
  };

  const enterWorld = (id: number) => {
    setActiveWorld(id);
    setActiveChapterIdx(0);
    playChord([261.63, 329.63, 392.00, 523.25], 'sine', 0.08);
  };

  const exitWorld = () => {
    setActiveWorld(0);
    playChord([523.25, 392.00, 329.63, 261.63], 'sine', 0.06);
  };

  const currentWorldData = WORLDS.find(w => w.id === activeWorld);
  const activeChapter = currentWorldData?.chapters[activeChapterIdx];

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', backgroundColor: '#050507' }}>
      {isPreloading && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#050507',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: '450px',
              height: '450px',
              background: 'radial-gradient(circle, rgba(245, 210, 138, 0.08) 0%, rgba(0,0,0,0) 70%)',
              animation: 'pulseGlow 5s ease infinite',
            }}
          />
          <div style={{ zIndex: 10, textAlign: 'center', padding: '2rem' }}>
            <span
              style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.65rem',
                letterSpacing: '0.45em',
                color: 'var(--gold)',
                textShadow: 'var(--glow-gold)',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '1rem',
              }}
            >
              Interactive Celestial Gallery
            </span>
            <h1
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(2.5rem, 5vw, 5.5rem)',
                fontWeight: 300,
                letterSpacing: '0.05em',
                color: 'transparent',
                backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #F5D28A 50%, #0E1F22 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                marginBottom: '2.5rem',
                lineHeight: 1.2,
              }}
            >
              The 360° Museum<br />of Vibration
            </h1>

            <button
              onClick={handleEnterExperience}
              style={{
                padding: '1.2rem 3.5rem',
                border: '1px solid rgba(245, 210, 138, 0.4)',
                borderRadius: '100px',
                background: 'rgba(245, 210, 138, 0.04)',
                color: 'var(--gold)',
                fontFamily: 'Space Mono, monospace',
                fontSize: '0.8rem',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                transition: 'all 0.4s ease',
                boxShadow: '0 0 20px rgba(245, 210, 138, 0.1)',
              }}
            >
              Enter Experience
            </button>

            <span
              style={{
                display: 'block',
                fontFamily: 'Space Grotesk, sans-serif',
                fontWeight: 200,
                fontSize: '0.7rem',
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.1em',
                marginTop: '1.5rem',
              }}
            >
              Move Mouse to Look Around 360° · headphones recommended
            </span>
          </div>
        </div>
      )}

      {hasEntered && (
        <>
          {/* Custom celestial cursor */}
          <CustomCursor />

          {/* Sticky WebGL Background executing the 360 flight spline */}
          <BackgroundWebGL activeWorld={activeWorld} progress={activeWorld > 0 ? 1.0 : 0.0} yaw={yaw} pitch={pitch} />

          {/* 1. CENTRAL HUB VIEW: Interactive portals selectors floating in 360 degrees */}
          {activeWorld === 0 && (
            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 10,
                display: 'flex',
                gap: '2.5rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
                width: 'min(1000px, 90vw)',
                pointerEvents: 'auto',
              }}
            >
              {WORLDS.map(world => (
                <div
                  key={world.id}
                  onClick={() => enterWorld(world.id)}
                  style={{
                    padding: '2.2rem',
                    background: 'rgba(14, 15, 20, 0.72)',
                    border: `1.5px solid ${world.color}15`,
                    borderRadius: '16px',
                    cursor: 'pointer',
                    maxWidth: '280px',
                    textAlign: 'center',
                    transition: 'all 0.4s ease',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = world.color;
                    el.style.boxShadow = `0 0 30px ${world.color}25`;
                    el.style.transform = 'translateY(-6px)';
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = `${world.color}15`;
                    el.style.boxShadow = '0 10px 40px rgba(0,0,0,0.5)';
                    el.style.transform = 'none';
                  }}
                >
                  <div
                    style={{
                      fontFamily: 'Space Grotesk, sans-serif',
                      fontSize: '0.65rem',
                      letterSpacing: '0.25em',
                      color: world.color,
                      textTransform: 'uppercase',
                      marginBottom: '0.8rem',
                    }}
                  >
                    {world.subtitle}
                  </div>
                  <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: '#ffffff', marginBottom: '0.8rem', fontWeight: 300 }}>
                    {world.label}
                  </h3>
                  <p style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.75rem', color: 'var(--white-dim)', lineHeight: 1.6 }}>
                    {world.description}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 2. WORLDS ACTIVE DASHBOARD PANELS */}
          {activeWorld > 0 && currentWorldData && (
            <>
              {/* Timeline navigator on the left */}
              <div
                style={{
                  position: 'absolute',
                  left: '3.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.2rem',
                  pointerEvents: 'auto',
                }}
              >
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', color: currentWorldData.color, letterSpacing: '0.25em', textTransform: 'uppercase' }}>
                  World Spline
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {currentWorldData.chapters.map((ch, idx) => (
                    <div
                      key={ch.id}
                      onClick={() => setActiveChapterIdx(idx)}
                      style={{
                        padding: '0.8rem 1.4rem',
                        background: activeChapterIdx === idx ? `${currentWorldData.color}08` : 'rgba(14, 15, 20, 0.65)',
                        border: `1px solid ${activeChapterIdx === idx ? currentWorldData.color : 'rgba(255, 255, 255, 0.08)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        fontFamily: 'Space Grotesk, sans-serif',
                        fontSize: '0.8rem',
                        color: activeChapterIdx === idx ? currentWorldData.color : '#ffffff',
                        boxShadow: activeChapterIdx === idx ? `0 0 15px ${currentWorldData.color}25` : 'none',
                      }}
                    >
                      {ch.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Core interactive playground overlay card */}
              <div
                style={{
                  position: 'absolute',
                  right: '3.5rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  zIndex: 20,
                  width: 'min(520px, 90vw)',
                  pointerEvents: 'auto',
                  animation: 'fadeInUp 0.5s ease forwards',
                }}
              >
                <div className="cosmic-card" style={{ position: 'relative' }}>
                  {/* Exit chapter return to hub */}
                  <button
                    onClick={exitWorld}
                    style={{
                      position: 'absolute',
                      top: '1.5rem',
                      right: '1.5rem',
                      background: 'transparent',
                      border: 'none',
                      color: 'rgba(255,255,255,0.4)',
                      fontSize: '1.2rem',
                      cursor: 'pointer',
                      fontFamily: 'Space Mono, monospace',
                    }}
                  >
                    ✕
                  </button>

                  {/* Render the selected active chapter dashboard */}
                  {/* WORLD 1 (WAVES THEME) */}
                  {activeWorld === 1 && activeChapter?.id === 'resonance' && <Chapter1 />}
                  {activeWorld === 1 && activeChapter?.id === 'frequency' && <Chapter2 />}
                  {activeWorld === 1 && activeChapter?.id === 'notes' && <Chapter3 />}
                  {activeWorld === 1 && activeChapter?.id === 'fibonacci' && <ChapterFibonacci />}

                  {/* WORLD 2 (GRAVITY THEME) */}
                  {activeWorld === 2 && activeChapter?.id === 'harmonics' && <ChapterStandingWaves />}
                  {activeWorld === 2 && activeChapter?.id === 'fifths' && <Chapter5 />}
                  {activeWorld === 2 && activeChapter?.id === 'gargantua' && (
                    <ChapterBlackHole
                      isPlayingSound={soundOn}
                      toggleSound={toggleSound}
                    />
                  )}

                  {/* WORLD 3 (LIGHT THEME) */}
                  {activeWorld === 3 && activeChapter?.id === 'fourier' && <ChapterFourier />}
                  {activeWorld === 3 && activeChapter?.id === 'geometry' && <Chapter7 />}
                  {activeWorld === 3 && activeChapter?.id === 'emotion' && <Chapter8 />}
                  {activeWorld === 3 && activeChapter?.id === 'aurora' && <ChapterNorthernLights />}
                  {activeWorld === 3 && activeChapter?.id === 'finale' && <ChapterFinale />}
                </div>
              </div>
            </>
          )}

          {/* Navigation Bar HUD */}
          <nav className="nav-cosmic" style={{ zIndex: 30 }}>
            <div className="nav-title" onClick={exitWorld} style={{ cursor: 'pointer' }}>
              𝄞 COSMIC GALAXIES
            </div>
            {activeWorld > 0 && (
              <button className="btn-secondary" onClick={exitWorld} style={{ fontSize: '0.65rem', padding: '0.5rem 1.5rem' }}>
                ← Cosmic Hub
              </button>
            )}
          </nav>

          {/* Audio HUD control */}
          <button
            className="sound-toggle"
            onClick={toggleSound}
            title={soundOn ? 'Mute' : 'Unmute'}
            style={{
              borderColor: soundOn ? 'var(--gold)' : 'rgba(255, 0, 85, 0.4)',
              color: soundOn ? 'var(--gold)' : '#FF2D55',
              boxShadow: soundOn ? 'var(--glow-gold)' : 'none',
              zIndex: 30,
            }}
          >
            {soundOn ? '🔊' : '🔇'}
          </button>

          {/* Central hub look hint */}
          {activeWorld === 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: '3rem',
                left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center',
                pointerEvents: 'none',
                animation: 'pulseGlow 3s ease infinite',
                zIndex: 10,
              }}
            >
              <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.65rem', letterSpacing: '0.4em', color: 'rgba(255,255,255,0.3)' }}>
                PAN YAW WITH CURSOR · SELECT A REALM TO COMMENCE
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useAudioUnlock } from '@/lib/audio';

// Dynamic imports to avoid SSR issues with canvas/WebAudio
const CustomCursor = dynamic(() => import('@/components/CustomCursor'), { ssr: false });
const ParticleCanvas = dynamic(() => import('@/components/ParticleCanvas'), { ssr: false });
const Chapter1 = dynamic(() => import('@/components/Chapter1'), { ssr: false });
const Chapter2 = dynamic(() => import('@/components/Chapter2'), { ssr: false });
const Chapter3 = dynamic(() => import('@/components/Chapter3'), { ssr: false });
const Chapter4 = dynamic(() => import('@/components/Chapter4'), { ssr: false });
const Chapter5 = dynamic(() => import('@/components/Chapter5'), { ssr: false });
const Chapter6 = dynamic(() => import('@/components/Chapter6'), { ssr: false });
const Chapter7 = dynamic(() => import('@/components/Chapter7'), { ssr: false });
const Chapter8 = dynamic(() => import('@/components/Chapter8'), { ssr: false });
const ChapterFinale = dynamic(() => import('@/components/ChapterFinale'), { ssr: false });

const NAV_ITEMS = [
  { id: 'chapter-1', label: 'Vibration' },
  { id: 'chapter-2', label: 'Frequency' },
  { id: 'chapter-3', label: 'Notes' },
  { id: 'chapter-4', label: 'Harmonics' },
  { id: 'chapter-5', label: 'Fifths' },
  { id: 'chapter-6', label: 'Geometry' },
  { id: 'chapter-7', label: 'Instruments' },
  { id: 'chapter-8', label: 'Emotion' },
  { id: 'finale', label: 'Finale' },
];

export default function Home() {
  const [activeSection, setActiveSection] = useState('chapter-1');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScroll, setShowScroll] = useState(true);
  const [soundOn, setSoundOn] = useState(true);

  useAudioUnlock();

  // Track scroll progress and active section
  useEffect(() => {
    const onScroll = () => {
      const total = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(window.scrollY / total, 1);
      setScrollProgress(progress * 100);

      if (window.scrollY > 200) setShowScroll(false);
      else setShowScroll(true);

      // Find active section
      for (const item of NAV_ITEMS) {
        const el = document.getElementById(item.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.5) {
            setActiveSection(item.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Click ripple effect
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const ripple = document.createElement('div');
      ripple.className = 'ripple';
      ripple.style.left = `${e.clientX}px`;
      ripple.style.top = `${e.clientY}px`;
      ripple.style.width = '50px';
      ripple.style.height = '50px';
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 1200);
    };
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Custom cursor */}
      <CustomCursor />

      {/* Global particle trail */}
      <ParticleCanvas />

      {/* Progress bar */}
      <div
        className="progress-bar"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Navigation */}
      <nav className="nav">
        <div className="nav-logo">𝄞 Vibration</div>
        <ul className="nav-chapters">
          {NAV_ITEMS.map(item => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={activeSection === item.id ? 'active' : ''}
                onClick={e => { e.preventDefault(); scrollTo(item.id); }}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Sound toggle */}
      <button
        className="sound-toggle"
        onClick={() => setSoundOn(s => !s)}
        title={soundOn ? 'Mute' : 'Unmute'}
      >
        {soundOn ? '♪' : '○'}
      </button>

      {/* Scroll indicator */}
      <div className="scroll-hint" style={{ opacity: showScroll ? 1 : 0 }}>
        <span>Scroll</span>
        <div className="scroll-line" />
      </div>

      {/* Main content */}
      <main>
        <Chapter1 isActive={activeSection === 'chapter-1'} />
        <Chapter2 />
        <Chapter3 />
        <Chapter4 />
        <Chapter5 />
        <Chapter6 />
        <Chapter7 />
        <Chapter8 />
        <ChapterFinale />
      </main>

      {/* Footer */}
      <footer style={{
        background: '#000',
        textAlign: 'center',
        padding: '3rem 2rem',
        borderTop: '1px solid rgba(0,255,255,0.06)',
      }}>
        <div style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: '1.5rem',
          color: 'rgba(0,255,255,0.3)',
          letterSpacing: '0.2em',
          marginBottom: '0.75rem',
        }}>
          𝄞
        </div>
        <p style={{
          fontFamily: 'Space Mono, monospace',
          fontSize: '0.6rem',
          letterSpacing: '0.25em',
          color: 'rgba(255,255,255,0.15)',
          textTransform: 'uppercase',
        }}>
          The Language of Vibration · Physics of Music
        </p>
      </footer>
    </>
  );
}

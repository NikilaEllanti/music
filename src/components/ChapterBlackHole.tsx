'use client';

interface ChapterBlackHoleProps {
  isPlayingSound: boolean;
  toggleSound: () => void;
}

export default function ChapterBlackHole({ isPlayingSound, toggleSound }: ChapterBlackHoleProps) {
  return (
    <section
      id="chapter-blackhole"
      className="chapter"
      style={{
        minHeight: '100vh',
        background: 'transparent',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div className="section-content" style={{ zIndex: 10, pointerEvents: 'none', textAlign: 'center' }}>
        <span className="chapter-num" style={{ color: '#00FF88', textShadow: '0 0 10px rgba(0,255,136,0.4)' }}>
          Gravity Climax
        </span>
        <h2
          className="chapter-title"
          style={{
            color: 'transparent',
            backgroundImage: 'linear-gradient(135deg, #ffffff 0%, #00D8FF 50%, #00FF88 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            marginBottom: '1rem',
          }}
        >
          Gargantua
        </h2>
        <p className="chapter-subtitle" style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '2.5rem' }}>
          Move mouse to orbit · Scroll to plunge in
        </p>

        <div style={{ pointerEvents: 'auto', display: 'inline-block' }}>
          <button
            onClick={toggleSound}
            style={{
              padding: '0.85rem 2.8rem',
              border: `1.5px solid ${isPlayingSound ? '#00FF88' : '#00D8FF'}`,
              borderRadius: '100px',
              background: isPlayingSound ? 'rgba(0, 255, 136, 0.08)' : 'rgba(0, 216, 255, 0.02)',
              color: isPlayingSound ? '#00FF88' : '#00D8FF',
              fontFamily: 'Space Mono, monospace',
              fontSize: '0.75rem',
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.4s ease',
              boxShadow: isPlayingSound ? '0 0 25px rgba(0, 255, 136, 0.25)' : 'none',
            }}
          >
            {isPlayingSound ? 'Suck Space-Time In' : 'Listen to Singularity'}
          </button>
        </div>

        <div className="divider" style={{ background: 'linear-gradient(to right, transparent, #00FF88, transparent)' }} />

        <p
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 200,
            fontSize: '0.9rem',
            color: 'rgba(255, 255, 255, 0.45)',
            lineHeight: 1.8,
            letterSpacing: '0.03em',
            maxWidth: '460px',
            margin: '0 auto',
          }}
        >
          A black hole is the ultimate vibration dampener, crushing sound waves under infinite density.
          NASA transposed the sound waves from the Perseus cluster by 57 octaves to make space-time audible.
        </p>
      </div>

      {/* Scroll indicator overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: '4rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.5rem',
          pointerEvents: 'none',
        }}
      >
        <span style={{ fontFamily: 'Space Mono, monospace', fontSize: '0.6rem', letterSpacing: '0.3em', color: 'rgba(0,255,136,0.5)' }}>
          PLUNGE DOWNWARD
        </span>
        <div style={{ width: '1px', height: '30px', background: 'linear-gradient(to bottom, #00FF88, transparent)' }} />
      </div>
    </section>
  );
}

'use client';
import { useEffect, useRef } from 'react';
import { playNote, freqToColor, C_MAJOR } from '@/lib/audio';

// Exhibit 1: STELLAR CONSTELLATION
// Notes = stars, chords = constellations, melodies = spiral galaxy arms

interface Star {
  x: number; y: number; z: number;
  vx: number; vy: number;
  brightness: number; size: number;
  freq: number; hue: number;
  twinkle: number;
}

interface ConstellationLine { a: number; b: number; age: number; }

export default function ExhibitGalaxy() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const starsRef = useRef<Star[]>([]);
  const linesRef = useRef<ConstellationLine[]>([]);
  const galaxyParticlesRef = useRef<{ x: number; y: number; hue: number; r: number; alpha: number }[]>([]);
  const rotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      initGalaxy();
    };

    const initGalaxy = () => {
      const W = canvas.width, H = canvas.height;
      // Spiral galaxy particles (background)
      const particles = [];
      for (let i = 0; i < 4000; i++) {
        const arm = Math.floor(Math.random() * 4);
        const dist = 30 + Math.random() * Math.min(W, H) * 0.45;
        const angle = (arm * Math.PI / 2) + dist * 0.012 + (Math.random() - 0.5) * 0.8;
        const px = W / 2 + Math.cos(angle) * dist + (Math.random() - 0.5) * 30;
        const py = H / 2 + Math.sin(angle) * dist * 0.38 + (Math.random() - 0.5) * 15;
        const hue = arm === 0 ? 220 : arm === 1 ? 260 : arm === 2 ? 190 : 280;
        particles.push({ x: px, y: py, hue, r: 0.5 + Math.random() * 1.5, alpha: 0.2 + Math.random() * 0.7 });
      }
      galaxyParticlesRef.current = particles;

      // Scattered stars
      starsRef.current = Array.from({ length: 80 }, (_, i) => ({
        x: Math.random() * W,
        y: Math.random() * H,
        z: Math.random(),
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.04,
        brightness: 0.2 + Math.random() * 0.8,
        size: 1 + Math.random() * 3.5,
        freq: C_MAJOR[Math.floor(Math.random() * C_MAJOR.length)] * (0.5 + Math.random()),
        hue: Math.random() * 360,
        twinkle: Math.random() * Math.PI * 2,
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    // Click to form constellation lines + play notes
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const W = canvas.width, H = canvas.height;

      // Find nearest star
      let nearestIdx = -1, nearestDist = Infinity;
      starsRef.current.forEach((s, i) => {
        const d = Math.hypot(s.x - mx, s.y - my);
        if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
      });

      if (nearestDist < 60 && nearestIdx >= 0) {
        // Play the star's note
        playNote(starsRef.current[nearestIdx].freq, 'sine', 1.5, 0.18);

        // Connect to last clicked star if there was one
        const lastClicked = starsRef.current.findIndex(s => (s as any).selected);
        if (lastClicked >= 0 && lastClicked !== nearestIdx) {
          linesRef.current.push({ a: lastClicked, b: nearestIdx, age: 0 });
          // Keep only last 20 lines
          if (linesRef.current.length > 20) linesRef.current.shift();
        }
        starsRef.current.forEach(s => (s as any).selected = false);
        (starsRef.current[nearestIdx] as any).selected = true;

        // Spawn galaxy arm from click
        for (let i = 0; i < 50; i++) {
          const angle = Math.random() * Math.PI * 2;
          const r = 5 + Math.random() * 40;
          galaxyParticlesRef.current.push({
            x: mx + Math.cos(angle) * r,
            y: my + Math.sin(angle) * r * 0.4,
            hue: starsRef.current[nearestIdx].hue,
            r: 0.5 + Math.random() * 1.5,
            alpha: 0.4 + Math.random() * 0.5
          });
        }
      }
    };

    canvas.addEventListener('click', onClick);

    const draw = () => {
      timeRef.current += 0.008;
      const t = timeRef.current;
      const W = canvas.width, H = canvas.height;
      rotationRef.current += 0.0004;

      ctx.fillStyle = 'rgba(2, 2, 12, 0.18)';
      ctx.fillRect(0, 0, W, H);

      // Draw galaxy (spiral arms background)
      const cx = W / 2, cy = H / 2;
      galaxyParticlesRef.current.forEach(p => {
        ctx.globalAlpha = p.alpha * 0.6;
        ctx.fillStyle = `hsl(${p.hue}, 70%, 65%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // Galactic core glow
      const coreGrd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
      coreGrd.addColorStop(0, 'rgba(255, 220, 160, 0.9)');
      coreGrd.addColorStop(0.4, 'rgba(200, 140, 80, 0.4)');
      coreGrd.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = coreGrd;
      ctx.beginPath();
      ctx.arc(cx, cy, 60, 0, Math.PI * 2);
      ctx.fill();

      // Constellation lines
      linesRef.current.forEach(line => {
        line.age += 0.01;
        const a = starsRef.current[line.a];
        const b = starsRef.current[line.b];
        const alpha = Math.max(0, 1 - line.age * 0.1);
        ctx.globalAlpha = alpha * 0.5;
        ctx.strokeStyle = '#aaddff';
        ctx.lineWidth = 0.8;
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#aaddff';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      });
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Filter out faded lines
      linesRef.current = linesRef.current.filter(l => l.age < 10);

      // Draw stars
      starsRef.current.forEach((star, i) => {
        star.x += star.vx;
        star.y += star.vy;
        star.twinkle += 0.04;
        if (star.x < 0) star.x = W;
        if (star.x > W) star.x = 0;
        if (star.y < 0) star.y = H;
        if (star.y > H) star.y = 0;

        const twinkleScale = 0.7 + 0.3 * Math.sin(star.twinkle);
        const selected = (star as any).selected;
        const r = star.size * twinkleScale * (selected ? 2 : 1);

        const grd = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, r * 4);
        grd.addColorStop(0, `hsla(${star.hue}, 80%, 95%, ${star.brightness})`);
        grd.addColorStop(0.3, `hsla(${star.hue}, 70%, 70%, ${star.brightness * 0.6})`);
        grd.addColorStop(1, 'rgba(0,0,0,0)');

        if (selected) {
          ctx.shadowBlur = 24;
          ctx.shadowColor = `hsl(${star.hue}, 80%, 75%)`;
        }
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(star.x, star.y, r * 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Star core
        ctx.fillStyle = `hsla(${star.hue}, 60%, 95%, ${star.brightness * twinkleScale})`;
        ctx.beginPath();
        ctx.arc(star.x, star.y, r, 0, Math.PI * 2);
        ctx.fill();
      });

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
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', bottom: '1.5rem', left: '1.5rem',
        fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', color: 'rgba(180,210,255,0.6)',
        lineHeight: 1.7, pointerEvents: 'none',
      }}>
        <div style={{ color: '#aaddff', marginBottom: '0.3rem', fontWeight: 600 }}>✦ STELLAR CONSTELLATION</div>
        Click near stars to play them · Stars near each other form constellations
      </div>
    </div>
  );
}

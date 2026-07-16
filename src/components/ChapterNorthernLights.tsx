'use client';
import { useEffect, useRef, useState } from 'react';
import { playNote } from '@/lib/audio';

// Exhibit 10: NORTHERN LIGHTS — realistic multi-layer aurora curtains
// Uses layered sine-wave bands with translucency compositing

export default function ChapterNorthernLights() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef(0);
  const timeRef   = useRef(0);
  const [showMath, setShowMath] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx    = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // ── Aurora band definitions ────────────────────────────────────────────
    const bands = [
      // Green primary curtains — the brightest
      { baseY: 0.38, amp: 0.10, freq: 0.9, phase: 0.0,  speed: 0.22, thickness: 0.22, color: [0,255,140],   alpha: 0.55 },
      { baseY: 0.42, amp: 0.08, freq: 1.3, phase: 1.5,  speed: 0.28, thickness: 0.18, color: [0,255,100],   alpha: 0.40 },
      { baseY: 0.32, amp: 0.12, freq: 0.7, phase: 3.0,  speed: 0.18, thickness: 0.20, color: [20,255,160],  alpha: 0.35 },
      // Teal mid layer
      { baseY: 0.30, amp: 0.09, freq: 1.1, phase: 0.8,  speed: 0.25, thickness: 0.14, color: [0,220,255],   alpha: 0.30 },
      { baseY: 0.48, amp: 0.07, freq: 1.6, phase: 2.2,  speed: 0.32, thickness: 0.12, color: [0,200,220],   alpha: 0.25 },
      // Purple upper fringe
      { baseY: 0.22, amp: 0.06, freq: 1.8, phase: 4.1,  speed: 0.15, thickness: 0.10, color: [140,60,255],  alpha: 0.22 },
      { baseY: 0.18, amp: 0.05, freq: 2.2, phase: 1.2,  speed: 0.20, thickness: 0.08, color: [180,80,255],  alpha: 0.18 },
      // Faint white upper edge
      { baseY: 0.14, amp: 0.04, freq: 2.5, phase: 0.5,  speed: 0.12, thickness: 0.06, color: [220,240,255], alpha: 0.12 },
    ];

    // ── Stars ─────────────────────────────────────────────────────────────
    const stars: { x: number; y: number; r: number; alpha: number; twinkle: number }[] = [];
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random(), y: Math.random() * 0.6,
        r: 0.3 + Math.random() * 1.0,
        alpha: 0.05 + Math.random() * 0.45,
        twinkle: 1 + Math.random() * 3,
      });
    }

    // ── Shimmer particles along aurora edges ───────────────────────────────
    interface Shimmer { x: number; y: number; vy: number; alpha: number; hue: number; r: number; }
    const shimmers: Shimmer[] = [];
    for (let i = 0; i < 120; i++) {
      shimmers.push({
        x: Math.random(),
        y: 0.15 + Math.random() * 0.45,
        vy: -0.00015 - Math.random() * 0.0004,
        alpha: 0.1 + Math.random() * 0.5,
        hue: 120 + Math.random() * 60,
        r: 0.5 + Math.random() * 1.5,
      });
    }

    const draw = () => {
      timeRef.current += 0.007;
      const t = timeRef.current;
      const W = canvas.width, H = canvas.height;

      ctx.clearRect(0, 0, W, H);

      // ── Deep sky gradient ──────────────────────────────────────────────
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0.0, '#010108');
      sky.addColorStop(0.4, '#010310');
      sky.addColorStop(0.7, '#020815');
      sky.addColorStop(1.0, '#030b0e');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // ── Stars (visible behind aurora) ──────────────────────────────────
      for (const s of stars) {
        const a = s.alpha * (0.4 + 0.6 * Math.sin(t * s.twinkle + s.x * 20));
        ctx.beginPath();
        ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(200,225,255,${a})`;
        ctx.fill();
      }

      // ── Aurora curtains ────────────────────────────────────────────────
      for (const band of bands) {
        const [r, g, b] = band.color;

        // Draw the curtain as a filled shape from the top of the band to bottom
        // with a gradient that fades toward the bottom (like real aurora rays)
        for (let layer = 0; layer < 3; layer++) {
          const lOffset = (layer - 1) * 0.025;
          const lAlpha  = band.alpha * (1.0 - layer * 0.28);

          ctx.beginPath();

          // Top edge of curtain
          for (let px = 0; px <= W; px += 6) {
            const nx    = px / W;
            const wave1 = Math.sin(nx * Math.PI * 4 * band.freq + t * band.speed * 5) * band.amp;
            const wave2 = Math.sin(nx * Math.PI * 7 * band.freq + t * band.speed * 3 + band.phase) * band.amp * 0.4;
            const wave3 = Math.sin(nx * Math.PI * 2 * band.freq - t * band.speed * 2 + band.phase * 0.5) * band.amp * 0.25;
            const topY  = (band.baseY + lOffset + wave1 + wave2 + wave3) * H;
            if (px === 0) ctx.moveTo(px, topY); else ctx.lineTo(px, topY);
          }

          // Bottom edge of curtain (band thickness below)
          for (let px = W; px >= 0; px -= 6) {
            const nx    = px / W;
            const wave1 = Math.sin(nx * Math.PI * 4 * band.freq + t * band.speed * 5) * band.amp;
            const wave2 = Math.sin(nx * Math.PI * 7 * band.freq + t * band.speed * 3 + band.phase) * band.amp * 0.4;
            const wave3 = Math.sin(nx * Math.PI * 2 * band.freq - t * band.speed * 2 + band.phase * 0.5) * band.amp * 0.25;
            const topY  = (band.baseY + lOffset + wave1 + wave2 + wave3) * H;
            const botY  = topY + band.thickness * H;
            ctx.lineTo(px, botY);
          }
          ctx.closePath();

          // Vertical gradient: bright top, fades to transparent bottom
          const minY = band.baseY * H;
          const maxY = (band.baseY + band.thickness) * H;
          const grad = ctx.createLinearGradient(0, minY, 0, maxY);
          grad.addColorStop(0.0, `rgba(${r},${g},${b},${lAlpha})`);
          grad.addColorStop(0.4, `rgba(${r},${g},${b},${lAlpha * 0.6})`);
          grad.addColorStop(1.0, `rgba(${r},${g},${b},0)`);
          ctx.fillStyle = grad;
          ctx.fill();
        }

        // Bright top-edge glow line
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        for (let px = 0; px <= W; px += 4) {
          const nx    = px / W;
          const wave1 = Math.sin(nx * Math.PI * 4 * band.freq + t * band.speed * 5) * band.amp;
          const wave2 = Math.sin(nx * Math.PI * 7 * band.freq + t * band.speed * 3 + band.phase) * band.amp * 0.4;
          const topY  = (band.baseY + wave1 + wave2) * H;
          if (px === 0) ctx.moveTo(px, topY); else ctx.lineTo(px, topY);
        }
        const edgeAlpha = band.alpha * 1.6 * (0.6 + 0.4 * Math.sin(t * 1.8 + band.phase));
        ctx.strokeStyle = `rgba(${r},${g},${b},${Math.min(edgeAlpha, 0.95)})`;
        ctx.shadowBlur  = 15;
        ctx.shadowColor = `rgba(${r},${g},${b},0.6)`;
        ctx.stroke();
        ctx.shadowBlur  = 0;
      }

      // ── Shimmer particles drifting upward ──────────────────────────────
      for (const sh of shimmers) {
        sh.y += sh.vy;
        if (sh.y < 0.05) sh.y = 0.15 + Math.random() * 0.4;
        const pulse = 0.3 + 0.7 * Math.sin(t * 3 + sh.x * 8);
        ctx.beginPath();
        ctx.arc(sh.x * W, sh.y * H, sh.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${sh.hue}, 90%, 80%, ${sh.alpha * pulse})`;
        ctx.fill();
      }

      // ── Horizon glow ──────────────────────────────────────────────────
      const horizGrad = ctx.createLinearGradient(0, H * 0.62, 0, H);
      horizGrad.addColorStop(0, 'rgba(0,30,20,0)');
      horizGrad.addColorStop(0.5, 'rgba(0,20,15,0.35)');
      horizGrad.addColorStop(1, 'rgba(0,8,6,0.9)');
      ctx.fillStyle = horizGrad;
      ctx.fillRect(0, H * 0.62, W, H * 0.38);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const triggerCelestialCascade = () => {
    setShowMath(p => !p);
    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
    notes.forEach((f, i) => setTimeout(() => playNote(f, 'sine', 2.5, 0.04), i * 180));
  };

  return (
    <section id="chapter-northernlights" className="chapter-container" style={{ background: 'transparent' }}>
      <div className="chapter-inner">
        <div style={{ position: 'relative', height: '420px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>

        <div className="cosmic-card">
          <span className="chapter-num" style={{ color: '#00ff99', textShadow: '0 0 15px rgba(0,255,153,0.4)' }}>
            Quantum Emissions
          </span>
          <h2 className="chapter-title" style={{ fontSize: '2.8rem' }}>Northern Lights</h2>

          <p style={{ color: 'var(--white-dim)', lineHeight: 1.85, marginBottom: '2rem', fontSize: '0.88rem' }}>
            Solar wind particles strike Earth's magnetic shield, exciting oxygen and nitrogen atoms.
            As they relax back to ground state, they emit photons — green at 557nm, purple at 427nm,
            white at the upper fringe. Every aurora is a cosmic symphony made visible.
          </p>

          <div style={{ marginBottom: '2rem' }}>
            <button className="btn-primary" onClick={triggerCelestialCascade}>
              {showMath ? 'Conceal Theorem' : 'Resolve Spectral Math'}
            </button>
          </div>

          {showMath && (
            <div className="math-equation">
              {`ΔE = hν = hc/λ   |   O(¹S→¹D): 557.7 nm Green   |   N₂⁺: 427.8 nm Violet`}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

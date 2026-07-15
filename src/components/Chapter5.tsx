'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { CIRCLE_OF_FIFTHS, RELATED_NOTES, NOTE_FREQS, playNote, playChord } from '@/lib/audio';

export default function Chapter5() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const activeNoteRef = useRef<string | null>(null);

  // Compute node positions on a circle
  const getNodePositions = useCallback((cx: number, cy: number, r: number) => {
    return CIRCLE_OF_FIFTHS.map((note, i) => {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2;
      return {
        note,
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        angle,
      };
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();

    // Particles travelling between nodes
    interface TravelParticle {
      x: number; y: number;
      tx: number; ty: number;
      progress: number;
      speed: number;
      hue: number;
      alpha: number;
    }
    const particles: TravelParticle[] = [];
    let particleTimer = 0;

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      timeRef.current += 0.01;
      const t = timeRef.current;

      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;
      const r = Math.min(W, H) * 0.35;
      const nodes = getNodePositions(cx, cy, r);
      const active = activeNoteRef.current;
      const relatedNotes = active ? (RELATED_NOTES[active] || []) : [];

      // Draw outer ring
      ctx.strokeStyle = 'rgba(0,255,255,0.06)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 30, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx, cy, r - 30, 0, Math.PI * 2);
      ctx.stroke();

      // Draw connection lines between related notes
      if (active) {
        const activeNode = nodes.find(n => n.note === active);
        if (activeNode) {
          for (const rel of relatedNotes) {
            const relNode = nodes.find(n => n.note === rel);
            if (relNode) {
              const grad = ctx.createLinearGradient(activeNode.x, activeNode.y, relNode.x, relNode.y);
              grad.addColorStop(0, 'rgba(0,255,255,0.5)');
              grad.addColorStop(1, 'rgba(0,128,255,0.2)');
              ctx.strokeStyle = grad;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(activeNode.x, activeNode.y);
              ctx.lineTo(relNode.x, relNode.y);
              ctx.stroke();
            }
          }
        }
      }

      // Spawn travel particles
      particleTimer++;
      if (active && particleTimer % 20 === 0) {
        const activeNode = nodes.find(n => n.note === active);
        if (activeNode) {
          const relatedToSpawn = relatedNotes.slice(0, 3);
          for (const rel of relatedToSpawn) {
            const relNode = nodes.find(n => n.note === rel);
            if (relNode && particles.length < 60) {
              particles.push({
                x: activeNode.x, y: activeNode.y,
                tx: relNode.x, ty: relNode.y,
                progress: 0, speed: 0.01 + Math.random() * 0.015,
                hue: 180, alpha: 0.8,
              });
            }
          }
        }
      }

      // Update and draw travel particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.progress += p.speed;
        if (p.progress >= 1) {
          particles.splice(i, 1);
          continue;
        }
        p.x += (p.tx - particles[i]?.x || 0) * p.speed * (1 - p.progress);
        // Use lerp
        const lx = p.x + (p.tx - p.x) * (p.progress);
        const ly = p.y + (p.ty - p.y) * (p.progress);
        p.alpha = Math.sin(p.progress * Math.PI);

        ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${p.alpha * 0.8})`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = '#00FFFF';
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw nodes
      for (const node of nodes) {
        const isActive = node.note === active;
        const isRelated = relatedNotes.includes(node.note);
        const pulse = isActive ? 1 + Math.sin(t * 4) * 0.15 : 1;

        // Glow ring
        if (isActive || isRelated) {
          const glowR = isActive ? 32 : 26;
          const grd = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowR * pulse);
          grd.addColorStop(0, `rgba(0,255,255,${isActive ? 0.2 : 0.1})`);
          grd.addColorStop(1, 'rgba(0,255,255,0)');
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(node.x, node.y, glowR * pulse, 0, Math.PI * 2);
          ctx.fill();
        }

        // Node circle
        ctx.beginPath();
        ctx.arc(node.x, node.y, 22 * pulse, 0, Math.PI * 2);
        if (isActive) {
          ctx.fillStyle = 'rgba(0,255,255,0.2)';
          ctx.strokeStyle = 'rgba(0,255,255,1)';
        } else if (isRelated) {
          ctx.fillStyle = 'rgba(0,128,255,0.12)';
          ctx.strokeStyle = 'rgba(0,128,255,0.7)';
        } else {
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.strokeStyle = 'rgba(0,255,255,0.2)';
        }
        ctx.lineWidth = isActive ? 1.5 : 1;
        ctx.fill();
        ctx.stroke();

        // Note label
        ctx.fillStyle = isActive ? '#00FFFF' : isRelated ? '#80C0FF' : 'rgba(255,255,255,0.55)';
        ctx.font = `${isActive ? 'italic ' : ''}${isActive ? 15 : 13}px Cormorant Garamond, serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (isActive) {
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#00FFFF';
        }
        ctx.fillText(node.note, node.x, node.y);
        ctx.shadowBlur = 0;
      }

      // Center label
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.font = '11px Space Mono, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CIRCLE OF FIFTHS', cx, cy);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const r = Math.min(canvas.width, canvas.height) * 0.35;
      const nodes = getNodePositions(cx, cy, r);

      for (const node of nodes) {
        const dx = mx - node.x;
        const dy = my - node.y;
        if (Math.sqrt(dx * dx + dy * dy) < 26) {
          const newActive = node.note === activeNoteRef.current ? null : node.note;
          activeNoteRef.current = newActive;
          setActiveNote(newActive);
          if (newActive) {
            playNote(NOTE_FREQS[newActive] || 261.63, 'triangle', 1.5, 0.1);
            const related = RELATED_NOTES[newActive] || [];
            setTimeout(() => {
              playChord(
                related.slice(0, 3).map(n => NOTE_FREQS[n] || 261.63),
                'sine'
              );
            }, 400);
          }
          break;
        }
      }
    };

    canvas.addEventListener('click', handleClick);
    canvas.style.pointerEvents = 'auto';
    canvas.style.cursor = 'none';

    return () => {
      canvas.removeEventListener('click', handleClick);
      cancelAnimationFrame(animRef.current);
    };
  }, [getNodePositions]);

  return (
    <section
      id="chapter-5"
      className="chapter"
      style={{ minHeight: '110vh', background: '#020008' }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'none' }}
      />
      <div
        className="section-content"
        style={{
          zIndex: 10,
          pointerEvents: 'none',
          position: 'absolute',
          top: '8vh',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      >
        <span className="chapter-num">Chapter V</span>
        <h2
          className="chapter-title"
          style={{
            color: 'transparent',
            backgroundImage: 'linear-gradient(135deg, #fff 0%, #8060FF 50%, #00FFFF 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            marginBottom: '0.75rem',
          }}
        >
          Circle of Fifths
        </h2>
        <p className="chapter-subtitle">Click any note · Watch the galaxy respond</p>
        {activeNote && (
          <div style={{
            marginTop: '1rem',
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '2rem',
            color: 'var(--cyan)',
            textShadow: 'var(--glow-cyan)',
            animation: 'fadeInUp 0.4s ease',
          }}>
            {activeNote} — {RELATED_NOTES[activeNote]?.join(' · ')}
          </div>
        )}
      </div>
    </section>
  );
}

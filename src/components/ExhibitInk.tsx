'use client';
import { useEffect, useRef } from 'react';
import { playNote, freqToColor, PENTATONIC } from '@/lib/audio';

// Exhibit 3: SMOKE & INK
// Every note releases colored ink that diffuses and mixes permanently.
// Inspired by the teal underwater ink/smoke image.

interface InkBlob {
  x: number; y: number;
  vx: number; vy: number;
  r: number; hue: number;
  alpha: number; life: number;
  type: 'blob' | 'tendril' | 'wisp';
}

interface InkTrail {
  x: number; y: number;
  px: number; py: number;
  hue: number; alpha: number;
}

export default function ExhibitInk() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const blobsRef = useRef<InkBlob[]>([]);
  const trailsRef = useRef<InkTrail[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, px: 0, py: 0, down: false });
  const lastNoteRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    // Persistent offscreen canvas where ink accumulates permanently
    const offscreen = document.createElement('canvas');
    offscreenRef.current = offscreen;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      offscreen.width = canvas.width;
      offscreen.height = canvas.height;
      // Fill offscreen with black
      const octx = offscreen.getContext('2d')!;
      octx.fillStyle = '#010108';
      octx.fillRect(0, 0, offscreen.width, offscreen.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const spawnInk = (x: number, y: number, hue: number, count = 25) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 3.5;
        const type = Math.random() < 0.6 ? 'blob' :
                     Math.random() < 0.7 ? 'tendril' : 'wisp';
        blobsRef.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2, // slight upward drift
          r: type === 'blob' ? 4 + Math.random() * 12 :
             type === 'tendril' ? 1.5 + Math.random() * 3 : 1,
          hue: hue + (Math.random() - 0.5) * 30,
          alpha: 0.5 + Math.random() * 0.5,
          life: 1.0,
          type,
        });
      }
    };

    // Mouse interaction
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.px = mouseRef.current.x;
      mouseRef.current.py = mouseRef.current.y;
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;

      if (mouseRef.current.down) {
        const now = Date.now();
        if (now - lastNoteRef.current > 150) {
          lastNoteRef.current = now;
          const noteIdx = Math.floor(Math.random() * PENTATONIC.length);
          const freq = PENTATONIC[noteIdx];
          playNote(freq, 'sine', 0.6, 0.1);
          const hue = (noteIdx * 50 + timeRef.current * 30) % 360;
          spawnInk(mouseRef.current.x, mouseRef.current.y, hue, 30);
        }

        trailsRef.current.push({
          x: mouseRef.current.x, y: mouseRef.current.y,
          px: mouseRef.current.px, py: mouseRef.current.py,
          hue: (timeRef.current * 40) % 360, alpha: 0.4,
        });
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      mouseRef.current.down = true;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const noteIdx = Math.floor(Math.random() * PENTATONIC.length);
      const freq = PENTATONIC[noteIdx];
      playNote(freq, 'sine', 1.0, 0.16);
      const hue = (noteIdx * 50) % 360;
      spawnInk(x, y, hue, 50);
    };

    const onMouseUp = () => { mouseRef.current.down = false; };

    // Also spawn on click for single note
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const noteIdx = Math.floor(Math.random() * PENTATONIC.length);
      const freq = PENTATONIC[noteIdx];
      playNote(freq, 'sine', 1.0, 0.18);
      const hue = (noteIdx * 50 + 180) % 360;
      spawnInk(x, y, hue, 60);
    };

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('click', onClick);

    // Auto spawn ambient ink drips
    const autoInterval = setInterval(() => {
      const W = canvas.width, H = canvas.height;
      const x = Math.random() * W;
      const y = Math.random() * H * 0.3;
      const hue = (timeRef.current * 20) % 360;
      spawnInk(x, y, hue, 12);
      playNote(PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)], 'sine', 0.8, 0.04);
    }, 1200);

    const draw = () => {
      timeRef.current += 0.01;
      const t = timeRef.current;
      const W = canvas.width, H = canvas.height;

      const octx = offscreen.getContext('2d')!;

      // Draw trails permanently onto offscreen
      trailsRef.current.forEach(trail => {
        octx.strokeStyle = `hsla(${trail.hue}, 80%, 65%, ${trail.alpha})`;
        octx.lineWidth = 2;
        octx.lineCap = 'round';
        octx.beginPath();
        octx.moveTo(trail.px, trail.py);
        octx.lineTo(trail.x, trail.y);
        octx.stroke();
      });
      trailsRef.current = [];

      // Render blobs and stamp onto offscreen
      blobsRef.current.forEach(blob => {
        blob.x += blob.vx;
        blob.y += blob.vy;
        blob.vx *= 0.97;
        blob.vy = blob.vy * 0.97 - 0.02; // rising

        // Turbulence
        blob.vx += (Math.random() - 0.5) * 0.15;
        blob.vy += (Math.random() - 0.5) * 0.08;

        blob.life -= 0.008;
        if (blob.life <= 0) return;

        const alpha = blob.alpha * blob.life;

        if (blob.type === 'blob') {
          const grd = octx.createRadialGradient(blob.x, blob.y, 0, blob.x, blob.y, blob.r);
          grd.addColorStop(0, `hsla(${blob.hue}, 90%, 70%, ${alpha})`);
          grd.addColorStop(0.5, `hsla(${blob.hue}, 80%, 55%, ${alpha * 0.5})`);
          grd.addColorStop(1, `hsla(${blob.hue}, 70%, 40%, 0)`);
          octx.fillStyle = grd;
          octx.beginPath();
          octx.arc(blob.x, blob.y, blob.r * 2, 0, Math.PI * 2);
          octx.fill();
        } else if (blob.type === 'tendril') {
          octx.strokeStyle = `hsla(${blob.hue}, 85%, 65%, ${alpha * 0.8})`;
          octx.lineWidth = blob.r * 0.5;
          octx.lineCap = 'round';
          octx.shadowBlur = 8;
          octx.shadowColor = `hsl(${blob.hue}, 90%, 65%)`;
          octx.beginPath();
          octx.moveTo(blob.x - blob.vx * 3, blob.y - blob.vy * 3);
          octx.lineTo(blob.x, blob.y);
          octx.stroke();
          octx.shadowBlur = 0;
        } else { // wisp
          octx.fillStyle = `hsla(${blob.hue}, 100%, 80%, ${alpha * 0.6})`;
          octx.beginPath();
          octx.arc(blob.x, blob.y, blob.r * 1.5, 0, Math.PI * 2);
          octx.fill();
        }
      });

      blobsRef.current = blobsRef.current.filter(b => b.life > 0);
      if (blobsRef.current.length > 3000) blobsRef.current = blobsRef.current.slice(-1500);

      // Compose: draw offscreen ink (persistent) onto main canvas
      ctx.globalAlpha = 1;
      ctx.drawImage(offscreen, 0, 0);

      // Add live glowing wisps on top
      blobsRef.current.forEach(blob => {
        if (blob.type === 'blob' && blob.life > 0.5) {
          ctx.globalAlpha = blob.life * 0.3;
          ctx.fillStyle = `hsl(${blob.hue}, 90%, 75%)`;
          ctx.shadowBlur = 20;
          ctx.shadowColor = `hsl(${blob.hue}, 90%, 65%)`;
          ctx.beginPath();
          ctx.arc(blob.x, blob.y, blob.r * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Ambient light rays from top
      for (let i = 0; i < 3; i++) {
        const rx = W * (0.2 + i * 0.3);
        const rayGrd = ctx.createLinearGradient(rx, 0, rx, H * 0.4);
        rayGrd.addColorStop(0, 'rgba(0, 220, 255, 0.04)');
        rayGrd.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = rayGrd;
        ctx.fillRect(rx - 20, 0, 40, H * 0.4);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('click', onClick);
      clearInterval(autoInterval);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block', cursor: 'crosshair' }} />
      <div style={{
        position: 'absolute', bottom: '1.5rem', left: '1.5rem',
        fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', color: 'rgba(0,220,255,0.6)',
        lineHeight: 1.7, pointerEvents: 'none',
      }}>
        <div style={{ color: '#00dcff', marginBottom: '0.3rem', fontWeight: 600 }}>🌊 SMOKE & INK</div>
        Click or drag to release ink · Every note stains the universe permanently
      </div>
    </div>
  );
}

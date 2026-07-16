'use client';
import { useEffect, useRef } from 'react';
import { playNote, freqToColor, C_MAJOR } from '@/lib/audio';

// Exhibit 2: GROWING SONIC FOREST
// Bioluminescent fractal tree with physics-based glowing particles that sway with wind.
// Music grows new twigs and blooms floating stardust flowers.

interface Branch {
  x1: number; y1: number;
  x2: number; y2: number;
  angle: number;
  length: number;
  width: number;
  depth: number;
  currentLength: number;
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  r: number;
  hue: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'leaf' | 'flower' | 'glow';
}

export default function ExhibitForest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const branchesRef = useRef<Branch[]>([]);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      generateTreeBase();
    };

    // Pre-generate a sturdy base tree structure so it never floats
    const generateTreeBase = () => {
      const W = canvas.width, H = canvas.height;
      branchesRef.current = [];
      
      const buildTree = (x: number, y: number, angle: number, length: number, width: number, depth: number) => {
        if (depth > 6) return;
        const x2 = x + Math.cos(angle) * length;
        const y2 = y + Math.sin(angle) * length;
        branchesRef.current.push({
          x1: x, y1: y, x2, y2, angle, length, width, depth, currentLength: 0
        });

        const subBranches = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < subBranches; i++) {
          const aOffset = (i - (subBranches - 1) / 2) * 0.45 + (Math.random() - 0.5) * 0.15;
          const nextLen = length * (0.68 + Math.random() * 0.1);
          buildTree(x2, y2, angle + aOffset, nextLen, width * 0.7, depth + 1);
        }
      };

      // Root trunk
      buildTree(W / 2, H - 40, -Math.PI / 2, H * 0.16, 12, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    // Spawns stardust particles around the tree branches
    const spawnNotesEffect = (noteIdx: number) => {
      const freq = C_MAJOR[noteIdx % C_MAJOR.length];
      playNote(freq, 'sine', 1.2, 0.12);

      const hue = 140 + (noteIdx * 35) % 120; // Teal and Greens
      const outerBranches = branchesRef.current.filter(b => b.depth >= 4);

      if (outerBranches.length > 0) {
        const count = 12 + Math.floor(Math.random() * 10);
        for (let i = 0; i < count; i++) {
          const b = outerBranches[Math.floor(Math.random() * outerBranches.length)];
          const t = Math.random();
          const bx = b.x1 + (b.x2 - b.x1) * t;
          const by = b.y1 + (b.y2 - b.y1) * t;
          
          const angle = Math.random() * Math.PI * 2;
          const speed = 0.5 + Math.random() * 1.5;
          
          particlesRef.current.push({
            x: bx, y: by,
            vx: Math.cos(angle) * speed + (Math.random() - 0.5) * 0.5,
            vy: Math.sin(angle) * speed - 0.2 - Math.random() * 0.5,
            r: 1.5 + Math.random() * 3,
            hue,
            alpha: 0.8 + Math.random() * 0.2,
            life: 0,
            maxLife: 100 + Math.random() * 120,
            type: Math.random() < 0.35 ? 'flower' : 'leaf',
          });
        }
      }
    };

    // Click triggers notes
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const noteIdx = Math.floor((clickX / canvas.width) * 12);
      spawnNotesEffect(noteIdx);
    };
    canvas.addEventListener('click', onClick);

    // Auto forest ambiance
    let stepCount = 0;
    const interval = setInterval(() => {
      spawnNotesEffect(stepCount++);
    }, 900);

    const draw = () => {
      timeRef.current += 0.008;
      const t = timeRef.current;
      const W = canvas.width, H = canvas.height;

      // restained deep palette clearing
      ctx.fillStyle = 'rgba(3, 4, 12, 0.12)';
      ctx.fillRect(0, 0, W, H);

      // Deep cyan/blue glow center behind the tree
      const radial = ctx.createRadialGradient(W / 2, H * 0.6, 10, W / 2, H * 0.6, W * 0.65);
      radial.addColorStop(0, 'rgba(0, 70, 150, 0.06)');
      radial.addColorStop(0.5, 'rgba(0, 30, 80, 0.02)');
      radial.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = radial;
      ctx.fillRect(0, 0, W, H);

      // Sway offset using noise/sine waves
      const getSwayX = (y: number, depth: number) => {
        const factor = (H - y) / H; // higher up = more sway
        return Math.sin(t * 1.5 + y * 0.01) * 22 * factor * (depth / 6);
      };

      // Draw branch skeleton
      branchesRef.current.forEach(b => {
        // Grow dynamically over time
        if (b.currentLength < b.length) {
          b.currentLength += (b.length - b.currentLength) * 0.06 + 0.2;
        }

        const sway1 = getSwayX(b.y1, b.depth);
        const sway2 = getSwayX(b.y2, b.depth + 1);

        const x1 = b.x1 + sway1;
        const x2 = b.x1 + sway1 + Math.cos(b.angle) * b.currentLength;
        const y2 = b.y2; // vertical height doesn't sway horizontally

        // Glow style
        ctx.beginPath();
        ctx.moveTo(x1, b.y1);
        ctx.lineTo(x2, y2);
        ctx.lineWidth = b.width;
        ctx.lineCap = 'round';

        // Luminescent coloring: fades to bright cyan/emerald at tips
        const hue = 150 + b.depth * 15;
        ctx.strokeStyle = `hsla(${hue}, 85%, 65%, ${0.35 + 0.05 * b.depth})`;
        ctx.shadowBlur = b.depth < 3 ? 12 : 5;
        ctx.shadowColor = `hsl(${hue}, 80%, 55%)`;
        ctx.stroke();
      });

      ctx.shadowBlur = 0;

      // Update and draw glowing particles
      let pIdx = 0;
      while (pIdx < particlesRef.current.length) {
        const p = particlesRef.current[pIdx];
        p.life++;

        // Add wind drift
        p.vx += Math.sin(t * 2 + p.y * 0.01) * 0.025;
        p.vy += 0.005; // falling speed
        p.x += p.vx;
        p.y += p.vy;

        const ageRatio = p.life / p.maxLife;
        const alpha = p.alpha * (1 - ageRatio);

        if (alpha > 0) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * (1.2 - ageRatio * 0.4), 0, Math.PI * 2);
          ctx.fillStyle = `hsla(${p.hue}, 90%, 75%, ${alpha})`;
          ctx.shadowBlur = 6;
          ctx.shadowColor = `hsl(${p.hue}, 85%, 65%)`;
          ctx.fill();
        }

        if (p.life >= p.maxLife || p.y > H + 10 || p.x < -10 || p.x > W + 10) {
          particlesRef.current.splice(pIdx, 1);
        } else {
          pIdx++;
        }
      }

      ctx.shadowBlur = 0;

      // Instruction overlay
      if (t < 5) {
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '0.72rem Space Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Click anywhere to grow and release sonic stardust', W / 2, H - 25);
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', onClick);
      clearInterval(interval);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#030308' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', bottom: '1.5rem', right: '1.5rem',
        fontFamily: 'Space Mono, monospace', fontSize: '0.58rem',
        color: 'rgba(0, 255, 153, 0.45)', lineHeight: 1.8, pointerEvents: 'none', textAlign: 'right',
      }}>
        <div style={{ color: '#00ff99', marginBottom: '0.2rem' }}>∿ GROWING FOREST</div>
        <div>Bioluminescent fractal · Dynamic wind sway</div>
        <div>Click to interact</div>
      </div>
    </div>
  );
}

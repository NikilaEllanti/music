'use client';
import { useEffect, useRef } from 'react';
import { playNote, freqToColor, C_MAJOR } from '@/lib/audio';

// Exhibit 2: GROWING SONIC FOREST
// Each note creates a branch. Harmony grows flowers. Rhythm grows leaves.
// Inspired by the blue luminescent fractal tree image.

interface Branch {
  x1: number; y1: number;
  x2: number; y2: number;
  angle: number; depth: number;
  width: number; hue: number; alpha: number;
  age: number; growthTarget: number;
  growth: number; // 0 to 1
}

interface Flower {
  x: number; y: number; r: number; hue: number; alpha: number; age: number; petals: number;
}

interface Leaf {
  x: number; y: number; angle: number; size: number; hue: number; alpha: number; age: number;
}

export default function ExhibitForest() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const branchesRef = useRef<Branch[]>([]);
  const flowersRef = useRef<Flower[]>([]);
  const leavesRef = useRef<Leaf[]>([]);
  const rootX = useRef(0);
  const rootY = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      rootX.current = canvas.width / 2;
      rootY.current = canvas.height - 20;
      // Reset to trunk
      branchesRef.current = [];
      growBranch(rootX.current, rootY.current, -Math.PI / 2, 80, 8, 200, 0);
    };

    // Recursive fractal branch spawner
    const growBranch = (x: number, y: number, angle: number, length: number, width: number, hue: number, depth: number) => {
      if (depth > 8 || length < 4) return;
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;
      branchesRef.current.push({
        x1: x, y1: y, x2: endX, y2: endY,
        angle, depth, width, hue,
        alpha: 0.7 + depth * 0.03,
        age: 0, growthTarget: length, growth: 0,
      });
    };

    resize();
    window.addEventListener('resize', resize);

    let lastBranchTime = 0;

    const addNoteGrowth = (noteIdx: number) => {
      const freq = C_MAJOR[noteIdx % C_MAJOR.length];
      playNote(freq, 'sine', 1.0, 0.14);

      const hue = 200 + noteIdx * 20;
      // Grow new branches from tips
      const tips = branchesRef.current.filter(b => b.depth >= 3 && b.growth > 0.8);
      if (tips.length > 0) {
        const tip = tips[Math.floor(Math.random() * tips.length)];
        const spread = 0.4;
        [-spread, spread].forEach(dAngle => {
          growBranch(
            tip.x2, tip.y2,
            tip.angle + dAngle + (Math.random() - 0.5) * 0.3,
            tip.growthTarget * 0.62,
            Math.max(tip.width * 0.55, 0.5),
            hue,
            tip.depth + 1
          );
        });
      }
    };

    const addHarmonyFlower = () => {
      const tips = branchesRef.current.filter(b => b.depth >= 5 && b.growth > 0.9);
      tips.slice(0, 3).forEach(tip => {
        flowersRef.current.push({
          x: tip.x2, y: tip.y2,
          r: 0, hue: 120 + Math.random() * 80,
          alpha: 0.9, age: 0, petals: 5 + Math.floor(Math.random() * 5),
        });
      });
      // Play a chord
      playNote(261.63, 'sine', 1.2, 0.1);
      playNote(329.63, 'sine', 1.2, 0.08);
      playNote(392.00, 'sine', 1.2, 0.06);
    };

    const addLeaves = () => {
      const branches = branchesRef.current.filter(b => b.depth >= 4 && b.growth > 0.8);
      for (let i = 0; i < 8; i++) {
        const b = branches[Math.floor(Math.random() * branches.length)];
        if (!b) continue;
        const t = Math.random();
        leavesRef.current.push({
          x: b.x1 + (b.x2 - b.x1) * t,
          y: b.y1 + (b.y2 - b.y1) * t,
          angle: b.angle + (Math.random() - 0.5) * 1.5,
          size: 3 + Math.random() * 8,
          hue: 100 + Math.random() * 60,
          alpha: 0.8, age: 0,
        });
      }
    };

    // Auto grow over time
    let noteCounter = 0;
    const autoGrowInterval = setInterval(() => {
      addNoteGrowth(noteCounter++);
      if (noteCounter % 4 === 0) addHarmonyFlower();
      if (noteCounter % 2 === 0) addLeaves();
    }, 800);

    // Click to play note and grow
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const freq = C_MAJOR[Math.floor(Math.random() * C_MAJOR.length)];
      playNote(freq, 'sine', 1.2, 0.16);
      addNoteGrowth(Math.floor(Math.random() * C_MAJOR.length));
      addHarmonyFlower();
      addLeaves();
    };
    canvas.addEventListener('click', onClick);

    const draw = () => {
      timeRef.current += 0.012;
      const t = timeRef.current;
      const W = canvas.width, H = canvas.height;

      ctx.fillStyle = 'rgba(1, 2, 8, 0.25)';
      ctx.fillRect(0, 0, W, H);

      // Ground glow
      const groundGrd = ctx.createRadialGradient(rootX.current, rootY.current, 0, rootX.current, rootY.current, 120);
      groundGrd.addColorStop(0, 'rgba(0, 100, 255, 0.15)');
      groundGrd.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = groundGrd;
      ctx.fillRect(0, 0, W, H);

      // Draw branches
      branchesRef.current.forEach(branch => {
        branch.growth = Math.min(branch.growth + 0.015, 1);
        const gx = branch.x1 + (branch.x2 - branch.x1) * branch.growth;
        const gy = branch.y1 + (branch.y2 - branch.y1) * branch.growth;

        ctx.globalAlpha = branch.alpha * branch.growth;
        ctx.strokeStyle = `hsl(${branch.hue}, 80%, 65%)`;
        ctx.shadowBlur = branch.depth < 3 ? 18 : 8;
        ctx.shadowColor = `hsl(${branch.hue}, 80%, 60%)`;
        ctx.lineWidth = branch.width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(branch.x1, branch.y1);
        ctx.lineTo(gx, gy);
        ctx.stroke();
      });

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Draw flowers
      flowersRef.current.forEach(flower => {
        flower.age += 0.02;
        flower.r = Math.min(flower.r + 0.4, 14);
        flower.alpha = Math.max(flower.alpha - 0.001, 0.3);

        const pulse = 1 + 0.08 * Math.sin(t * 3 + flower.age);
        ctx.globalAlpha = flower.alpha;
        for (let p = 0; p < flower.petals; p++) {
          const pAngle = (p / flower.petals) * Math.PI * 2;
          const px = flower.x + Math.cos(pAngle) * flower.r * pulse;
          const py = flower.y + Math.sin(pAngle) * flower.r * pulse * 0.8;
          ctx.fillStyle = `hsl(${flower.hue + p * 15}, 70%, 70%)`;
          ctx.shadowBlur = 10;
          ctx.shadowColor = `hsl(${flower.hue}, 80%, 60%)`;
          ctx.beginPath();
          ctx.arc(px, py, flower.r * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        // Center
        ctx.fillStyle = `hsl(${flower.hue + 30}, 80%, 90%)`;
        ctx.beginPath();
        ctx.arc(flower.x, flower.y, flower.r * 0.25, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw leaves
      leavesRef.current.forEach(leaf => {
        leaf.age += 0.01;
        leaf.alpha = Math.max(leaf.alpha - 0.0008, 0.15);
        const leafPulse = 1 + 0.05 * Math.sin(leaf.age * 3 + t);

        ctx.globalAlpha = leaf.alpha;
        ctx.fillStyle = `hsl(${leaf.hue}, 75%, 55%)`;
        ctx.shadowBlur = 6;
        ctx.shadowColor = `hsl(${leaf.hue}, 80%, 50%)`;
        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.angle + 0.2 * Math.sin(leaf.age + t));
        ctx.scale(leafPulse, leafPulse);
        ctx.beginPath();
        ctx.ellipse(0, 0, leaf.size * 0.4, leaf.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // Trim old particles to keep perf
      if (flowersRef.current.length > 200) flowersRef.current = flowersRef.current.slice(-120);
      if (leavesRef.current.length > 400) leavesRef.current = leavesRef.current.slice(-250);
      if (branchesRef.current.length > 500) branchesRef.current = branchesRef.current.slice(-300);

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('click', onClick);
      clearInterval(autoGrowInterval);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      <div style={{
        position: 'absolute', bottom: '1.5rem', left: '1.5rem',
        fontFamily: 'Space Grotesk, sans-serif', fontSize: '0.72rem', color: 'rgba(100,255,160,0.6)',
        lineHeight: 1.7, pointerEvents: 'none',
      }}>
        <div style={{ color: '#00ff88', marginBottom: '0.3rem', fontWeight: 600 }}>🌿 GROWING SONIC FOREST</div>
        Click anywhere to grow branches · Harmony blooms flowers · Rhythm scatters leaves
      </div>
    </div>
  );
}

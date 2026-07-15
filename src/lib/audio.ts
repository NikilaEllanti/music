'use client';

import { useEffect, useRef, useCallback } from 'react';

// Web Audio context singleton
let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioCtx;
}

export function playNote(
  frequency: number,
  type: OscillatorType = 'sine',
  duration = 0.8,
  volume = 0.15
) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = frequency * 4;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.1);
  } catch {
    // Audio not supported
  }
}

export function playChord(frequencies: number[], type: OscillatorType = 'sine') {
  frequencies.forEach((f, i) => {
    setTimeout(() => playNote(f, type, 2.5, 0.08), i * 60);
  });
}

// Note frequencies
export const NOTE_FREQS: Record<string, number> = {
  'C': 261.63, 'C#': 277.18, 'D': 293.66, 'D#': 311.13,
  'E': 329.63, 'F': 349.23, 'F#': 369.99, 'G': 392.00,
  'G#': 415.30, 'A': 440.00, 'A#': 466.16, 'B': 493.88,
  'A2': 880.00, 'A3': 1320.00, 'A4': 1760.00, 'A5': 2200.00,
  'Bb': 466.16, 'Eb': 311.13, 'Ab': 415.30, 'Db': 277.18, 'Gb': 369.99,
};

export const CIRCLE_OF_FIFTHS = ['C','G','D','A','E','B','Gb','Db','Ab','Eb','Bb','F'];

export const RELATED_NOTES: Record<string, string[]> = {
  'C': ['G', 'F', 'E', 'A'],
  'G': ['D', 'C', 'B', 'E'],
  'D': ['A', 'G', 'F#', 'B'],
  'A': ['E', 'D', 'C#', 'G'],
  'E': ['B', 'A', 'G#', 'D'],
  'B': ['F#', 'E', 'D#', 'G#'],
  'Gb': ['Db', 'B', 'Bb', 'Eb'],
  'Db': ['Ab', 'Gb', 'F', 'Bb'],
  'Ab': ['Eb', 'Db', 'G', 'F'],
  'Eb': ['Bb', 'Ab', 'D', 'G'],
  'Bb': ['F', 'Eb', 'A', 'D'],
  'F': ['C', 'Bb', 'E', 'A'],
};

export function useAudioUnlock() {
  const unlocked = useRef(false);

  const unlock = useCallback(() => {
    if (unlocked.current) return;
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();
      unlocked.current = true;
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, [unlock]);
}

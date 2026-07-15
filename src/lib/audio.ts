'use client';
// Comprehensive Web Audio API layer for all 15 exhibits
// Zero React state - pure imperative

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let masterVolume = 1;
let isUnlocked = false;

export function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = masterVolume;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

export function getMasterGain(): GainNode {
  getAudioContext();
  return masterGain!;
}

export async function ensureUnlocked() {
  if (isUnlocked) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') await ctx.resume();
    isUnlocked = true;
  } catch {}
}

export function setMasterVolume(vol: number) {
  masterVolume = vol;
  if (!masterGain) return;
  masterGain.gain.setTargetAtTime(vol, getAudioContext().currentTime, 0.05);
}

// Hook for use in components
export function useAudioUnlock() {
  if (typeof window === 'undefined') return;
  // Handled externally by Enter button
}

// Play a single note with envelope
export function playNote(
  frequency: number,
  type: OscillatorType = 'sine',
  duration = 0.8,
  volume = 0.15
) {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(frequency * 6, 18000);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(getMasterGain());
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(frequency, 1), ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume * masterVolume, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

// Play a chord (multiple simultaneous notes)
export function playChord(
  frequencies: number[],
  type: OscillatorType = 'sine',
  volume = 0.08,
  duration = 1.2
) {
  frequencies.forEach((f, i) => {
    setTimeout(() => playNote(f, type, duration, volume), i * 30);
  });
}

// Black hole synthesizer — continuous low rumble with LFO wobble
let blackHoleSynth: { stop: () => void; updateProgress: (p: number) => void } | null = null;

export function startBlackHoleSynth() {
  if (blackHoleSynth) return;
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') ctx.resume();

    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];

    const freqs = [28, 41, 55, 73];
    freqs.forEach(f => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 220;

      osc.type = 'sawtooth';
      osc.frequency.value = f;
      gain.gain.value = 0.04 * masterVolume;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(getMasterGain());
      osc.start();
      oscs.push(osc);
      gains.push(gain);
    });

    // Gravitational wave modulation
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.18;
    lfoGain.gain.value = 18;
    lfo.connect(lfoGain);
    oscs.forEach(o => lfoGain.connect(o.frequency));
    lfo.start();

    blackHoleSynth = {
      stop: () => {
        oscs.forEach(o => { try { o.stop(); } catch {} });
        lfo.stop();
        blackHoleSynth = null;
      },
      updateProgress: (p: number) => {
        const now = ctx.currentTime;
        gains.forEach((g, i) => {
          const baseVol = 0.04 + p * 0.05;
          g.gain.setTargetAtTime(baseVol * masterVolume, now, 0.3);
        });
        lfoGain.gain.setTargetAtTime(18 + p * 40, now, 0.5);
        lfo.frequency.setTargetAtTime(0.18 + p * 0.5, now, 0.5);
      }
    };
  } catch {}
}

export function stopBlackHoleSynth() {
  blackHoleSynth?.stop();
}

export function updateBlackHoleSynthProgress(progress: number) {
  blackHoleSynth?.updateProgress(progress);
}

// Musical note frequencies map
export const NOTE_FREQ: Record<string, number> = {
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51,
};

// C major scale frequencies
export const C_MAJOR = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];

// Map frequency to HSL color (chromesthetic mapping)
export function freqToColor(freq: number): string {
  const semitone = Math.round(12 * Math.log2(freq / 261.63)) % 12;
  const hue = (semitone * 30 + 200) % 360;
  return `hsl(${hue}, 90%, 65%)`;
}

// Pentatonic minor scale
export const PENTATONIC = [261.63, 311.13, 349.23, 392.00, 466.16, 523.25];

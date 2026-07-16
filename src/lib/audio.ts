'use client';
// Comprehensive Web Audio API layer for all 15 exhibits
// Zero React state - pure imperative

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let masterVolume = 1;
let isUnlocked = false;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = masterVolume;
      masterGain.connect(audioCtx.destination);
    } catch (e) {
      console.error("AudioContext initialization failed:", e);
      return null;
    }
  }
  return audioCtx;
}

export function getMasterGain(): GainNode | null {
  const ctx = getAudioContext();
  if (!ctx) return null;
  return masterGain;
}

export async function ensureUnlocked() {
  if (isUnlocked) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') {
      // Race resume with a short timeout to prevent browser UI lockup if it blocks
      await Promise.race([
        ctx.resume(),
        new Promise(resolve => setTimeout(resolve, 500))
      ]);
    }
    isUnlocked = true;
  } catch (e) {
    console.error("Audio unlock error caught:", e);
  }
}

export function setMasterVolume(vol: number) {
  masterVolume = vol;
  const gain = getMasterGain();
  const ctx = getAudioContext();
  if (!gain || !ctx) return;
  gain.gain.setTargetAtTime(vol, ctx.currentTime, 0.05);
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
    const mGain = getMasterGain();
    if (!ctx || !mGain) return;
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = Math.min(frequency * 6, 18000);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(mGain);
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

// Black hole synthesizer — procedural cavernous rumble mimicking the NASA Perseus recording
let blackHoleSynth: { stop: () => void; updateProgress: (p: number) => void } | null = null;

export function startBlackHoleSynth() {
  if (blackHoleSynth) return;
  try {
    const ctx = getAudioContext();
    const mGain = getMasterGain();
    if (!ctx || !mGain) return;
    if (ctx.state === 'suspended') ctx.resume();

    // ── Generate Procedural White Noise Buffer ──
    const bufferSize = ctx.sampleRate * 4; // 4 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Resonant bandpass sweep 1 (haunting gas wind)
    const bp1 = ctx.createBiquadFilter();
    bp1.type = 'bandpass';
    bp1.frequency.value = 55;
    bp1.Q.value = 8.0;

    // Resonant bandpass sweep 2 (hollow upper harmonics)
    const bp2 = ctx.createBiquadFilter();
    bp2.type = 'bandpass';
    bp2.frequency.value = 110;
    bp2.Q.value = 6.0;

    // Master deep low-pass to eliminate harsh hiss
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 140;
    lp.Q.value = 1.0;

    // Deep sub-bass carrier (17Hz Perseus frequency)
    const subOsc = ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.value = 17;

    const subGain = ctx.createGain();
    subGain.gain.value = 0.08 * masterVolume;

    const mainGain = ctx.createGain();
    mainGain.gain.value = 0.12 * masterVolume;

    // Cavernous space echo delay
    const delay = ctx.createDelay(2.0);
    const feedback = ctx.createGain();
    delay.delayTime.value = 0.75;
    feedback.gain.value = 0.45;

    // Connections
    noiseSource.connect(bp1);
    noiseSource.connect(bp2);
    bp1.connect(lp);
    bp2.connect(lp);
    
    // Connect to cavernous delay loop
    lp.connect(mainGain);
    mainGain.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    
    // Connect everything to master output
    mainGain.connect(mGain);
    delay.connect(mGain);

    subOsc.connect(subGain);
    subGain.connect(mGain);

    // Start audio
    noiseSource.start(0);
    subOsc.start(0);

    // Slow pressure wave modulation LFOs (modulate filter cutoffs)
    const lfo1 = ctx.createOscillator();
    lfo1.type = 'sine';
    lfo1.frequency.value = 0.04; // ultra slow

    const lfo1Gain = ctx.createGain();
    lfo1Gain.gain.value = 25; // sweep range
    lfo1.connect(lfo1Gain);
    lfo1Gain.connect(bp1.frequency);
    lfo1.start();

    const lfo2 = ctx.createOscillator();
    lfo2.type = 'sine';
    lfo2.frequency.value = 0.07;

    const lfo2Gain = ctx.createGain();
    lfo2Gain.gain.value = 45;
    lfo2.connect(lfo2Gain);
    lfo2Gain.connect(bp2.frequency);
    lfo2.start();

    blackHoleSynth = {
      stop: () => {
        try {
          noiseSource.stop();
          subOsc.stop();
          lfo1.stop();
          lfo2.stop();
        } catch {}
        blackHoleSynth = null;
      },
      updateProgress: (p: number) => {
        const now = ctx.currentTime;
        // Make the rumble build up in presence based on distance
        mainGain.gain.setTargetAtTime((0.12 + p * 0.15) * masterVolume, now, 0.4);
        subGain.gain.setTargetAtTime((0.08 + p * 0.08) * masterVolume, now, 0.3);
        lp.frequency.setTargetAtTime(140 + p * 120, now, 0.5);
      },
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

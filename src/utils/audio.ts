// src/utils/audio.ts

let audioContext: AudioContext | null = null;

export const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    // Create new context
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

export const resetAudioContextForTesting = () => {
    audioContext = null;
};

// Map grades to frequencies (roughly C Major scale + extension)
// -1 (Pre-K) to 12
const GRADE_FREQUENCIES: Record<number, number> = {
  [-1]: 110.00, // A2
  0: 123.47,    // B2
  1: 130.81,    // C3
  2: 146.83,    // D3
  3: 164.81,    // E3
  4: 174.61,    // F3
  5: 196.00,    // G3
  6: 220.00,    // A3
  7: 246.94,    // B3
  8: 261.63,    // C4
  9: 293.66,    // D4
  10: 329.63,   // E4
  11: 349.23,   // F4
  12: 392.00    // G4
};

export const getFrequencyForGrade = (grade: number): number => {
    // Clamp or fallback
    if (grade in GRADE_FREQUENCIES) {
        return GRADE_FREQUENCIES[grade];
    }
    // If out of bounds, extrapolate roughly
    if (grade < -1) return 110.00;
    if (grade > 12) return 392.00 + ((grade - 12) * 20);
    return 220; // Default A3
};

export const playTone = (frequency: number, type: OscillatorType = 'sine', duration: number = 0.15) => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // Ensure context is running (browser autoplay policy)
        if (ctx.state === 'suspended') {
            ctx.resume().catch(e => console.warn('AudioContext resume failed', e));
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = type;
        oscillator.frequency.value = frequency;

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Ramp down smoothly to avoid clicking
        gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        oscillator.start();
        oscillator.stop(ctx.currentTime + duration);

    } catch (e) {
        // Audio playback error (e.g., no hardware, strict browser policy)
        // Fail silently or log
        console.warn('Failed to play tone', e);
    }
};

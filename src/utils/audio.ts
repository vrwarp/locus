// src/utils/audio.ts

let audioContext: AudioContext | null = null;

export const getAudioContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;

  if (!audioContext) {
    // Create new context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
        audioContext = new AudioContextClass();
    }
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

let ambientOscillators: OscillatorNode[] = [];
let ambientGainNode: GainNode | null = null;

export const playAmbientAudio = (theme: string) => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        if (ctx.state === 'suspended') {
            ctx.resume().catch(e => console.warn('AudioContext resume failed', e));
        }

        // Stop any existing ambient audio
        stopAmbientAudio();

        if (theme === 'none') return;

        ambientGainNode = ctx.createGain();
        ambientGainNode.connect(ctx.destination);
        // Start silent, fade in
        ambientGainNode.gain.setValueAtTime(0.001, ctx.currentTime);
        ambientGainNode.gain.exponentialRampToValueAtTime(0.1, ctx.currentTime + 2); // 2 second fade in

        if (theme === 'rainfall') {
            // Simulate rainfall using brown noise
            const bufferSize = 2 * ctx.sampleRate;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                output[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = output[i];
                output[i] *= 3.5; // Compensate for gain
            }

            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            noiseSource.loop = true;

            // Lowpass filter to muffle it a bit, making it sound more like distant rain
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 400;

            noiseSource.connect(filter);
            filter.connect(ambientGainNode);
            noiseSource.start();

            // We treat the buffer source like an oscillator for stopping purposes
            ambientOscillators.push(noiseSource as unknown as OscillatorNode);

        } else if (theme === 'soft-synths') {
            // Create a pleasant, slowly modulating drone chord
            const frequencies = [220.00, 277.18, 329.63]; // A Major chord (A3, C#4, E4)

            frequencies.forEach(freq => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;

                // Modulate the frequency slightly for a "chorus" or "breathing" effect
                const lfo = ctx.createOscillator();
                lfo.type = 'sine';
                lfo.frequency.value = 0.1 + Math.random() * 0.1; // Very slow LFO

                const lfoGain = ctx.createGain();
                lfoGain.gain.value = 2; // Small frequency modulation amount

                lfo.connect(lfoGain);
                lfoGain.connect(osc.frequency);

                osc.connect(ambientGainNode!);

                osc.start();
                lfo.start();

                ambientOscillators.push(osc, lfo);
            });
        }
    } catch (e) {
        console.warn('Failed to play ambient audio', e);
    }
};

export const stopAmbientAudio = () => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        if (ambientGainNode) {
            // Fade out smoothly
            ambientGainNode.gain.cancelScheduledValues(ctx.currentTime);
            ambientGainNode.gain.setValueAtTime(ambientGainNode.gain.value, ctx.currentTime);
            ambientGainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1); // 1 second fade out

            // Stop oscillators slightly after fade out completes
            const stopTime = ctx.currentTime + 1.1;
            ambientOscillators.forEach(osc => {
                try {
                    osc.stop(stopTime);
                } catch (e) {
                    // Already stopped or not started
                }
            });

            // Capture local references to avoid nullifying newly created nodes
            // if playAmbientAudio is called before the timeout completes
            const capturedGainNode = ambientGainNode;

            // Clear globals immediately so new calls start fresh
            ambientGainNode = null;
            ambientOscillators = [];

            // Cleanup captured references after stopping
            setTimeout(() => {
                capturedGainNode.disconnect();
            }, 1200);
        } else {
             // Immediate cleanup if no gain node
             ambientOscillators.forEach(osc => {
                 try { osc.stop(); } catch(e) {}
             });
             ambientOscillators = [];
        }

    } catch (e) {
        console.warn('Failed to stop ambient audio', e);
    }
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

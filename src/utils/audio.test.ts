// src/utils/audio.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getFrequencyForGrade, playTone, getAudioContext, resetAudioContextForTesting } from './audio';

describe('Audio Utils', () => {
    // Mock AudioContext
    let mockContext: any;
    let mockOscillator: any;
    let mockGain: any;

    beforeEach(() => {
        resetAudioContextForTesting();
        mockOscillator = {
            type: 'sine',
            frequency: { value: 0 },
            connect: vi.fn(),
            start: vi.fn(),
            stop: vi.fn(),
        };

        mockGain = {
            gain: {
                setValueAtTime: vi.fn(),
                exponentialRampToValueAtTime: vi.fn(),
            },
            connect: vi.fn(),
        };

        mockContext = {
            createOscillator: vi.fn(() => mockOscillator),
            createGain: vi.fn(() => mockGain),
            destination: {},
            currentTime: 0,
            state: 'running',
            resume: vi.fn().mockResolvedValue(undefined),
        };

        (window as any).AudioContext = class {
            constructor() {
                return mockContext;
            }
        };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should map grades to correct frequencies', () => {
        expect(getFrequencyForGrade(-1)).toBe(110.00); // A2
        expect(getFrequencyForGrade(0)).toBe(123.47);  // B2
        expect(getFrequencyForGrade(5)).toBe(196.00);  // G3
        expect(getFrequencyForGrade(12)).toBe(392.00); // G4
    });

    it('should fallback to valid frequencies for out of bound grades', () => {
        expect(getFrequencyForGrade(-2)).toBe(110.00);
        expect(getFrequencyForGrade(13)).toBeGreaterThan(392.00);
    });

    it('should play tone using AudioContext', () => {
        playTone(440);
        expect(mockContext.createOscillator).toHaveBeenCalled();
        expect(mockContext.createGain).toHaveBeenCalled();
        expect(mockOscillator.frequency.value).toBe(440);
        expect(mockOscillator.start).toHaveBeenCalled();
        expect(mockOscillator.stop).toHaveBeenCalledWith(0.15); // default duration
    });

    it('should resume AudioContext if suspended', () => {
        mockContext.state = 'suspended';
        playTone(440);
        expect(mockContext.resume).toHaveBeenCalled();
    });

    it('should handle missing AudioContext gracefully', () => {
        (window as any).AudioContext = undefined;
        (window as any).webkitAudioContext = undefined;

        // Should not throw
        expect(() => playTone(440)).not.toThrow();
    });
});

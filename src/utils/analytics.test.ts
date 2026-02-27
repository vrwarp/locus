import { describe, it, expect } from 'vitest';
import { calculateHealthStats } from './analytics';
import type { Student } from './pco';

describe('calculateHealthStats', () => {
  it('returns 0 stats for empty array', () => {
    const stats = calculateHealthStats([]);
    expect(stats).toEqual({
      score: 0,
      total: 0,
      anomalies: 0,
      accuracy: 0,
    });
  });

  it('calculates 100% score for perfect data', () => {
    const students = [
      { delta: 0, hasNameAnomaly: false, hasEmailAnomaly: false, hasAddressAnomaly: false, hasPhoneAnomaly: false },
      { delta: 0, hasNameAnomaly: false, hasEmailAnomaly: false, hasAddressAnomaly: false, hasPhoneAnomaly: false },
    ] as Student[];

    const stats = calculateHealthStats(students);
    expect(stats).toEqual({
      score: 100,
      total: 2,
      anomalies: 0,
      accuracy: 100,
    });
  });

  it('calculates 0% score for all anomalies', () => {
    const students = [
      { delta: 1, hasNameAnomaly: false },
      { delta: -1, hasNameAnomaly: false },
    ] as Student[];

    const stats = calculateHealthStats(students);
    expect(stats).toEqual({
      score: 0,
      total: 2,
      anomalies: 2,
      accuracy: 0,
    });
  });

  it('calculates mixed score correctly', () => {
    const students = [
      { delta: 0 },
      { delta: 0 },
      { delta: 0 },
      { delta: 1 }, // 1 anomaly out of 4
    ] as Student[];

    const stats = calculateHealthStats(students);
    expect(stats).toEqual({
      score: 75,
      total: 4,
      anomalies: 1,
      accuracy: 75,
    });
  });

  it('detects hygiene anomalies', () => {
    const students = [
      { delta: 0, hasNameAnomaly: true },
      { delta: 0, hasEmailAnomaly: true },
      { delta: 0, hasAddressAnomaly: true },
      { delta: 0, hasPhoneAnomaly: true },
      { delta: 0 }, // Good
    ] as Student[];

    const stats = calculateHealthStats(students);
    expect(stats).toEqual({
      score: 20, // 1 good out of 5
      total: 5,
      anomalies: 4,
      accuracy: 20,
    });
  });

  it('rounds score correctly', () => {
     // 2 valid out of 3 = 66.66%
      const students = [
      { delta: 0 },
      { delta: 0 },
      { delta: 1 },
    ] as Student[];

    const stats = calculateHealthStats(students);
    expect(stats.score).toBe(67);
    expect(stats.accuracy).toBeCloseTo(66.67, 2);
  });
});

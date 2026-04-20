import { describe, it, expect } from 'vitest';
import { calculateSentimentPulse } from './sentiment';
import type { Student } from './pco';

describe('sentiment', () => {
  it('should return empty array if no students have prayer topics', () => {
    const students: Partial<Student>[] = [
      { id: '1', prayerTopic: null },
      { id: '2', prayerTopic: undefined }
    ];

    const result = calculateSentimentPulse(students as Student[]);
    expect(result).toEqual([]);
  });

  it('should calculate frequency of prayer topics and capitalize them', () => {
    const students: Partial<Student>[] = [
      { id: '1', prayerTopic: 'anxiety' },
      { id: '2', prayerTopic: 'financial' },
      { id: '3', prayerTopic: 'anxiety' },
      { id: '4', prayerTopic: 'HEALTH' },
      { id: '5', prayerTopic: 'health' },
      { id: '6', prayerTopic: 'health' }
    ];

    const result = calculateSentimentPulse(students as Student[]);

    // Should be sorted by frequency descending
    expect(result.length).toBe(3);

    expect(result[0]).toEqual({ text: 'Health', value: 3 });
    expect(result[1]).toEqual({ text: 'Anxiety', value: 2 });
    expect(result[2]).toEqual({ text: 'Financial', value: 1 });
  });

  it('should handle empty input array', () => {
    const result = calculateSentimentPulse([]);
    expect(result).toEqual([]);
  });
});
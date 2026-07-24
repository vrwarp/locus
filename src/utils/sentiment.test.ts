import { describe, it, expect } from 'vitest';
import { calculateSentimentPulse } from './sentiment';
import type { Student } from './pco';

describe('sentiment', () => {
  const currentYear = new Date().getFullYear();
  // Ensure the demographic filtering works accurately using our mocked GENERATIONS limits.
  // Millennials: 1981 - 1996
  // Gen Z: 1997 - 2012
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

  it('should filter students by demographic if specified', () => {
    const students: Partial<Student>[] = [
      { id: '1', birthdate: '1990-05-15', prayerTopic: 'family' }, // Millennial
      { id: '2', birthdate: '1992-08-20', prayerTopic: 'career' }, // Millennial
      { id: '3', birthdate: '2000-01-10', prayerTopic: 'school' }, // Gen Z
      { id: '4', birthdate: '2005-11-30', prayerTopic: 'school' }, // Gen Z
      { id: '5', birthdate: '1985-12-05', prayerTopic: 'health' }, // Millennial
      { id: '6', prayerTopic: 'unknown' }, // No birthdate
      { id: '7', birthdate: 'invalid', prayerTopic: 'invalid' } // Invalid birthdate
    ];

    const allResult = calculateSentimentPulse(students as Student[], 'All');
    // Topics: Family (1), Career (1), School (2), Health (1), Unknown (1), Invalid (1) = 6 topics
    expect(allResult.length).toBe(6);
    expect(allResult.find(r => r.text === 'School')?.value).toBe(2);

    const millennialResult = calculateSentimentPulse(students as Student[], 'Millennials');
    expect(millennialResult.length).toBe(3);
    expect(millennialResult.find(r => r.text === 'Family')?.value).toBe(1);
    expect(millennialResult.find(r => r.text === 'Career')?.value).toBe(1);
    expect(millennialResult.find(r => r.text === 'Health')?.value).toBe(1);
    expect(millennialResult.find(r => r.text === 'School')).toBeUndefined();

    const genZResult = calculateSentimentPulse(students as Student[], 'Gen Z');
    expect(genZResult.length).toBe(1);
    expect(genZResult[0]).toEqual({ text: 'School', value: 2 });
  });
});
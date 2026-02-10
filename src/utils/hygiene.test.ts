import { describe, it, expect } from 'vitest';
import { detectNameAnomaly, fixName } from './hygiene';

describe('detectNameAnomaly', () => {
  it('should detect all uppercase names', () => {
    expect(detectNameAnomaly('JOHN DOE')).toBe(true);
    expect(detectNameAnomaly('SARAH')).toBe(true);
  });

  it('should detect all lowercase names', () => {
    expect(detectNameAnomaly('john doe')).toBe(true);
    expect(detectNameAnomaly('sarah')).toBe(true);
  });

  it('should accept Title Case names', () => {
    expect(detectNameAnomaly('John Doe')).toBe(false);
    expect(detectNameAnomaly('Sarah')).toBe(false);
  });

  it('should handle empty or null names gracefully', () => {
    expect(detectNameAnomaly('')).toBe(false);
    expect(detectNameAnomaly(' ')).toBe(false);
  });
});

describe('fixName', () => {
  it('should convert all uppercase to Title Case', () => {
    expect(fixName('JOHN DOE')).toBe('John Doe');
  });

  it('should convert all lowercase to Title Case', () => {
    expect(fixName('john doe')).toBe('John Doe');
  });

  it('should handle single names', () => {
    expect(fixName('SARAH')).toBe('Sarah');
  });

  it('should handle multiple names', () => {
    expect(fixName('JOHN ROBERT DOE')).toBe('John Robert Doe');
  });
});

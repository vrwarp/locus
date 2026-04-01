import { describe, it, expect } from 'vitest';
import { generateMockGivingData } from './giving';

describe('Giving River Utils', () => {
  it('generates mock data with correct structure', () => {
    const data = generateMockGivingData();
    expect(data).toHaveProperty('nodes');
    expect(data).toHaveProperty('links');
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.links)).toBe(true);
    expect(data.nodes.length).toBeGreaterThan(0);
    expect(data.links.length).toBeGreaterThan(0);
  });

  it('generates links with valid source and target indices', () => {
    const data = generateMockGivingData();
    const nodeCount = data.nodes.length;
    data.links.forEach(link => {
      expect(link.source).toBeGreaterThanOrEqual(0);
      expect(link.source).toBeLessThan(nodeCount);
      expect(link.target).toBeGreaterThanOrEqual(0);
      expect(link.target).toBeLessThan(nodeCount);
    });
  });
});

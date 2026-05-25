import { describe, it, expect } from 'vitest';
import { enrichZipCode } from './zipCodes';

describe('Zip Code Enrichment Utils', () => {
  it('returns valid location for known prefixes', () => {
    expect(enrichZipCode('90001')).toEqual({ city: 'Los Angeles', state: 'CA' });
    expect(enrichZipCode('10022')).toEqual({ city: 'New York', state: 'NY' });
    expect(enrichZipCode('60614')).toEqual({ city: 'Chicago', state: 'IL' });
  });

  it('returns null for unknown prefixes', () => {
    expect(enrichZipCode('99999')).toBeNull();
    expect(enrichZipCode('00000')).toBeNull();
  });

  it('handles edge cases safely', () => {
    expect(enrichZipCode('')).toBeNull();
    expect(enrichZipCode('12')).toBeNull(); // Less than 3 digits
  });

  it('uses first 3 digits', () => {
    // 90021-1234
    expect(enrichZipCode('90021-1234')).toEqual({ city: 'Los Angeles', state: 'CA' });
  });
});

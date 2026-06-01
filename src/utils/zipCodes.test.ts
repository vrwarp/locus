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

  describe('enrichZipCodeAsync', () => {
    let originalFetch: typeof global.fetch;

    beforeAll(() => {
      originalFetch = global.fetch;
    });

    afterAll(() => {
      global.fetch = originalFetch;
    });

    it('returns valid location for 5 digit zip using api', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          places: [
            {
              'place name': 'Beverly Hills',
              'state abbreviation': 'CA'
            }
          ]
        })
      });

      const result = await (await import('./zipCodes')).enrichZipCodeAsync('90210');
      expect(result).toEqual({ city: 'Beverly Hills', state: 'CA' });
      expect(global.fetch).toHaveBeenCalledWith('https://api.zippopotam.us/us/90210');
    });

    it('returns null on api error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await (await import('./zipCodes')).enrichZipCodeAsync('90210');
      expect(result).toBeNull();
    });

    it('returns null on non-ok response', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false
      });

      const result = await (await import('./zipCodes')).enrichZipCodeAsync('90210');
      expect(result).toBeNull();
    });

    it('returns null for zip code not 5 digits', async () => {
      const result1 = await (await import('./zipCodes')).enrichZipCodeAsync('9021');
      expect(result1).toBeNull();

      const result2 = await (await import('./zipCodes')).enrichZipCodeAsync('90210-1234');
      expect(result2).toBeNull();
    });
  });
});

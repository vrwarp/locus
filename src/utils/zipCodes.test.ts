import { describe, it, expect } from 'vitest';
import { enrichZipCode, enrichZipCodeAsync } from './zipCodes';
import { vi } from 'vitest';

describe('Zip Code Enrichment Utils', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

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
    it('returns valid location for 5 digit zip code using fetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          places: [
            {
              'place name': 'Beverly Hills',
              'state abbreviation': 'CA'
            }
          ]
        })
      });

      const result = await enrichZipCodeAsync('90210');
      expect(result).toEqual({ city: 'Beverly Hills', state: 'CA' });
      expect(global.fetch).toHaveBeenCalledWith('https://api.zippopotam.us/us/90210');
    });

    it('returns null if fetch fails (e.g., 404 Not Found)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false
      });

      const result = await enrichZipCodeAsync('99999');
      expect(result).toBeNull();
      expect(global.fetch).toHaveBeenCalledWith('https://api.zippopotam.us/us/99999');
    });

    it('returns null if fetch throws an error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await enrichZipCodeAsync('90210');
      expect(result).toBeNull();
    });

    it('returns null for non-5-digit zip codes without calling fetch', async () => {
      global.fetch = vi.fn();

      expect(await enrichZipCodeAsync('9021')).toBeNull();
      expect(await enrichZipCodeAsync('902101')).toBeNull();
      expect(await enrichZipCodeAsync('')).toBeNull();

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });
});

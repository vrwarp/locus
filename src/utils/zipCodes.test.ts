import { describe, it, expect, vi, afterEach } from 'vitest';
import { enrichZipCode, enrichZipCodeAsync } from './zipCodes';

describe('Zip Code Enrichment Utils', () => {
  afterEach(() => {
    vi.restoreAllMocks();
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
});

describe('Async Zip Code Enrichment', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (global as any).fetch;
  });

  it('fetches exact city and state from API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        places: [{
          'place name': 'Beverly Hills',
          'state abbreviation': 'CA'
        }]
      })
    });

    const result = await enrichZipCodeAsync('90210');
    expect(result).toEqual({ city: 'Beverly Hills', state: 'CA' });
    expect(global.fetch).toHaveBeenCalledWith('https://api.zippopotam.us/us/90210');
  });

  it('returns null on API failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false
    });

    const result = await enrichZipCodeAsync('99999');
    expect(result).toBeNull();
  });

  it('handles network errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    // Silence console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await enrichZipCodeAsync('90210');
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('returns null for short inputs', async () => {
    global.fetch = vi.fn();
    const result = await enrichZipCodeAsync('9021');
    expect(result).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('strips non-digits and uses first 5 digits', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        places: [{
          'place name': 'Beverly Hills',
          'state abbreviation': 'CA'
        }]
      })
    });

    const result = await enrichZipCodeAsync('90210-1234');
    expect(result).toEqual({ city: 'Beverly Hills', state: 'CA' });
    expect(global.fetch).toHaveBeenCalledWith('https://api.zippopotam.us/us/90210');
  });
});

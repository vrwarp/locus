import { describe, it, expect } from 'vitest';
import { getAreaCodeFromZip } from './areaCodes';

describe('Area Code Mapping', () => {
  it('maps common zip prefixes correctly', () => {
    // California
    expect(getAreaCodeFromZip('90001')).toBe('213');
    expect(getAreaCodeFromZip('90210')).toBe('310');
    // New York
    expect(getAreaCodeFromZip('10001')).toBe('212');
    expect(getAreaCodeFromZip('11201')).toBe('718');
    // Texas
    expect(getAreaCodeFromZip('75201')).toBe('214');
    expect(getAreaCodeFromZip('78701')).toBe('512');
    // Illinois
    expect(getAreaCodeFromZip('60601')).toBe('312');
  });

  it('handles short or missing zip codes safely', () => {
    expect(getAreaCodeFromZip('')).toBeNull();
    expect(getAreaCodeFromZip('12')).toBeNull();
    expect(getAreaCodeFromZip(null as any)).toBeNull();
  });

  it('returns null for unknown prefixes', () => {
    expect(getAreaCodeFromZip('00000')).toBeNull();
  });
});

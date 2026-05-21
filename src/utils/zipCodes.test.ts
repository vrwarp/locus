import { describe, it, expect } from 'vitest';
import { getCityStateFromZip } from './zipCodes';

describe('Zip Codes Utility', () => {
    it('returns city and state for a known prefix', () => {
        const result = getCityStateFromZip('10021');
        expect(result).toEqual({ city: 'New York', state: 'NY' });
    });

    it('returns city and state for another known prefix', () => {
        const result = getCityStateFromZip('90001');
        expect(result).toEqual({ city: 'Los Angeles', state: 'CA' });
    });

    it('returns null for an unknown prefix', () => {
        const result = getCityStateFromZip('99999');
        expect(result).toBeNull();
    });

    it('returns null if zip is shorter than 3 characters', () => {
        const result = getCityStateFromZip('10');
        expect(result).toBeNull();
    });

    it('returns null if zip is empty', () => {
        const result = getCityStateFromZip('');
        expect(result).toBeNull();
    });
});

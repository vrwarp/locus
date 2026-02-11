import { describe, it, expect } from 'vitest';
import { detectNameAnomaly, fixName, validateEmail, detectEmailAnomaly, validateAddress, detectAddressAnomaly } from './hygiene';

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

describe('Email Validation', () => {
    it('should validate correct emails', () => {
        expect(validateEmail('test@example.com')).toBe(true);
        expect(validateEmail('john.doe@company.org')).toBe(true);
    });

    it('should invalidate incorrect emails', () => {
        expect(validateEmail('testexample.com')).toBe(false); // No @
        expect(validateEmail('test@example')).toBe(false); // No TLD
        expect(validateEmail('@example.com')).toBe(false); // No user
        expect(validateEmail('')).toBe(false);
    });

    it('should detect anomalies correctly', () => {
        expect(detectEmailAnomaly('testexample.com')).toBe(true);
        expect(detectEmailAnomaly('test@example.com')).toBe(false);
        expect(detectEmailAnomaly('')).toBe(false); // Empty is not anomaly
    });
});

describe('Address Validation', () => {
    const validAddress = { street: '123 Main St', city: 'Anytown', state: 'CA', zip: '90210' };

    it('should validate correct address', () => {
        expect(validateAddress(validAddress)).toBe(true);
    });

    it('should invalidate missing fields', () => {
        expect(validateAddress({ ...validAddress, street: '' })).toBe(false);
        expect(validateAddress({ ...validAddress, city: '' })).toBe(false);
        expect(validateAddress({ ...validAddress, state: '' })).toBe(false);
        expect(validateAddress({ ...validAddress, zip: '' })).toBe(false);
    });

    it('should invalidate bad zip codes', () => {
        expect(validateAddress({ ...validAddress, zip: '1234' })).toBe(false); // Too short
        expect(validateAddress({ ...validAddress, zip: 'ABCDE' })).toBe(false); // Letters
        expect(validateAddress({ ...validAddress, zip: '123456' })).toBe(false); // Too long
    });

    it('should detect anomalies correctly', () => {
         expect(detectAddressAnomaly(validAddress)).toBe(false);
         expect(detectAddressAnomaly({ ...validAddress, zip: '' })).toBe(true);
    });
});

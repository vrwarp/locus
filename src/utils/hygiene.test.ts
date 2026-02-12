import { describe, it, expect } from 'vitest';
import { detectNameAnomaly, fixName, validateEmail, detectEmailAnomaly, validateAddress, detectAddressAnomaly, validatePhone, detectPhoneAnomaly, fixPhone } from './hygiene';

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

describe('Phone Validation', () => {
    it('should validate E.164 phone numbers', () => {
        expect(validatePhone('+15551234567')).toBe(true);
    });

    it('should invalidate non-E.164 phone numbers', () => {
        expect(validatePhone('555-123-4567')).toBe(false);
        expect(validatePhone('(555) 123-4567')).toBe(false);
        expect(validatePhone('5551234567')).toBe(false);
        expect(validatePhone('+1555123456')).toBe(false); // Too short
        expect(validatePhone('+155512345678')).toBe(false); // Too long
        expect(validatePhone('')).toBe(false);
    });

    it('should detect anomalies correctly', () => {
        expect(detectPhoneAnomaly('+15551234567')).toBe(false);
        expect(detectPhoneAnomaly('555-123-4567')).toBe(true);
        expect(detectPhoneAnomaly('')).toBe(false); // Empty is not anomaly
    });
});

describe('fixPhone', () => {
    it('should format 10 digit numbers to E.164', () => {
        expect(fixPhone('5551234567')).toBe('+15551234567');
        expect(fixPhone('555-123-4567')).toBe('+15551234567');
        expect(fixPhone('(555) 123-4567')).toBe('+15551234567');
        expect(fixPhone('555.123.4567')).toBe('+15551234567');
    });

    it('should format 11 digit numbers starting with 1 to E.164', () => {
        expect(fixPhone('15551234567')).toBe('+15551234567');
        expect(fixPhone('1-555-123-4567')).toBe('+15551234567');
    });

    it('should return original if unable to fix standardly', () => {
        expect(fixPhone('555-1234')).toBe('555-1234'); // 7 digits
        expect(fixPhone('123')).toBe('123');
    });
});

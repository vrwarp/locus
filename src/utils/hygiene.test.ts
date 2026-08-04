import { describe, it, expect } from 'vitest';
import { detectNameAnomaly, fixName, validateEmail, detectEmailAnomaly, validateAddress, detectAddressAnomaly, fixAddress, validatePhone, detectPhoneAnomaly, fixPhone, fixEmail } from './hygiene';

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

  it('should preserve hyphens and apostrophes', () => {
    expect(fixName('vega-ruiz')).toBe('Vega-Ruiz');
    expect(fixName('mary-jane')).toBe('Mary-Jane');
    expect(fixName("o'brien")).toBe("O'Brien");
    expect(fixName("d'angelo")).toBe("D'Angelo");
  });

  it('should special-case Mc and Mac prefixes', () => {
    expect(fixName('mcdonald')).toBe('McDonald');
    expect(fixName('macarthur')).toBe('MacArthur');
    expect(fixName('mccarthy')).toBe('McCarthy');
    expect(fixName('mackenzie')).toBe('MacKenzie');
  });

  it('should maintain uppercase for common Roman numeral and professional suffixes', () => {
    expect(fixName('john doe ii')).toBe('John Doe II');
    expect(fixName('john doe iii')).toBe('John Doe III');
    expect(fixName('john doe iv')).toBe('John Doe IV');
    expect(fixName('john doe md')).toBe('John Doe MD');
    expect(fixName('john doe phd')).toBe('John Doe PHD');
  });

  it('should maintain mixed case for Jr and Sr suffixes', () => {
    expect(fixName('john doe jr')).toBe('John Doe Jr');
    expect(fixName('john doe sr.')).toBe('John Doe Sr.');
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

describe('fixEmail', () => {
    it('should return empty string for empty input', () => {
        expect(fixEmail('')).toBe('');
    });

    it('should strip whitespaces and convert to lowercase', () => {
        expect(fixEmail(' Test@Example.com ')).toBe('test@example.com');
        expect(fixEmail('  test @ example.com ')).toBe('test@example.com');
        expect(fixEmail('TEST@EXAMPLE.COM')).toBe('test@example.com');
    });

    it('should fix common domain typos using Levenshtein distance', () => {
        expect(fixEmail('user@gmial.com')).toBe('user@gmail.com');
        expect(fixEmail('user@yaho.com')).toBe('user@yahoo.com');
        expect(fixEmail('user@hotmial.com')).toBe('user@hotmail.com');
        // aol.con distance from aol.com is 1, aol.com is 7 chars long
        expect(fixEmail('user@aol.con')).toBe('user@aol.com');
        expect(fixEmail('user@gmailcom')).toBe('user@gmail.com'); // This is tested by the missing period fix
        expect(fixEmail('user@yahoo.con')).toBe('user@yahoo.com');
        expect(fixEmail('user@gamil.com')).toBe('user@gmail.com');
        expect(fixEmail('user@mail.com')).toBe('user@mail.com');
        expect(fixEmail('user@outlok.com')).toBe('user@outlook.com');
        expect(fixEmail('user@iclud.com')).toBe('user@icloud.com');
    });

    it('should not alter short domains or regional TLDs to prevent false positives', () => {
        expect(fixEmail('user@mac.com')).toBe('user@mac.com');
        expect(fixEmail('user@aol.com')).toBe('user@aol.com');
        expect(fixEmail('user@box.com')).toBe('user@box.com');
        expect(fixEmail('user@att.net')).toBe('user@att.net');
        expect(fixEmail('user@app.com')).toBe('user@app.com');
        expect(fixEmail('user@yahoo.co.uk')).toBe('user@yahoo.co.uk');
        expect(fixEmail('user@ymail.com')).toBe('user@ymail.com');
    });

    it('should not alter domains that are not close to known domains', () => {
        expect(fixEmail('user@example.com')).toBe('user@example.com');
        expect(fixEmail('user@company.org')).toBe('user@company.org');
    });

    it('should fix missing periods before common TLDs', () => {
        expect(fixEmail('user@examplecom')).toBe('user@example.com');
        expect(fixEmail('user@examplenet')).toBe('user@example.net');
        expect(fixEmail('user@exampleorg')).toBe('user@example.org');
    });

    it('should not alter valid emails', () => {
        expect(fixEmail('user@example.com')).toBe('user@example.com');
        expect(fixEmail('john.doe+test@gmail.com')).toBe('john.doe+test@gmail.com');
    });

    it('should not apply fuzzy typo correction when allowFuzzy is false', () => {
        expect(fixEmail('user@gmial.com', false)).toBe('user@gmial.com');
        expect(fixEmail('user@yaho.com', false)).toBe('user@yaho.com');
        expect(fixEmail('user@hotmial.com', false)).toBe('user@hotmial.com');

        // Basic dot-com additions should still work
        expect(fixEmail('user@gmailcom', false)).toBe('user@gmail.com');
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

describe('fixAddress', () => {
    it('should expand common abbreviations', () => {
        expect(fixAddress('123 Main St.')).toBe('123 Main Street');
        expect(fixAddress('123 Main St')).toBe('123 Main Street');
        expect(fixAddress('456 Oak Rd.')).toBe('456 Oak Road');
        expect(fixAddress('456 Oak rd')).toBe('456 Oak Road');
        expect(fixAddress('789 Pine Ave.')).toBe('789 Pine Avenue');
        expect(fixAddress('789 Pine Ave')).toBe('789 Pine Avenue');
    });

    it('should correctly format other suffixes', () => {
        expect(fixAddress('101 Maple Blvd.')).toBe('101 Maple Boulevard');
        expect(fixAddress('202 Cedar Dr')).toBe('202 Cedar Drive');
        expect(fixAddress('303 Elm Ln.')).toBe('303 Elm Lane');
        expect(fixAddress('404 Birch Ct')).toBe('404 Birch Court');
        expect(fixAddress('505 Walnut Pl.')).toBe('505 Walnut Place');
        expect(fixAddress('606 Ash Ter')).toBe('606 Ash Terrace');
        expect(fixAddress('707 Cherry Cir.')).toBe('707 Cherry Circle');
    });

    it('should capitalize fixed abbreviations properly', () => {
        expect(fixAddress('123 Main street')).toBe('123 Main Street');
        expect(fixAddress('123 main ave')).toBe('123 main Avenue');
    });

    it('should not modify non-matching text', () => {
        expect(fixAddress('123 Main')).toBe('123 Main');
    });

    it('should handle empty or null address gracefully', () => {
        expect(fixAddress('')).toBe('');
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

    it('should format 7 digit numbers with area code based on zip', () => {
        // '902' prefix maps to '310' area code
        expect(fixPhone('555-1234', '90210')).toBe('+13105551234');
        expect(fixPhone('5551234', '90210')).toBe('+13105551234');

        // '100' prefix maps to '212' area code
        expect(fixPhone('555-1234', '10001')).toBe('+12125551234');
    });

    it('should return original if unable to fix standardly', () => {
        expect(fixPhone('555-1234')).toBe('555-1234'); // 7 digits, no zip
        expect(fixPhone('555-1234', '00000')).toBe('555-1234'); // 7 digits, unknown zip prefix
        expect(fixPhone('123')).toBe('123');
    });
});

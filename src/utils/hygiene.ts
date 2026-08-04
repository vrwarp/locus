import { distance } from 'fastest-levenshtein';
import { getAreaCodeFromZip } from './areaCodes';

export const detectNameAnomaly = (name: string): boolean => {
  if (!name || name.trim().length === 0) return false;

  const trimmedName = name.trim();

  // Check if all uppercase (and contains letters)
  const isAllUpperCase = trimmedName === trimmedName.toUpperCase() && /[a-zA-Z]/.test(trimmedName);

  // Check if all lowercase
  const isAllLowerCase = trimmedName === trimmedName.toLowerCase();

  return isAllUpperCase || isAllLowerCase;
};

export const fixName = (name: string): string => {
  if (!name) return '';

  const upperCaseSuffixes = ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'MD', 'DDS', 'PHD'];
  const mixedCaseSuffixes = ['Jr', 'Sr', 'Jr.', 'Sr.'];

  // Split by space, hyphen, or apostrophe, preserving the delimiters
  return name
    .toLowerCase()
    .split(/([\s\-'])/)
    .map(token => {
      if (/^[\s\-']$/.test(token)) return token; // Delimiter

      const upperToken = token.toUpperCase();
      if (upperCaseSuffixes.includes(upperToken)) {
        return upperToken;
      }

      const mixedIdx = mixedCaseSuffixes.findIndex(s => s.toLowerCase() === token);
      if (mixedIdx !== -1) {
        return mixedCaseSuffixes[mixedIdx];
      }

      if (token.startsWith('mc') && token.length > 2) {
        return 'Mc' + token.charAt(2).toUpperCase() + token.slice(3);
      }
      if (token.startsWith('mac') && token.length > 3) {
        return 'Mac' + token.charAt(3).toUpperCase() + token.slice(4);
      }

      return token.charAt(0).toUpperCase() + token.slice(1);
    })
    .join('');
};

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  location?: string;
}

export const validateEmail = (email: string): boolean => {
  if (!email) return false;
  // Simple regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const detectEmailAnomaly = (email: string): boolean => {
    // If email is present but invalid, it's an anomaly
    if (!email) return false;
    return !validateEmail(email);
}

export const fixEmail = (email: string, allowFuzzy: boolean = true): string => {
    if (!email) return '';

    // Strip whitespaces and convert to lowercase
    let fixed = email.trim().replace(/\s+/g, '').toLowerCase();

    const knownDomains = [
        'gmail.com', 'yahoo.com', 'hotmail.com', 'aol.com',
        'outlook.com', 'icloud.com', 'msn.com', 'live.com',
        'me.com', 'mac.com', 'comcast.net', 'sbcglobal.net'
    ];

    const parts = fixed.split('@');
    if (parts.length === 2) {
        let domain = parts[1];

        // Basic fallback for missing period before com/net/org
        if (domain.endsWith('com') && !domain.endsWith('.com')) {
             domain = domain.slice(0, -3) + '.com';
        } else if (domain.endsWith('net') && !domain.endsWith('.net')) {
             domain = domain.slice(0, -3) + '.net';
        } else if (domain.endsWith('org') && !domain.endsWith('.org')) {
             domain = domain.slice(0, -3) + '.org';
        }

        // Fuzzy matching for domain typos if domain > 4 chars (to prevent aol.com false positives)
        if (allowFuzzy && domain.length > 4) {
            let bestMatch = domain;
            let minDistance = Infinity;

            // List of valid known domains that are close to our knownDomains but should be left alone
            const validProvidersToIgnore = ['mail.com', 'ymail.com', 'mac.com', 'me.com'];

            // Skip fuzzy matching if the domain is a known valid domain that shouldn't be touched, or if it is a regional TLD (has more than 1 dot)
            const isRegionalTLD = domain.split('.').length > 2;
            if (!validProvidersToIgnore.includes(domain) && !isRegionalTLD) {
                for (const validDomain of knownDomains) {
                    const dist = distance(domain, validDomain);
                    if (dist < minDistance) {
                        minDistance = dist;
                        bestMatch = validDomain;
                    }
                }

                // For short domains (e.g. box.com length 7), a distance of 2 is too big (e.g. box.com -> aol.com is dist 2).
                // So if domain length <= 8, only allow distance of 1. If > 8, allow 2.
                const threshold = domain.length <= 8 ? 1 : 2;

                if (minDistance <= threshold) {
                    domain = bestMatch;
                }
            }
        }

        fixed = `${parts[0]}@${domain}`;
    }

    return fixed;
}


export const validateAddress = (address: Address): boolean => {
    if (!address) return false;
    // Check required fields
    if (!address.street || !address.city || !address.state || !address.zip) return false;

    // Check Zip format (US 5 digit)
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(address.zip);
}

export const detectAddressAnomaly = (address: Address): boolean => {
    if (!address) return false;
    return !validateAddress(address);
}

export const fixAddress = (addressStr: string): string => {
    if (!addressStr) return '';

    let fixed = addressStr;

    // Define common abbreviations and their full forms
    const replacements: Record<string, string> = {
        'St\\.?': 'Street',
        'Rd\\.?': 'Road',
        'Ave\\.?': 'Avenue',
        'Blvd\\.?': 'Boulevard',
        'Dr\\.?': 'Drive',
        'Ln\\.?': 'Lane',
        'Ct\\.?': 'Court',
        'Pl\\.?': 'Place',
        'Ter\\.?': 'Terrace',
        'Cir\\.?': 'Circle'
    };

    for (const [abbr, full] of Object.entries(replacements)) {
        // Match at the end of the string or followed by a space
        const regex = new RegExp(`\\b${abbr}(?=\\s|$)`, 'gi');
        fixed = fixed.replace(regex, full);
    }

    // Attempt to maintain capitalization correctly:
    // Usually these parts are capitalized.
    // e.g., '123 Main street' -> '123 Main Street'
    fixed = fixed.replace(/\b(Street|Road|Avenue|Boulevard|Drive|Lane|Court|Place|Terrace|Circle)\b/gi, (match) => {
        return match.charAt(0).toUpperCase() + match.slice(1).toLowerCase();
    });

    return fixed;
};

export const validatePhone = (phone: string): boolean => {
    if (!phone) return false;
    // E.164 format for US: +1 followed by 10 digits
    const e164Regex = /^\+1\d{10}$/;
    return e164Regex.test(phone);
};

export const detectPhoneAnomaly = (phone: string): boolean => {
    if (!phone) return false;
    return !validatePhone(phone);
};

export const fixPhone = (phone: string, zipCode?: string): string => {
    if (!phone) return '';
    // Strip non-digits
    const digits = phone.replace(/\D/g, '');

    // If 7 digits and we have a zip code, try to prepend the area code
    if (digits.length === 7 && zipCode) {
        const areaCode = getAreaCodeFromZip(zipCode);
        if (areaCode) {
            return `+1${areaCode}${digits}`;
        }
    }

    // If 10 digits, prepend +1
    if (digits.length === 10) {
        return `+1${digits}`;
    }

    // If 11 digits and starts with 1, prepend +
    if (digits.length === 11 && digits.startsWith('1')) {
        return `+${digits}`;
    }

    return phone;
};

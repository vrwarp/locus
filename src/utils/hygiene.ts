import { getAreaCodeFromZip } from './areaCodes';
import { distance } from 'fastest-levenshtein';

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

  return name
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
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

const KNOWN_DOMAINS = [
    'gmail.com',
    'yahoo.com',
    'hotmail.com',
    'aol.com',
    'outlook.com',
    'icloud.com',
    'msn.com',
    'live.com',
    'me.com',
    'mac.com'
];

export const fixEmail = (email: string): string => {
    if (!email) return '';

    // Strip whitespaces and convert to lowercase
    let fixed = email.trim().replace(/\s+/g, '').toLowerCase();

    const parts = fixed.split('@');
    if (parts.length === 2) {
        let domain = parts[1];

        // 1. Exact match bypass
        if (KNOWN_DOMAINS.includes(domain)) {
            return fixed;
        }

        // 2. Advanced Heuristics: Levenshtein distance
        // Only trigger heuristic if the length of the domain is greater than 4
        // to avoid clashing with short, valid domains.
        // Additionally, we want to ensure we don't accidentally overwrite common valid domains.
        const commonValidButNotListed = ['mail.com', 'ymail.com', 'email.com', 'protonmail.com', 'pm.me', 'hey.com'];

        if (commonValidButNotListed.includes(domain)) {
            fixed = `${parts[0]}@${domain}`;
            return fixed;
        }

        let bestMatch = '';
        let lowestDistance = Infinity;

        for (const knownDomain of KNOWN_DOMAINS) {
            const dist = distance(domain, knownDomain);
            if (dist < lowestDistance) {
                lowestDistance = dist;
                bestMatch = knownDomain;
            }
        }

        // Only correct it if the distance is exactly 1 or 2, and the domain isn't extremely short
        // (to prevent 'me.com' turning into something else entirely)
        if (lowestDistance <= 2 && domain.length > 4 && !commonValidButNotListed.includes(domain)) {
            // Add a safeguard check: if distance is 2, it should only be allowed if the domain is fairly long
            // e.g. distance of 2 is fine for 'outlook.cmo' -> 'outlook.com', but dangerous for 'mac.com'
            if (lowestDistance === 1 || (lowestDistance === 2 && domain.length >= 7)) {
                 domain = bestMatch;
            } else {
                 // basic fallback
                 if (domain.endsWith('com') && !domain.endsWith('.com')) {
                     domain = domain.slice(0, -3) + '.com';
                 } else if (domain.endsWith('net') && !domain.endsWith('.net')) {
                     domain = domain.slice(0, -3) + '.net';
                 } else if (domain.endsWith('org') && !domain.endsWith('.org')) {
                     domain = domain.slice(0, -3) + '.org';
                 }
            }
        } else {
            // 3. Basic fallback for missing period before TLD if heuristic didn't match
            if (domain.endsWith('com') && !domain.endsWith('.com')) {
                 domain = domain.slice(0, -3) + '.com';
            } else if (domain.endsWith('net') && !domain.endsWith('.net')) {
                 domain = domain.slice(0, -3) + '.net';
            } else if (domain.endsWith('org') && !domain.endsWith('.org')) {
                 domain = domain.slice(0, -3) + '.org';
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

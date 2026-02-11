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

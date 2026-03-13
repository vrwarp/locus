// Basic mapping of US States and some common zip prefixes to area codes
// This is a simplified mock mapping for demonstration purposes.

// A simple dictionary mapping the first 3 digits of a zip code to a default area code.
// In reality, zip codes to area codes mapping is complex and not 1:1.
export const ZIP_TO_AREA_CODE: Record<string, string> = {
  // California (Los Angeles)
  '900': '213',
  '902': '310',
  '904': '310',

  // New York (NYC)
  '100': '212',
  '101': '212',
  '102': '212',

  // Texas (Dallas)
  '752': '214',
  '753': '214',

  // Illinois (Chicago)
  '606': '312',

  // Florida (Miami)
  '331': '305',
  '332': '305',

  // Washington (Seattle)
  '981': '206',

  // Default fallback for tests
  '123': '555'
};

export const getAreaCodeFromZip = (zip: string): string | null => {
  if (!zip || zip.length < 3) return null;
  const prefix = zip.substring(0, 3);
  return ZIP_TO_AREA_CODE[prefix] || null;
};

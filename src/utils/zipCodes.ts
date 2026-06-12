// A mapping of 3-digit ZIP Code prefixes to major City/State pairs.
// Used for Zip Code Enrichment to auto-fill address details.

export interface LocationData {
  city: string;
  state: string;
}

export const ZIP_PREFIX_MAP: Record<string, LocationData> = {
  '100': { city: 'New York', state: 'NY' },
  '900': { city: 'Los Angeles', state: 'CA' },
  '606': { city: 'Chicago', state: 'IL' },
  '770': { city: 'Houston', state: 'TX' },
  '850': { city: 'Phoenix', state: 'AZ' },
  '191': { city: 'Philadelphia', state: 'PA' },
  '782': { city: 'San Antonio', state: 'TX' },
  '921': { city: 'San Diego', state: 'CA' },
  '752': { city: 'Dallas', state: 'TX' },
  '787': { city: 'Austin', state: 'TX' },
  '322': { city: 'Jacksonville', state: 'FL' },
  '951': { city: 'San Jose', state: 'CA' },
  '761': { city: 'Fort Worth', state: 'TX' },
  '432': { city: 'Columbus', state: 'OH' },
  '282': { city: 'Charlotte', state: 'NC' },
  '462': { city: 'Indianapolis', state: 'IN' },
  '941': { city: 'San Francisco', state: 'CA' },
  '981': { city: 'Seattle', state: 'WA' },
  '802': { city: 'Denver', state: 'CO' },
  '200': { city: 'Washington', state: 'DC' },
  '021': { city: 'Boston', state: 'MA' },
  '372': { city: 'Nashville', state: 'TN' },
  '891': { city: 'Las Vegas', state: 'NV' },
  '482': { city: 'Detroit', state: 'MI' },
  '972': { city: 'Portland', state: 'OR' },
  '381': { city: 'Memphis', state: 'TN' },
  '402': { city: 'Louisville', state: 'KY' },
  '532': { city: 'Milwaukee', state: 'WI' },
  '212': { city: 'Baltimore', state: 'MD' },
  '303': { city: 'Atlanta', state: 'GA' },
  '641': { city: 'Kansas City', state: 'MO' },
  '331': { city: 'Miami', state: 'FL' },
};

export const enrichZipCode = (zip: string): LocationData | null => {
  if (!zip || zip.length < 3) return null;
  const prefix = zip.substring(0, 3);
  return ZIP_PREFIX_MAP[prefix] || null;
};

export const enrichZipCodeAsync = async (zip: string): Promise<LocationData | null> => {
  if (!zip || zip.length !== 5) return null;

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zip}`);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.places && data.places.length > 0) {
      return {
        city: data.places[0]['place name'],
        state: data.places[0]['state abbreviation']
      };
    }
    return null;
  } catch (error) {
    return null;
  }
};

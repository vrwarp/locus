export interface CityState {
    city: string;
    state: string;
}

const ZIP_PREFIX_MAP: Record<string, CityState> = {
    // New York
    '100': { city: 'New York', state: 'NY' },
    '112': { city: 'Brooklyn', state: 'NY' },
    // California
    '900': { city: 'Los Angeles', state: 'CA' },
    '941': { city: 'San Francisco', state: 'CA' },
    '921': { city: 'San Diego', state: 'CA' },
    // Texas
    '787': { city: 'Austin', state: 'TX' },
    '770': { city: 'Houston', state: 'TX' },
    '752': { city: 'Dallas', state: 'TX' },
    // Illinois
    '606': { city: 'Chicago', state: 'IL' },
    // Florida
    '331': { city: 'Miami', state: 'FL' },
    '328': { city: 'Orlando', state: 'FL' },
    // Washington
    '981': { city: 'Seattle', state: 'WA' },
    // Georgia
    '303': { city: 'Atlanta', state: 'GA' },
    // Colorado
    '802': { city: 'Denver', state: 'CO' },
    // Massachusetts
    '021': { city: 'Boston', state: 'MA' },
};

export const getCityStateFromZip = (zip: string): CityState | null => {
    if (!zip || zip.length < 3) return null;

    // Check for exact 5-digit matches first if we wanted to expand the mock,
    // but for now, just match the first 3 digits
    const prefix = zip.substring(0, 3);
    return ZIP_PREFIX_MAP[prefix] || null;
};

import { differenceInYears } from 'date-fns';
import { AxiosError } from 'axios';
import api from './api';
import { calculateExpectedGrade } from './grader';
import { detectNameAnomaly, detectEmailAnomaly, detectAddressAnomaly, detectPhoneAnomaly } from './hygiene';
import type { Address } from './hygiene';
import type { GraderOptions } from './grader';

export interface PcoAttributes {
  birthdate?: string | null;
  grade?: number | null;
  name?: string;
  first_name?: string;
  last_name?: string;
  child?: boolean;
  household_id?: string;
  background_check_expires_at?: string | null;
  prayer_topic?: string | null;
  first_time_giver?: boolean;
  first_gift_date?: string | null;
  anniversary?: string | null;
  death_date?: string | null;
  email_addresses?: { address: string, location: string }[];
  phone_numbers?: { number: string, location: string }[];
  addresses?: Address[];
  [key: string]: unknown;
}

/** A JSON:API resource identifier, as it appears inside `relationships`. */
export interface PcoRef {
  id: string;
  type: string;
}

/** A sideloaded resource: an Email, PhoneNumber, Address or Household. */
export interface PcoIncluded {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
}

export interface PcoPerson {
  id: string;
  type: string;
  attributes: PcoAttributes;
  // Present when the request asked for `include=`; this is where PCO names the
  // contact records that belong to the person.
  relationships?: Record<string, { data?: PcoRef | PcoRef[] | null }>;
}

export interface PcoApiResponse {
  links?: {
    next?: string;
    self?: string;
  };
  data: PcoPerson[];
  // JSON:API sideloads. Real PCO (and pcomirror) return a person's emails, phone
  // numbers, addresses and households here rather than as Person attributes.
  included?: PcoIncluded[];
  meta: {
    total_count: number;
    count: number;
    [key: string]: unknown;
  };
}

export interface PcoSingleResponse {
    data: PcoPerson;
}

export interface Student {
  id: string;
  age: number;
  pcoGrade: number | null;
  name: string;
  firstName: string;
  lastName: string;
  birthdate: string;
  calculatedGrade: number;
  delta: number;
  lastCheckInAt: string | null;
  checkInCount: number | null;
  avatarUrl?: string;
  isChild: boolean;
  // When PCO first knew about this person. Needed to tell a long-lapsed member
  // from a family who joined last Sunday and has not checked in yet.
  createdAt: string | null;
  householdId: string | null;
  backgroundCheckExpiresAt?: string | null;
  prayerTopic?: string | null;
  hasNameAnomaly: boolean;
  email?: string;
  address?: Address;
  phoneNumber?: string;
  hasEmailAnomaly: boolean;
  hasAddressAnomaly: boolean;
  hasPhoneAnomaly: boolean;
  firstTimeGiver: boolean;
  firstGiftDate: string | null;
  anniversary?: string | null;
  deathDate?: string | null;
}

/**
 * Is this person a minor?
 *
 * Nowhere in Locus should ask `isChild` on its own. That field is PCO's `child`
 * attribute, which someone in the office sets by hand and then nobody revisits,
 * so it is wrong in both directions: the teenager who was never flagged reads as
 * an adult, and last year's graduate is still marked as a kid. Age catches the
 * first case — but only when the birthdate is real, and placeholder dates like
 * 1900-01-01 are valid dates that compute an implausible adult age, so an upper
 * bound is needed to catch a record that is telling us nothing.
 *
 * Treat anything uncertain as a minor. The costs are not symmetrical: leaving a
 * child out of an adults-only list is a missing row, and putting one in is a
 * safeguarding failure.
 *
 * Use this to answer "may this person be treated as an adult?" — who appears in
 * a broadcast, who goes into an adult small group. Do *not* use it to read the
 * role a household record claims: the family audit compares the declared
 * `isChild` flag against age precisely to catch the disagreement, and folding
 * the two together there would hide the anomaly it exists to find.
 */
export const isMinor = (person: Pick<Student, 'isChild' | 'age'>): boolean =>
  person.isChild || person.age < 18 || person.age > 110;

export interface PcoEvent {
  id: string;
  type: string;
  attributes: {
    name: string;
    frequency?: string;
  };
}

export interface PcoCheckIn {
  id: string;
  type: string;
  attributes: {
    created_at: string;
    kind: string;
  };
  relationships: {
    person: { data: { type: 'Person', id: string } };
    event: { data: { type: 'Event', id: string } };
  };
}


// PCO's own base. Live, it is what `links.next` is absolute against; behind
// pcomirror the links come back relative, having been rewritten to point at the
// mirror rather than at an API the caller has no PAT for.
const PCO_ORIGIN = 'https://api.planningcenteronline.com';

// The PCO products this app reads. A page link naming one of them is a link we
// own and must route through the dev proxy.
const PCO_PRODUCT = /^\/(people|check-ins)\/v2\//;

/**
 * Normalise a `links.next` into a path this app can actually request.
 *
 * Three shapes arrive here, and only the first used to be handled:
 *
 *   - `https://api.planningcenteronline.com/people/v2/people?offset=100` — live PCO.
 *   - `/people/v2/people?offset=100` — pcomirror, which rewrites every PCO URL it
 *     serves to a mirror-relative path. Left alone this bypasses the `/api` proxy
 *     entirely: the dev server answers with `index.html`, and paging stopped after
 *     page one having silently dropped every record past it.
 *   - `http://localhost:1234/people/v2/people?...` — the mock API, addressed
 *     directly by the simulator test rather than through the proxy.
 *
 * Anything else is returned untouched, so a caller that already passes an
 * `/api/...` path keeps working.
 */
export const toProxyPath = (url: string): string => {
  if (url.startsWith(`${PCO_ORIGIN}/`)) {
    return `/api${url.slice(PCO_ORIGIN.length)}`;
  }
  if (PCO_PRODUCT.test(url)) {
    return `/api${url}`;
  }
  return url;
};

/**
 * Fold `included[]` back onto the people that own it.
 *
 * PCO does not put a person's contact details on the Person: emails, phone
 * numbers and addresses are separate resources, and households are a
 * relationship. This app was written against a mock that inlined all four as
 * attributes, so against a real PCO — or pcomirror, which stores PCO verbatim —
 * every person came back with no email, no phone, no address and a null
 * household, silently disabling the hygiene, duplicate and mapping features.
 *
 * Requesting `include=` and flattening the result here keeps `transformPerson`
 * and everything downstream unchanged. Existing inline attributes win, so a
 * response that already carries them (the mock) is left exactly as it was.
 */
export const flattenIncluded = (response: PcoApiResponse): PcoPerson[] => {
  const included = response.included || [];
  if (included.length === 0) return response.data;

  const byId = new Map<string, PcoIncluded>(
    included.map(r => [`${r.type}:${r.id}`, r]));

  return response.data.map(person => {
    const rels = person.relationships || {};
    const pick = (relName: string, type: string): PcoIncluded[] => {
      const data = rels[relName]?.data;
      if (!data) return [];
      return (Array.isArray(data) ? data : [data])
        .map(ref => byId.get(`${type}:${ref.id}`))
        .filter((r): r is PcoIncluded => r !== undefined);
    };

    const emails = pick('emails', 'Email');
    const phones = pick('phone_numbers', 'PhoneNumber');
    const addresses = pick('addresses', 'Address');
    const households = pick('households', 'Household');

    const str = (r: PcoIncluded, key: string) => r.attributes[key] as string;

    const attributes: PcoAttributes = { ...person.attributes };
    if (attributes.email_addresses === undefined && emails.length) {
      attributes.email_addresses = emails.map(e => ({
        address: str(e, 'address'),
        location: str(e, 'location'),
      }));
    }
    if (attributes.phone_numbers === undefined && phones.length) {
      attributes.phone_numbers = phones.map(p => ({
        number: str(p, 'number'),
        location: str(p, 'location'),
      }));
    }
    if (attributes.addresses === undefined && addresses.length) {
      attributes.addresses = addresses.map(a => ({
        street: str(a, 'street'),
        city: str(a, 'city'),
        state: str(a, 'state'),
        zip: str(a, 'zip'),
        location: str(a, 'location'),
      }));
    }
    // A person can belong to more than one household; the first is the one the
    // rest of the app means by "the" household, matching the mock's single id.
    if (attributes.household_id === undefined && households.length) {
      attributes.household_id = households[0].id;
    }

    return { ...person, attributes };
  });
};

export const transformPerson = (person: PcoPerson, options?: GraderOptions): Student | null => {
  const { id, attributes } = person;
  const { birthdate, grade, name, first_name, last_name, last_checked_in_at, avatar, child, created_at, household_id, background_check_expires_at, prayer_topic, first_time_giver, first_gift_date, anniversary, death_date, email_addresses, addresses, phone_numbers } = attributes;

  if (!birthdate) {
    return null;
  }

  const dob = new Date(birthdate);
  // Check if date is valid
  if (isNaN(dob.getTime())) {
    return null;
  }

  const age = differenceInYears(new Date(), dob);
  const calculatedGrade = calculateExpectedGrade(dob, undefined, options);
  const delta = (grade !== null && grade !== undefined) ? calculatedGrade - grade : 0;

  // Use 'name' if available, otherwise construct from first/last, otherwise 'Unknown'
  const displayName = name || `${first_name || ''} ${last_name || ''}`.trim() || 'Unknown';
  const hasNameAnomaly = detectNameAnomaly(displayName);

  const primaryEmail = email_addresses && email_addresses.length > 0 ? email_addresses[0].address : undefined;
  const primaryAddress = addresses && addresses.length > 0 ? addresses[0] : undefined;
  const primaryPhone = phone_numbers && phone_numbers.length > 0 ? phone_numbers[0].number : undefined;

  const hasEmailAnomaly = primaryEmail ? detectEmailAnomaly(primaryEmail) : false;
  // Only flag address if it exists and is invalid
  const hasAddressAnomaly = primaryAddress ? detectAddressAnomaly(primaryAddress) : false;
  const hasPhoneAnomaly = primaryPhone ? detectPhoneAnomaly(primaryPhone) : false;

  return {
    id,
    age,
    pcoGrade: grade ?? null,
    name: displayName,
    firstName: (first_name || '').trim(),
    lastName: (last_name || '').trim(),
    birthdate,
    calculatedGrade,
    delta,
    lastCheckInAt: (last_checked_in_at as string) || null,
    checkInCount: null, // Fetched lazily
    avatarUrl: (avatar as string) || undefined,
    isChild: !!child,
    createdAt: (created_at as string) || null,
    householdId: household_id || null,
    backgroundCheckExpiresAt: (background_check_expires_at as string) || null,
    prayerTopic: (prayer_topic as string) || null,
    hasNameAnomaly,
    email: primaryEmail,
    address: primaryAddress,
    phoneNumber: primaryPhone,
    hasEmailAnomaly,
    hasAddressAnomaly,
    hasPhoneAnomaly,
    firstTimeGiver: !!first_time_giver,
    firstGiftDate: first_gift_date || null,
    anniversary: anniversary || null,
    deathDate: death_date || null
  };
};

export const prepareUpdateAttributes = (original: Student, updated: Student): PcoAttributes => {
  const attributes: PcoAttributes = {};

  if (original.pcoGrade !== updated.pcoGrade) {
      attributes.grade = updated.pcoGrade;
  }
  if (original.birthdate !== updated.birthdate) {
      attributes.birthdate = updated.birthdate;
  }
  if (original.firstName !== updated.firstName) {
      attributes.first_name = updated.firstName;
  }
  if (original.lastName !== updated.lastName) {
      attributes.last_name = updated.lastName;
  }
  if (original.email !== updated.email && updated.email) {
      attributes.email_addresses = [{ address: updated.email, location: 'Home' }];
  }
  if (original.address !== updated.address && updated.address) {
      attributes.addresses = [{ ...updated.address, location: 'Home' }];
  }
  if (original.phoneNumber !== updated.phoneNumber && updated.phoneNumber) {
      attributes.phone_numbers = [{ number: updated.phoneNumber, location: 'Mobile' }];
  }

  return attributes;
};

/**
 * The three attributes this app keeps on a Student that PCO keeps somewhere else.
 *
 * Each is its own resource under the person — `/people/{id}/emails` and friends —
 * so a `PATCH` naming them on the Person writes attributes PCO does not have.
 * That write returns 200 and changes nothing, which is how ReviewMode's "Fix All"
 * could report a corrected email address and leave the record untouched.
 */
const CONTACT_RESOURCES = {
  email_addresses: { endpoint: 'emails', type: 'Email' },
  phone_numbers: { endpoint: 'phone_numbers', type: 'PhoneNumber' },
  addresses: { endpoint: 'addresses', type: 'Address' },
} as const;

type ContactKey = keyof typeof CONTACT_RESOURCES;

/**
 * Write one contact record, updating the person's existing one where they have one.
 *
 * Read-before-write because PCO addresses these by their own id, which a Student
 * does not carry. Posting unconditionally would leave the stale address in place
 * beside the corrected one and make a cleanup tool a source of duplicates.
 */
const writeContact = async (
  personId: string,
  key: ContactKey,
  attributes: Record<string, unknown>,
  headers: Record<string, string>,
): Promise<void> => {
  const { endpoint, type } = CONTACT_RESOURCES[key];
  const collection = `/api/people/v2/people/${personId}/${endpoint}`;

  const existing = await api.get<{ data: { id: string }[] }>(collection, {
    headers,
    cache: false,
  });
  const current = existing.data.data?.[0];

  if (current) {
    await api.patch(`${collection}/${current.id}`,
      { data: { type, id: current.id, attributes } }, { headers });
  } else {
    await api.post(collection, { data: { type, attributes } }, { headers });
  }
};

export class SandboxUnavailableError extends Error {
    constructor() {
        super(
            'Sandbox Mode is on, but the interceptor that makes it work is not running, ' +
            'so this change would have gone to Planning Center for real. Nothing was sent. ' +
            'Reload the page to start the interceptor, or turn Sandbox Mode off if you meant to save.'
        );
        this.name = 'SandboxUnavailableError';
    }
}

/**
 * Is the sandbox interceptor actually in control of this page?
 *
 * Sandbox Mode works by tagging writes with `X-Locus-Sandbox` and having a
 * service worker (`public/sandbox-sw.js`) answer them with a synthetic response
 * instead of letting them reach PCO. That mechanism is real, but it is not
 * always there: a service worker does not control the page on the very first
 * load before it activates, registration can fail outright (`main.tsx` only
 * logs it), and it needs a secure context.
 *
 * In every one of those cases the header was still attached, the PATCH still
 * went to Planning Center, and the banner still said "changes are simulated".
 * A safety switch that quietly stops working is worse than none, because it is
 * the cautious user who reaches for it. So: no controller, no write.
 */
const sandboxInterceptorReady = (): boolean =>
    typeof navigator !== 'undefined' &&
    'serviceWorker' in navigator &&
    !!navigator.serviceWorker.controller;

export const updatePerson = async (id: string, attributes: PcoAttributes, auth: string, sandboxMode?: boolean): Promise<PcoPerson> => {
    const headers: Record<string, string> = {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
    };

    if (sandboxMode) {
        if (!sandboxInterceptorReady()) throw new SandboxUnavailableError();
        headers['X-Locus-Sandbox'] = 'true';
    }

    // Split the payload by where PCO actually stores each part.
    const personAttributes: PcoAttributes = {};
    const contacts: [ContactKey, Record<string, unknown>][] = [];
    for (const [key, value] of Object.entries(attributes)) {
      const record = Array.isArray(value) ? value[0] : undefined;
      if (key in CONTACT_RESOURCES && record) {
        contacts.push([key as ContactKey, record as Record<string, unknown>]);
      } else {
        personAttributes[key] = value;
      }
    }

    // Sequential, and the person first: these are edits to one record, and PCO
    // rate-limits per organization. A batch fix that fanned them out would spend
    // the whole budget in a burst and start colliding with its own 429 backoff.
    let person: PcoPerson | undefined;
    if (Object.keys(personAttributes).length > 0 || contacts.length === 0) {
      const response = await api.patch<PcoSingleResponse>(
        `/api/people/v2/people/${id}`,
        {
          data: {
            type: 'Person',
            id,
            attributes: personAttributes
          }
        },
        {
          headers
        }
      );

      // Belt as well as braces. The controller check above runs before the
      // request; this confirms afterwards that the reply really came from the
      // interceptor and not from Planning Center. If the worker went away
      // mid-session the write has already landed, so say so plainly rather than
      // returning a success the banner will dress up as simulated.
      if (sandboxMode && !response.headers?.['x-locus-sandbox-response']) {
        throw new Error(
          'Sandbox Mode was on, but this change reached Planning Center — the reply did not come ' +
          'from the sandbox interceptor. Treat the record as edited and check it.'
        );
      }

      person = response.data.data;
    }

    for (const [key, record] of contacts) {
      await writeContact(id, key, record, headers);
    }

    if (person) return person;

    // Contact-only edit: nothing PATCHed the person, so read back the record the
    // caller is owed rather than inventing one.
    const fresh = await api.get<PcoSingleResponse>(`/api/people/v2/people/${id}`,
      { headers, cache: false });
    return fresh.data.data;
  };

export const archivePerson = async (id: string, auth: string, sandboxMode?: boolean): Promise<PcoPerson> => {
    return updatePerson(id, { status: 'inactive' }, auth, sandboxMode);
};

export const fetchCheckInCount = async (id: string, auth: string): Promise<number | null> => {
    try {
        const response = await api.get<{ data: { attributes: { check_in_count: number } } }>(
            `/api/check-ins/v2/people/${id}`,
            {
                headers: {
                    Authorization: `Basic ${auth}`
                }
            }
        );
        return response.data.data.attributes.check_in_count;
    } catch (error) {
        console.error('Failed to fetch check-in count for person', id, error);
        return null;
    }
};

// Asked for on the first page only; PCO echoes `include` into `links.next`, so
// every page after it carries the sideloads without our having to re-add them.
export const PEOPLE_INCLUDES = 'emails,phone_numbers,addresses,households';

export const fetchAllPeople = async (auth: string, url: string = `/api/people/v2/people?per_page=100&include=${PEOPLE_INCLUDES}`, maxPages: number = Infinity): Promise<{ people: PcoPerson[], nextUrl: string | undefined }> => {
  let allPeople: PcoPerson[] = [];
  let nextUrl: string | undefined = url;
  let pageCount = 0;

  while (nextUrl && pageCount < maxPages) {
    // Route the link through the dev proxy, whether PCO returned it absolute or
    // pcomirror returned it relative.
    const proxyUrl: string = toProxyPath(nextUrl);

    const response: { data: PcoApiResponse } = await api.get<PcoApiResponse>(proxyUrl, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });

    allPeople = [...allPeople, ...flattenIncluded(response.data)];
    nextUrl = response.data.links?.next;
    pageCount++;
  }

  return { people: allPeople, nextUrl };
};

export const checkApiVersion = async (auth: string): Promise<boolean> => {
  try {
    await api.get('/api/people/v2/people', {
      params: { per_page: 1 },
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    return true;
  } catch (error) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        throw new Error('Unauthorized: Invalid credentials.');
      }
      if (error.response?.status === 404) {
        throw new Error('API Error: Version mismatch or endpoint not found.');
      }
    }
    throw error;
  }
};

export const fetchEvents = async (auth: string): Promise<PcoEvent[]> => {
  try {
    const response = await api.get<{ data: PcoEvent[] }>(
      '/api/check-ins/v2/events',
      {
        headers: { Authorization: `Basic ${auth}` }
      }
    );
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch events', error);
    return [];
  }
};

export const fetchRecentCheckIns = async (auth: string, maxPages: number = 100): Promise<PcoCheckIn[]> => {
    let allCheckIns: PcoCheckIn[] = [];
    let nextUrl: string | undefined = '/api/check-ins/v2/check_ins?per_page=100';
    let pageCount = 0;

    while (nextUrl && pageCount < maxPages) {
        try {
            const proxyUrl = toProxyPath(nextUrl);

            const response = await api.get<{ data: PcoCheckIn[], links?: { next?: string } }>(
                proxyUrl,
                 {
                    headers: { Authorization: `Basic ${auth}` }
                 }
            );
            allCheckIns = [...allCheckIns, ...response.data.data];
            nextUrl = response.data.links?.next;
            pageCount++;
        } catch (error) {
            console.error('Failed to fetch check-ins', error);
            break;
        }
    }
    return allCheckIns;
};

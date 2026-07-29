import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { transformPerson, updatePerson, fetchAllPeople, fetchCheckInCount, checkApiVersion, prepareUpdateAttributes, toProxyPath, flattenIncluded, isMinor, PEOPLE_INCLUDES } from './pco';
import type { PcoPerson, Student } from './pco';
import { calculateExpectedGrade } from './grader';
import { subYears, format } from 'date-fns';
import { AxiosError } from 'axios';

vi.mock('./api', () => {
    return {
        default: {
            get: vi.fn(),
            patch: vi.fn(),
            post: vi.fn(),
        }
    };
});

beforeEach(() => {
    vi.clearAllMocks();
});

describe('transformPerson', () => {
  const today = new Date();
  // Create a birthdate that makes the person exactly 10 years old
  const birthdate10 = format(subYears(today, 10), 'yyyy-MM-dd');

  it('transforms a valid person correctly', () => {
    const person: PcoPerson = {
      id: '1',
      type: 'Person',
      attributes: {
        birthdate: birthdate10,
        grade: 4,
        name: 'John Doe',
        first_name: 'John',
        last_name: 'Doe',
        child: true,
        household_id: 'hh1'
      },
    };

    const result = transformPerson(person);

    expect(result).not.toBeNull();

    const expectedGrade = calculateExpectedGrade(new Date(birthdate10));

    expect(result).toEqual({
      id: '1',
      age: 10,
      pcoGrade: 4,
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      birthdate: birthdate10,
      calculatedGrade: expectedGrade,
      delta: expectedGrade - 4,
      lastCheckInAt: null,
      checkInCount: null,
      avatarUrl: undefined,
      isChild: true,
      createdAt: null,
      householdId: 'hh1',
      backgroundCheckExpiresAt: null,
      prayerTopic: null,
      hasNameAnomaly: false,
      email: undefined,
      address: undefined,
      hasEmailAnomaly: false,
      hasAddressAnomaly: false,
      hasPhoneAnomaly: false,
      phoneNumber: undefined,
      firstTimeGiver: false,
      firstGiftDate: null,
      anniversary: null,
      deathDate: null
    });
  });

  it('detects name anomalies', () => {
    const person: PcoPerson = {
      id: '1',
      type: 'Person',
      attributes: {
        birthdate: birthdate10,
        grade: 4,
        name: 'JOHN DOE',
        first_name: 'JOHN',
        last_name: 'DOE',
      },
    };
    const result = transformPerson(person);
    expect(result?.hasNameAnomaly).toBe(true);
  });

  it('detects phone anomalies', () => {
    const person: PcoPerson = {
      id: '1',
      type: 'Person',
      attributes: {
        birthdate: birthdate10,
        grade: 4,
        name: 'John Doe',
        phone_numbers: [{ number: '555-1234', location: 'Mobile' }]
      },
    };
    const result = transformPerson(person);
    expect(result?.hasPhoneAnomaly).toBe(true);
    expect(result?.phoneNumber).toBe('555-1234');
  });

  it('accepts valid E.164 phone numbers', () => {
    const person: PcoPerson = {
      id: '1',
      type: 'Person',
      attributes: {
        birthdate: birthdate10,
        grade: 4,
        name: 'John Doe',
        phone_numbers: [{ number: '+15551234567', location: 'Mobile' }]
      },
    };
    const result = transformPerson(person);
    expect(result?.hasPhoneAnomaly).toBe(false);
    expect(result?.phoneNumber).toBe('+15551234567');
  });

  it('transforms a person with avatar correctly', () => {
    const person: PcoPerson = {
      id: '1',
      type: 'Person',
      attributes: {
        birthdate: birthdate10,
        grade: 4,
        name: 'John Doe',
        avatar: 'http://avatar.url/1.jpg',
        child: false
      },
    };

    const result = transformPerson(person);

    expect(result).toEqual(expect.objectContaining({
        avatarUrl: 'http://avatar.url/1.jpg',
        isChild: false,
        householdId: null
    }));
  });

  it('returns null if birthdate is missing', () => {
    const person: PcoPerson = {
      id: '2',
      type: 'Person',
      attributes: {
        birthdate: null,
        grade: 4,
        name: 'No Birthdate',
      },
    };
    expect(transformPerson(person)).toBeNull();
  });

  it('returns student object with null grade if grade is missing', () => {
    const person: PcoPerson = {
      id: '3',
      type: 'Person',
      attributes: {
        birthdate: birthdate10,
        grade: null,
        name: 'No Grade',
      },
    };
    const result = transformPerson(person);
    expect(result).not.toBeNull();
    expect(result?.pcoGrade).toBeNull();
    expect(result?.name).toBe('No Grade');
  });

  it('returns null if birthdate is invalid', () => {
    const person: PcoPerson = {
      id: '4',
      type: 'Person',
      attributes: {
        birthdate: 'not-a-date',
        grade: 4,
        name: 'Invalid Date',
      },
    };
    expect(transformPerson(person)).toBeNull();
  });

  it('constructs name from first and last if name is missing', () => {
    const person: PcoPerson = {
      id: '5',
      type: 'Person',
      attributes: {
        birthdate: birthdate10,
        grade: 5,
        first_name: 'Jane',
        last_name: 'Smith',
      },
    };
    const result = transformPerson(person);
    expect(result?.name).toBe('Jane Smith');
  });

  it('returns Unknown if all name fields are missing', () => {
    const person: PcoPerson = {
      id: '6',
      type: 'Person',
      attributes: {
        birthdate: birthdate10,
        grade: 6,
      },
    };
    const result = transformPerson(person);
    expect(result?.name).toBe('Unknown');
  });
});


// Sandbox Mode is only honoured when the service worker that intercepts the
// write is actually controlling the page, so tests that exercise it have to say
// which of the two worlds they are in.
const withSandboxInterceptor = (present: boolean) => {
    Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: present ? { controller: {} } : {},
    });
};
const sandboxReply = (person: PcoPerson) => ({
    data: { data: person },
    headers: { 'x-locus-sandbox-response': 'true' },
});

describe('updatePerson', () => {
    it('calls api patch with correct arguments and returns data', async () => {
        const mockPerson: PcoPerson = {
            id: '123',
            type: 'Person',
            attributes: { grade: 5 }
        };
        const mockResponse = { data: { data: mockPerson } };

        // Mock api.patch
        (api.patch as any).mockResolvedValue(mockResponse);

        const result = await updatePerson('123', { grade: 5 }, 'auth-token');

        expect(api.patch).toHaveBeenCalledWith(
            '/api/people/v2/people/123',
            {
                data: {
                    type: 'Person',
                    id: '123',
                    attributes: { grade: 5 }
                }
            },
            {
                headers: {
                    Authorization: 'Basic auth-token',
                    'Content-Type': 'application/json'
                }
            }
        );
        expect(result).toEqual(mockPerson);
    });

    it('injects sandbox header when sandboxMode is true', async () => {
        const mockPerson: PcoPerson = {
            id: '123',
            type: 'Person',
            attributes: { grade: 5 }
        };
        withSandboxInterceptor(true);
        (api.patch as any).mockResolvedValue(sandboxReply(mockPerson));

        await updatePerson('123', { grade: 5 }, 'auth-token', true);

        expect(api.patch).toHaveBeenCalledWith(
            '/api/people/v2/people/123',
            expect.any(Object),
            expect.objectContaining({
                headers: expect.objectContaining({
                    'X-Locus-Sandbox': 'true'
                })
            })
        );
    });

    it('does not inject sandbox header when sandboxMode is false/undefined', async () => {
        const mockPerson: PcoPerson = {
            id: '123',
            type: 'Person',
            attributes: { grade: 5 }
        };
        const mockResponse = { data: { data: mockPerson } };
        (api.patch as any).mockResolvedValue(mockResponse);

        await updatePerson('123', { grade: 5 }, 'auth-token');

        expect(api.patch).toHaveBeenCalledWith(
            '/api/people/v2/people/123',
            expect.any(Object),
            expect.objectContaining({
                headers: expect.not.objectContaining({
                    'X-Locus-Sandbox': 'true'
                })
            })
        );
    });
});

describe('fetchCheckInCount', () => {
    it('fetches check in count successfully', async () => {
        (api.get as any).mockResolvedValue({
            data: { data: { attributes: { check_in_count: 42 } } }
        });

        const count = await fetchCheckInCount('123', 'token');
        expect(count).toBe(42);
        expect(api.get).toHaveBeenCalledWith(
            '/api/check-ins/v2/people/123',
            expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Basic token' }) })
        );
    });

    it('returns null on failure', async () => {
        (api.get as any).mockRejectedValue(new Error('Failed'));
        const count = await fetchCheckInCount('123', 'token');
        expect(count).toBeNull();
    });
});

describe('fetchAllPeople', () => {
    it('fetches all pages recursively', async () => {
        const page1 = {
            links: { next: 'http://api.pco/next' },
            data: [{ id: '1', type: 'Person', attributes: { name: 'A' } }]
        };
        const page2 = {
            links: {},
            data: [{ id: '2', type: 'Person', attributes: { name: 'B' } }]
        };

        (api.get as any)
            .mockResolvedValueOnce({ data: page1 })
            .mockResolvedValueOnce({ data: page2 });

        const result = await fetchAllPeople('auth-token');

        expect(result.people).toHaveLength(2);
        expect(result.people[0].id).toBe('1');
        expect(result.people[1].id).toBe('2');
        expect(result.nextUrl).toBeUndefined();
        expect(api.get).toHaveBeenCalledTimes(2);
        expect(api.get).toHaveBeenNthCalledWith(1, `/api/people/v2/people?per_page=100&include=${PEOPLE_INCLUDES}`, expect.any(Object));
        expect(api.get).toHaveBeenNthCalledWith(2, 'http://api.pco/next', expect.any(Object));
    });

    it('uses proxy for absolute URLs in next links', async () => {
        const page1 = {
            links: { next: 'https://api.planningcenteronline.com/next' },
            data: [{ id: '1', type: 'Person', attributes: { name: 'A' } }]
        };
        const page2 = {
            links: {},
            data: [{ id: '2', type: 'Person', attributes: { name: 'B' } }]
        };

        (api.get as any)
            .mockResolvedValueOnce({ data: page1 })
            .mockResolvedValueOnce({ data: page2 });

        await fetchAllPeople('auth-token');

        expect(api.get).toHaveBeenNthCalledWith(2, '/api/next', expect.any(Object));
    });

    it('fetches single page correctly', async () => {
        const page1 = {
            links: {},
            data: [{ id: '1', type: 'Person', attributes: { name: 'A' } }]
        };

        (api.get as any).mockResolvedValueOnce({ data: page1 });

        const result = await fetchAllPeople('auth-token');

        expect(result.people).toHaveLength(1);
        expect(api.get).toHaveBeenCalledTimes(1);
    });

    it('stops fetching after maxPages and returns nextUrl', async () => {
        const page1 = {
            links: { next: 'http://api.pco/next' },
            data: [{ id: '1', type: 'Person', attributes: { name: 'A' } }]
        };

        (api.get as any).mockResolvedValueOnce({ data: page1 });

        const result = await fetchAllPeople('auth-token', undefined, 1);

        expect(result.people).toHaveLength(1);
        expect(result.nextUrl).toBe('http://api.pco/next');
        expect(api.get).toHaveBeenCalledTimes(1);
    });
});

describe('checkApiVersion', () => {
  it('returns true on success', async () => {
    (api.get as any).mockResolvedValue({ status: 200 });

    const result = await checkApiVersion('token');

    expect(result).toBe(true);
    expect(api.get).toHaveBeenCalledWith(
        '/api/people/v2/people',
        {
            params: { per_page: 1 },
            headers: { Authorization: 'Basic token' }
        }
    );
  });

  it('throws Unauthorized error on 401', async () => {
    const error = new AxiosError('Unauthorized');
    error.response = { status: 401 } as any;
    (api.get as any).mockRejectedValue(error);

    await expect(checkApiVersion('token')).rejects.toThrow('Unauthorized: Invalid credentials.');
  });

  it('throws API Error on 404', async () => {
    const error = new AxiosError('Not Found');
    error.response = { status: 404 } as any;
    (api.get as any).mockRejectedValue(error);

    await expect(checkApiVersion('token')).rejects.toThrow('API Error: Version mismatch or endpoint not found.');
  });

  it('rethrows other errors', async () => {
    const error = new Error('Network Error');
    (api.get as any).mockRejectedValue(error);

    await expect(checkApiVersion('token')).rejects.toThrow('Network Error');
  });
});

describe('prepareUpdateAttributes', () => {
    // Helper to create a partial student
    const createStudent = (overrides: Partial<Student>): Student => ({
        id: '1',
        age: 10,
        pcoGrade: 5,
        name: 'Test',
        firstName: 'Test',
        lastName: 'Student',
        birthdate: '2010-01-01',
        calculatedGrade: 5,
        delta: 0,
        lastCheckInAt: null,
        checkInCount: 0,
        isChild: true,
        householdId: null,
        hasNameAnomaly: false,
        hasEmailAnomaly: false,
        hasAddressAnomaly: false,
        hasPhoneAnomaly: false,
        firstTimeGiver: false,
        firstGiftDate: null,
        ...overrides
    });

    it('returns empty object if no changes', () => {
        const student = createStudent({});
        const result = prepareUpdateAttributes(student, student);
        expect(result).toEqual({});
    });

    it('detects grade change', () => {
        const original = createStudent({ pcoGrade: 5 });
        const updated = createStudent({ pcoGrade: 6 });
        const result = prepareUpdateAttributes(original, updated);
        expect(result).toEqual({ grade: 6 });
    });

    it('detects birthdate change', () => {
        const original = createStudent({ birthdate: '2010-01-01' });
        const updated = createStudent({ birthdate: '2010-01-02' });
        const result = prepareUpdateAttributes(original, updated);
        expect(result).toEqual({ birthdate: '2010-01-02' });
    });

    it('detects name change', () => {
        const original = createStudent({ firstName: 'Test', lastName: 'Student' });
        const updated = createStudent({ firstName: 'New', lastName: 'Name' });
        const result = prepareUpdateAttributes(original, updated);
        expect(result).toEqual({ first_name: 'New', last_name: 'Name' });
    });

    it('detects email change', () => {
        const original = createStudent({ email: 'old@test.com' });
        const updated = createStudent({ email: 'new@test.com' });
        const result = prepareUpdateAttributes(original, updated);
        expect(result).toEqual({ email_addresses: [{ address: 'new@test.com', location: 'Home' }] });
    });

    it('detects address change', () => {
        const original = createStudent({ address: { street: 'Old St', city: 'City', state: 'ST', zip: '12345' } });
        const updated = createStudent({ address: { street: 'New St', city: 'City', state: 'ST', zip: '12345' } });
        const result = prepareUpdateAttributes(original, updated);
        expect(result).toEqual({ addresses: [{ street: 'New St', city: 'City', state: 'ST', zip: '12345', location: 'Home' }] });
    });

    it('detects phone change', () => {
        const original = createStudent({ phoneNumber: '123' });
        const updated = createStudent({ phoneNumber: '456' });
        const result = prepareUpdateAttributes(original, updated);
        expect(result).toEqual({ phone_numbers: [{ number: '456', location: 'Mobile' }] });
    });
});

// --- pcomirror compatibility -------------------------------------------------
//
// pcomirror is a local mirror of the PCO People API that this app can be pointed
// at with a base-URL + credential swap. Two things about it differ from the mock
// this app was written against, and both used to break silently.

describe('toProxyPath', () => {
    it('routes absolute PCO links through the dev proxy', () => {
        expect(toProxyPath('https://api.planningcenteronline.com/people/v2/people?offset=100'))
            .toBe('/api/people/v2/people?offset=100');
    });

    it('routes pcomirror relative links through the dev proxy', () => {
        // The regression. pcomirror rewrites every PCO URL it serves to a
        // mirror-relative path, so the old `.replace(origin, '/api')` was a
        // no-op: the request bypassed the proxy, the dev server answered with
        // index.html, and paging stopped after page one.
        expect(toProxyPath('/people/v2/people?offset=100&per_page=100'))
            .toBe('/api/people/v2/people?offset=100&per_page=100');
        expect(toProxyPath('/check-ins/v2/check_ins?offset=100'))
            .toBe('/api/check-ins/v2/check_ins?offset=100');
    });

    it('leaves an already-proxied path alone', () => {
        expect(toProxyPath('/api/people/v2/people?per_page=100'))
            .toBe('/api/people/v2/people?per_page=100');
    });

    it('leaves a non-PCO absolute URL alone', () => {
        // The simulator test addresses the mock API directly rather than through
        // the proxy, and must keep working.
        expect(toProxyPath('http://localhost:3000/people/v2/people?per_page=50'))
            .toBe('http://localhost:3000/people/v2/people?per_page=50');
    });
});

describe('flattenIncluded', () => {
    const response = {
        data: [{
            id: '1', type: 'Person',
            attributes: { name: 'Ada Byron', birthdate: '1990-01-01' },
            relationships: {
                emails: { data: [{ type: 'Email', id: 'e1' }] },
                phone_numbers: { data: [{ type: 'PhoneNumber', id: 'p1' }] },
                addresses: { data: [{ type: 'Address', id: 'a1' }] },
                households: { data: [{ type: 'Household', id: 'h1' }] },
            },
        }],
        included: [
            { id: 'e1', type: 'Email', attributes: { address: 'ada@example.com', location: 'Home' } },
            { id: 'p1', type: 'PhoneNumber', attributes: { number: '555-1234', location: 'Mobile' } },
            { id: 'a1', type: 'Address', attributes: { street: '1 Main St', city: 'Springfield', state: 'CA', zip: '90001', location: 'Home' } },
            { id: 'h1', type: 'Household', attributes: { name: 'Byron' } },
        ],
        meta: { total_count: 1, count: 1 },
    } as any;

    it('folds sideloaded contact details onto the person', () => {
        // Real PCO does not put these on the Person; the mock did. Without this
        // every person arrived with no email, phone or address and a null
        // household, silently disabling hygiene, duplicates and the map.
        const [person] = flattenIncluded(response);
        expect(person.attributes.email_addresses).toEqual([{ address: 'ada@example.com', location: 'Home' }]);
        expect(person.attributes.phone_numbers).toEqual([{ number: '555-1234', location: 'Mobile' }]);
        expect(person.attributes.addresses?.[0]).toMatchObject({ street: '1 Main St', zip: '90001' });
        expect(person.attributes.household_id).toBe('h1');
    });

    it('leaves inline attributes alone when the response already has them', () => {
        // The mock API inlines all four. It must round-trip untouched.
        const inline = {
            ...response,
            data: [{
                ...response.data[0],
                attributes: {
                    ...response.data[0].attributes,
                    email_addresses: [{ address: 'inline@example.com', location: 'Work' }],
                    household_id: 'inline-household',
                },
            }],
        };
        const [person] = flattenIncluded(inline);
        expect(person.attributes.email_addresses).toEqual([{ address: 'inline@example.com', location: 'Work' }]);
        expect(person.attributes.household_id).toBe('inline-household');
    });

    it('passes data straight through when there is nothing sideloaded', () => {
        const bare = { data: [{ id: '1', type: 'Person', attributes: { name: 'A' } }], meta: { total_count: 1, count: 1 } } as any;
        expect(flattenIncluded(bare)).toBe(bare.data);
    });

    it('survives a relationship whose sideload is missing', () => {
        const partial = { ...response, included: [response.included[0]] };
        const [person] = flattenIncluded(partial);
        expect(person.attributes.email_addresses).toHaveLength(1);
        expect(person.attributes.phone_numbers).toBeUndefined();
    });

    it('is applied by fetchAllPeople, so transformPerson sees the contact details', () => {
        (api.get as any).mockResolvedValueOnce({ data: { ...response, links: {} } });
        return fetchAllPeople('auth-token').then(({ people }) => {
            expect(people[0].attributes.email_addresses).toEqual([
                { address: 'ada@example.com', location: 'Home' },
            ]);
            const student = transformPerson(people[0] as any);
            expect(student?.email).toBe('ada@example.com');
            expect(student?.householdId).toBe('h1');
        });
    });
});

describe('updatePerson contact writes', () => {
    const auth = 'auth-token';
    const person = { id: '1', type: 'Person', attributes: {} };

    beforeEach(() => {
        (api.patch as any).mockResolvedValue({ data: { data: person } });
        (api.post as any).mockResolvedValue({ data: { data: person } });
        (api.get as any).mockResolvedValue({ data: { data: [] } });
    });

    it('patches the existing email record rather than the person', async () => {
        // The regression. PCO keeps emails at /people/{id}/emails, so naming
        // `email_addresses` on the Person was a write it accepted and ignored:
        // ReviewMode's "Fix All" reported a corrected address and changed nothing.
        (api.get as any).mockResolvedValue({ data: { data: [{ id: 'e1' }] } });

        await updatePerson('1', { email_addresses: [{ address: 'fixed@example.com', location: 'Home' }] }, auth);

        expect(api.get).toHaveBeenCalledWith('/api/people/v2/people/1/emails', expect.any(Object));
        expect(api.patch).toHaveBeenCalledWith(
            '/api/people/v2/people/1/emails/e1',
            { data: { type: 'Email', id: 'e1', attributes: { address: 'fixed@example.com', location: 'Home' } } },
            expect.any(Object),
        );
        // and never onto the person itself
        expect(api.patch).not.toHaveBeenCalledWith(
            '/api/people/v2/people/1', expect.anything(), expect.anything());
    });

    it('creates a record when the person has none', async () => {
        (api.get as any).mockResolvedValue({ data: { data: [] } });

        await updatePerson('1', { phone_numbers: [{ number: '+15551234567', location: 'Mobile' }] }, auth);

        expect(api.post).toHaveBeenCalledWith(
            '/api/people/v2/people/1/phone_numbers',
            { data: { type: 'PhoneNumber', attributes: { number: '+15551234567', location: 'Mobile' } } },
            expect.any(Object),
        );
    });

    it('updates in place rather than accumulating duplicates', async () => {
        // A cleanup tool that appends a corrected address beside the stale one is
        // a source of the duplicates it exists to remove.
        (api.get as any).mockResolvedValue({ data: { data: [{ id: 'a1' }] } });

        await updatePerson('1', { addresses: [{ street: '1 Main St', city: 'Springfield', state: 'CA', zip: '90001', location: 'Home' }] }, auth);

        expect(api.post).not.toHaveBeenCalled();
        expect(api.patch).toHaveBeenCalledWith(
            '/api/people/v2/people/1/addresses/a1', expect.any(Object), expect.any(Object));
    });

    it('splits a mixed edit between the person and its contact records', async () => {
        (api.get as any).mockResolvedValue({ data: { data: [{ id: 'e1' }] } });

        await updatePerson('1', {
            first_name: 'Ada',
            email_addresses: [{ address: 'ada@example.com', location: 'Home' }],
        }, auth);

        expect(api.patch).toHaveBeenCalledWith(
            '/api/people/v2/people/1',
            { data: { type: 'Person', id: '1', attributes: { first_name: 'Ada' } } },
            expect.any(Object),
        );
        expect(api.patch).toHaveBeenCalledWith(
            '/api/people/v2/people/1/emails/e1', expect.any(Object), expect.any(Object));
    });

    it('carries the sandbox header onto the contact writes too', async () => {
        withSandboxInterceptor(true);
        (api.get as any).mockResolvedValue({ data: { data: [{ id: 'e1' }] } });

        await updatePerson('1', { email_addresses: [{ address: 'a@b.com', location: 'Home' }] }, auth, true);

        expect(api.patch).toHaveBeenCalledWith(
            '/api/people/v2/people/1/emails/e1',
            expect.any(Object),
            expect.objectContaining({ headers: expect.objectContaining({ 'X-Locus-Sandbox': 'true' }) }),
        );
    });

    it('refuses to write at all when Sandbox Mode is on but the interceptor is not running', async () => {
        // The dangerous case: header attached, request sent, PATCH lands in real
        // Planning Center, banner still claims the change was simulated.
        withSandboxInterceptor(false);

        await expect(updatePerson('1', { grade: 5 }, auth, true))
            .rejects.toThrow(/would have gone to Planning Center for real/);
        expect(api.patch).not.toHaveBeenCalled();
    });

    it('reports it when a sandbox write reaches PCO anyway', async () => {
        // Controller present at the start, but the reply came back without the
        // interceptor's marker — the worker went away and the write is live.
        withSandboxInterceptor(true);
        (api.patch as any).mockResolvedValue({ data: { data: person }, headers: {} });

        await expect(updatePerson('1', { grade: 5 }, auth, true))
            .rejects.toThrow(/reached Planning Center/);
    });

    it('does not consult the interceptor when Sandbox Mode is off', async () => {
        withSandboxInterceptor(false);
        (api.patch as any).mockResolvedValue({ data: { data: person }, headers: {} });

        await expect(updatePerson('1', { grade: 5 }, auth)).resolves.toBeTruthy();
    });

    it('reads the person back when only contacts changed', async () => {
        (api.get as any)
            .mockResolvedValueOnce({ data: { data: [{ id: 'e1' }] } })
            .mockResolvedValueOnce({ data: { data: person } });

        const result = await updatePerson('1', { email_addresses: [{ address: 'a@b.com', location: 'Home' }] }, auth);

        expect(result).toEqual(person);
        expect(api.get).toHaveBeenLastCalledWith('/api/people/v2/people/1', expect.any(Object));
    });

    it('still sends a plain attribute edit as one patch on the person', async () => {
        await updatePerson('1', { grade: 5 }, auth);

        expect(api.patch).toHaveBeenCalledTimes(1);
        expect(api.get).not.toHaveBeenCalled();
        expect(api.post).not.toHaveBeenCalled();
    });
});

describe('isMinor', () => {
    // Each clause guards a case the others miss. Every consumer of this
    // predicate — the newsletter, the small group sorter, recruitment — is
    // deciding whether someone may be treated as an adult, so a gap here is a
    // gap in all of them at once.
    it('accepts an adult with a plausible birthdate', () => {
        expect(isMinor({ isChild: false, age: 42 })).toBe(false);
    });

    it('rejects anyone PCO has flagged as a child', () => {
        expect(isMinor({ isChild: true, age: 12 })).toBe(true);
    });

    it('rejects a minor the office never flagged', () => {
        // The `child` attribute is maintained by hand, so this is the common case.
        expect(isMinor({ isChild: false, age: 14 })).toBe(true);
    });

    it('rejects a placeholder birthdate that computes an implausible age', () => {
        // 1900-01-01 and friends are valid dates that clear an age >= 18 check
        // while telling us nothing at all about who the person is.
        expect(isMinor({ isChild: false, age: 126 })).toBe(true);
    });

    it('rejects someone still flagged as a child after their eighteenth birthday', () => {
        // Stale in the other direction. Over-protecting costs a missing row.
        expect(isMinor({ isChild: true, age: 19 })).toBe(true);
    });

    it('treats the boundary birthday as adult', () => {
        expect(isMinor({ isChild: false, age: 18 })).toBe(false);
    });
});

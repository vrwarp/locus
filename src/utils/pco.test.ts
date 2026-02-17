import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './api';
import { transformPerson, updatePerson, fetchAllPeople, fetchCheckInCount, fetchGroupCount, checkApiVersion, prepareUpdateAttributes } from './pco';
import type { PcoPerson, Student } from './pco';
import { calculateExpectedGrade } from './grader';
import { subYears, format } from 'date-fns';
import { AxiosError } from 'axios';

vi.mock('./api', () => {
    return {
        default: {
            get: vi.fn(),
            patch: vi.fn(),
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
      groupCount: null,
      avatarUrl: undefined,
      isChild: true,
      householdId: 'hh1',
      hasNameAnomaly: false,
      email: undefined,
      address: undefined,
      hasEmailAnomaly: false,
      hasAddressAnomaly: false,
      hasPhoneAnomaly: false,
      phoneNumber: undefined
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
        const mockResponse = { data: { data: mockPerson } };
        (api.patch as any).mockResolvedValue(mockResponse);

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

describe('fetchGroupCount', () => {
    it('fetches group count successfully', async () => {
        (api.get as any).mockResolvedValue({
            data: { meta: { total_count: 5 } }
        });

        const count = await fetchGroupCount('123', 'token');
        expect(count).toBe(5);
        expect(api.get).toHaveBeenCalledWith(
            '/groups/v2/people/123/memberships',
            expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Basic token' }) })
        );
    });

    it('returns null on failure', async () => {
        (api.get as any).mockRejectedValue(new Error('Failed'));
        const count = await fetchGroupCount('123', 'token');
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
        expect(api.get).toHaveBeenNthCalledWith(1, '/api/people/v2/people?per_page=100', expect.any(Object));
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
        groupCount: 0,
        isChild: true,
        householdId: null,
        hasNameAnomaly: false,
        hasEmailAnomaly: false,
        hasAddressAnomaly: false,
        hasPhoneAnomaly: false,
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

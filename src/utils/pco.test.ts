import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { transformPerson, updatePerson, fetchAllPeople, fetchCheckInCount, fetchGroupCount, PcoPerson } from './pco';
import { calculateExpectedGrade } from './grader';
import { subYears, format } from 'date-fns';

vi.mock('axios');

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
      },
    };

    const result = transformPerson(person);

    expect(result).not.toBeNull();

    // We expect specific fields.
    // Note: calculatedGrade depends on the exact date logic in grader.ts.
    // We use the same function here to verify consistency.
    const expectedGrade = calculateExpectedGrade(new Date(birthdate10));

    expect(result).toEqual({
      id: '1',
      age: 10,
      pcoGrade: 4,
      name: 'John Doe',
      birthdate: birthdate10,
      calculatedGrade: expectedGrade,
      delta: expectedGrade - 4,
      lastCheckInAt: null,
      checkInCount: null,
      groupCount: null,
      avatarUrl: undefined
    });
  });

  it('transforms a person with avatar correctly', () => {
    const person: PcoPerson = {
      id: '1',
      type: 'Person',
      attributes: {
        birthdate: birthdate10,
        grade: 4,
        name: 'John Doe',
        avatar: 'http://avatar.url/1.jpg'
      },
    };

    const result = transformPerson(person);

    expect(result).toEqual(expect.objectContaining({
        avatarUrl: 'http://avatar.url/1.jpg'
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

  it('returns null if grade is missing', () => {
    const person: PcoPerson = {
      id: '3',
      type: 'Person',
      attributes: {
        birthdate: birthdate10,
        grade: null,
        name: 'No Grade',
      },
    };
    expect(transformPerson(person)).toBeNull();
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
    it('calls axios patch with correct arguments and returns data', async () => {
        const mockPerson: PcoPerson = {
            id: '123',
            type: 'Person',
            attributes: { grade: 5 }
        };
        const mockResponse = { data: { data: mockPerson } };

        // Mock axios.patch
        (axios.patch as any).mockResolvedValue(mockResponse);

        const result = await updatePerson('123', { grade: 5 }, 'auth-token');

        expect(axios.patch).toHaveBeenCalledWith(
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
        (axios.patch as any).mockResolvedValue(mockResponse);

        await updatePerson('123', { grade: 5 }, 'auth-token', true);

        expect(axios.patch).toHaveBeenCalledWith(
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
        (axios.patch as any).mockResolvedValue(mockResponse);

        await updatePerson('123', { grade: 5 }, 'auth-token');

        expect(axios.patch).toHaveBeenCalledWith(
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
        (axios.get as any).mockResolvedValue({
            data: { data: { attributes: { check_in_count: 42 } } }
        });

        const count = await fetchCheckInCount('123', 'token');
        expect(count).toBe(42);
        expect(axios.get).toHaveBeenCalledWith(
            '/api/check-ins/v2/people/123',
            expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Basic token' }) })
        );
    });

    it('returns null on failure', async () => {
        (axios.get as any).mockRejectedValue(new Error('Failed'));
        const count = await fetchCheckInCount('123', 'token');
        expect(count).toBeNull();
    });
});

describe('fetchGroupCount', () => {
    it('fetches group count successfully', async () => {
        (axios.get as any).mockResolvedValue({
            data: { meta: { total_count: 5 } }
        });

        const count = await fetchGroupCount('123', 'token');
        expect(count).toBe(5);
        expect(axios.get).toHaveBeenCalledWith(
            '/api/groups/v2/group_memberships?where[person_id]=123',
            expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Basic token' }) })
        );
    });

    it('returns null on failure', async () => {
        (axios.get as any).mockRejectedValue(new Error('Failed'));
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

        (axios.get as any)
            .mockResolvedValueOnce({ data: page1 })
            .mockResolvedValueOnce({ data: page2 });

        const result = await fetchAllPeople('auth-token');

        expect(result.people).toHaveLength(2);
        expect(result.people[0].id).toBe('1');
        expect(result.people[1].id).toBe('2');
        expect(result.nextUrl).toBeUndefined();
        expect(axios.get).toHaveBeenCalledTimes(2);
        expect(axios.get).toHaveBeenNthCalledWith(1, '/api/people/v2/people?per_page=100', expect.any(Object));
        expect(axios.get).toHaveBeenNthCalledWith(2, 'http://api.pco/next', expect.any(Object));
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

        (axios.get as any)
            .mockResolvedValueOnce({ data: page1 })
            .mockResolvedValueOnce({ data: page2 });

        await fetchAllPeople('auth-token');

        expect(axios.get).toHaveBeenNthCalledWith(2, '/api/next', expect.any(Object));
    });

    it('fetches single page correctly', async () => {
        const page1 = {
            links: {},
            data: [{ id: '1', type: 'Person', attributes: { name: 'A' } }]
        };

        (axios.get as any).mockResolvedValueOnce({ data: page1 });

        const result = await fetchAllPeople('auth-token');

        expect(result.people).toHaveLength(1);
        expect(axios.get).toHaveBeenCalledTimes(1);
    });

    it('stops fetching after maxPages and returns nextUrl', async () => {
        const page1 = {
            links: { next: 'http://api.pco/next' },
            data: [{ id: '1', type: 'Person', attributes: { name: 'A' } }]
        };

        (axios.get as any).mockResolvedValueOnce({ data: page1 });

        const result = await fetchAllPeople('auth-token', undefined, 1);

        expect(result.people).toHaveLength(1);
        expect(result.nextUrl).toBe('http://api.pco/next');
        expect(axios.get).toHaveBeenCalledTimes(1);
    });
});

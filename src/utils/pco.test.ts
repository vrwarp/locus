import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';
import { transformPerson, updatePerson, PcoPerson } from './pco';
import { calculateExpectedGrade } from './grader';
import { subYears, format } from 'date-fns';

vi.mock('axios');

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
      delta: expectedGrade - 4
    });
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
});

import { describe, it, expect } from 'vitest';
import { calculateCityClusters, suggestCampusLocations } from './geospatial';
import type { Student } from './pco';

describe('geospatial utilities', () => {
  const createStudent = (id: string, city: string | undefined): Student => ({
    id,
    age: 30,
    pcoGrade: null,
    name: `Student ${id}`,
    firstName: `First ${id}`,
    lastName: `Last ${id}`,
    birthdate: '1990-01-01',
    calculatedGrade: 0,
    delta: 0,
    lastCheckInAt: null,
    checkInCount: 0,
    groupCount: 0,
    isChild: false,
    householdId: null,
    hasNameAnomaly: false,
    hasEmailAnomaly: false,
    hasAddressAnomaly: false,
    hasPhoneAnomaly: false,
    address: city ? { city, street: '', state: '', zip: '' } : undefined,
  });

  describe('calculateCityClusters', () => {
    it('groups members by city and sorts descending', () => {
      const students = [
        createStudent('1', 'Austin'),
        createStudent('2', 'Dallas'),
        createStudent('3', 'Austin'),
        createStudent('4', 'Houston'),
        createStudent('5', 'Austin'),
        createStudent('6', 'Dallas'),
      ];

      const clusters = calculateCityClusters(students);

      expect(clusters).toEqual([
        { city: 'Austin', count: 3 },
        { city: 'Dallas', count: 2 },
        { city: 'Houston', count: 1 },
      ]);
    });

    it('ignores members without a city', () => {
      const students = [
        createStudent('1', 'Austin'),
        createStudent('2', undefined),
        createStudent('3', '   '),
      ];

      const clusters = calculateCityClusters(students);

      expect(clusters).toEqual([
        { city: 'Austin', count: 1 },
      ]);
    });

    it('normalizes city names', () => {
      const students = [
        createStudent('1', 'austin'),
        createStudent('2', 'AUSTIN'),
        createStudent('3', 'San antonio'),
        createStudent('4', ' SAN ANTONIO '),
      ];

      const clusters = calculateCityClusters(students);

      expect(clusters).toEqual([
        { city: 'Austin', count: 2 },
        { city: 'San Antonio', count: 2 },
      ]);
    });
  });

  describe('suggestCampusLocations', () => {
    it('suggests cities that meet the threshold, excluding the primary city', () => {
      const clusters = [
        { city: 'Primary City', count: 100 },
        { city: 'Suburbs North', count: 20 },
        { city: 'Suburbs South', count: 15 },
        { city: 'Rural Town', count: 5 },
      ];

      const suggestions = suggestCampusLocations(clusters, 15);

      expect(suggestions).toEqual([
        { city: 'Suburbs North', count: 20 },
        { city: 'Suburbs South', count: 15 },
      ]);
    });

    it('returns empty array if no cities meet threshold other than primary', () => {
      const clusters = [
        { city: 'Primary City', count: 100 },
        { city: 'Rural Town 1', count: 10 },
        { city: 'Rural Town 2', count: 5 },
      ];

      const suggestions = suggestCampusLocations(clusters, 15);
      expect(suggestions).toEqual([]);
    });

    it('returns empty array if only one city exists', () => {
        const clusters = [
            { city: 'Primary City', count: 100 },
        ];
        const suggestions = suggestCampusLocations(clusters, 15);
        expect(suggestions).toEqual([]);
    });
  });
});

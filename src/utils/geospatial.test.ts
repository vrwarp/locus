import { describe, it, expect } from 'vitest';
import { calculateGeospatialClusters, suggestCampusPlant } from './geospatial';
import type { Student } from './pco';

describe('geospatial utils', () => {
    it('calculates geospatial clusters', () => {
        const students = [
            { id: '1', address: { city: 'Springfield' } },
            { id: '2', address: { city: 'Springfield' } },
            { id: '3', address: { city: 'Rivertown' } },
            { id: '4', address: null },
            { id: '5', address: { city: 'Lakeside' } },
            { id: '6', address: { city: 'Lakeside' } },
            { id: '7', address: { city: 'Lakeside' } },
        ] as unknown as Student[];

        const clusters = calculateGeospatialClusters(students);
        expect(clusters).toEqual([
            { city: 'Lakeside', count: 3 },
            { city: 'Springfield', count: 2 },
            { city: 'Rivertown', count: 1 },
        ]);
    });

    it('suggests a campus plant', () => {
        const clusters = [
            { city: 'Lakeside', count: 300 },
            { city: 'Springfield', count: 150 },
            { city: 'Rivertown', count: 50 },
        ];
        expect(suggestCampusPlant(clusters)).toBe('Springfield');
    });

    it('returns null for plant suggestion if not enough clusters', () => {
        expect(suggestCampusPlant([{ city: 'Lakeside', count: 10 }])).toBeNull();
        expect(suggestCampusPlant([])).toBeNull();
    });
});

import type { Student } from './pco';

export interface CityCluster {
    city: string;
    count: number;
}

export const calculateGeospatialClusters = (students: Student[]): CityCluster[] => {
    const cityCounts: Record<string, number> = {};
    for (const student of students) {
        if (student.address && student.address.city) {
            const city = student.address.city;
            cityCounts[city] = (cityCounts[city] || 0) + 1;
        }
    }

    return Object.entries(cityCounts)
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count);
};

export const suggestCampusPlant = (clusters: CityCluster[]): string | null => {
    if (clusters.length < 2) return null;
    // Assuming the largest cluster is the main campus, the second largest is the best candidate
    return clusters[1].city;
};

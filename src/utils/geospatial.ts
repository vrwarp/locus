import type { Student } from './pco';

export interface CityCluster {
  city: string;
  count: number;
}

export const calculateCityClusters = (students: Student[]): CityCluster[] => {
  const clusters: Record<string, number> = {};

  students.forEach((student) => {
    if (student.address?.city) {
      // Normalize city name (capitalize first letters)
      const city = student.address.city
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
        .trim();

      if (city) {
        clusters[city] = (clusters[city] || 0) + 1;
      }
    }
  });

  return Object.entries(clusters)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count); // Sort descending by count
};

export const suggestCampusLocations = (clusters: CityCluster[], threshold = 15): CityCluster[] => {
  // Suggest a campus if a city has a high density but is not the primary city (which we assume is the one with the most members)
  if (clusters.length <= 1) return [];

  const primaryCity = clusters[0].city;

  return clusters
    .filter((c) => c.city !== primaryCity && c.count >= threshold)
    .sort((a, b) => b.count - a.count);
};

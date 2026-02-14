import type { Student } from './pco';

export interface GenerationStat {
  name: string;
  count: number;
  fill: string;
}

export const GENERATIONS = [
  { name: 'Gen Alpha', start: 2013, end: new Date().getFullYear(), color: '#8884d8' },
  { name: 'Gen Z', start: 1997, end: 2012, color: '#82ca9d' },
  { name: 'Millennials', start: 1981, end: 1996, color: '#ffc658' },
  { name: 'Gen X', start: 1965, end: 1980, color: '#ff7300' },
  { name: 'Boomers', start: 1946, end: 1964, color: '#d0ed57' },
  { name: 'Silent', start: 1928, end: 1945, color: '#a4de6c' },
  { name: 'Greatest', start: 0, end: 1927, color: '#8dd1e1' },
];

export const calculateDemographics = (students: Student[]): GenerationStat[] => {
  const stats: Record<string, number> = {};

  // Initialize counts
  GENERATIONS.forEach(gen => {
    stats[gen.name] = 0;
  });
  stats['Unknown'] = 0;

  students.forEach(student => {
    if (!student.birthdate) {
      stats['Unknown']++;
      return;
    }

    const birthYear = new Date(student.birthdate).getFullYear();
    if (isNaN(birthYear)) {
      stats['Unknown']++;
      return;
    }

    const generation = GENERATIONS.find(gen => birthYear >= gen.start && birthYear <= gen.end);

    if (generation) {
      stats[generation.name]++;
    } else {
      // Future or very old (unlikely given "Greatest" starts at 0)
      stats['Unknown']++;
    }
  });

  return GENERATIONS.map(gen => ({
    name: gen.name,
    count: stats[gen.name],
    fill: gen.color
  }));
};

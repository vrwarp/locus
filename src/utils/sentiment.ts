import type { Student } from './pco';
import { GENERATIONS } from './demographics';

export interface SentimentData {
  text: string;
  value: number;
}

export const calculateSentimentPulse = (
  students: Student[],
  demographic: string = 'All'
): SentimentData[] => {
  const themes = new Map<string, number>();

  let filteredStudents = students;

  if (demographic && demographic !== 'All') {
    filteredStudents = students.filter(student => {
      if (!student.birthdate) return false;
      const birthYear = new Date(student.birthdate).getFullYear();
      if (isNaN(birthYear)) return false;

      const generation = GENERATIONS.find(gen => birthYear >= gen.start && birthYear <= gen.end);
      return generation && generation.name === demographic;
    });
  }

  // Use prayerTopic as the source of "Sentiment"
  filteredStudents.forEach(student => {
    if (student.prayerTopic) {
      // Clean up the topic string slightly to make it look like a theme
      // By capitalizing it properly
      const topic = student.prayerTopic.charAt(0).toUpperCase() + student.prayerTopic.slice(1).toLowerCase();

      themes.set(topic, (themes.get(topic) || 0) + 1);
    }
  });

  // Convert map to array format
  const result: SentimentData[] = [];
  themes.forEach((value, text) => {
    result.push({ text, value });
  });

  // Sort by highest frequency
  result.sort((a, b) => b.value - a.value);

  return result;
};
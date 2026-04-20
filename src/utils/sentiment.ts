import type { Student } from './pco';

export interface SentimentData {
  text: string;
  value: number;
}

export const calculateSentimentPulse = (students: Student[]): SentimentData[] => {
  const themes = new Map<string, number>();

  // Use prayerTopic as the source of "Sentiment"
  students.forEach(student => {
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
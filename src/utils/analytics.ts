import type { Student } from './pco';

export interface HealthStats {
  score: number;
  total: number;
  anomalies: number;
  accuracy: number;
}

export const calculateHealthStats = (students: Student[]): HealthStats => {
  const total = students.length;
  if (total === 0) {
    return {
      score: 0,
      total: 0,
      anomalies: 0,
      accuracy: 0,
    };
  }

  const anomalies = students.filter((s) => s.delta !== 0).length;
  const valid = total - anomalies;
  const accuracy = (valid / total) * 100;

  // Score is essentially the accuracy percentage rounded
  const score = Math.round(accuracy);

  return {
    score,
    total,
    anomalies,
    accuracy,
  };
};

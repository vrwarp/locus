import { differenceInDays, parseISO } from 'date-fns';
import type { Student, PcoCheckIn } from './pco';

export interface DriftResult {
  student: Student;
  recentCount: number;
  previousCount: number;
  dropPercentage: number;
}

export const calculateDrift = (
  students: Student[],
  checkIns: PcoCheckIn[],
  referenceDate: Date = new Date()
): DriftResult[] => {
  const checkInCounts: Record<string, { recent: number; previous: number }> = {};

  for (const student of students) {
    checkInCounts[student.id] = { recent: 0, previous: 0 };
  }

  for (const checkIn of checkIns) {
    const personId = checkIn.relationships?.person?.data?.id;
    if (!personId || !checkInCounts[personId]) {
      continue;
    }

    const checkInDate = parseISO(checkIn.attributes.created_at);
    const daysAgo = differenceInDays(referenceDate, checkInDate);

    if (daysAgo >= 0 && daysAgo <= 90) {
      checkInCounts[personId].recent++;
    } else if (daysAgo >= 91 && daysAgo <= 180) {
      checkInCounts[personId].previous++;
    }
  }

  const driftResults: DriftResult[] = [];
  for (const student of students) {
    const counts = checkInCounts[student.id];

    if (counts.previous > 0) {
      const drop = counts.previous - counts.recent;
      const dropPercentage = (drop / counts.previous) * 100;

      if (dropPercentage >= 50) {
        driftResults.push({
          student,
          recentCount: counts.recent,
          previousCount: counts.previous,
          dropPercentage: Math.round(dropPercentage)
        });
      }
    }
  }

  driftResults.sort((a, b) => {
    if (b.dropPercentage !== a.dropPercentage) {
      return b.dropPercentage - a.dropPercentage;
    }
    return b.previousCount - a.previousCount;
  });

  return driftResults;
};

import { differenceInDays, subDays } from 'date-fns';
import type { Student, PcoCheckIn } from './pco';

export interface DriftSignal {
  person: Student;
  recentCheckIns: number; // Last 90 days
  pastCheckIns: number;   // 91 - 180 days ago
  dropPercentage: number;
}

export const calculateDrift = (
  checkIns: PcoCheckIn[],
  students: Student[],
  now: Date = new Date()
): DriftSignal[] => {
  const ninetyDaysAgo = subDays(now, 90);
  const oneEightyDaysAgo = subDays(now, 180);

  // Map person ID to their check-in counts
  const recentCounts: Record<string, number> = {};
  const pastCounts: Record<string, number> = {};

  checkIns.forEach(checkIn => {
    const personId = checkIn.relationships?.person?.data?.id;
    if (!personId) return;

    const date = new Date(checkIn.attributes.created_at);

    if (date >= ninetyDaysAgo && date <= now) {
      recentCounts[personId] = (recentCounts[personId] || 0) + 1;
    } else if (date >= oneEightyDaysAgo && date < ninetyDaysAgo) {
      pastCounts[personId] = (pastCounts[personId] || 0) + 1;
    }
  });

  const signals: DriftSignal[] = [];

  students.forEach(student => {
    // Only care about people who were active in the past
    const past = pastCounts[student.id] || 0;
    if (past >= 4) { // Threshold: Must have attended roughly once a month or more previously
      const recent = recentCounts[student.id] || 0;

      // If attendance dropped by 50% or more
      if (recent <= past / 2) {
        const dropPercentage = Math.round(((past - recent) / past) * 100);
        signals.push({
          person: student,
          recentCheckIns: recent,
          pastCheckIns: past,
          dropPercentage,
        });
      }
    }
  });

  // Sort by highest drop percentage, then by most past check-ins
  return signals.sort((a, b) => {
    if (b.dropPercentage !== a.dropPercentage) {
      return b.dropPercentage - a.dropPercentage;
    }
    return b.pastCheckIns - a.pastCheckIns;
  });
};

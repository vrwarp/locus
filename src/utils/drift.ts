import type { Student, PcoCheckIn } from './pco';
import { differenceInMonths, parseISO, isAfter, subMonths, startOfDay, endOfDay, isBefore } from 'date-fns';

export interface DriftCandidate {
  person: Student;
  baselineRate: number; // check-ins per week
  recentRate: number; // check-ins per week
  dropPercentage: number;
  tenureMonths: number;
  status: 'Drifting' | 'At Risk' | 'Gone';
}

export const calculateDriftRisk = (checkIns: PcoCheckIn[], students: Student[]): DriftCandidate[] => {
  if (checkIns.length === 0 || students.length === 0) return [];

  const candidates: DriftCandidate[] = [];
  const now = new Date();

  // Time Windows
  // Recent: Last 6 weeks
  const recentStart = subMonths(now, 1.5); // approx 6 weeks
  // Baseline: Month -7 to Month -2 (5 month window)
  const baselineStart = subMonths(now, 7);
  const baselineEnd = subMonths(now, 2);

  // Helper to filter check-ins by person
  const checkInsByPerson = new Map<string, Date[]>();

  checkIns.forEach(c => {
    // Only count Regular attendance for drift (Volunteer burnout is handled elsewhere)
    if (c.attributes.kind === 'Regular' && c.attributes.created_at) {
        const personId = c.relationships.person.data.id;
        if (!checkInsByPerson.has(personId)) {
            checkInsByPerson.set(personId, []);
        }
        checkInsByPerson.get(personId)!.push(parseISO(c.attributes.created_at));
    }
  });

  students.forEach(student => {
    // 1. Filter: Tenure > 6 months
    // We need enough history to establish a baseline.
    // If we don't have their first check-in date easily, we can infer from check-ins list or student creation?
    // Let's infer from earliest check-in found.
    const dates = checkInsByPerson.get(student.id) || [];
    if (dates.length === 0) return;

    // Sort dates
    dates.sort((a, b) => a.getTime() - b.getTime());
    const firstSeen = dates[0];
    const tenureMonths = differenceInMonths(now, firstSeen);

    if (tenureMonths < 6) return; // Newcomers are handled by Retention funnel

    // 2. Calculate Rates
    // Baseline Rate (Avg per week over 5 months ~ 21 weeks)
    const baselineCount = dates.filter(d => isAfter(d, baselineStart) && isBefore(d, baselineEnd)).length;
    const baselineRate = baselineCount / 21;

    // Recent Rate (Avg per week over 6 weeks)
    const recentCount = dates.filter(d => isAfter(d, recentStart)).length;
    const recentRate = recentCount / 6;

    // 3. Drift Logic
    // Ignore low-frequency attendees (e.g. once a month or less in baseline)
    // Threshold: Baseline >= 0.5 (at least once every 2 weeks)
    if (baselineRate < 0.5) return;

    // Calculate Drop
    // If Recent is significantly lower than Baseline
    const dropPercentage = ((baselineRate - recentRate) / baselineRate) * 100;

    let status: 'Drifting' | 'At Risk' | 'Gone' | null = null;

    if (recentRate === 0) {
        status = 'Gone'; // Zero attendance in last 6 weeks
    } else if (dropPercentage >= 50) {
        status = 'Drifting'; // Dropped by half
    } else if (dropPercentage >= 25) {
        status = 'At Risk'; // Dropped by quarter
    }

    if (status) {
        candidates.push({
            person: student,
            baselineRate,
            recentRate,
            dropPercentage,
            tenureMonths,
            status
        });
    }
  });

  // Sort by drop severity
  return candidates.sort((a, b) => b.dropPercentage - a.dropPercentage);
};

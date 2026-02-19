import { startOfWeek, format, parseISO } from 'date-fns';
import type { PcoCheckIn } from './pco';

export interface WeeklyAttendance {
  week: string; // Formatted date string (e.g., "Jan 1")
  date: string; // ISO date string for sorting (e.g., "2023-01-01")
  count: number;
}

export const aggregateCheckInsByWeek = (checkIns: PcoCheckIn[]): WeeklyAttendance[] => {
  const counts: Record<string, number> = {};

  checkIns.forEach((checkIn) => {
    const date = parseISO(checkIn.attributes.created_at);
    // Group by start of week (Sunday)
    const weekStart = startOfWeek(date, { weekStartsOn: 0 });
    const weekKey = format(weekStart, 'yyyy-MM-dd');

    counts[weekKey] = (counts[weekKey] || 0) + 1;
  });

  const result: WeeklyAttendance[] = Object.entries(counts).map(([dateStr, count]) => {
    const date = parseISO(dateStr);
    return {
      week: format(date, 'MMM d'),
      date: dateStr,
      count,
    };
  });

  // Sort by date ascending
  return result.sort((a, b) => a.date.localeCompare(b.date));
};

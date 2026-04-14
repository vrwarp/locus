import { parseISO, startOfWeek, format } from 'date-fns';
import type { PcoCheckIn, PcoEvent } from './pco';

export interface GivingTrendData {
  weekStarting: string;
  attendance: number;
  givingVolume: number;
}

export const calculateGivingTrends = (
  checkIns: PcoCheckIn[],
  events: PcoEvent[]
): GivingTrendData[] => {
  // Identify the primary Worship Service event ID
  const worshipEvent = events.find(e =>
    e.attributes.name.toLowerCase().includes('worship') ||
    e.attributes.name.toLowerCase().includes('sunday')
  );

  if (!worshipEvent) return [];

  const worshipEventId = worshipEvent.id;

  // Filter check-ins to just the worship service
  const worshipCheckIns = checkIns.filter(
    c => c.relationships.event.data.id === worshipEventId && c.attributes.kind === 'Regular'
  );

  // Group check-ins by week
  const weeklyAttendance = new Map<string, Set<string>>(); // week string -> set of person IDs (unique attendees)

  worshipCheckIns.forEach(c => {
    if (!c.attributes.created_at) return;
    const date = parseISO(c.attributes.created_at);
    // Group by the Sunday of that week
    const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Sunday
    const weekStr = format(weekStart, 'yyyy-MM-dd');

    if (!weeklyAttendance.has(weekStr)) {
      weeklyAttendance.set(weekStr, new Set());
    }

    // Add person ID to set
    weeklyAttendance.get(weekStr)!.add(c.relationships.person.data.id);
  });

  // Convert to GivingTrendData array
  const results: GivingTrendData[] = [];
  const weeks = Array.from(weeklyAttendance.keys()).sort(); // Ascending

  weeks.forEach((weekStr, index) => {
    const attendance = weeklyAttendance.get(weekStr)!.size;

    // Simulate "Stripe" giving volume based on attendance + deterministic variance
    // We use index to create a deterministic variance so it doesn't change on re-render
    // Base assumption: Average giving per person is ~$25
    // Variance: +/- 15% based on a sine wave of the index to look natural
    const baseGiving = attendance * 25;
    const varianceMultiplier = 1 + (Math.sin(index * 1.5) * 0.15);
    const givingVolume = Math.round(baseGiving * varianceMultiplier);

    results.push({
      weekStarting: weekStr,
      attendance,
      givingVolume
    });
  });

  return results;
};

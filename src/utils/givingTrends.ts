import { parseISO, startOfWeek, format } from 'date-fns';
import type { PcoCheckIn, PcoEvent } from './pco';

export interface GivingTrendData {
  weekStarting: string;
  attendance: number;
  givingVolume: number;
}

export const correlateGivingAndAttendance = (
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
    // Mock simulated giving volume: Base giving of $10,000 + ($50 * attendance) + random noise (-$500 to +$500)
    // To make it deterministic for tests, we use a simple formula based on index
    const baseGiving = 10000;
    const perPersonGiving = 50;
    const deterministicNoise = (index % 10) * 100 - 450;
    const givingVolume = baseGiving + (perPersonGiving * attendance) + deterministicNoise;

    results.push({
      weekStarting: weekStr,
      attendance,
      givingVolume: givingVolume > 0 ? givingVolume : 0 // Ensure non-negative
    });
  });

  return results;
};

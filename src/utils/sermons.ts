import { parseISO, startOfWeek, format } from 'date-fns';
import type { PcoCheckIn, PcoEvent } from './pco';

export interface SermonData {
  weekStarting: string;
  topic: string;
  attendance: number;
}

// Mock mapping of dates to sermon topics since we don't have a real endpoint for this
export const SERMON_TOPICS = [
  "The Prodigal Son",
  "Faith Over Fear",
  "Community Matters",
  "The Power of Prayer",
  "Living Generously",
  "Finding Purpose",
  "Grace Abounds",
  "Walking in Light"
];

export const correlateSermonsAndAttendance = (
  checkIns: PcoCheckIn[],
  events: PcoEvent[]
): SermonData[] => {
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

  // Convert to SermonData array
  const results: SermonData[] = [];
  const weeks = Array.from(weeklyAttendance.keys()).sort(); // Ascending

  weeks.forEach((weekStr, index) => {
    // Assign a topic based on the week index (mock behavior)
    const topicIndex = index % SERMON_TOPICS.length;
    const topic = SERMON_TOPICS[topicIndex];

    results.push({
      weekStarting: weekStr,
      topic: topic,
      attendance: weeklyAttendance.get(weekStr)!.size
    });
  });

  return results;
};

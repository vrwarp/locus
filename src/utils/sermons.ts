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

export interface SermonEngagementData {
  weekStarting: string;
  topic: string;
  smallGroupSignups: number;
  volunteerApplications: number;
}

export const correlateSermonsWithEngagement = (
  checkIns: PcoCheckIn[],
  events: PcoEvent[]
): SermonEngagementData[] => {
  // To simulate this without a real "forms" or "signups" endpoint,
  // we will derive a deterministic number of signups based on the topic.
  // The vision doc says: "Sermons about 'Community' result in a 15% spike in Small Group signups"
  // "Week 3 (The 'Serve One Another' sermon) resulted in a 400% spike in volunteer applications."

  // First, calculate attendance to establish a baseline size
  const attendanceData = correlateSermonsAndAttendance(checkIns, events);

  return attendanceData.map(data => {
    let smallGroupSignups = Math.round(data.attendance * 0.05); // Base rate: 5% of attendance
    let volunteerApplications = Math.round(data.attendance * 0.02); // Base rate: 2% of attendance

    // Apply spikes based on topic keywords
    if (data.topic.toLowerCase().includes('community') || data.topic.toLowerCase().includes('together')) {
        smallGroupSignups = Math.round(smallGroupSignups * 1.5); // 50% spike (or 15% overall increase)
    }

    if (data.topic.toLowerCase().includes('serve') || data.topic.toLowerCase().includes('purpose')) {
        volunteerApplications = Math.round(volunteerApplications * 4.0); // 400% spike
    }

    if (data.topic.toLowerCase().includes('generous') || data.topic.toLowerCase().includes('giving')) {
        // Maybe giving spike, but we only track signups here
    }

    return {
        weekStarting: data.weekStarting,
        topic: data.topic,
        smallGroupSignups,
        volunteerApplications
    };
  });
};

import type { Student, PcoCheckIn, PcoEvent } from './pco';
import { parseISO } from 'date-fns';

export interface BurnoutCandidate {
  person: Student;
  servingCount: number;
  worshipCount: number;
  riskLevel: 'High' | 'Medium' | 'Low';
}

export const classifyEvent = (event: PcoEvent): 'Worship' | 'Serving' | 'Unknown' => {
  const name = event.attributes.name.toLowerCase();

  // Explicit Serving Keywords
  if (name.includes('team') || name.includes('volunteer') || name.includes('serving') || name.includes('greeter') || name.includes('ministry')) {
    return 'Serving';
  }

  // Explicit Worship Keywords
  if (name.includes('service') || name.includes('worship') || name.includes('kids church') || name.includes('friday night live')) {
    return 'Worship';
  }

  return 'Unknown';
};

export const calculateBurnoutRisk = (checkIns: PcoCheckIn[], events: PcoEvent[], people: Student[]): BurnoutCandidate[] => {
  // 1. Map Event ID to Type
  const eventTypeMap = new Map<string, 'Worship' | 'Serving' | 'Unknown'>();
  events.forEach(e => eventTypeMap.set(e.id, classifyEvent(e)));

  if (checkIns.length === 0) return [];

  // 2. Filter Check-ins (Last 8 Weeks)
  const validCheckIns = checkIns.filter(c => c.attributes?.created_at);
  if (validCheckIns.length === 0) return [];

  const dates = validCheckIns.map(c => parseISO(c.attributes.created_at).getTime());
  const maxDate = new Date(Math.max(...dates));
  const cutoffDate = new Date(maxDate);
  cutoffDate.setDate(cutoffDate.getDate() - (8 * 7)); // 8 weeks ago

  const recentCheckIns = checkIns.filter(c => {
    if (!c.attributes?.created_at) return false;
    const d = parseISO(c.attributes.created_at);
    return d >= cutoffDate;
  });

  // 3. Aggregate by Person
  const personStats = new Map<string, { serving: number, worship: number }>();

  recentCheckIns.forEach(c => {
    const personId = c.relationships.person.data.id;
    const eventId = c.relationships.event.data.id;
    let type = eventTypeMap.get(eventId) || 'Unknown';

    // Override if kind is Volunteer
    if (c.attributes.kind === 'Volunteer') {
        type = 'Serving';
    }

    if (!personStats.has(personId)) {
      personStats.set(personId, { serving: 0, worship: 0 });
    }
    const stats = personStats.get(personId)!;

    if (type === 'Serving') stats.serving++;
    else if (type === 'Worship') stats.worship++;
  });

  // 4. Determine Risk
  const candidates: BurnoutCandidate[] = [];

  personStats.forEach((stats, personId) => {
    // Find student object
    const student = people.find(p => p.id === personId);
    if (!student) return;

    // We focus on adults/volunteers usually, but let's just flag anyone matching the pattern
    let risk: 'High' | 'Medium' | 'Low' = 'Low';

    // Criteria:
    // High: Serving >= 6 times in 8 weeks AND Worship == 0
    // Medium: Serving >= 6 times in 8 weeks AND Worship <= 2

    if (stats.serving >= 6) {
        if (stats.worship === 0) {
            risk = 'High';
        } else if (stats.worship <= 2) {
            risk = 'Medium';
        }
    }

    if (risk !== 'Low') {
      candidates.push({
        person: student,
        servingCount: stats.serving,
        worshipCount: stats.worship,
        riskLevel: risk
      });
    }
  });

  return candidates.sort((a, b) => {
      // High before Medium
      if (a.riskLevel === 'High' && b.riskLevel !== 'High') return -1;
      if (a.riskLevel !== 'High' && b.riskLevel === 'High') return 1;
      // Then by serving count desc
      return b.servingCount - a.servingCount;
  });
};

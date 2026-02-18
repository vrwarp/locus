import type { Student, PcoCheckIn, PcoEvent } from './pco';
import { parseISO } from 'date-fns';
import { classifyEvent } from './burnout';

export interface RecruitmentCandidate {
  person: Student;
  worshipCount: number;
  servingCount: number;
  score: number;
  isParent: boolean;
}

export const calculateRecruitmentCandidates = (checkIns: PcoCheckIn[], events: PcoEvent[], people: Student[]): RecruitmentCandidate[] => {
  // 1. Map Event ID to Type
  const eventTypeMap = new Map<string, 'Worship' | 'Serving' | 'Unknown'>();
  events.forEach(e => eventTypeMap.set(e.id, classifyEvent(e)));

  if (checkIns.length === 0) return [];

  // 2. Filter Check-ins (Last 8 Weeks)
  const dates = checkIns.map(c => parseISO(c.attributes.created_at).getTime());
  const maxTime = dates.reduce((a, b) => Math.max(a, b), 0);
  const maxDate = new Date(maxTime);
  const cutoffDate = new Date(maxDate);
  cutoffDate.setDate(cutoffDate.getDate() - (8 * 7)); // 8 weeks ago

  const recentCheckIns = checkIns.filter(c => {
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

  // 4. Identify Children Household IDs to Flag Parents
  const childHouseholdIds = new Set(
    people.filter(p => p.isChild && p.householdId).map(p => p.householdId!)
  );

  // 5. Determine Candidates
  const candidates: RecruitmentCandidate[] = [];

  personStats.forEach((stats, personId) => {
    // Find student object
    const student = people.find(p => p.id === personId);
    if (!student) return;

    // Filter: Adults only
    if (student.isChild) return;

    // Filter: High Worship (>= 4), Low Serving (<= 1)
    if (stats.worship >= 4 && stats.serving <= 1) {
        const isParent = student.householdId ? childHouseholdIds.has(student.householdId) : false;

        // Score: (Worship * 10) + (Parent * 20)
        let score = stats.worship * 10;
        if (isParent) score += 20;

        candidates.push({
            person: student,
            worshipCount: stats.worship,
            servingCount: stats.serving,
            score,
            isParent
        });
    }
  });

  return candidates.sort((a, b) => b.score - a.score);
};

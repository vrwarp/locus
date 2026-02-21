import type { Student, PcoCheckIn, PcoEvent } from './pco';
import { parseISO, differenceInMonths } from 'date-fns';
import { classifyEvent } from './burnout';

export interface RecruitmentCandidate {
  person: Student;
  worshipCount: number;
  servingCount: number;
  score: number;
  isParent: boolean;
  tenureMonths: number;
  potentialRoles: string[];
  childNames: string[];
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

  // 4. Identify Children Household IDs and build map of household -> children
  const householdChildrenMap = new Map<string, Student[]>();
  people.filter(p => p.isChild && p.householdId).forEach(child => {
      const hid = child.householdId!;
      if (!householdChildrenMap.has(hid)) {
          householdChildrenMap.set(hid, []);
      }
      householdChildrenMap.get(hid)!.push(child);
  });

  const childHouseholdIds = new Set(householdChildrenMap.keys());

  // Helper to find earliest check-in
  const findEarliestCheckIn = (personId: string): Date | null => {
      let minDate: Date | null = null;
      // Iterate through ALL check-ins, not just recent
      for (const checkIn of checkIns) {
          if (checkIn.relationships.person.data.id === personId) {
              const d = parseISO(checkIn.attributes.created_at);
              if (!minDate || d < minDate) {
                  minDate = d;
              }
          }
      }
      return minDate;
  };

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

        // Calculate Tenure
        const firstCheckIn = findEarliestCheckIn(personId);
        const tenureMonths = firstCheckIn ? differenceInMonths(maxDate, firstCheckIn) : 0;

        // Identify Potential Roles & Child Names
        const potentialRoles: string[] = [];
        const childNames: string[] = [];

        if (student.householdId && householdChildrenMap.has(student.householdId)) {
            const children = householdChildrenMap.get(student.householdId)!;
            children.forEach(child => {
                childNames.push(child.firstName);
                if (child.age >= 5 && child.age <= 10) {
                    if (!potentialRoles.includes('Kids Ministry')) potentialRoles.push('Kids Ministry');
                }
                if (child.age >= 11 && child.age <= 18) {
                    if (!potentialRoles.includes('Student Ministry')) potentialRoles.push('Student Ministry');
                }
            });
        }

        // Score: (Worship * 10) + (Parent * 20) + (Tenure > 6mo ? 10 : 0)
        let score = stats.worship * 10;
        if (isParent) score += 20;
        if (tenureMonths > 6) score += 10;

        candidates.push({
            person: student,
            worshipCount: stats.worship,
            servingCount: stats.serving,
            score,
            isParent,
            tenureMonths,
            potentialRoles,
            childNames
        });
    }
  });

  return candidates.sort((a, b) => b.score - a.score);
};

export const generateAskScript = (candidate: RecruitmentCandidate): string => {
  const { person, isParent, tenureMonths, potentialRoles, childNames } = candidate;
  const firstName = person.firstName;

  let script = `Hi ${firstName},\n\n`;

  // Opening
  if (tenureMonths > 6) {
    script += `I noticed you've been a consistent part of our church family for over ${Math.floor(tenureMonths / 6) * 6} months now. We're so glad you're here!\n\n`;
  } else {
    script += `I've noticed you've been joining us for worship regularly lately. We're so glad to see you!\n\n`;
  }

  // The "Why" (Personalization)
  if (isParent && childNames.length > 0) {
    const formatter = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
    const kids = formatter.format(childNames);
    script += `We love having ${kids} in our ministry areas. Usually, parents make the best leaders because they are already invested!\n\n`;
  }

  // The "Ask"
  script += `I wanted to personally invite you to consider joining a serving team. `;

  if (potentialRoles.includes('Kids Ministry')) {
    script += `Given your family stage, I think you'd be amazing in our Kids Ministry. It's a great way to influence the next generation (and see what your kids are learning!).\n\n`;
  } else if (potentialRoles.includes('Student Ministry')) {
    script += `Our Student Ministry is always looking for mentors, and I think you'd connect really well with the students.\n\n`;
  } else {
    script += `Whether it's greeting at the door, brewing coffee, or helping behind the scenes, there's a spot for you.\n\n`;
  }

  // Closing
  script += `Would you be open to grabbing coffee or chatting for 5 minutes this Sunday about it? No pressure at all—just want to help you find your people.\n\nBest,\n[Your Name]`;

  return script;
};

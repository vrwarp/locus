import type { Student, PcoCheckIn, PcoEvent } from './pco';
import { parseISO, subWeeks, isAfter } from 'date-fns';
import { classifyEvent } from './burnout';

export interface MissingVolunteer {
    person: Student;
    lastSeen: string;
    missingWeeks: number;
}

export const calculateMissingVolunteers = (
    checkIns: PcoCheckIn[],
    events: PcoEvent[],
    people: Student[]
): MissingVolunteer[] => {
    // 1. Map Event ID to Type
    const eventTypeMap = new Map<string, 'Worship' | 'Serving' | 'Unknown'>();
    events.forEach(e => eventTypeMap.set(e.id, classifyEvent(e)));

    if (checkIns.length === 0) return [];

    // Filter to valid check-ins
    const validCheckIns = checkIns.filter(c => c.attributes?.created_at);
    if (validCheckIns.length === 0) return [];

    // Determine the "current date" based on the latest check-in
    const latestDateStr = validCheckIns.reduce((latest, current) => {
        const currentDate = parseISO(current.attributes.created_at);
        const latestDate = parseISO(latest);
        return isAfter(currentDate, latestDate) ? current.attributes.created_at : latest;
    }, validCheckIns[0].attributes.created_at);

    const now = parseISO(latestDateStr);

    // We want to look at a period to establish they are a "key volunteer"
    // E.g., serving at least 2 times in the 6 weeks prior to going missing.
    // "Missing" means 0 check-ins (serving or worship) in the last 2 weeks.

    const twoWeeksAgo = subWeeks(now, 2);
    const eightWeeksAgo = subWeeks(now, 8); // 2 weeks missing + 6 weeks of history

    const recentCheckIns = validCheckIns.filter(c => {
        const d = parseISO(c.attributes.created_at);
        return isAfter(d, eightWeeksAgo);
    });

    const personStats = new Map<string, { lastSeen: Date; historyServingCount: number; recentCount: number }>();

    recentCheckIns.forEach(c => {
        const personId = c.relationships.person.data.id;
        const date = parseISO(c.attributes.created_at);
        const eventId = c.relationships.event.data.id;
        let type = eventTypeMap.get(eventId) || 'Unknown';

        if (c.attributes.kind === 'Volunteer') type = 'Serving';

        if (!personStats.has(personId)) {
            personStats.set(personId, { lastSeen: new Date(0), historyServingCount: 0, recentCount: 0 });
        }

        const stats = personStats.get(personId)!;

        if (isAfter(date, stats.lastSeen)) {
            stats.lastSeen = date;
        }

        if (isAfter(date, twoWeeksAgo)) {
             stats.recentCount++;
        } else if (type === 'Serving') {
             stats.historyServingCount++;
        }
    });

    const missing: MissingVolunteer[] = [];

    personStats.forEach((stats, personId) => {
        // Is key volunteer? (Served >= 2 times in the 6 week history period)
        const isKeyVolunteer = stats.historyServingCount >= 2;

        // Is missing? (0 checkins in the last 2 weeks)
        const isMissing = stats.recentCount === 0;

        if (isKeyVolunteer && isMissing) {
            const student = people.find(p => p.id === personId);
            if (student) {
                // Calculate weeks missing
                const msPerWeek = 1000 * 60 * 60 * 24 * 7;
                const diffTime = Math.abs(now.getTime() - stats.lastSeen.getTime());
                const missingWeeks = Math.floor(diffTime / msPerWeek);

                missing.push({
                    person: student,
                    lastSeen: stats.lastSeen.toISOString(),
                    missingWeeks: Math.max(2, missingWeeks) // At least 2 weeks
                });
            }
        }
    });

    // Sort by most missed weeks
    return missing.sort((a, b) => b.missingWeeks - a.missingWeeks);
};

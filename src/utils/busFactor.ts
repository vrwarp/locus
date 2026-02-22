import { parseISO, differenceInMinutes } from 'date-fns';
import type { PcoCheckIn, PcoEvent, Student } from './pco';
import { classifyEvent } from './burnout';

export interface BusFactorCandidate {
  person: Student;
  teamName: string;
  soloCount: number;
  totalServing: number;
  riskScore: number;
}

export const calculateBusFactor = (
  checkIns: PcoCheckIn[],
  events: PcoEvent[],
  students: Student[]
): BusFactorCandidate[] => {
  // 1. Identify Serving Events
  const servingEventIds = new Set<string>();
  const eventNameMap = new Map<string, string>();

  events.forEach(e => {
    eventNameMap.set(e.id, e.attributes.name);
    if (classifyEvent(e) === 'Serving') {
      servingEventIds.add(e.id);
    }
  });

  // 2. Filter Check-Ins
  const servingCheckIns = checkIns.filter(c => {
    const eventId = c.relationships.event.data.id;
    return servingEventIds.has(eventId) || c.attributes.kind === 'Volunteer';
  });

  // 3. Group by Team (Event)
  const teamCheckIns = new Map<string, PcoCheckIn[]>();
  servingCheckIns.forEach(c => {
      const eventId = c.relationships.event.data.id;
      if (!teamCheckIns.has(eventId)) {
          teamCheckIns.set(eventId, []);
      }
      teamCheckIns.get(eventId)!.push(c);
  });

  // 4. Cluster Check-Ins by Time (Service) per Team
  const candidateMap = new Map<string, BusFactorCandidate>(); // Key: personId:eventId

  teamCheckIns.forEach((checkIns, eventId) => {
      // Sort by time
      checkIns.sort((a, b) => {
          return new Date(a.attributes.created_at).getTime() - new Date(b.attributes.created_at).getTime();
      });

      // Cluster logic
      // Iterate through check-ins and group them if they are close in time (e.g. within 60 mins of PREVIOUS check-in)
      let currentCluster: Set<string> = new Set();
      let lastTime: Date | null = null;

      checkIns.forEach(c => {
          const currentTime = parseISO(c.attributes.created_at);
          const personId = c.relationships.person.data.id;

          if (lastTime && differenceInMinutes(currentTime, lastTime) > 60) {
              // Analyze previous cluster
              analyzeCluster(currentCluster, eventId, candidateMap, students, eventNameMap);
              // Start new cluster
              currentCluster = new Set();
          }

          currentCluster.add(personId);
          lastTime = currentTime;
      });

      // Analyze last cluster
      if (currentCluster.size > 0) {
          analyzeCluster(currentCluster, eventId, candidateMap, students, eventNameMap);
      }
  });

  // 5. Finalize
  const candidates: BusFactorCandidate[] = [];
  candidateMap.forEach(c => {
       c.riskScore = c.soloCount;
       if (c.soloCount > 0) {
           candidates.push(c);
       }
   });

   return candidates.sort((a, b) => {
       if (b.riskScore !== a.riskScore) return b.riskScore - a.riskScore;
       return b.totalServing - a.totalServing;
   });
};

function analyzeCluster(
    personIds: Set<string>,
    eventId: string,
    candidateMap: Map<string, BusFactorCandidate>,
    students: Student[],
    eventNameMap: Map<string, string>
) {
    const teamSize = personIds.size;
    personIds.forEach(personId => {
        const key = `${personId}:${eventId}`;
        if (!candidateMap.has(key)) {
            const student = students.find(s => s.id === personId);
            if (student) {
                candidateMap.set(key, {
                    person: student,
                    teamName: eventNameMap.get(eventId) || 'Unknown Team',
                    soloCount: 0,
                    totalServing: 0,
                    riskScore: 0
                });
            }
        }
        const candidate = candidateMap.get(key);
        if (candidate) {
            candidate.totalServing++;
            if (teamSize === 1) {
                candidate.soloCount++;
            }
        }
    });
}

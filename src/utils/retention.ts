import type { PcoCheckIn } from './pco';
import { subMonths, isAfter, parseISO } from 'date-fns';

export interface FunnelStep {
  name: string;
  value: number;
  fill: string;
}

export const calculateNewcomerFunnel = (checkIns: PcoCheckIn[]): FunnelStep[] => {
  // 1. Map Check-Ins to People
  const checkInsByPerson: Record<string, Date[]> = {};

  checkIns.forEach(checkIn => {
    // Count attendance, not volunteering. Written as a blacklist of one kind
    // rather than a whitelist of one: `kind !== 'Regular'` also dropped Guest
    // check-ins, which is the entire population this funnel is counting. Worse
    // than undercounting, it mis-dated anyone whose first visit was a Guest
    // check-in and whose later ones were Regular — their earliest date became a
    // later one, so a long-time attender could score as a newcomer. Invisible
    // on the fixture, which has no Guest rows, and invisible to any church that
    // renamed its visitor kind.
    if (checkIn.attributes.kind === 'Volunteer') return;

    const personId = checkIn.relationships.person.data.id;
    if (!checkInsByPerson[personId]) {
      checkInsByPerson[personId] = [];
    }
    checkInsByPerson[personId].push(parseISO(checkIn.attributes.created_at));
  });

  // Sort dates for each person
  Object.keys(checkInsByPerson).forEach(id => {
    checkInsByPerson[id].sort((a, b) => a.getTime() - b.getTime());
  });

  // 2. Identify Newcomers (First check-in within last 12 months)
  const oneYearAgo = subMonths(new Date(), 12);

  let newcomers: string[] = [];

  Object.keys(checkInsByPerson).forEach(personId => {
    const dates = checkInsByPerson[personId];
    if (dates.length > 0) {
      const firstCheckIn = dates[0];
      if (isAfter(firstCheckIn, oneYearAgo)) {
        newcomers.push(personId);
      }
    }
  });

  // 3. Calculate Retention
  let visit1 = 0;
  let visit2 = 0;
  let visit3 = 0;
  let visit4 = 0;

  newcomers.forEach(id => {
    const count = checkInsByPerson[id].length;
    if (count >= 1) visit1++;
    if (count >= 2) visit2++;
    if (count >= 3) visit3++;
    if (count >= 4) visit4++;
  });

  // 4. Format for Funnel Chart
  // Colors: Start with bright/welcoming, fade to loyal/deep
  return [
    { name: '1st Visit', value: visit1, fill: '#8884d8' },
    { name: '2nd Visit', value: visit2, fill: '#83a6ed' },
    { name: '3rd Visit', value: visit3, fill: '#8dd1e1' },
    { name: 'Member', value: visit4, fill: '#82ca9d' },
  ];
};

import type { Student, PcoEvent } from './pco';
import { addDays, isWithinInterval, parseISO, setYear, getYear } from 'date-fns';

export function getUpcomingBirthdays(students: Student[], date: Date = new Date()): Student[] {
  const endDate = addDays(date, 7);
  const currentYear = getYear(date);

  return students.filter(student => {
    if (!student.birthdate) return false;

    // Parse the birthdate
    let bd = parseISO(student.birthdate);

    // Map the birthdate to the current year to see if it falls in the next 7 days
    let upcomingBd = setYear(bd, currentYear);

    // If the birthday already passed this year, check next year
    if (upcomingBd < date) {
      upcomingBd = setYear(bd, currentYear + 1);
    }

    return isWithinInterval(upcomingBd, { start: date, end: endDate });
  }).sort((a, b) => {
      let bdA = setYear(parseISO(a.birthdate!), currentYear);
      if (bdA < date) bdA = setYear(bdA, currentYear + 1);

      let bdB = setYear(parseISO(b.birthdate!), currentYear);
      if (bdB < date) bdB = setYear(bdB, currentYear + 1);

      return bdA.getTime() - bdB.getTime();
  });
}

export function generateNewsletterDraft(events: PcoEvent[], students: Student[]): string {
    const today = new Date();
    const upcomingBirthdays = getUpcomingBirthdays(students, today);

    let draft = `# Weekly Church Newsletter\n*Drafted: ${today.toLocaleDateString()}*\n\nWelcome to our weekly update! Here is what's happening in our community.\n\n## 📅 Upcoming Events\n`;

    if (events.length === 0) {
        draft += `*No upcoming events listed.*\n`;
    } else {
        events.forEach(event => {
             draft += `- **${event.attributes.name}**\n`;
             if (event.attributes.frequency) {
                 draft += `  *Frequency: ${event.attributes.frequency}*\n`;
             }
        });
    }

    draft += `\n## 🎂 Upcoming Birthdays (Next 7 Days)\n`;

    if (upcomingBirthdays.length === 0) {
        draft += `*No birthdays in the next week.*\n`;
    } else {
        upcomingBirthdays.forEach(student => {
             draft += `- Let's wish a Happy Birthday to **${student.name}**!\n`;
        });
    }

    draft += `\n---\n*Reply to this email with your prayer requests!*`;

    return draft;
}

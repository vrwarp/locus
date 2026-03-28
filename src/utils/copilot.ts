import type { Student, PcoCheckIn, PcoEvent } from './pco';
import type { HealthStats } from './analytics';
import { calculateBurnoutRisk } from './burnout';
import { calculateRecruitmentCandidates } from './recruitment';
import { isGhost } from './ghost';
import { calculateMissingVolunteers } from './missing';
import { analyzeFamilies } from './family';
import { getUpcomingBirthdays, getPendingGradePromotions, getCollegeSendOffs, getExpiringBackgroundChecks, getExpiredBackgroundChecks } from './automations';
import { matchPrayerPartners } from './prayer';

export interface CoPilotContext {
  students: Student[];
  checkIns: PcoCheckIn[];
  events: PcoEvent[];
  stats: HealthStats;
}

export interface CoPilotResponse {
  type: 'text' | 'list' | 'stat';
  message: string;
  data?: any[];
  action?: string;
}

export const processQuery = (query: string, context: CoPilotContext): CoPilotResponse => {
  const lowerQuery = query.toLowerCase();

  // Intent: Health Score
  if (lowerQuery.includes('health') || lowerQuery.includes('score') || lowerQuery.includes('status')) {
    const { score, anomalies, total } = context.stats;
    let message = `Your current Data Health Score is ${score}/100.`;
    if (score > 80) message += " That's excellent! Keep it up.";
    else if (score > 50) message += " There's room for improvement.";
    else message += " We need to work on this.";

    message += `\nI found ${anomalies} anomalies across ${total} records.`;

    return {
      type: 'stat',
      message,
      data: [{ label: 'Score', value: score }, { label: 'Anomalies', value: anomalies }]
    };
  }

  // Intent: Burnout Risk
  if (lowerQuery.includes('burnout') || lowerQuery.includes('tired') || lowerQuery.includes('risk')) {
    const candidates = calculateBurnoutRisk(context.checkIns, context.events, context.students);
    const highRisk = candidates.filter(c => c.riskLevel === 'High');

    if (highRisk.length === 0) {
      return {
        type: 'text',
        message: "Good news! I don't see any volunteers at high risk of burnout right now based on the last 8 weeks."
      };
    }

    return {
      type: 'list',
      message: `I found ${highRisk.length} volunteers who might be at high risk (serving heavily without attending worship).`,
      data: highRisk.map(c => ({
        id: c.person.id,
        primary: c.person.name,
        secondary: `${c.servingCount} serves / ${c.worshipCount} worships`,
        icon: '🔥'
      }))
    };
  }



  // Intent: Split Households
  if (lowerQuery.includes('split household') || lowerQuery.includes('split family') || lowerQuery.includes('divorced') || lowerQuery.includes('separate household')) {
      const issues = analyzeFamilies(context.students);
      const splitIssues = issues.filter(i => i.message.includes('Split Household'));

      if (splitIssues.length === 0) {
          return {
              type: 'text',
              message: "Good news! I don't see any split households (families sharing an address/email/phone across multiple household records)."
          };
      }

      return {
          type: 'list',
          message: `I found ${splitIssues.length} potential split households.`,
          data: splitIssues.map(i => ({
              id: i.householdId, // this might be a string of comma-separated ids
              primary: `${i.familyName} Family`,
              secondary: i.message,
              icon: '👨‍👩‍👧‍👦'
          }))
      };
  }

  // Intent: Missing Volunteers
  if (lowerQuery.includes('missing volunteer') || lowerQuery.includes('haven\'t seen') || lowerQuery.includes('missing person')) {
      const missing = calculateMissingVolunteers(context.checkIns, context.events, context.students);

      if (missing.length === 0) {
          return {
              type: 'text',
              message: "Good news! I don't see any key volunteers who have missed 2 or more weeks recently."
          };
      }

      return {
          type: 'list',
          message: `I found ${missing.length} key volunteers who haven't checked in for at least 2 weeks.`,
          data: missing.map(m => ({
              id: m.person.id,
              primary: m.person.name,
              secondary: `Missing for ${m.missingWeeks} weeks (Last seen: ${new Date(m.lastSeen).toLocaleDateString()})`,
              icon: '🚨'
          }))
      };
  }

  // Intent: Ghosts
  if (lowerQuery.includes('ghost') || lowerQuery.includes('missing') || lowerQuery.includes('inactive')) {
    const ghosts = context.students.filter(s => isGhost(s));

    if (ghosts.length === 0) {
        return {
            type: 'text',
            message: "I didn't find any 'Ghosts' (active students with 0 attendance in 2 years)."
        };
    }

    return {
        type: 'list',
        message: `I found ${ghosts.length} 'Ghosts'. These are active records with no check-ins for over 2 years.`,
        data: ghosts.map(g => ({
            id: g.id,
            primary: g.name,
            secondary: `Age: ${g.age}`,
            icon: '👻'
        }))
    };
  }

  // Intent: Recruitment
  if (lowerQuery.includes('recruit') || lowerQuery.includes('volunteer') || lowerQuery.includes('need help')) {
      const candidates = calculateRecruitmentCandidates(context.checkIns, context.events, context.students);

      if (candidates.length === 0) {
          return {
              type: 'text',
              message: "I couldn't find any obvious recruitment candidates right now based on attendance patterns."
          };
      }

      return {
          type: 'list',
          message: `I found ${candidates.length} potential volunteers. These are adults who attend worship frequently but don't serve yet.`,
          data: candidates.slice(0, 5).map(c => ({
              id: c.person.id,
              primary: c.person.name,
              secondary: `Score: ${c.score} (Tenure: ${Math.floor(c.tenureMonths/12)}y)`,
              icon: '🌱'
          }))
      };
  }

  // Intent: Search by Grade
  // Regex for "grade X" or "X grade" or "Xth grade"
  const gradeMatch = lowerQuery.match(/grade\s+(\d+)|(\d+)(st|nd|rd|th)?\s+grade/);
  if (gradeMatch) {
      const grade = parseInt(gradeMatch[1] || gradeMatch[2]);
      const students = context.students.filter(s => s.pcoGrade === grade);

      if (students.length === 0) {
          return {
              type: 'text',
              message: `I couldn't find any students in Grade ${grade}.`
          };
      }

      return {
          type: 'list',
          message: `I found ${students.length} students in Grade ${grade}.`,
          data: students.map(s => ({
              id: s.id,
              primary: s.name,
              secondary: `Age: ${s.age}`,
              icon: '🎓'
          }))
      };
  }

  // Intent: Search Kindergarten
  if (lowerQuery.includes('kindergarten') || lowerQuery.includes('kinder')) {
       const students = context.students.filter(s => s.pcoGrade === 0);
       return {
          type: 'list',
          message: `I found ${students.length} students in Kindergarten.`,
          data: students.map(s => ({
              id: s.id,
              primary: s.name,
              secondary: `Age: ${s.age}`,
              icon: '🧸'
          }))
      };
  }

  // Intent: Search Person
  if (lowerQuery.startsWith('who is ') || lowerQuery.startsWith('find ')) {
      const nameQuery = lowerQuery.replace('who is ', '').replace('find ', '').trim();
      const people = context.students.filter(s => s.name.toLowerCase().includes(nameQuery));

      if (people.length === 0) {
          return {
              type: 'text',
              message: `I couldn't find anyone named "${nameQuery}".`
          };
      }

      return {
          type: 'list',
          message: `Here is what I found for "${nameQuery}":`,
          data: people.map(p => ({
              id: p.id,
              primary: p.name,
              secondary: `Age: ${p.age} • Grade: ${p.pcoGrade ?? 'N/A'}`,
              icon: '👤'
          }))
      };
  }

  // Intent: Automations
  if (lowerQuery.includes('automation') || lowerQuery.includes('pending') || lowerQuery.includes('upcoming') || lowerQuery.includes('action')) {
      const today = new Date();
      const birthdays = getUpcomingBirthdays(context.students, 7, today);
      const promotions = getPendingGradePromotions(context.students, today);
      const sendOffs = getCollegeSendOffs(context.students, today);
      const expiring = getExpiringBackgroundChecks(context.students, 30, today);
      const expired = getExpiredBackgroundChecks(context.students, today);

      const totalPending = birthdays.length + promotions.length + sendOffs.length + expiring.length + expired.length;

      if (totalPending === 0) {
          return {
              type: 'text',
              message: "Good news! You have 0 pending automations right now. Your data is perfectly up-to-date."
          };
      }

      const summaryData = [];
      if (birthdays.length > 0) summaryData.push({ primary: 'Upcoming Birthdays', secondary: `${birthdays.length} in the next 7 days`, icon: '🎂' });
      if (promotions.length > 0) summaryData.push({ primary: 'Pending Promotions', secondary: `${promotions.length} students need a grade bump`, icon: '📈' });
      if (sendOffs.length > 0) summaryData.push({ primary: 'College Send-offs', secondary: `${sendOffs.length} high school grads`, icon: '🎓' });
      if (expiring.length > 0) summaryData.push({ primary: 'Expiring Background Checks', secondary: `${expiring.length} checks expiring soon`, icon: '⚠️' });
      if (expired.length > 0) summaryData.push({ primary: 'Expired Background Checks', secondary: `${expired.length} critical safety issues`, icon: '🚨' });

      return {
          type: 'list',
          message: `You have ${totalPending} pending automations across ${summaryData.length} categories. Head to the 'Automations' view to process them.`,
          data: summaryData
      };
  }

  // Intent: Prayer Match
  if (lowerQuery.includes('prayer') || lowerQuery.includes('partner') || lowerQuery.includes('struggle')) {
      const matches = matchPrayerPartners(context.students);
      if (matches.length === 0) {
          return {
              type: 'text',
              message: "I couldn't find anyone with assigned prayer topics to match right now."
          };
      }

      // Filter by a specific topic if requested
      const possibleTopics = ['financial', 'health', 'grief', 'anxiety', 'addiction'];
      const matchedTopic = possibleTopics.find(t => lowerQuery.includes(t));

      let relevantMatches = matches;
      if (matchedTopic) {
          relevantMatches = matches.filter(m => m.topic.toLowerCase() === matchedTopic);
          if (relevantMatches.length === 0) {
              return {
                  type: 'text',
                  message: `I found prayer partners, but none specifically for '${matchedTopic}'.`
              };
          }
      }

      const listData = relevantMatches.map(m => {
         const partnerBName = m.personB ? m.personB.name : 'Waiting for partner';
         return {
             primary: `Struggle: ${m.topic}`,
             secondary: `${m.personA.name} 🤝 ${partnerBName}`,
             icon: '🙏'
         };
      });

      return {
          type: 'list',
          message: `I found ${relevantMatches.length} prayer partner match${relevantMatches.length === 1 ? '' : 'es'}${matchedTopic ? ` for ${matchedTopic}` : ''}. Head to the 'Prayer Partner Match' view for details.`,
          data: listData
      };
  }

  // Default Fallback
  return {
    type: 'text',
    message: "I'm not sure how to help with that yet. You can ask me about 'Health Score', 'Burnout Risk', 'Ghosts', 'Recruitment', 'Missing Volunteers', 'Split Households', 'Automations', 'Prayer Partners', or search for a grade or person."
  };
};

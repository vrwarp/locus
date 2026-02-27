import type { Student, PcoCheckIn, PcoEvent } from './pco';
import type { HealthStats } from './analytics';
import { calculateBurnoutRisk } from './burnout';
import { calculateRecruitmentCandidates } from './recruitment';
import { isGhost } from './ghost';

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

  // Default Fallback
  return {
    type: 'text',
    message: "I'm not sure how to help with that yet. You can ask me about 'Health Score', 'Burnout Risk', 'Ghosts', 'Recruitment', or search for a grade or person."
  };
};

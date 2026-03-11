import { isAfter, differenceInDays, parseISO, isSameMonth, getDate } from 'date-fns';
import type { Student } from './pco';
import { calculateExpectedGrade, type GraderOptions } from './grader';

export interface BirthdayAction {
    person: Student;
    daysUntil: number;
}

export interface PromotionAction {
    person: Student;
    currentGrade: number | null;
    expectedGrade: number;
}

export interface CollegeSendOffAction {
    person: Student;
    age: number;
}

/**
 * Identifies students whose birthday is exactly a specified number of days away.
 * Assumes today is the current date if not provided.
 */
export const getUpcomingBirthdays = (
    students: Student[],
    daysAhead: number = 7,
    today: Date = new Date()
): BirthdayAction[] => {
    return students
        .filter(s => s.birthdate)
        .map(person => {
            const birthdate = parseISO(person.birthdate);
            // Construct a "birthday this year" date
            const birthdayThisYear = new Date(
                today.getFullYear(),
                birthdate.getMonth(),
                getDate(birthdate) // using getDate to handle leap year correctly (Feb 29)
            );

            // If birthday already passed this year, look at next year
            if (isAfter(today, birthdayThisYear) && differenceInDays(today, birthdayThisYear) > 0) {
                birthdayThisYear.setFullYear(today.getFullYear() + 1);
            }

            const daysUntil = differenceInDays(birthdayThisYear, today);
            return { person, daysUntil };
        })
        .filter(action => action.daysUntil === daysAhead);
};

/**
 * Identifies students who need a grade promotion.
 * E.g., it's after June 1st, and their `pcoGrade` is lower than their `expectedGrade` for the new year.
 * Only targets children (isChild = true).
 */
export const getPendingGradePromotions = (
    students: Student[],
    today: Date = new Date(),
    options: GraderOptions = {}
): PromotionAction[] => {
    // Default promotion season starts June 1st
    const promotionStartMonth = 5; // June (0-indexed)
    const promotionStartDay = 1;

    const promotionSeasonStart = new Date(today.getFullYear(), promotionStartMonth, promotionStartDay);

    // If we haven't hit promotion season this year, there are no *new* pending promotions to suggest broadly.
    // (We rely on standard anomaly detection for regular mismatches).
    // But for this automation, we specifically look for people who should have been promoted recently.
    if (!isAfter(today, promotionSeasonStart)) {
        return [];
    }

    return students
        .filter(s => s.isChild && s.birthdate) // Only look at kids with birthdates
        .map(person => {
            const expectedGrade = calculateExpectedGrade(parseISO(person.birthdate), today, options);
            return { person, currentGrade: person.pcoGrade, expectedGrade };
        })
        .filter(action => {
            // They need a promotion if their current grade is less than expected
            // We only suggest promotion if they are 1 grade behind (typical end-of-year rollover)
            return action.currentGrade !== null && action.expectedGrade > action.currentGrade && (action.expectedGrade - action.currentGrade === 1);
        });
};

/**
 * Identifies students who are 18 and should be moved to College groups.
 * Targets young adults (Age 18) during late summer (August).
 */
export const getCollegeSendOffs = (
    students: Student[],
    today: Date = new Date()
): CollegeSendOffAction[] => {
    // Send-off season is typically August (Month 7, 0-indexed)
    const targetMonth = 7;

    // Only suggest this during August
    if (today.getMonth() !== targetMonth) {
        return [];
    }

    return students
        .filter(s => s.age === 18 && s.isChild) // Flag 18 year olds who are still marked as children
        .map(person => ({ person, age: person.age }));
};

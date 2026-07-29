import { isAfter, isBefore, differenceInDays, parseISO, isSameMonth, getDate } from 'date-fns';
import type { Student } from './pco';
import { calculateExpectedGrade, DEFAULT_CUTOFF_MONTH, DEFAULT_CUTOFF_DAY, type GraderOptions } from './grader';

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

export interface BackgroundCheckAction {
    person: Student;
    daysUntilExpiry: number;
}

export interface FirstTimeGiverAction {
    person: Student;
    daysSinceFirstGift: number;
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
 * Who is a grade behind and should be rolled over.
 *
 * Three things were wrong with the previous version and all three mattered in
 * August, the one week of the year this screen is worth opening.
 *
 * It ran off a hardcoded June 1, ignoring the configurable school-year cutoff
 * that `calculateExpectedGrade` uses — so the lane could open before or after
 * the grades it compares against had rolled over, depending on the church's
 * setting. There is one clock now, and it is the configured one.
 *
 * It filtered on `isChild`, PCO's hand-maintained flag. That is unreliable
 * above about 8th grade, which silently excluded most high-schoolers from
 * promotion in the exact season they needed it. Having a grade on file is the
 * honest test of whether somebody is in the school system.
 *
 * And it dropped anyone two or more grades behind, on the reasoning that a
 * single-grade gap is the normal rollover. That is right about what to promote
 * automatically and wrong about what to do with the rest: a two-grade gap is a
 * data error somebody should look at, so `gradePromotionBacklog` returns them
 * separately rather than letting them vanish.
 */
export const getPendingGradePromotions = (
    students: Student[],
    today: Date = new Date(),
    options: GraderOptions = {}
): PromotionAction[] => gradePromotionBacklog(students, today, options).readyToPromote;

export interface GradePromotionBacklog {
    /** Exactly one grade behind: the ordinary rollover, safe to promote in bulk. */
    readyToPromote: PromotionAction[];
    /** Two or more behind: not a rollover, a data problem. Needs a human. */
    needsReview: PromotionAction[];
}

export const gradePromotionBacklog = (
    students: Student[],
    today: Date = new Date(),
    options: GraderOptions = {}
): GradePromotionBacklog => {
    const { cutoffMonth = DEFAULT_CUTOFF_MONTH, cutoffDay = DEFAULT_CUTOFF_DAY } = options;

    // The same cutoff the grade calculation uses. Before it, expected grades have
    // not rolled over yet and every comparison below would be against last year.
    const seasonStart = new Date(today.getFullYear(), cutoffMonth, cutoffDay);
    if (isBefore(today, seasonStart)) return { readyToPromote: [], needsReview: [] };

    const readyToPromote: PromotionAction[] = [];
    const needsReview: PromotionAction[] = [];

    for (const person of students) {
        // A grade on file is what says "this person is in the school system".
        if (!person.birthdate || person.pcoGrade === null) continue;

        const expectedGrade = calculateExpectedGrade(parseISO(person.birthdate), today, options);
        const gap = expectedGrade - person.pcoGrade;
        if (gap <= 0) continue;

        const action = { person, currentGrade: person.pcoGrade, expectedGrade };
        (gap === 1 ? readyToPromote : needsReview).push(action);
    }

    return { readyToPromote, needsReview };
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

/**
 * Identifies adults whose background checks are expiring within the specified threshold.
 */
export const getExpiringBackgroundChecks = (students: Student[], thresholdDays: number = 30, referenceDate: Date = new Date()): BackgroundCheckAction[] => {
    return students
        .filter(s => !s.isChild && s.backgroundCheckExpiresAt)
        .map(person => {
            const expiryDate = new Date(person.backgroundCheckExpiresAt!);
            const daysUntilExpiry = differenceInDays(expiryDate, referenceDate);
            return { person, daysUntilExpiry };
        })
        .filter(action => action.daysUntilExpiry > 0 && action.daysUntilExpiry <= thresholdDays)
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
};

/**
 * Identifies adults whose background checks have already expired.
 */
export const getExpiredBackgroundChecks = (students: Student[], referenceDate: Date = new Date()): BackgroundCheckAction[] => {
    return students
        .filter(s => !s.isChild && s.backgroundCheckExpiresAt)
        .map(person => {
            const expiryDate = new Date(person.backgroundCheckExpiresAt!);
            const daysUntilExpiry = differenceInDays(expiryDate, referenceDate);
            return { person, daysUntilExpiry };
        })
        .filter(action => action.daysUntilExpiry <= 0)
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry); // Most expired first
};

/**
 * Identifies people who gave for the first time within a recent threshold.
 */
export const getFirstTimeGivers = (students: Student[], thresholdDays: number = 7, referenceDate: Date = new Date()): FirstTimeGiverAction[] => {
    return students
        .filter(s => s.firstTimeGiver && s.firstGiftDate)
        .map(person => {
            const giftDate = new Date(person.firstGiftDate!);
            const daysSinceFirstGift = differenceInDays(referenceDate, giftDate);
            return { person, daysSinceFirstGift };
        })
        .filter(action => action.daysSinceFirstGift >= 0 && action.daysSinceFirstGift <= thresholdDays)
        .sort((a, b) => a.daysSinceFirstGift - b.daysSinceFirstGift); // Most recent first
};

/**
 * Identifies families with new babies (age 0).
 * Used for sending care packages (e.g., DoorDash meals).
 */
export const getNewBabies = (students: Student[]): Student[] => {
    return students.filter(s => s.age === 0 && s.isChild);
};

/**
 * Identifies elderly congregants (age >= 75) who may need assistance (e.g., Uber rides).
 */
export const getElderlyCare = (students: Student[]): Student[] => {
    return students.filter(s => !s.isChild && s.age >= 75);
};

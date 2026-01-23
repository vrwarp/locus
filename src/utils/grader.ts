import { differenceInYears, isAfter } from 'date-fns';

// Config: Default to Sept 1st cutoff
const CUTOFF_MONTH = 8; // September (0-indexed in JS dates)
const CUTOFF_DAY = 1;

export const calculateExpectedGrade = (dob: Date, today: Date = new Date()): number => {
  const currentSchoolYearStart = isAfter(today, new Date(today.getFullYear(), CUTOFF_MONTH, CUTOFF_DAY))
    ? today.getFullYear()
    : today.getFullYear() - 1;

  // Logic: Calculate age as of the school year start
  const cutoffDate = new Date(currentSchoolYearStart, CUTOFF_MONTH, CUTOFF_DAY);
  const ageAtCutoff = differenceInYears(cutoffDate, dob);

  // USA Standard: 6 years old = 1st Grade
  const grade = ageAtCutoff - 5;

  // Return -1 for Pre-K, 0 for K, 1-12 for Grades, 13+ for Graduated
  return grade;
};

import { differenceInYears, isBefore } from 'date-fns';

// Config: Default to Sept 1st cutoff
const DEFAULT_CUTOFF_MONTH = 8; // September (0-indexed in JS dates)
const DEFAULT_CUTOFF_DAY = 1;

export interface GraderOptions {
  cutoffMonth?: number;
  cutoffDay?: number;
}

export const calculateExpectedGrade = (
  dob: Date,
  today: Date = new Date(),
  options: GraderOptions = {}
): number => {
  const { cutoffMonth = DEFAULT_CUTOFF_MONTH, cutoffDay = DEFAULT_CUTOFF_DAY } = options;

  // Use !isBefore to handle the date being exactly on the cutoff (inclusive)
  const currentSchoolYearStart = !isBefore(today, new Date(today.getFullYear(), cutoffMonth, cutoffDay))
    ? today.getFullYear()
    : today.getFullYear() - 1;

  // Logic: Calculate age as of the school year start
  const cutoffDate = new Date(currentSchoolYearStart, cutoffMonth, cutoffDay);
  const ageAtCutoff = differenceInYears(cutoffDate, dob);

  // USA Standard: 6 years old = 1st Grade
  const grade = ageAtCutoff - 5;

  // Return -1 for Pre-K, 0 for K, 1-12 for Grades, 13+ for Graduated
  return grade;
};

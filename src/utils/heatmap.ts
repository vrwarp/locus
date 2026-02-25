import { parseISO, isValid, getMonth, getDate } from 'date-fns';
import type { Student } from './pco';

export interface HeatmapCell {
  monthIndex: number; // 0-11
  day: number; // 1-31
  count: number;
  students: Student[]; // Store students for potential tooltip details
}

export const calculateBirthdayHeatmap = (students: Student[]): HeatmapCell[] => {
  // Initialize grid (12 months x 31 days max)
  const heatmap: HeatmapCell[] = [];

  // Use a leap year (2024) to include Feb 29
  const year = 2024;

  for (let m = 0; m < 12; m++) {
    // Determine max days in this month
    // We can just iterate 1-31 and check if valid
    for (let d = 1; d <= 31; d++) {
        const testDate = new Date(year, m, d);

        // If the month rolled over, it's an invalid date (e.g., Feb 30 -> Mar 1/2)
        if (testDate.getMonth() !== m) {
             continue;
        }

        heatmap.push({
            monthIndex: m,
            day: d,
            count: 0,
            students: []
        });
    }
  }

  students.forEach(student => {
    if (!student.birthdate) return;
    const date = parseISO(student.birthdate);
    if (!isValid(date)) return;

    const m = getMonth(date);
    const d = getDate(date);

    const cell = heatmap.find(c => c.monthIndex === m && c.day === d);
    if (cell) {
        cell.count++;
        cell.students.push(student);
    }
  });

  return heatmap;
};

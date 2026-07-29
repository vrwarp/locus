import { differenceInMonths } from 'date-fns';
import type { Student } from './pco';

export interface GhostConfig {
  checkInThresholdMonths: number;
}

export const DEFAULT_GHOST_CONFIG: GhostConfig = {
  checkInThresholdMonths: 24,
};

export const isGhost = (student: Student, config: GhostConfig = DEFAULT_GHOST_CONFIG): boolean => {
  // Check Last Check-in
  if (!student.lastCheckInAt) {
    // Never checked in is considered a ghost
    return true;
  }

  const monthsSinceCheckIn = differenceInMonths(new Date(), new Date(student.lastCheckInAt));
  if (monthsSinceCheckIn <= config.checkInThresholdMonths) return false;

  // Small-group membership used to rescue someone here, on the reasoning that an
  // active community member is not a ghost. It was read from PCO Groups, which
  // this church does not use — so the count was always zero and the rescue could
  // never fire. Attendance is the only signal left.
  return true;
};

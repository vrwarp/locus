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

  // If they are in a group, they are not a ghost (Active Community Member)
  if (student.groupCount !== null && student.groupCount > 0) {
    return false;
  }

  return true;
};

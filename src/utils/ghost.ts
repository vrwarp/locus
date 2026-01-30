import { differenceInMonths } from 'date-fns';
import type { Student } from './pco';

export interface GhostConfig {
  checkInThresholdMonths: number;
}

export const DEFAULT_GHOST_CONFIG: GhostConfig = {
  checkInThresholdMonths: 24,
};

export const isGhost = (student: Student, config: GhostConfig = DEFAULT_GHOST_CONFIG): boolean => {
  // 1. Check Groups (if known). If they are in a group, they are NOT a ghost.
  if (student.groupCount !== null && student.groupCount > 0) {
      return false;
  }

  // 2. Check Last Check-in
  if (!student.lastCheckInAt) {
    // Never checked in is considered a ghost (unless groups check passed above)
    return true;
  }

  const monthsSinceCheckIn = differenceInMonths(new Date(), new Date(student.lastCheckInAt));
  if (monthsSinceCheckIn <= config.checkInThresholdMonths) return false;

  return true;
};

import { differenceInMonths } from 'date-fns';
import type { Student } from './pco';

export interface GhostConfig {
  checkInThresholdMonths: number;
}

export const DEFAULT_GHOST_CONFIG: GhostConfig = {
  checkInThresholdMonths: 24,
};

export const isGhost = (student: Student, config: GhostConfig = DEFAULT_GHOST_CONFIG): boolean => {
  // 1. Check Last Check-in (The Primary Filter)
  if (student.lastCheckInAt) {
      const monthsSinceCheckIn = differenceInMonths(new Date(), new Date(student.lastCheckInAt));
      if (monthsSinceCheckIn <= config.checkInThresholdMonths) return false;
  }
  // If no lastCheckInAt, they are a potential ghost (never checked in).

  return true;
};

export const isSafe = (student: Student): boolean => {
  if (student.groupCount !== undefined && student.groupCount > 0) {
      return true;
  }
  return false;
};

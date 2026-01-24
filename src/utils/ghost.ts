import { differenceInMonths } from 'date-fns';
import type { Student } from './pco';

export interface GhostConfig {
  checkInThresholdMonths: number;
  givingThreshold: number;
  groupThreshold: number;
}

export const DEFAULT_GHOST_CONFIG: GhostConfig = {
  checkInThresholdMonths: 24,
  givingThreshold: 100,
  groupThreshold: 0,
};

export const isGhost = (student: Student, config: GhostConfig = DEFAULT_GHOST_CONFIG): boolean => {
  // Check Groups
  if (student.groupCount > config.groupThreshold) return false;

  // Check Giving
  if (student.totalGiving > config.givingThreshold) return false;

  // Check Last Check-in
  if (!student.lastCheckInAt) {
    // Never checked in is considered a ghost if other criteria met
    return true;
  }

  const monthsSinceCheckIn = differenceInMonths(new Date(), new Date(student.lastCheckInAt));
  if (monthsSinceCheckIn <= config.checkInThresholdMonths) return false;

  return true;
};

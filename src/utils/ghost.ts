import { differenceInMonths } from 'date-fns';
import type { Student } from './pco';

export interface GhostConfig {
  checkInThresholdMonths: number;
  donationThreshold: number;
}

export const DEFAULT_GHOST_CONFIG: GhostConfig = {
  checkInThresholdMonths: 24,
  donationThreshold: 100,
};

export const isGhost = (student: Student, config: GhostConfig = DEFAULT_GHOST_CONFIG): boolean => {
  // Check Donations (Exception)
  // If donation data is available and exceeds threshold, they are NOT a ghost (High Value Donor)
  if (student.donationTotal !== undefined && student.donationTotal !== null) {
      if (student.donationTotal > config.donationThreshold) {
          return false;
      }
  }

  // Check Last Check-in
  if (!student.lastCheckInAt) {
    // Never checked in is considered a ghost
    return true;
  }

  const monthsSinceCheckIn = differenceInMonths(new Date(), new Date(student.lastCheckInAt));
  if (monthsSinceCheckIn <= config.checkInThresholdMonths) return false;

  return true;
};

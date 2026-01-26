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
  // 1. Check Last Check-in (The Primary Filter)
  if (student.lastCheckInAt) {
      const monthsSinceCheckIn = differenceInMonths(new Date(), new Date(student.lastCheckInAt));
      if (monthsSinceCheckIn <= config.checkInThresholdMonths) return false;
  }
  // If no lastCheckInAt, they are a potential ghost (never checked in).

  // 2. Check Exonerating Factors (If data is available)

  // High Value Donor
  if (student.donationTotal !== undefined && student.donationTotal > config.donationThreshold) {
      return false;
  }

  // Active Group Member
  if (student.groupCount !== undefined && student.groupCount > 0) {
      return false;
  }

  return true;
};

export const isHighValueDonor = (student: Student, config: GhostConfig = DEFAULT_GHOST_CONFIG): boolean => {
    return (student.donationTotal || 0) > config.donationThreshold;
}

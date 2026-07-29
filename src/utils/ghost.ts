import { differenceInMonths } from 'date-fns';
import type { Student } from './pco';

export interface GhostConfig {
  checkInThresholdMonths: number;
  /**
   * How long a record must have existed before absence means anything.
   *
   * Without this, "never checked in" caught every family who joined last Sunday
   * and every baby added at birth — the newest records in the database, flagged
   * for deactivation on the strength of having no history yet.
   */
  minTenureMonths: number;
}

export const DEFAULT_GHOST_CONFIG: GhostConfig = {
  checkInThresholdMonths: 24,
  minTenureMonths: 12,
};

/** Why a record was flagged, in words an admin can check against the person. */
export type GhostReason =
  | { kind: 'never-checked-in'; tenureMonths: number }
  | { kind: 'lapsed'; monthsSinceCheckIn: number };

/**
 * Should this record be considered for archival?
 *
 * Deliberately conservative, because the action it feeds is a write to somebody's
 * real member record. Two ways to fail closed:
 *
 *   - A record younger than `minTenureMonths` is never a ghost, whatever its
 *     check-in history. New families have no history by definition.
 *   - A record with no `createdAt` is never a ghost either. PCO returns
 *     `created_at` on every Person, so a missing value means something went wrong
 *     upstream — and "we don't know when this record appeared" is not grounds to
 *     deactivate it.
 */
export const ghostReason = (
  student: Student,
  config: GhostConfig = DEFAULT_GHOST_CONFIG
): GhostReason | null => {
  if (!student.createdAt) return null;

  const tenureMonths = differenceInMonths(new Date(), new Date(student.createdAt));
  if (tenureMonths < config.minTenureMonths) return null;

  if (!student.lastCheckInAt) return { kind: 'never-checked-in', tenureMonths };

  const monthsSinceCheckIn = differenceInMonths(new Date(), new Date(student.lastCheckInAt));
  if (monthsSinceCheckIn <= config.checkInThresholdMonths) return null;

  return { kind: 'lapsed', monthsSinceCheckIn };
};

export const isGhost = (student: Student, config: GhostConfig = DEFAULT_GHOST_CONFIG): boolean =>
  ghostReason(student, config) !== null;

export const describeGhostReason = (reason: GhostReason): string =>
  reason.kind === 'never-checked-in'
    ? `On file ${reason.tenureMonths} months, never checked in`
    : `Last check-in ${reason.monthsSinceCheckIn} months ago`;

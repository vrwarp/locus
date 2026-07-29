import type { GamificationState } from './storage';

/**
 * A record of edits made, per day. Not a score.
 *
 * Locus used to count "fixes" — a number incremented whenever a field changed
 * shape, then displayed as though it meant a member record had become more
 * correct. It never did. The product has no source of truth about anyone's
 * name, phone, address or grade and never asks for one: it compares a value
 * against a pattern and rewrites it.
 *
 * The feature audit spent four rounds designing a gate that would credit only
 * genuine corrections, and concluded no such gate exists. No predicate over
 * (before, after) can tell "someone rang the family and confirmed this" from
 * "someone accepted the tool's guess", because nobody rang the family. Review
 * Mode's one-click bulk fixer settled it: any rule computable from the record
 * is a rule the fixer already satisfies without a human reading anything.
 *
 * So this counts edits and calls them edits. It is honest, it shows whether a
 * cleanup session happened, and it claims nothing about whether the database
 * is better than it was.
 */
export const recordEdits = (
  state: GamificationState,
  count: number = 1
): GamificationState => {
  // Local date parts, not a UTC ISO string — otherwise an evening session in a
  // western timezone lands on tomorrow's row.
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const fixHistory = { ...(state.fixHistory || {}) };
  fixHistory[today] = (fixHistory[today] || 0) + count;
  return { fixHistory };
};

/** Edits recorded today. The only figure any surface is entitled to show. */
export const editsToday = (state: GamificationState): number => {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return state.fixHistory?.[today] || 0;
};

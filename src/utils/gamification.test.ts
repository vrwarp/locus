import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { recordEdits, editsToday } from './gamification';
import type { GamificationState } from './storage';

describe('edit history', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-24T14:00:00'));
  });
  afterEach(() => vi.useRealTimers());

  const empty: GamificationState = { fixHistory: {} };

  it('records an edit against today', () => {
    expect(editsToday(recordEdits(empty))).toBe(1);
  });

  it('accumulates within a day', () => {
    let state = recordEdits(empty);
    state = recordEdits(state);
    state = recordEdits(state);
    expect(editsToday(state)).toBe(3);
  });

  it('records a batch as one call', () => {
    expect(editsToday(recordEdits(empty, 17))).toBe(17);
  });

  it('starts a fresh count on a new day and keeps the old one', () => {
    const yesterday = recordEdits(empty, 5);

    vi.setSystemTime(new Date('2026-03-25T09:00:00'));
    const today = recordEdits(yesterday, 2);

    expect(editsToday(today)).toBe(2);
    expect(today.fixHistory?.['2026-03-24']).toBe(5);
  });

  it('uses local date parts, so an evening session lands on the right day', () => {
    // A UTC ISO string would push a 9pm edit west of Greenwich into tomorrow.
    vi.setSystemTime(new Date('2026-03-24T21:30:00'));
    expect(recordEdits(empty).fixHistory).toHaveProperty('2026-03-24');
  });

  it('reads zero from a state that has never recorded anything', () => {
    expect(editsToday({})).toBe(0);
  });

  it('carries no field that claims correctness', () => {
    const state = recordEdits(empty, 4);
    expect(Object.keys(state)).toEqual(['fixHistory']);
  });
});

import { describe, it, expect } from 'vitest';
import { updateGamificationState } from './gamification';
import type { GamificationState } from './storage';

describe('Gamification Logic', () => {
  const baseState: GamificationState = {
    lastActiveDate: '2023-01-01',
    currentStreak: 1,
    dailyFixes: 0,
    totalFixes: 0,
    ghostsCleared: 0,
    birthdatesFixed: 0,
    gradesFixed: 0,
    unlockedBadges: [],
    fixHistory: {}
  };

  it('increments total fixes', () => {
    const { newState } = updateGamificationState(baseState);
    expect(newState.totalFixes).toBe(1);
  });

  it('increments specific action types correctly', () => {
    const { newState: ghostState } = updateGamificationState(baseState, 'ghost', 5);
    expect(ghostState.ghostsCleared).toBe(5);
    expect(ghostState.totalFixes).toBe(5);

    const { newState: gradeState } = updateGamificationState(ghostState, 'grade', 2);
    expect(gradeState.gradesFixed).toBe(2);
    expect(gradeState.totalFixes).toBe(7);

    const { newState: bdayState } = updateGamificationState(gradeState, 'birthdate', 3);
    expect(bdayState.birthdatesFixed).toBe(3);
    expect(bdayState.totalFixes).toBe(10);
  });

  it('awards The Exorcist badge', () => {
      const state = { ...baseState, ghostsCleared: 995, totalFixes: 995 };
      const { newState, newBadges } = updateGamificationState(state, 'ghost', 5);

      expect(newState.ghostsCleared).toBe(1000);
      const exorcistBadge = newBadges.find(b => b.id === 'the-exorcist');
      expect(exorcistBadge).toBeDefined();
  });

  it('awards The Time Lord badge', () => {
      const state = { ...baseState, birthdatesFixed: 499, totalFixes: 499 };
      const { newState, newBadges } = updateGamificationState(state, 'birthdate', 1);

      expect(newState.birthdatesFixed).toBe(500);
      const timeLordBadge = newBadges.find(b => b.id === 'the-time-lord');
      expect(timeLordBadge).toBeDefined();
  });

  it('awards The Golden Record badge', () => {
      const state = { ...baseState, totalFixes: 9999 };
      const { newState, newBadges } = updateGamificationState(state, 'general', 1);

      expect(newState.totalFixes).toBe(10000);
      const goldenRecordBadge = newBadges.find(b => b.id === 'the-golden-record');
      expect(goldenRecordBadge).toBeDefined();
  });

  it('awards First Fix badge', () => {
    const { newState, newBadges } = updateGamificationState(baseState);
    expect(newState.totalFixes).toBe(1);
    expect(newBadges).toHaveLength(1);
    expect(newBadges[0].id).toBe('first-fix');
    expect(newState.unlockedBadges).toHaveLength(1);
    expect(newState.unlockedBadges[0].id).toBe('first-fix');
  });

  it('does not award First Fix badge twice', () => {
    const stateWithBadge: GamificationState = {
        ...baseState,
        totalFixes: 1,
        unlockedBadges: [{ id: 'first-fix', date: '2023-01-01' }]
    };
    const { newState, newBadges } = updateGamificationState(stateWithBadge);
    expect(newState.totalFixes).toBe(2);
    expect(newBadges).toHaveLength(0);
    expect(newState.unlockedBadges).toHaveLength(1);
  });

  it('increments streak if active yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const state: GamificationState = {
        ...baseState,
        lastActiveDate: yesterdayStr,
        currentStreak: 2
    };

    const { newState } = updateGamificationState(state);
    expect(newState.currentStreak).toBe(3);
  });

  it('awards Streak Master badge', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

    const state: GamificationState = {
        ...baseState,
        lastActiveDate: yesterdayStr,
        currentStreak: 2,
        unlockedBadges: []
    };

    const { newState, newBadges } = updateGamificationState(state);
    expect(newState.currentStreak).toBe(3);

    // Check if Streak Master is in newBadges
    const streakBadge = newBadges.find(b => b.id === 'streak-master');
    expect(streakBadge).toBeDefined();
  });

  it('resets streak if gap > 1 day', () => {
     const twoDaysAgo = new Date();
     twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
     const twoDaysAgoStr = `${twoDaysAgo.getFullYear()}-${String(twoDaysAgo.getMonth() + 1).padStart(2, '0')}-${String(twoDaysAgo.getDate()).padStart(2, '0')}`;

     const state: GamificationState = {
         ...baseState,
         lastActiveDate: twoDaysAgoStr,
         currentStreak: 5
     };

     const { newState } = updateGamificationState(state);
     expect(newState.currentStreak).toBe(1);
  });

  it('updates fixHistory correctly', () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const state: GamificationState = {
          ...baseState,
          fixHistory: {
              '2023-01-01': 5
          }
      };

      const { newState } = updateGamificationState(state);
      expect(newState.fixHistory).toBeDefined();
      expect(newState.fixHistory?.[today]).toBe(1);
      expect(newState.fixHistory?.['2023-01-01']).toBe(5);

      const { newState: state2 } = updateGamificationState(newState);
      expect(state2.fixHistory?.[today]).toBe(2);
  });
});

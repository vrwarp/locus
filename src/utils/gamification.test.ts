import { describe, it, expect, vi } from 'vitest';
import { updateGamificationState, BADGES } from './gamification';
import type { GamificationState } from './storage';

describe('Gamification Logic', () => {
  const baseState: GamificationState = {
    lastActiveDate: '2023-01-01',
    currentStreak: 1,
    dailyFixes: 0,
    totalFixes: 0,
    unlockedBadges: []
  };

  it('increments total fixes', () => {
    const { newState } = updateGamificationState(baseState);
    expect(newState.totalFixes).toBe(1);
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
    const yesterdayStr = yesterday.toISOString().split('T')[0];

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
    const yesterdayStr = yesterday.toISOString().split('T')[0];

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
     const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

     const state: GamificationState = {
         ...baseState,
         lastActiveDate: twoDaysAgoStr,
         currentStreak: 5
     };

     const { newState } = updateGamificationState(state);
     expect(newState.currentStreak).toBe(1);
  });
});

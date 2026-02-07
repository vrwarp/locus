import type { GamificationState } from './storage';

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: (state: GamificationState) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: 'first-fix',
    name: 'First Fix',
    description: 'You fixed your first record!',
    icon: '🎉',
    condition: (state) => state.totalFixes >= 1
  },
  {
    id: 'streak-master',
    name: 'Streak Master',
    description: 'You reached a 3-day streak!',
    icon: '🔥',
    condition: (state) => state.currentStreak >= 3
  },
  {
    id: 'archaeologist',
    name: 'The Archaeologist',
    description: 'You have fixed 50 records.',
    icon: '🏺',
    condition: (state) => state.totalFixes >= 50
  },
  {
      id: 'daily-grind',
      name: 'Daily Grind',
      description: 'You fixed 10 records in one day!',
      icon: '☕',
      condition: (state) => state.dailyFixes >= 10
  }
];

export const updateGamificationState = (currentState: GamificationState): { newState: GamificationState, newBadges: Badge[] } => {
    const today = new Date().toISOString().split('T')[0];
    const lastActive = currentState.lastActiveDate;

    let newStreak = currentState.currentStreak;
    let newDailyFixes = currentState.dailyFixes;

    // Reset daily fixes if it's a new day
    if (lastActive !== today) {
        newDailyFixes = 0;
    }

    if (lastActive === today) {
        newDailyFixes += 1;
        // Streak already counted for today
    } else {
        // Check if yesterday
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        if (lastActive === yesterdayStr) {
            newStreak += 1;
        } else {
            // Broken streak (or first time)
            newStreak = 1;
        }
        newDailyFixes = 1;
    }

    const nextState: GamificationState = {
        lastActiveDate: today,
        currentStreak: newStreak,
        dailyFixes: newDailyFixes,
        totalFixes: currentState.totalFixes + 1,
        unlockedBadges: currentState.unlockedBadges ? [...currentState.unlockedBadges] : []
    };

    // Check for new badges
    const newBadges: Badge[] = [];
    const unlockedIds = new Set(nextState.unlockedBadges.map(b => b.id));

    BADGES.forEach(badge => {
        if (!unlockedIds.has(badge.id) && badge.condition(nextState)) {
            newBadges.push(badge);
            nextState.unlockedBadges.push({
                id: badge.id,
                date: new Date().toISOString()
            });
        }
    });

    return { newState: nextState, newBadges };
};

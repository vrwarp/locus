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
  },
  {
      id: 'the-exorcist',
      name: 'The Exorcist',
      description: 'You cleared 1,000 Ghosts!',
      icon: '👻',
      condition: (state) => (state.ghostsCleared || 0) >= 1000
  },
  {
      id: 'the-time-lord',
      name: 'The Time Lord',
      description: 'You fixed 500 Birthdates!',
      icon: '⌛',
      condition: (state) => (state.birthdatesFixed || 0) >= 500
  },
  {
      id: 'the-golden-record',
      name: 'The Golden Record',
      description: 'You made your 10,000th fix!',
      icon: '📀',
      condition: (state) => state.totalFixes >= 10000
  }
];

export type ActionType = 'general' | 'ghost' | 'birthdate' | 'grade';

export const updateGamificationState = (
    currentState: GamificationState,
    actionType: ActionType = 'general',
    count: number = 1
): { newState: GamificationState, newBadges: Badge[] } => {
    // Use local date string instead of UTC ISO string to prevent timezone bugs
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

        if (lastActive === yesterdayStr) {
            newStreak += 1;
        } else {
            // Broken streak (or first time)
            newStreak = 1;
        }
        newDailyFixes = 1;
    }

    // Update fix history
    const fixHistory = currentState.fixHistory ? { ...currentState.fixHistory } : {};
    if (!fixHistory[today]) {
        fixHistory[today] = 0;
    }
    fixHistory[today] += count;

    // Optional: Prune fixHistory to keep it from growing indefinitely (e.g., last 365 days)
    // We do a simple prune: if Object.keys > 400, keep only the most recent 365
    if (Object.keys(fixHistory).length > 400) {
        const sortedKeys = Object.keys(fixHistory).sort((a, b) => b.localeCompare(a));
        const keysToKeep = sortedKeys.slice(0, 365);
        const prunedHistory: Record<string, number> = {};
        keysToKeep.forEach(k => { prunedHistory[k] = fixHistory[k]; });
        // Replace with pruned
        Object.keys(fixHistory).forEach(k => {
            if (!prunedHistory[k]) delete fixHistory[k];
        });
    }

    const nextState: GamificationState = {
        ...currentState,
        lastActiveDate: today,
        currentStreak: newStreak,
        dailyFixes: newDailyFixes,
        totalFixes: currentState.totalFixes + count,
        unlockedBadges: currentState.unlockedBadges ? [...currentState.unlockedBadges] : [],
        fixHistory
    };

    if (actionType === 'ghost') {
        nextState.ghostsCleared = (currentState.ghostsCleared || 0) + count;
    } else if (actionType === 'birthdate') {
        nextState.birthdatesFixed = (currentState.birthdatesFixed || 0) + count;
    } else if (actionType === 'grade') {
        nextState.gradesFixed = (currentState.gradesFixed || 0) + count;
    } else if (actionType === 'phone') {
        nextState.phonesFixed = (currentState.phonesFixed || 0) + count;
    } else if (actionType === 'email') {
        nextState.emailsFixed = (currentState.emailsFixed || 0) + count;
    } else if (actionType === 'address') {
        nextState.addressesFixed = (currentState.addressesFixed || 0) + count;
    }

    // Process Bounties
    if (nextState.bounties) {
        nextState.bounties = nextState.bounties.map(bounty => {
            if (!bounty.completedAt && (bounty.actionType === 'general' || bounty.actionType === actionType)) {
                const newCount = bounty.currentCount + count;
                return {
                    ...bounty,
                    currentCount: Math.min(newCount, bounty.targetCount),
                    completedAt: newCount >= bounty.targetCount ? new Date().toISOString() : undefined
                };
            }
            return bounty;
        });
    }

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

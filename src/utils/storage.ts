import type { GraderOptions } from './grader';
import type { HealthStats } from './analytics';
import { encryptData, decryptData } from './crypto';

export interface AppConfig {
  graderOptions: GraderOptions;
  highContrastMode?: boolean;
  sandboxMode?: boolean;
  colorblindMode?: boolean;
}

export interface HealthHistoryEntry {
  timestamp: number;
  score: number;
  accuracy: number;
  totalRecords: number;
}

export interface GamificationState {
  lastActiveDate: string; // YYYY-MM-DD
  currentStreak: number;
  dailyFixes: number;
  totalFixes: number;
}

const STORAGE_KEY = 'locus_config';
const HISTORY_KEY = 'locus_health_history';
const GAMIFICATION_KEY = 'locus_gamification';

export const loadConfig = async (appId: string): Promise<AppConfig> => {
  if (!appId) return { graderOptions: {} };

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
       return { graderOptions: {} };
    }
    // Try to decrypt
    try {
      return await decryptData(stored, appId);
    } catch (e) {
       // If decryption fails, it might be old unencrypted data or wrong key.
       // Check if it looks like JSON?
       // For now, assume if it fails, we can't recover.
       // But wait, during migration, users might have unencrypted data.
       // We could try JSON.parse(stored) as fallback?
       try {
           return JSON.parse(stored) as AppConfig;
       } catch (jsonErr) {
           console.error("Failed to decrypt config and not valid JSON", e);
           return { graderOptions: {} };
       }
    }
  } catch (e) {
    console.error("Failed to load config", e);
    return { graderOptions: {} };
  }
};

export const saveConfig = async (config: AppConfig, appId: string): Promise<void> => {
  if (!appId) return;
  try {
    const encrypted = await encryptData(config, appId);
    localStorage.setItem(STORAGE_KEY, encrypted);
  } catch (e) {
    console.error("Failed to save config", e);
  }
};

export const loadHealthHistory = async (appId: string): Promise<HealthHistoryEntry[]> => {
  if (!appId) return [];
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];

    try {
        return await decryptData(stored, appId);
    } catch (e) {
        // Fallback for migration
        try {
            return JSON.parse(stored) as HealthHistoryEntry[];
        } catch (jsonErr) {
            return [];
        }
    }
  } catch (e) {
    console.error("Failed to load health history", e);
    return [];
  }
};

export const saveHealthSnapshot = async (stats: HealthStats, appId: string): Promise<void> => {
  if (!appId) return;
  try {
    const history = await loadHealthHistory(appId);
    const entry: HealthHistoryEntry = {
      timestamp: Date.now(),
      score: stats.score,
      accuracy: stats.accuracy,
      totalRecords: stats.total,
    };
    history.push(entry);

    const encrypted = await encryptData(history, appId);
    localStorage.setItem(HISTORY_KEY, encrypted);
  } catch (e) {
    console.error("Failed to save health snapshot", e);
  }
};

export const loadGamificationState = async (appId: string): Promise<GamificationState> => {
  if (!appId) return { lastActiveDate: '', currentStreak: 0, dailyFixes: 0, totalFixes: 0 };
  try {
      const stored = localStorage.getItem(GAMIFICATION_KEY);
      if (!stored) return { lastActiveDate: '', currentStreak: 0, dailyFixes: 0, totalFixes: 0 };

      try {
          return await decryptData(stored, appId);
      } catch (e) {
          try {
              return JSON.parse(stored) as GamificationState;
          } catch {
               return { lastActiveDate: '', currentStreak: 0, dailyFixes: 0, totalFixes: 0 };
          }
      }
  } catch (e) {
      console.error("Failed to load gamification state", e);
      return { lastActiveDate: '', currentStreak: 0, dailyFixes: 0, totalFixes: 0 };
  }
};

export const saveGamificationState = async (state: GamificationState, appId: string): Promise<void> => {
    if (!appId) return;
    try {
        const encrypted = await encryptData(state, appId);
        localStorage.setItem(GAMIFICATION_KEY, encrypted);
    } catch (e) {
        console.error("Failed to save gamification state", e);
    }
};

export const updateGamificationState = (currentState: GamificationState): GamificationState => {
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

    return {
        lastActiveDate: today,
        currentStreak: newStreak,
        dailyFixes: newDailyFixes,
        totalFixes: currentState.totalFixes + 1
    };
};

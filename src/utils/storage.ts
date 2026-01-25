import type { GraderOptions } from './grader';
import type { HealthStats } from './analytics';
import { encryptData, decryptData } from './crypto';

export interface AppConfig {
  graderOptions: GraderOptions;
  highContrastMode?: boolean;
  sandboxMode?: boolean;
}

export interface HealthHistoryEntry {
  timestamp: number;
  score: number;
  accuracy: number;
  totalRecords: number;
}

const STORAGE_KEY = 'locus_config';
const HISTORY_KEY = 'locus_health_history';

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

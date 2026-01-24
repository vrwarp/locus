import type { GraderOptions } from './grader';
import type { HealthStats } from './analytics';

export interface AppConfig {
  graderOptions: GraderOptions;
  highContrastMode?: boolean;
}

export interface HealthHistoryEntry {
  timestamp: number;
  score: number;
  accuracy: number;
  totalRecords: number;
}

const STORAGE_KEY = 'locus_config';
const HISTORY_KEY = 'locus_health_history';

export const loadConfig = (appId?: string): AppConfig => {
  // In the future, appId will be used for decryption key derivation
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
       return { graderOptions: {} };
    }
    return JSON.parse(stored) as AppConfig;
  } catch (e) {
    console.error("Failed to load config", e);
    return { graderOptions: {} };
  }
};

export const saveConfig = (config: AppConfig, appId?: string): void => {
  // In the future, appId will be used for encryption
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Failed to save config", e);
  }
};

export const loadHealthHistory = (): HealthHistoryEntry[] => {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as HealthHistoryEntry[];
  } catch (e) {
    console.error("Failed to load health history", e);
    return [];
  }
};

export const saveHealthSnapshot = (stats: HealthStats): void => {
  try {
    const history = loadHealthHistory();
    const entry: HealthHistoryEntry = {
      timestamp: Date.now(),
      score: stats.score,
      accuracy: stats.accuracy,
      totalRecords: stats.total,
    };
    history.push(entry);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error("Failed to save health snapshot", e);
  }
};

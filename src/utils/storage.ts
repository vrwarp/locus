import type { GraderOptions } from './grader';

export interface AppConfig {
  graderOptions: GraderOptions;
}

const STORAGE_KEY = 'locus_config';

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

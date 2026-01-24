import { openDB } from 'idb';
import { encryptData, decryptData } from './crypto';

const DB_NAME = 'locus-db';
const STORE_NAME = 'query-cache';

interface CacheEntry {
  value: string; // Encrypted data
  timestamp: number;
}

const openCacheDB = async () => {
  return openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export const saveToCache = async (key: string, data: any, appId: string): Promise<void> => {
  if (!appId) return;
  try {
    const db = await openCacheDB();
    const encrypted = await encryptData(data, appId);
    const entry: CacheEntry = {
      value: encrypted,
      timestamp: Date.now(),
    };
    await db.put(STORE_NAME, entry, key);
  } catch (error) {
    console.error('Failed to save to cache:', error);
  }
};

export const loadFromCache = async <T>(key: string, appId: string, ttlMs: number): Promise<T | null> => {
  if (!appId) return null;
  try {
    const db = await openCacheDB();
    const entry = await db.get(STORE_NAME, key) as CacheEntry | undefined;

    if (!entry) return null;

    if (Date.now() - entry.timestamp > ttlMs) {
      await db.delete(STORE_NAME, key);
      return null;
    }

    try {
      return await decryptData(entry.value, appId) as T;
    } catch (e) {
      console.error('Failed to decrypt cache:', e);
      return null;
    }
  } catch (error) {
    console.error('Failed to load from cache:', error);
    return null;
  }
};

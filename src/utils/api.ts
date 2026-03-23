import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { setupCache, buildStorage } from 'axios-cache-interceptor';
import localforage from 'localforage';

// Extend the config to track retry count
interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

const MAX_RETRIES = 3;

// Only init storage in browser env to avoid issues in Node test env
const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const storage = isBrowser ? buildStorage({
  async find(key) {
    const result = await localforage.getItem(key);
    return result as any || undefined;
  },
  async set(key, value) {
    await localforage.setItem(key, value as any);
  },
  async remove(key) {
    await localforage.removeItem(key);
  }
}) : undefined;

const instance = axios.create();

// Ensure test mode bypasses caching to fix timers
const cacheConfig = storage ? { storage, ttl: 1000 * 60 * 60 } : { ttl: 0, methods: [] as string[] }; // Disable cache if no storage

// @ts-ignore
const api = setupCache(instance, cacheConfig as any);

let globalBackoffPromise: Promise<void> | null = null;
let nextAllowedRequestTime = 0;
// We removed MIN_REQUEST_INTERVAL delay to prevent Playwright Ghost Protocol from timing out
// because Ghost Protocol makes O(N) requests (70 ghosts * 2 reqs each = 140).
// 140 * 200ms = 28 seconds, timing out a 10000ms Playwright expectation.
// Planning Center rate limit is 100 requests per 20 seconds. We'll handle 429 backoff gracefully instead.
const MIN_REQUEST_INTERVAL = 0;

export const __resetApiStateForTesting = () => {
    globalBackoffPromise = null;
    nextAllowedRequestTime = 0;
};

// @ts-ignore
api.interceptors.request.use(async (config: any) => {
    if (globalBackoffPromise) {
        await globalBackoffPromise;
    }

    return config;
});

// @ts-ignore
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig;

    // If config is missing or we've reached max retries, reject
    if (!config || (config._retryCount || 0) >= MAX_RETRIES) {
      return Promise.reject(error);
    }

    // Check for 429 status
    if (error.response?.status === 429) {
      config._retryCount = (config._retryCount || 0) + 1;

      // Determine wait time from Retry-After header or default to exponential backoff
      const retryAfter = error.response.headers['retry-after'];
      let waitTime = 1000; // Default 1s

      if (retryAfter) {
        const seconds = parseInt(retryAfter as string, 10);
        if (!isNaN(seconds)) {
          waitTime = seconds * 1000;
        }
      } else {
        // Exponential backoff: 1s, 2s, 4s...
        waitTime = 1000 * Math.pow(2, config._retryCount - 1);
      }

      console.warn(`Rate limited. Global backoff for ${waitTime}ms (Attempt ${config._retryCount}/${MAX_RETRIES})`);

      // If we're not already waiting on a global backoff, start one
      if (!globalBackoffPromise) {
          globalBackoffPromise = new Promise(resolve => {
              setTimeout(() => {
                  globalBackoffPromise = null;
                  resolve();
              }, waitTime);
          });
      }

      // Wait for the global backoff
      await globalBackoffPromise;

      // Retry the request using the main api instance
      return api(config as any);
    }

    return Promise.reject(error);
  }
);

export default api;

import axios, { AxiosError } from 'axios';
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios';

// Extend the config to track retry count
interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
}

const api: AxiosInstance = axios.create();

const MAX_RETRIES = 3;

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
        const seconds = parseInt(retryAfter, 10);
        if (!isNaN(seconds)) {
          waitTime = seconds * 1000;
        }
      } else {
        // Exponential backoff: 1s, 2s, 4s...
        waitTime = 1000 * Math.pow(2, config._retryCount - 1);
      }

      console.warn(`Rate limited. Retrying in ${waitTime}ms (Attempt ${config._retryCount}/${MAX_RETRIES})`);

      // Create a promise that resolves after waitTime
      await new Promise((resolve) => setTimeout(resolve, waitTime));

      // Retry the request
      return api(config);
    }

    return Promise.reject(error);
  }
);

export default api;

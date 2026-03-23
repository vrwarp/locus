import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';

// Mock storage for localforage before importing api
vi.mock('localforage', () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  }
}));

import api, { __resetApiStateForTesting } from './api';

describe('API Client Rate Limiting', () => {
  beforeEach(() => {
    vi.useFakeTimers({
        toFake: ['setTimeout', 'clearTimeout', 'Date', 'setInterval', 'clearInterval']
    });
    __resetApiStateForTesting();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
    delete api.defaults.adapter;
    delete axios.defaults.adapter;
  });

  it('should pass through successful requests', async () => {
    const mockAdapter = vi.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: 'success'
    });
    api.defaults.adapter = mockAdapter;

    const promise = api.get('/test');

    // Fast forward throttle time
    await vi.runAllTimersAsync();

    const response = await promise;
    expect(response.data).toBe('success');
    expect(mockAdapter).toHaveBeenCalledTimes(1);
  });

  it('should space out concurrent requests', async () => {
      const mockAdapter = vi.fn().mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        data: 'success'
    });
    api.defaults.adapter = mockAdapter;

    const p1 = api.get('/test1');
    const p2 = api.get('/test2');
    const p3 = api.get('/test3');

    // Initial request goes through immediately (no wait)
    // 2nd waits 200ms
    // 3rd waits 400ms

    // Fast forward enough for all
    await vi.runAllTimersAsync();

    await p1;
    await p2;
    await p3;

    expect(mockAdapter).toHaveBeenCalledTimes(3);
  });

  it('should retry on 429 with Retry-After header', async () => {
    const mockAdapter = vi.fn()
        .mockRejectedValueOnce({
            isAxiosError: true,
            response: {
                status: 429,
                headers: { 'retry-after': '1' }
            },
            config: { method: 'get', url: '/test' }
        })
        .mockResolvedValue({
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {},
            data: 'recovered'
        });

    api.defaults.adapter = mockAdapter;

    const promise = api.get('/test');

    // Since we're using fake timers with Promises, we use advanceTimersByTimeAsync repeatedly
    // to unblock the await chains correctly.

    // 1. Initial request goes out immediately (waitTime = 0)
    // mockAdapter throws 429.
    // 2. Response interceptor catches 429. Sets globalBackoffPromise for 1000ms.
    await vi.advanceTimersByTimeAsync(1); // Allow promises to settle

    // 3. Advance 1000ms to clear global backoff
    await vi.advanceTimersByTimeAsync(1000);

    // 4. Retry request goes out (via return api(config)).
    // It hits request interceptor. nextAllowedRequestTime was set previously to `now + 200`,
    // but 1000ms has passed, so `now > nextAllowedRequestTime`. waitTime = 0.
    await vi.runAllTimersAsync();

    const response = await promise;
    expect(response.data).toBe('recovered');
    expect(mockAdapter).toHaveBeenCalledTimes(2);
  });

  it('should retry on 429 with exponential backoff (default)', async () => {
    const mockAdapter = vi.fn()
        .mockRejectedValueOnce({
            isAxiosError: true,
            response: {
                status: 429,
                headers: {}
            },
            config: { method: 'get', url: '/test' }
        })
        .mockResolvedValue({
            status: 200,
            statusText: 'OK',
            headers: {},
            config: {},
            data: 'recovered'
        });

    api.defaults.adapter = mockAdapter;

    const promise = api.get('/test');

    await vi.advanceTimersByTimeAsync(1); // settle promises
    await vi.advanceTimersByTimeAsync(1000); // 1st backoff (1s)
    await vi.runAllTimersAsync();

    const response = await promise;
    expect(response.data).toBe('recovered');
    expect(mockAdapter).toHaveBeenCalledTimes(2);
  });

  it('should fail after max retries', async () => {
    const error429 = {
        isAxiosError: true,
        response: {
            status: 429,
            headers: { 'retry-after': '1' }
        },
        config: { method: 'get', url: '/test' }
    };

    const mockAdapter = vi.fn().mockRejectedValue(error429);

    api.defaults.adapter = mockAdapter;

    const promise = api.get('/test');

    // Disable Unhandled Rejection for the promise while we wait
    promise.catch(() => {});

    await vi.advanceTimersByTimeAsync(1); // settle initial req
    await vi.advanceTimersByTimeAsync(1000); // retry 1 backoff (1s)
    await vi.advanceTimersByTimeAsync(1); // settle retry 1 req
    await vi.advanceTimersByTimeAsync(1000); // retry 2 backoff (1s - wait, actually it uses config._retryCount so it's exponential if retryAfter is absent. But here retryAfter is '1', so it's 1s each time)
    await vi.advanceTimersByTimeAsync(1); // settle retry 2 req
    await vi.advanceTimersByTimeAsync(1000); // retry 3 backoff
    await vi.runAllTimersAsync(); // clear remaining

    await expect(promise).rejects.toMatchObject({ response: { status: 429 } });
    expect(mockAdapter).toHaveBeenCalledTimes(4); // Initial + 3 Retries
  });
});

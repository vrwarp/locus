import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api from './api';

describe('API Client Rate Limiting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    // Reset adapter
    delete api.defaults.adapter;
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

    const response = await api.get('/test');
    expect(response.data).toBe('success');
    expect(mockAdapter).toHaveBeenCalledTimes(1);
  });

  it('should retry on 429 with Retry-After header', async () => {
    const mockAdapter = vi.fn()
        .mockRejectedValueOnce({
            isAxiosError: true,
            response: {
                status: 429,
                headers: { 'retry-after': '1' } // 1 second
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

    // Advance time by 1000ms
    await vi.advanceTimersByTimeAsync(1000);

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
                headers: {} // No Retry-After
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

    // Default wait is 1000ms for first retry
    await vi.advanceTimersByTimeAsync(1000);

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

    // Advance time enough for 3 retries (1s, 1s, 1s)
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(1000);

    await expect(promise).rejects.toMatchObject({ response: { status: 429 } });
    expect(mockAdapter).toHaveBeenCalledTimes(4); // Initial + 3 Retries
  });
});

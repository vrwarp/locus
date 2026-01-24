import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig, saveConfig, AppConfig, loadHealthHistory, saveHealthSnapshot, HealthHistoryEntry } from './storage';
import type { HealthStats } from './analytics';

describe('Storage Utils', () => {
  const mockSetItem = vi.fn();
  const mockGetItem = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: mockGetItem,
        setItem: mockSetItem,
      },
      writable: true
    });
  });

  it('saves config to localStorage', () => {
    const config: AppConfig = { graderOptions: { cutoffMonth: 9, cutoffDay: 1 } };
    saveConfig(config, 'test-app-id');
    expect(mockSetItem).toHaveBeenCalledWith('locus_config', JSON.stringify(config));
  });

  it('loads config from localStorage', () => {
    const config: AppConfig = { graderOptions: { cutoffMonth: 5, cutoffDay: 15 } };
    mockGetItem.mockReturnValue(JSON.stringify(config));

    const loaded = loadConfig('test-app-id');
    expect(mockGetItem).toHaveBeenCalledWith('locus_config');
    expect(loaded).toEqual(config);
  });

  it('returns default config if localStorage is empty', () => {
    mockGetItem.mockReturnValue(null);
    const loaded = loadConfig();
    expect(loaded).toEqual({ graderOptions: {} });
  });

  it('returns default config if JSON parse fails', () => {
    mockGetItem.mockReturnValue('invalid-json');
    const loaded = loadConfig();
    expect(loaded).toEqual({ graderOptions: {} });
  });

  it('saves and loads highContrastMode', () => {
    const config: AppConfig = {
        graderOptions: {},
        highContrastMode: true
    };
    saveConfig(config);
    expect(mockSetItem).toHaveBeenCalledWith('locus_config', JSON.stringify(config));

    mockGetItem.mockReturnValue(JSON.stringify(config));
    const loaded = loadConfig();
    expect(loaded.highContrastMode).toBe(true);
  });

  describe('Health History', () => {
    it('returns empty array if no history', () => {
        mockGetItem.mockReturnValue(null);
        const history = loadHealthHistory();
        expect(history).toEqual([]);
    });

    it('saves a health snapshot', () => {
        // Setup existing history
        const existing: HealthHistoryEntry[] = [{ timestamp: 123, score: 50, accuracy: 50, totalRecords: 100 }];
        mockGetItem.mockReturnValue(JSON.stringify(existing));

        const stats: HealthStats = { score: 80, accuracy: 80.5, total: 200, anomalies: 10 };
        saveHealthSnapshot(stats);

        expect(mockSetItem).toHaveBeenCalledTimes(1);
        const callArgs = mockSetItem.mock.calls[0];
        expect(callArgs[0]).toBe('locus_health_history');

        const savedHistory = JSON.parse(callArgs[1]);
        expect(savedHistory).toHaveLength(2);
        expect(savedHistory[0]).toEqual(existing[0]);
        expect(savedHistory[1].score).toBe(80);
        expect(savedHistory[1].accuracy).toBe(80.5);
        expect(savedHistory[1].totalRecords).toBe(200);
        expect(savedHistory[1].timestamp).toBeDefined();
    });

    it('handles corrupted history data', () => {
        mockGetItem.mockReturnValue('invalid-json');
        const history = loadHealthHistory();
        expect(history).toEqual([]);
    });
  });
});

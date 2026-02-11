import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig, saveConfig, loadHealthHistory, saveHealthSnapshot, loadGamificationState, saveGamificationState } from './storage';
import type { AppConfig, HealthHistoryEntry, GamificationState } from './storage';
import type { HealthStats } from './analytics';
import * as cryptoUtils from './crypto';

// Mock crypto module
vi.mock('./crypto', () => ({
  encryptData: vi.fn(),
  decryptData: vi.fn(),
}));

describe('Storage Utils', () => {
  const mockSetItem = vi.fn();
  const mockGetItem = vi.fn();
  const appId = 'test-app-id';

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

  it('saves config to localStorage encrypted', async () => {
    const config: AppConfig = { graderOptions: { cutoffMonth: 9, cutoffDay: 1 } };
    const encryptedData = 'encrypted-blob';
    vi.mocked(cryptoUtils.encryptData).mockResolvedValue(encryptedData);

    await saveConfig(config, appId);

    expect(cryptoUtils.encryptData).toHaveBeenCalledWith(config, appId);
    expect(mockSetItem).toHaveBeenCalledWith('locus_config', encryptedData);
  });

  it('loads config from localStorage and decrypts', async () => {
    const config: AppConfig = { graderOptions: { cutoffMonth: 5, cutoffDay: 15 } };
    const encryptedData = 'encrypted-blob';
    mockGetItem.mockReturnValue(encryptedData);
    vi.mocked(cryptoUtils.decryptData).mockResolvedValue(config);

    const loaded = await loadConfig(appId);

    expect(mockGetItem).toHaveBeenCalledWith('locus_config');
    expect(cryptoUtils.decryptData).toHaveBeenCalledWith(encryptedData, appId);
    expect(loaded).toEqual(config);
  });

  it('returns default config if localStorage is empty', async () => {
    mockGetItem.mockReturnValue(null);
    const loaded = await loadConfig(appId);
    expect(loaded).toEqual({ graderOptions: {} });
  });

  it('returns default config if appId is missing', async () => {
    // @ts-ignore
    const loaded = await loadConfig(undefined);
    expect(loaded).toEqual({ graderOptions: {} });
  });

  it('falls back to JSON parse if decryption fails (migration support)', async () => {
    const config: AppConfig = { graderOptions: { cutoffMonth: 5, cutoffDay: 15 } };
    const jsonStr = JSON.stringify(config);
    mockGetItem.mockReturnValue(jsonStr);

    vi.mocked(cryptoUtils.decryptData).mockRejectedValue(new Error('Decrypt failed'));

    const loaded = await loadConfig(appId);
    expect(loaded).toEqual(config);
  });

  it('saves and loads highContrastMode', async () => {
    const config: AppConfig = {
        graderOptions: {},
        highContrastMode: true
    };
    const encryptedData = 'enc-theme';
    vi.mocked(cryptoUtils.encryptData).mockResolvedValue(encryptedData);
    vi.mocked(cryptoUtils.decryptData).mockResolvedValue(config);

    await saveConfig(config, appId);
    expect(mockSetItem).toHaveBeenCalledWith('locus_config', encryptedData);

    mockGetItem.mockReturnValue(encryptedData);
    const loaded = await loadConfig(appId);
    expect(loaded.highContrastMode).toBe(true);
  });

  it('saves and loads colorblindMode', async () => {
    const config: AppConfig = {
        graderOptions: {},
        colorblindMode: true
    };
    const encryptedData = 'enc-cb-theme';
    vi.mocked(cryptoUtils.encryptData).mockResolvedValue(encryptedData);
    vi.mocked(cryptoUtils.decryptData).mockResolvedValue(config);

    await saveConfig(config, appId);
    expect(mockSetItem).toHaveBeenCalledWith('locus_config', encryptedData);

    mockGetItem.mockReturnValue(encryptedData);
    const loaded = await loadConfig(appId);
    expect(loaded.colorblindMode).toBe(true);
  });

  it('saves and loads muteSounds', async () => {
    const config: AppConfig = {
        graderOptions: {},
        muteSounds: true
    };
    const encryptedData = 'enc-mute-sounds';
    vi.mocked(cryptoUtils.encryptData).mockResolvedValue(encryptedData);
    vi.mocked(cryptoUtils.decryptData).mockResolvedValue(config);

    await saveConfig(config, appId);
    expect(mockSetItem).toHaveBeenCalledWith('locus_config', encryptedData);

    mockGetItem.mockReturnValue(encryptedData);
    const loaded = await loadConfig(appId);
    expect(loaded.muteSounds).toBe(true);
  });

  describe('Health History', () => {
    it('returns empty array if no history', async () => {
        mockGetItem.mockReturnValue(null);
        const history = await loadHealthHistory(appId);
        expect(history).toEqual([]);
    });

    it('saves a health snapshot', async () => {
        // Setup existing history
        const existing: HealthHistoryEntry[] = [{ timestamp: 123, score: 50, accuracy: 50, totalRecords: 100 }];
        const encryptedExisting = 'enc-existing';
        mockGetItem.mockReturnValue(encryptedExisting);
        vi.mocked(cryptoUtils.decryptData).mockResolvedValue(existing);

        const stats: HealthStats = { score: 80, accuracy: 80.5, total: 200, anomalies: 10 };
        const encryptedNew = 'enc-new';
        vi.mocked(cryptoUtils.encryptData).mockResolvedValue(encryptedNew);

        await saveHealthSnapshot(stats, appId);

        expect(mockSetItem).toHaveBeenCalledTimes(1);
        const callArgs = mockSetItem.mock.calls[0];
        expect(callArgs[0]).toBe('locus_health_history');
        expect(callArgs[1]).toBe(encryptedNew); // should be encrypted

        // Verify what was passed to encryptData
        const encryptCallArgs = vi.mocked(cryptoUtils.encryptData).mock.calls[0];
        const historyPassed = encryptCallArgs[0] as HealthHistoryEntry[];
        expect(historyPassed).toHaveLength(2);
        expect(historyPassed[0]).toEqual(existing[0]);
    });

    it('handles corrupted history data', async () => {
        mockGetItem.mockReturnValue('invalid-data');
        vi.mocked(cryptoUtils.decryptData).mockRejectedValue(new Error('fail'));

        const history = await loadHealthHistory(appId);
        expect(history).toEqual([]);
    });
  });

  describe('Gamification Storage', () => {
      it('loads gamification state with default unlockedBadges', async () => {
          const storedState = { lastActiveDate: '2023-01-01', currentStreak: 5, dailyFixes: 0, totalFixes: 100 };
          mockGetItem.mockReturnValue('enc-gamification');
          vi.mocked(cryptoUtils.decryptData).mockResolvedValue(storedState);

          const loaded = await loadGamificationState(appId);
          expect(loaded.unlockedBadges).toEqual([]);
          expect(loaded.currentStreak).toBe(5);
      });

      it('saves gamification state', async () => {
          const state: GamificationState = {
              lastActiveDate: '2023-01-01',
              currentStreak: 5,
              dailyFixes: 0,
              totalFixes: 100,
              unlockedBadges: []
          };
          const encrypted = 'enc-state';
          vi.mocked(cryptoUtils.encryptData).mockResolvedValue(encrypted);

          await saveGamificationState(state, appId);
          expect(mockSetItem).toHaveBeenCalledWith('locus_gamification', encrypted);
      });
  });
});

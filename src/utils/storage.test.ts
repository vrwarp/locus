import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadConfig, saveConfig, AppConfig } from './storage';

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
});

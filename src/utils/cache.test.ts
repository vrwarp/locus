import { describe, it, expect, vi, beforeEach } from 'vitest';
import { saveToCache, loadFromCache } from './cache';
import * as crypto from './crypto';

// Mock idb
const mockPut = vi.fn();
const mockGet = vi.fn();
const mockDelete = vi.fn();

vi.mock('idb', () => ({
  openDB: vi.fn(() => Promise.resolve({
    put: mockPut,
    get: mockGet,
    delete: mockDelete,
    objectStoreNames: { contains: vi.fn() },
    createObjectStore: vi.fn(),
  })),
}));

// Mock crypto
vi.mock('./crypto', () => ({
  encryptData: vi.fn((data) => Promise.resolve(JSON.stringify(data) + '_encrypted')),
  decryptData: vi.fn((data) => Promise.resolve(JSON.parse(data.replace('_encrypted', '')))),
}));

describe('cache utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saveToCache encrypts and stores data', async () => {
    const data = { foo: 'bar' };
    await saveToCache('key1', data, 'app123');

    expect(crypto.encryptData).toHaveBeenCalledWith(data, 'app123');
    expect(mockPut).toHaveBeenCalledWith('query-cache', expect.objectContaining({
      value: JSON.stringify(data) + '_encrypted',
    }), 'key1');
  });

  it('loadFromCache returns data if valid', async () => {
    mockGet.mockResolvedValueOnce({
      value: JSON.stringify({ foo: 'bar' }) + '_encrypted',
      timestamp: Date.now(),
    });

    const result = await loadFromCache('key1', 'app123', 1000);
    expect(result).toEqual({ foo: 'bar' });
    expect(crypto.decryptData).toHaveBeenCalled();
  });

  it('loadFromCache returns null and deletes if expired', async () => {
     mockGet.mockResolvedValueOnce({
      value: JSON.stringify({ foo: 'bar' }) + '_encrypted',
      timestamp: Date.now() - 2000,
    });

    const result = await loadFromCache('key1', 'app123', 1000);
    expect(result).toBeNull();
    expect(mockDelete).toHaveBeenCalledWith('query-cache', 'key1');
  });

  it('loadFromCache returns null if no entry', async () => {
    mockGet.mockResolvedValueOnce(undefined);
    const result = await loadFromCache('key1', 'app123', 1000);
    expect(result).toBeNull();
  });
});

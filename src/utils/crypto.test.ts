import { describe, it, expect } from 'vitest';
import { encryptData, decryptData } from './crypto';

describe('Crypto Utils', () => {
  it('should encrypt and decrypt data correctly', async () => {
    const data = { secret: 'message', count: 42 };
    const password = 'my-secure-password';

    const encrypted = await encryptData(data, password);
    expect(encrypted).toBeDefined();
    expect(typeof encrypted).toBe('string');
    expect(encrypted).not.toBe(JSON.stringify(data)); // Should be encoded

    const decrypted = await decryptData(encrypted, password);
    expect(decrypted).toEqual(data);
  });

  it('should fail to decrypt with wrong password', async () => {
    const data = { secret: 'message' };
    const password = 'password1';
    const wrongPassword = 'password2';

    const encrypted = await encryptData(data, password);

    await expect(decryptData(encrypted, wrongPassword)).rejects.toThrow('Failed to decrypt data');
  });

  it('should handle different data types', async () => {
    const data = "Just a string";
    const password = 'pass';
    const encrypted = await encryptData(data, password);
    const decrypted = await decryptData(encrypted, password);
    expect(decrypted).toBe(data);
  });
});

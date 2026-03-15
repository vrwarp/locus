import { describe, it, expect } from 'vitest';
import { getAvatarForFixes, getNextAvatarLevel, AVATAR_LEVELS } from './avatar';

describe('Avatar Utils', () => {
    it('returns Data Novice for 0 fixes', () => {
        const avatar = getAvatarForFixes(0);
        expect(avatar.title).toBe('Data Novice');
        expect(avatar.level).toBe(1);
    });

    it('returns Data Apprentice for 50 fixes', () => {
        const avatar = getAvatarForFixes(50);
        expect(avatar.title).toBe('Data Apprentice');
        expect(avatar.level).toBe(2);
    });

    it('returns Data Ninja for 250 fixes', () => {
        const avatar = getAvatarForFixes(250);
        expect(avatar.title).toBe('Data Ninja');
        expect(avatar.level).toBe(3);
    });

    it('returns Data Deity for 10000+ fixes', () => {
        const avatar = getAvatarForFixes(10005);
        expect(avatar.title).toBe('Data Deity');
        expect(avatar.level).toBe(6);
    });

    it('returns next level correctly', () => {
        const next = getNextAvatarLevel(1);
        expect(next?.title).toBe('Data Apprentice');

        const noNext = getNextAvatarLevel(6);
        expect(noNext).toBeNull();
    });
});

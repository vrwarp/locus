export interface AvatarLevel {
    level: number;
    title: string;
    icon: string;
    minFixes: number;
    maxFixes: number; // exclusive
}

export const AVATAR_LEVELS: AvatarLevel[] = [
    { level: 1, title: 'Data Novice', icon: '🥚', minFixes: 0, maxFixes: 50 },
    { level: 2, title: 'Data Apprentice', icon: '🐣', minFixes: 50, maxFixes: 250 },
    { level: 3, title: 'Data Ninja', icon: '🥷', minFixes: 250, maxFixes: 1000 },
    { level: 4, title: 'Data Master', icon: '🧙', minFixes: 1000, maxFixes: 5000 },
    { level: 5, title: 'Data Grandmaster', icon: '👑', minFixes: 5000, maxFixes: 10000 },
    { level: 6, title: 'Data Deity', icon: '🌟', minFixes: 10000, maxFixes: Infinity }
];

export const getAvatarForFixes = (totalFixes: number): AvatarLevel => {
    return AVATAR_LEVELS.find(l => totalFixes >= l.minFixes && totalFixes < l.maxFixes) || AVATAR_LEVELS[0];
};

export const getNextAvatarLevel = (currentLevel: number): AvatarLevel | null => {
    return AVATAR_LEVELS.find(l => l.level === currentLevel + 1) || null;
};

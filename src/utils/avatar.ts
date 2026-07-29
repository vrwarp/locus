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

// Placeholder portrait for someone with no PCO avatar.
//
// This used to be `https://ui-avatars.com/api/?name=<their name>`, which sent a
// congregant's real name to a third party on every render — including children,
// on screens nobody thought of as an integration. Rendering the initials
// ourselves costs nothing and keeps the roster inside the building.
export const initialsAvatar = (name: string): string => {
    const initials = (name || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part[0].toUpperCase())
        .join('') || '?';

    // Hue from the name so a given person keeps the same colour between renders.
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) % 360;

    const svg =
        `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">` +
        `<rect width="64" height="64" fill="hsl(${hash}, 45%, 82%)"/>` +
        `<text x="32" y="32" font-family="system-ui, sans-serif" font-size="26" fill="hsl(${hash}, 45%, 25%)" ` +
        `text-anchor="middle" dominant-baseline="central">${initials}</text>` +
        `</svg>`;

    return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

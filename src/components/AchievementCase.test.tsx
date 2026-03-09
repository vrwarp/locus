import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AchievementCase } from './AchievementCase';
import { BADGES } from '../utils/gamification';
import type { GamificationState } from '../utils/storage';

describe('AchievementCase', () => {
    it('renders all stats correctly', () => {
        const state: GamificationState = {
            lastActiveDate: '2024-01-01',
            currentStreak: 5,
            dailyFixes: 10,
            totalFixes: 1500,
            ghostsCleared: 120,
            birthdatesFixed: 45,
            gradesFixed: 200,
            unlockedBadges: [],
            fixHistory: {}
        };

        render(<AchievementCase gamificationState={state} />);

        expect(screen.getByText('Total Fixes:')).toBeInTheDocument();
        expect(screen.getByText('1500')).toBeInTheDocument();
        expect(screen.getByText('Ghosts Cleared:')).toBeInTheDocument();
        expect(screen.getByText('120')).toBeInTheDocument();
        expect(screen.getByText('Birthdates Fixed:')).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument();
        expect(screen.getByText('Grades Fixed:')).toBeInTheDocument();
        expect(screen.getByText('200')).toBeInTheDocument();
    });

    it('renders unlocked and locked badges', () => {
        const state: GamificationState = {
            lastActiveDate: '2024-01-01',
            currentStreak: 1,
            dailyFixes: 1,
            totalFixes: 1,
            unlockedBadges: [{ id: 'first-fix', date: '2024-01-01T12:00:00Z' }],
        };

        render(<AchievementCase gamificationState={state} />);

        // Ensure all badges are rendered
        BADGES.forEach(badge => {
            expect(screen.getByText(badge.name)).toBeInTheDocument();
        });

        // The first-fix badge should show the date
        const unlockedDateText = new Date('2024-01-01T12:00:00Z').toLocaleDateString();
        expect(screen.getByText(`Unlocked: ${unlockedDateText}`)).toBeInTheDocument();
    });
});

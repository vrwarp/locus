import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CampusCup } from './CampusCup';
import type { GamificationState } from '../utils/storage';

// Mock Recharts to avoid jsdom measurement issues
vi.mock('recharts', async () => {
  const OriginalRecharts = await vi.importActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: '800px', height: '400px' }}>
        {children}
      </div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="bar-chart">{children}</div>
    ),
  };
});

describe('CampusCup Component', () => {
    const mockGamificationState: GamificationState = {
        lastActiveDate: '2024-03-27',
        currentStreak: 5,
        dailyFixes: 10,
        totalFixes: 500,
        unlockedBadges: [],
        fixHistory: {}
    };

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('renders the component and leaderboard', () => {
        render(<CampusCup gamificationState={mockGamificationState} userCampus="Online" />);

        expect(screen.getByText('🏆 The Campus Cup')).toBeInTheDocument();
        expect(screen.getByText(/Which campus will reign supreme/)).toBeInTheDocument();
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('calculates the user impact string correctly for a selected campus', () => {
        const { container } = render(<CampusCup gamificationState={mockGamificationState} userCampus="Online" />);

        expect(screen.getByText('Your Impact')).toBeInTheDocument();
        expect(container).toHaveTextContent('You have contributed 500 fixes to Online!');
    });

    it('defaults to Main Campus if no userCampus is provided', () => {
        const { container } = render(<CampusCup gamificationState={mockGamificationState} />);

        expect(container).toHaveTextContent('You have contributed 500 fixes to Main Campus!');
    });

    it('handles missing gamification state gracefully', () => {
         const { container } = render(<CampusCup userCampus="North Campus" />);

         expect(container).toHaveTextContent('You have contributed 0 fixes to North Campus!');
    });

    it('simulates recent activity updates over time', () => {
        // We set up Math.random to always be > 0.5 to trigger the recentActivity update
        vi.spyOn(Math, 'random').mockReturnValue(0.9);

        const { container } = render(<CampusCup gamificationState={mockGamificationState} userCampus="Online" />);

        // Initial state should be 0 recent fixes
        expect(container).toHaveTextContent('0 fixes submitted by your campus in the last 24 hours');

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        // After 3 seconds, should increment
        expect(container).toHaveTextContent('1 fixes submitted by your campus in the last 24 hours');

        act(() => {
            vi.advanceTimersByTime(3000);
        });

        // After 6 seconds, should increment again
        expect(container).toHaveTextContent('2 fixes submitted by your campus in the last 24 hours');
    });
});

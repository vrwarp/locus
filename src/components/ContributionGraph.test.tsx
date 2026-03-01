import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ContributionGraph } from './ContributionGraph';

describe('ContributionGraph', () => {
  beforeEach(() => {
    // Mock system time to ensure consistent date rendering
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-05-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly with empty fixHistory', () => {
    render(<ContributionGraph fixHistory={{}} weeks={4} />);
    expect(screen.getByText('Your Activity')).toBeInTheDocument();
    expect(screen.getByText('Start fixing to build your streak!')).toBeInTheDocument();
  });

  it('renders correct number of squares for given weeks', () => {
    // For a mock date of 2024-05-15 (Wednesday), day of week is 3.
    // Weeks = 4
    // totalDays = (4 * 7) - (6 - 3) = 28 - 3 = 25
    const { container } = render(<ContributionGraph fixHistory={{}} weeks={4} />);
    const squares = container.querySelectorAll('.graph-square:not(.graph-legend .graph-square)');
    expect(squares.length).toBe(25);
  });

  it('applies correct intensity classes based on fix count', () => {
    const today = '2024-05-15';
    const yesterday = '2024-05-14';
    const lastWeek = '2024-05-08';
    const older = '2024-05-01';

    const fixHistory = {
      [today]: 2, // level-1
      [yesterday]: 8, // level-2
      [lastWeek]: 16, // level-3
      [older]: 35 // level-4
    };

    render(<ContributionGraph fixHistory={fixHistory} weeks={4} />);

    // Subtitle should not be shown if maxCount > 0
    expect(screen.queryByText('Start fixing to build your streak!')).not.toBeInTheDocument();

    const todaySquare = screen.getByTestId(`square-${today}`);
    expect(todaySquare).toHaveClass('level-1');

    const yesterdaySquare = screen.getByTestId(`square-${yesterday}`);
    expect(yesterdaySquare).toHaveClass('level-2');

    const lastWeekSquare = screen.getByTestId(`square-${lastWeek}`);
    expect(lastWeekSquare).toHaveClass('level-3');

    const olderSquare = screen.getByTestId(`square-${older}`);
    expect(olderSquare).toHaveClass('level-4');
  });

  it('shows tooltip with fix count and date', () => {
    const today = '2024-05-15';
    const fixHistory = {
      [today]: 5
    };

    render(<ContributionGraph fixHistory={fixHistory} weeks={2} />);

    const todaySquare = screen.getByTestId(`square-${today}`);
    expect(todaySquare).toHaveAttribute('title', `5 fixes on ${today}`);
  });
});

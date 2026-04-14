import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GivingTrends } from './GivingTrends';
import type { PcoCheckIn, PcoEvent } from '../utils/pco';
import * as givingTrendsUtils from '../utils/givingTrends';

// Mock Recharts to avoid SVG rendering issues in JSDOM
vi.mock('recharts', async (importOriginal) => {
    const Actual = await importOriginal<typeof import('recharts')>();
    return {
        ...Actual,
        ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
        ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
        Line: () => <div data-testid="line-chart" />,
        Bar: () => <div data-testid="bar-chart" />,
        XAxis: () => <div data-testid="x-axis" />,
        YAxis: () => <div data-testid="y-axis" />,
        CartesianGrid: () => <div data-testid="cartesian-grid" />,
        Tooltip: () => <div data-testid="tooltip" />,
        Legend: () => <div data-testid="legend" />
    };
});

describe('GivingTrends Component', () => {
    const mockEvents: PcoEvent[] = [
        { id: '1', type: 'Event', attributes: { name: 'Sunday Worship' } } as any
    ];

    it('renders empty state when no data is returned from utility', () => {
        // Spy to return empty
        vi.spyOn(givingTrendsUtils, 'calculateGivingTrends').mockReturnValue([]);

        render(<GivingTrends checkIns={[]} events={mockEvents} />);

        expect(screen.getByText('Stripe Giving Trends')).toBeInTheDocument();
        expect(screen.getByText('Not enough check-in data to visualize trends.')).toBeInTheDocument();
        expect(screen.queryByTestId('composed-chart')).not.toBeInTheDocument();
    });

    it('renders chart and summary when data is present', () => {
        // Spy to return mock data
        vi.spyOn(givingTrendsUtils, 'calculateGivingTrends').mockReturnValue([
            { weekStarting: '2024-01-07', attendance: 100, givingVolume: 2500 },
            { weekStarting: '2024-01-14', attendance: 150, givingVolume: 3500 }
        ]);

        render(<GivingTrends checkIns={[]} events={mockEvents} />);

        // Summary calculations: Total att = 250, Total give = 6000. Avg = 24.00
        expect(screen.getByText('Stripe Giving Trends')).toBeInTheDocument();
        expect(screen.getByText(/24\.00/)).toBeInTheDocument(); // Avg Giving per Attendee

        // Recharts Elements
        expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
        expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
        expect(screen.getByTestId('bar-chart')).toBeInTheDocument(); // Attendance
        expect(screen.getByTestId('line-chart')).toBeInTheDocument(); // Giving Volume
        // 2 Y-Axis expected
        expect(screen.getAllByTestId('y-axis')).toHaveLength(2);
    });
});

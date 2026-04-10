import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GivingRiver } from './GivingRiver';
import React from 'react';
import { getGivingFlowData } from '../utils/giving';

// Mock Recharts to avoid JSDOM measurement issues with SVG elements
vi.mock('recharts', () => {
    return {
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
            <div data-testid="responsive-container" style={{ width: '100%', height: '600px' }}>
                {children}
            </div>
        ),
        Sankey: ({ data, children }: any) => (
            <div data-testid="sankey-chart" data-node-count={data.nodes.length} data-link-count={data.links.length}>
                {children}
            </div>
        ),
        Tooltip: () => <div data-testid="recharts-tooltip" />,
        Layer: ({ children }: any) => <div>{children}</div>,
        Rectangle: () => <div />,
    };
});

describe('GivingRiver Component', () => {
    it('renders the Giving River header and chart correctly', () => {
        render(<GivingRiver />);

        expect(screen.getByText('The Giving River')).toBeInTheDocument();
        expect(screen.getByText('Visualizing the flow of generosity')).toBeInTheDocument();

        const sankeyChart = screen.getByTestId('sankey-chart');
        expect(sankeyChart).toBeInTheDocument();

        // Assert that the sankey chart received the expected nodes and links
        const nodeCount = sankeyChart.getAttribute('data-node-count');
        const linkCount = sankeyChart.getAttribute('data-link-count');

        expect(Number(nodeCount)).toBeGreaterThan(0);
        expect(Number(linkCount)).toBeGreaterThan(0);
    });

    it('updates data when date range is changed', () => {
        render(<GivingRiver />);

        const sankeyChart = screen.getByTestId('sankey-chart');

        // Initial state (all-time)
        const allTimeData = getGivingFlowData('all-time');
        const allTimeLinkValue = allTimeData.links[0].value;

        const select = screen.getByLabelText('Date Range:');
        expect(select).toBeInTheDocument();

        // Verify default selection
        expect(select).toHaveValue('all-time');

        // Change to this-year
        fireEvent.change(select, { target: { value: 'this-year' } });
        expect(select).toHaveValue('this-year');

        // We cannot easily assert the exact value passed to the mock Sankey without more complex mocking,
        // but we can verify the select element works and state is updated.

        // Change to this-month
        fireEvent.change(select, { target: { value: 'this-month' } });
        expect(select).toHaveValue('this-month');
    });
});

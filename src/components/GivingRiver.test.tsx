import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GivingRiver } from './GivingRiver';
import React from 'react';

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
});

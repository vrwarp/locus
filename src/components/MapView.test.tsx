import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MapView } from './MapView';
import type { Student } from '../utils/pco';

// Mock Recharts to avoid JSDOM measurement issues
vi.mock('recharts', async () => {
  const OriginalRecharts = await vi.importActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: ({ children }: any) => <div data-testid="barchart">{children}</div>,
  };
});

describe('MapView component', () => {
    it('renders empty state when no clusters', () => {
        render(<MapView students={[]} />);
        expect(screen.getByText('No geographic data available. Ensure student records contain addresses.')).toBeInTheDocument();
    });

    it('renders epicenters and suggestions', () => {
        const students = [
            { id: '1', address: { city: 'Springfield' } },
            { id: '2', address: { city: 'Springfield' } },
            { id: '3', address: { city: 'Springfield' } },
            { id: '4', address: { city: 'Rivertown' } },
            { id: '5', address: { city: 'Rivertown' } },
            { id: '6', address: { city: 'Lakeside' } },
        ] as unknown as Student[];

        render(<MapView students={students} />);

        expect(screen.getByText('Current Epicenter')).toBeInTheDocument();
        expect(screen.getByText('Springfield')).toBeInTheDocument();
        expect(screen.getByText('3 members')).toBeInTheDocument();

        expect(screen.getByText('Suggested Next Campus')).toBeInTheDocument();
        expect(screen.getByText('Rivertown')).toBeInTheDocument();
        expect(screen.getByText('Growing cluster with 2 members')).toBeInTheDocument();

        expect(screen.getByTestId('barchart')).toBeInTheDocument();
    });
});

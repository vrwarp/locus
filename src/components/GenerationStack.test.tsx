import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GenerationStack } from './GenerationStack';
import type { Student } from '../utils/pco';

// Mock Recharts to avoid DOM measuring issues in JSDOM
vi.mock('recharts', () => {
    const OriginalModule = vi.importActual('recharts');
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
        BarChart: ({ children, data }: any) => (
            <div data-testid="barchart">
                {children}
                <div data-testid="chart-data">{JSON.stringify(data)}</div>
            </div>
        ),
        Bar: ({ children, dataKey }: any) => <div data-testid="bar">{children}</div>,
        XAxis: () => <div data-testid="xaxis" />,
        YAxis: () => <div data-testid="yaxis" />,
        CartesianGrid: () => <div data-testid="grid" />,
        Tooltip: () => <div data-testid="tooltip" />,
        Cell: () => <div data-testid="cell" />
    };
});

describe('GenerationStack', () => {
    const mockStudents: Student[] = [
        { id: '1', age: 10, pcoGrade: 5, name: 'Alpha Kid', firstName: 'Alpha', lastName: 'Kid', birthdate: '2015-01-01', calculatedGrade: 5, delta: 0, lastCheckInAt: null, checkInCount: 0, groupCount: 0, isChild: true, householdId: null, hasNameAnomaly: false, hasEmailAnomaly: false, hasAddressAnomaly: false, hasPhoneAnomaly: false },
        { id: '2', age: 30, pcoGrade: null, name: 'Millennial Parent', firstName: 'Millennial', lastName: 'Parent', birthdate: '1990-01-01', calculatedGrade: -1, delta: 0, lastCheckInAt: null, checkInCount: 0, groupCount: 0, isChild: false, householdId: null, hasNameAnomaly: false, hasEmailAnomaly: false, hasAddressAnomaly: false, hasPhoneAnomaly: false }
    ];

    it('renders "No demographic data available" if no valid birthdates exist', () => {
        render(<GenerationStack students={[]} />);
        expect(screen.getByText('No demographic data available.')).toBeInTheDocument();
    });

    it('renders the chart with processed data', () => {
        render(<GenerationStack students={mockStudents} />);

        expect(screen.getByText('Demographics (Generation Stack)')).toBeInTheDocument();
        expect(screen.getByTestId('barchart')).toBeInTheDocument();

        const dataElement = screen.getByTestId('chart-data');
        const data = JSON.parse(dataElement.textContent || '[]');

        expect(data).toEqual(expect.arrayContaining([
            expect.objectContaining({ name: 'Gen Alpha', count: 1 }),
            expect.objectContaining({ name: 'Millennials', count: 1 })
        ]));
        // Should have filtered out empty generations
        expect(data.length).toBe(2);
    });
});

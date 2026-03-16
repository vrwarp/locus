import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dashboard } from './Dashboard';
import * as pco from '../utils/pco';
import { calculateMissingVolunteers } from '../utils/missing';
import { waitFor } from '@testing-library/react';

vi.mock('../utils/pco', () => ({
    fetchEvents: vi.fn().mockResolvedValue([{ id: '1', attributes: { name: 'Test' } }]),
    fetchRecentCheckIns: vi.fn().mockResolvedValue([{ id: '1', attributes: { created_at: '2023-01-01' }, relationships: { person: { data: { id: '1' } }, event: { data: { id: '1' } } } }]),
}));

vi.mock('../utils/missing', () => ({
    calculateMissingVolunteers: vi.fn().mockReturnValue([])
}));

describe('Dashboard Component', () => {
    const mockStudents = [
        { id: '1', name: 'Student A', delta: 0, pcoGrade: 5, age: 10, isChild: true } as any,
        { id: '2', name: 'Student B', delta: 1, pcoGrade: 5, age: 11, isChild: true } as any // Anomaly
    ];

    it('renders metrics grid', async () => {
        render(<Dashboard students={mockStudents} onNavigate={vi.fn()} auth="test" />);

        await waitFor(() => {
            expect(screen.getByText('Dashboard')).toBeInTheDocument();
            expect(screen.getByText('Health Score')).toBeInTheDocument();
            expect(screen.getByText('Anomalies Detected')).toBeInTheDocument();
            expect(screen.getByText('Burnout Risk')).toBeInTheDocument();
            expect(screen.getByText('Recruitment Pool')).toBeInTheDocument();
        });
    });

    it('displays correct anomaly count', async () => {
        render(<Dashboard students={mockStudents} onNavigate={vi.fn()} auth="test" />);
        // 1 student has delta != 0
        await waitFor(() => {
            expect(screen.getByText('1')).toBeInTheDocument();
        });
    });

    it('handles navigation clicks', async () => {
        const onNavigate = vi.fn();
        render(<Dashboard students={mockStudents} onNavigate={onNavigate} auth="test" />);

        await waitFor(() => {
            expect(screen.getByText('Start Review')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByText('Start Review'));
        expect(onNavigate).toHaveBeenCalledWith('data-health');
    });

    it('displays missing volunteer alert when present', async () => {
        vi.mocked(calculateMissingVolunteers).mockReturnValue([
            { person: mockStudents[0] as any, lastSeen: '2023-01-01', missingWeeks: 3 }
        ]);

        render(<Dashboard students={mockStudents} onNavigate={vi.fn()} auth="test" />);

        await waitFor(() => {
            expect(screen.getByText(/Missing Person Alert/)).toBeInTheDocument();
            expect(screen.getByText(/1 key volunteer has missed 2\+ consecutive weeks/)).toBeInTheDocument();
        });
    });
});

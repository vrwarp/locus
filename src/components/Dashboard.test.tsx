import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Dashboard } from './Dashboard';
import * as pco from '../utils/pco';

vi.mock('../utils/pco', () => ({
    fetchEvents: vi.fn().mockResolvedValue([]),
    fetchRecentCheckIns: vi.fn().mockResolvedValue([]),
}));

describe('Dashboard Component', () => {
    const mockStudents = [
        { id: '1', name: 'Student A', delta: 0, pcoGrade: 5, age: 10, isChild: true } as any,
        { id: '2', name: 'Student B', delta: 1, pcoGrade: 5, age: 11, isChild: true } as any // Anomaly
    ];

    it('renders metrics grid', async () => {
        render(<Dashboard students={mockStudents} onNavigate={vi.fn()} auth="test" />);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Health Score')).toBeInTheDocument();
        expect(screen.getByText('Anomalies Detected')).toBeInTheDocument();
        expect(screen.getByText('Burnout Risk')).toBeInTheDocument();
        expect(screen.getByText('Recruitment Pool')).toBeInTheDocument();
    });

    it('displays correct anomaly count', async () => {
        render(<Dashboard students={mockStudents} onNavigate={vi.fn()} auth="test" />);
        // 1 student has delta != 0
        expect(screen.getByText('1')).toBeInTheDocument();
    });

    it('handles navigation clicks', async () => {
        const onNavigate = vi.fn();
        render(<Dashboard students={mockStudents} onNavigate={onNavigate} auth="test" />);

        fireEvent.click(screen.getByText('Start Review'));
        expect(onNavigate).toHaveBeenCalledWith('data-health');
    });
});

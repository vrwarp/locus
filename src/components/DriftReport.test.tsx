import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DriftReport } from './DriftReport';
import * as pcoUtils from '../utils/pco';
import * as driftUtils from '../utils/drift';
import type { Student } from '../utils/pco';

vi.mock('../utils/pco');
vi.mock('../utils/drift');

const mockStudents: Student[] = [
    { id: '1', name: 'John Doe', age: 30, isChild: false, householdId: null, pcoGrade: null, birthdate: '1990-01-01', calculatedGrade: 0, delta: 0, lastCheckInAt: null, checkInCount: 0, groupCount: 0, hasNameAnomaly: false, hasEmailAnomaly: false, hasAddressAnomaly: false, hasPhoneAnomaly: false }
];

describe('DriftReport', () => {
    it('renders loading state initially', () => {
        render(<DriftReport students={mockStudents} auth="test" />);
        expect(screen.getByText(/Analyzing Attendance Trends/i)).toBeInTheDocument();
    });

    it('renders empty state when no candidates found', async () => {
        vi.mocked(pcoUtils.fetchRecentCheckIns).mockResolvedValue([]);
        vi.mocked(driftUtils.calculateDriftRisk).mockReturnValue([]);

        render(<DriftReport students={mockStudents} auth="test" />);

        await waitFor(() => {
            expect(screen.getByText(/Steady as a Rock/i)).toBeInTheDocument();
        });
    });

    it('renders candidate list when drifting students found', async () => {
        vi.mocked(pcoUtils.fetchRecentCheckIns).mockResolvedValue([]);
        vi.mocked(driftUtils.calculateDriftRisk).mockReturnValue([
            {
                person: mockStudents[0],
                baselineRate: 1.0,
                recentRate: 0.0,
                dropPercentage: 100,
                tenureMonths: 12,
                status: 'Gone'
            }
        ]);

        render(<DriftReport students={mockStudents} auth="test" />);

        await waitFor(() => {
            expect(screen.getByText('John Doe')).toBeInTheDocument();
            expect(screen.getByText('Gone')).toBeInTheDocument();
            expect(screen.getByText('-100%')).toBeInTheDocument();
        });
    });
});

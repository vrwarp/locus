import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { VolunteerWeb } from './VolunteerWeb';
import { fetchEvents, fetchRecentCheckIns } from '../utils/pco';
import type { Student } from '../utils/pco';

vi.mock('../utils/pco', () => ({
  fetchEvents: vi.fn(),
  fetchRecentCheckIns: vi.fn(),
}));

describe('VolunteerWeb', () => {
  const mockStudents: Student[] = [
    { id: '1', name: 'Alice', firstName: 'Alice', lastName: 'A', age: 30, pcoGrade: null, birthdate: '1990-01-01', calculatedGrade: 0, delta: 0, lastCheckInAt: null, checkInCount: 0, groupCount: 0, isChild: false, householdId: '1', hasNameAnomaly: false, hasEmailAnomaly: false, hasAddressAnomaly: false, hasPhoneAnomaly: false },
    { id: '2', name: 'Bob', firstName: 'Bob', lastName: 'B', age: 32, pcoGrade: null, birthdate: '1988-01-01', calculatedGrade: 0, delta: 0, lastCheckInAt: null, checkInCount: 0, groupCount: 0, isChild: false, householdId: '2', hasNameAnomaly: false, hasEmailAnomaly: false, hasAddressAnomaly: false, hasPhoneAnomaly: false },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (fetchEvents as any).mockReturnValue(new Promise(() => {})); // Never resolve
    (fetchRecentCheckIns as any).mockReturnValue(new Promise(() => {}));

    render(<VolunteerWeb auth="test" students={mockStudents} />);
    expect(screen.getByText(/Analyzing volunteer connections/i)).toBeInTheDocument();
  });

  it('renders graph when data is loaded', async () => {
    (fetchEvents as any).mockResolvedValue([
      { id: 'e1', type: 'Event', attributes: { name: 'Team A' } }
    ]);
    (fetchRecentCheckIns as any).mockResolvedValue([
      {
        id: 'c1', type: 'CheckIn',
        attributes: { created_at: '2023-01-01T10:00:00Z', kind: 'Volunteer' },
        relationships: { person: { data: { type: 'Person', id: '1' } }, event: { data: { type: 'Event', id: 'e1' } } }
      },
      {
        id: 'c2', type: 'CheckIn',
        attributes: { created_at: '2023-01-01T10:00:00Z', kind: 'Volunteer' },
        relationships: { person: { data: { type: 'Person', id: '2' } }, event: { data: { type: 'Event', id: 'e1' } } }
      }
    ]);

    render(<VolunteerWeb auth="test" students={mockStudents} />);

    await waitFor(() => {
      expect(screen.queryByText(/Analyzing/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText('The Volunteer Web')).toBeInTheDocument();
  });

  it('renders no connections message if no data', async () => {
    (fetchEvents as any).mockResolvedValue([]);
    (fetchRecentCheckIns as any).mockResolvedValue([]);

    render(<VolunteerWeb auth="test" students={mockStudents} />);

    await waitFor(() => {
      expect(screen.getByText('No Connections Found')).toBeInTheDocument();
    });
  });
});

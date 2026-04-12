import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MissingVolunteersReport } from './MissingVolunteersReport';
import * as pcoModule from '../utils/pco';
import * as missingModule from '../utils/missing';
import type { Student } from '../utils/pco';

describe('MissingVolunteersReport', () => {
  const mockStudents: Student[] = [
    {
      id: '1',
      name: 'John Doe',
      birthdate: '',
      calculatedGrade: 0,
      delta: 0,
      age: 30,
      isChild: false,
      hasNameAnomaly: false,
      hasEmailAnomaly: false,
      hasAddressAnomaly: false,
      hasPhoneAnomaly: false,
      pcoGrade: null,
      lastCheckInAt: null,
      checkInCount: null,
      groupCount: null,
    }
  ];

  beforeEach(() => {
    vi.spyOn(pcoModule, 'fetchEvents').mockResolvedValue([]);
    vi.spyOn(pcoModule, 'fetchRecentCheckIns').mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders empty state when no volunteers are missing', async () => {
    vi.spyOn(missingModule, 'calculateMissingVolunteers').mockReturnValue([]);

    render(<MissingVolunteersReport students={mockStudents} auth="auth" />);

    expect(screen.getByText('Locating Missing Volunteers...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('All Accounted For')).toBeInTheDocument();
    });
  });

  it('renders missing volunteers when found', async () => {
    vi.spyOn(missingModule, 'calculateMissingVolunteers').mockReturnValue([
      {
        person: mockStudents[0],
        lastSeen: '2023-01-01T12:00:00Z',
        missingWeeks: 3
      }
    ]);

    render(<MissingVolunteersReport students={mockStudents} auth="auth" />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('3 Weeks Missing')).toBeInTheDocument();
    });
  });

  it('renders error state if data fetch fails', async () => {
      vi.spyOn(pcoModule, 'fetchEvents').mockRejectedValue(new Error('Network Error'));

      render(<MissingVolunteersReport students={mockStudents} auth="auth" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load check-in data.')).toBeInTheDocument();
      });
  });
});

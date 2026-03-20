import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { SmallGroupSorter } from './SmallGroupSorter';
import type { Student } from '../utils/pco';
import * as sorterModule from '../utils/sorter';

describe('SmallGroupSorter', () => {
  const mockStudents: Student[] = [
    {
      id: '1',
      age: 25,
      householdId: 'h1',
      isChild: false,
      name: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      pcoGrade: null,
      birthdate: '',
      calculatedGrade: 0,
      delta: 0,
      lastCheckInAt: null,
      checkInCount: null,
      groupCount: null,
      hasNameAnomaly: false,
      hasEmailAnomaly: false,
      hasAddressAnomaly: false,
      hasPhoneAnomaly: false,
    },
    {
      id: '2',
      age: 30,
      householdId: 'h2',
      isChild: false,
      name: 'Jane Smith',
      firstName: 'Jane',
      lastName: 'Smith',
      pcoGrade: null,
      birthdate: '',
      calculatedGrade: 0,
      delta: 0,
      lastCheckInAt: null,
      checkInCount: null,
      groupCount: null,
      hasNameAnomaly: false,
      hasEmailAnomaly: false,
      hasAddressAnomaly: false,
      hasPhoneAnomaly: false,
    }
  ];

  beforeEach(() => {
    vi.spyOn(sorterModule, 'sortIntoGroups').mockReturnValue([
      {
        id: 0,
        members: [mockStudents[0]],
        size: 1,
        averageAge: 25
      },
      {
        id: 1,
        members: [mockStudents[1]],
        size: 1,
        averageAge: 30
      }
    ]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders correctly with default state', () => {
    render(<SmallGroupSorter students={mockStudents} />);

    expect(screen.getByText('Small Group Sorter')).toBeInTheDocument();
    expect(screen.getByLabelText('Number of Groups:')).toHaveValue(3); // default 3
    expect(screen.getByRole('button', { name: 'Run Algorithm' })).toBeInTheDocument();
  });

  it('triggers sorting and displays results on click', async () => {
    render(<SmallGroupSorter students={mockStudents} />);

    const input = screen.getByLabelText('Number of Groups:');
    fireEvent.change(input, { target: { value: '2' } });

    const button = screen.getByRole('button', { name: 'Run Algorithm' });
    fireEvent.click(button);

    // Test env skips setTimeout and finishes processing instantly, so button reverts to Run Algorithm immediately.
    expect(button).toHaveTextContent('Run Algorithm');

    expect(sorterModule.sortIntoGroups).toHaveBeenCalledWith(mockStudents, 2, 500);

    // Check if the mocked groups were rendered
    expect(screen.getByText('Group 1')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();

    expect(screen.getByText('Group 2')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});

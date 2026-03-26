import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MapView } from './MapView';
import type { Student } from '../utils/pco';
import React from 'react';

// Mock Recharts to avoid JS DOM measurement issues
vi.mock('recharts', async () => {
  const OriginalModule = await vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: any) => (
      <div data-testid="mock-responsive-container">{children}</div>
    ),
    BarChart: ({ children, data }: any) => (
      <div data-testid="mock-bar-chart" data-data={JSON.stringify(data)}>
        {children}
      </div>
    ),
    Bar: () => <div data-testid="mock-bar" />,
    XAxis: () => <div data-testid="mock-xaxis" />,
    YAxis: () => <div data-testid="mock-yaxis" />,
    Tooltip: () => <div data-testid="mock-tooltip" />,
    CartesianGrid: () => <div data-testid="mock-cartesian-grid" />,
    Cell: () => <div data-testid="mock-cell" />
  };
});

describe('MapView', () => {
  const createStudent = (id: string, city: string | undefined): Student => ({
    id,
    age: 30,
    pcoGrade: null,
    name: `Student ${id}`,
    firstName: `First ${id}`,
    lastName: `Last ${id}`,
    birthdate: '1990-01-01',
    calculatedGrade: 0,
    delta: 0,
    lastCheckInAt: null,
    checkInCount: 0,
    groupCount: 0,
    isChild: false,
    householdId: null,
    hasNameAnomaly: false,
    hasEmailAnomaly: false,
    hasAddressAnomaly: false,
    hasPhoneAnomaly: false,
    address: city ? { city, street: '', state: '', zip: '' } : undefined,
  });

  it('renders an empty state if no geospatial data is found', () => {
    const students = [
      createStudent('1', undefined),
      createStudent('2', ''),
    ];
    render(<MapView students={students} />);
    expect(screen.getByText('No Geospatial Data Found')).toBeInTheDocument();
  });

  it('renders a bar chart with member distributions', () => {
    const students = [
      createStudent('1', 'Austin'),
      createStudent('2', 'Dallas'),
      createStudent('3', 'Austin'),
      createStudent('4', 'Houston'),
      createStudent('5', 'Austin'),
      createStudent('6', 'Dallas'),
    ];

    render(<MapView students={students} />);
    expect(screen.getByText('Member Distribution (Top 20 Cities)')).toBeInTheDocument();

    const chart = screen.getByTestId('mock-bar-chart');
    expect(chart).toBeInTheDocument();

    // Verify data passed to the chart
    const data = JSON.parse(chart.getAttribute('data-data') || '[]');
    expect(data).toHaveLength(3); // Austin, Dallas, Houston
    expect(data[0].city).toBe('Austin');
    expect(data[0].count).toBe(3);
  });

  it('suggests campus locations based on the threshold', () => {
    const students: Student[] = [];
    for (let i = 0; i < 50; i++) students.push(createStudent(`A${i}`, 'Primary City'));
    for (let i = 0; i < 20; i++) students.push(createStudent(`B${i}`, 'Suburbs North'));
    for (let i = 0; i < 15; i++) students.push(createStudent(`C${i}`, 'Suburbs South'));
    for (let i = 0; i < 5; i++) students.push(createStudent(`D${i}`, 'Rural Town'));

    render(<MapView students={students} />);

    // Default threshold is 15
    expect(screen.getByText('Predictive Planting Suggestions')).toBeInTheDocument();
    expect(screen.getByText('Suburbs North')).toBeInTheDocument();
    expect(screen.getByText('20 Members')).toBeInTheDocument();
    expect(screen.getByText('Suburbs South')).toBeInTheDocument();
    expect(screen.getByText('15 Members')).toBeInTheDocument();
    expect(screen.queryByText('Rural Town')).not.toBeInTheDocument();
    expect(screen.queryByText('Primary City')).not.toBeInTheDocument(); // Primary city should not be suggested
  });

  it('updates suggestions when threshold is changed via slider', () => {
    const students: Student[] = [];
    for (let i = 0; i < 50; i++) students.push(createStudent(`A${i}`, 'Primary City'));
    for (let i = 0; i < 20; i++) students.push(createStudent(`B${i}`, 'Suburbs North'));
    for (let i = 0; i < 15; i++) students.push(createStudent(`C${i}`, 'Suburbs South'));
    for (let i = 0; i < 5; i++) students.push(createStudent(`D${i}`, 'Rural Town'));

    render(<MapView students={students} />);

    // Default threshold is 15
    expect(screen.getByText('Suburbs South')).toBeInTheDocument();

    // Change threshold to 20
    const slider = screen.getByLabelText(/Suggestion Threshold:/i);
    fireEvent.change(slider, { target: { value: '20' } });

    // Suburbs South (15) should disappear
    expect(screen.queryByText('Suburbs South')).not.toBeInTheDocument();
    expect(screen.getByText('Suburbs North')).toBeInTheDocument();
  });
});

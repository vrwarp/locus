import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlobalPulse } from './GlobalPulse';

describe('GlobalPulse', () => {
  it('renders correctly with empty data', () => {
    render(<GlobalPulse students={[]} />);

    expect(screen.getByText('The Global Pulse')).toBeInTheDocument();
    expect(screen.getByText("Compare your church's health metrics against anonymized global averages.")).toBeInTheDocument();
    expect(screen.getByText("No data available to calculate the pulse.")).toBeInTheDocument();
  });

  it('renders correctly with student data and calculates metrics', () => {
    const students = [
      {
        id: '1',
        hasNameAnomaly: false,
        hasEmailAnomaly: false,
        hasPhoneAnomaly: false,
        hasAddressAnomaly: false,
        phoneNumber: '1234567890',
        email: 'test@example.com',
        address: { city: 'Test City' },
        checkInCount: 1,
        groupCount: 0,
      },
      {
        id: '2',
        hasNameAnomaly: true,
        hasEmailAnomaly: true,
        hasPhoneAnomaly: true,
        hasAddressAnomaly: true,
        phoneNumber: '',
        email: '',
        address: undefined,
        checkInCount: 0,
        groupCount: 0,
      }
    ] as any;

    const { container } = render(<GlobalPulse students={students} />);

    expect(screen.getByText('The Global Pulse')).toBeInTheDocument();
    expect(screen.queryByText("No data available to calculate the pulse.")).not.toBeInTheDocument();

    // Check if the recharts container exists
    expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
  });
});

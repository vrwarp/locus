import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GlobalPulse } from './GlobalPulse';

describe('GlobalPulse', () => {
  it('renders correctly', () => {
    render(<GlobalPulse students={[]} />);

    expect(screen.getByText('The Global Pulse')).toBeInTheDocument();
    expect(screen.getByText("Compare your church's health metrics against anonymized global averages.")).toBeInTheDocument();
  });
});

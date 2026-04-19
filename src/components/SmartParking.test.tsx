import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SmartParking } from './SmartParking';

// Mock Recharts to avoid JS DOM measurement issues
vi.mock('recharts', async () => {
  const OriginalRecharts = await vi.importActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    ComposedChart: ({ children, data }: any) => (
        <div data-testid="mock-composed-chart" data-count={data ? data.length : 0}>
            {children}
            {data && data.map((d: any, i: number) => (
              <div key={i} data-testid={`chart-bar-${i}`} data-time={d.time} data-occupancy={d.occupancy} data-cars={d.cars} data-people={d.people}></div>
            ))}
        </div>
    )
  };
});

describe('SmartParking', () => {
  it('renders the Smart Parking integration view with metrics', () => {
    render(<SmartParking />);

    expect(screen.getByText('Smart Parking Integration')).toBeInTheDocument();
    expect(screen.getByText('Total Capacity')).toBeInTheDocument();
    expect(screen.getByText('Current Occupancy')).toBeInTheDocument();
    expect(screen.getByText('Avg People / Car')).toBeInTheDocument();

    // Check for mocked metric values
    expect(screen.getByText('500')).toBeInTheDocument(); // Capacity
    expect(screen.getByText('490')).toBeInTheDocument(); // Occupancy
    expect(screen.getByText('2.3')).toBeInTheDocument(); // Ratio
  });

  it('toggles between Lot Occupancy and Cars vs People Ratio views', () => {
    render(<SmartParking />);

    // Default view should be Lot Occupancy
    const occupancyButton = screen.getByText('Lot Occupancy');
    const ratioButton = screen.getByText('Cars vs People Ratio');

    expect(occupancyButton).toHaveClass('active');
    expect(ratioButton).not.toHaveClass('active');

    // Both views render the composed chart, but with different datasets in the mock
    const chart = screen.getByTestId('mock-composed-chart');
    expect(chart).toBeInTheDocument();
    expect(chart).toHaveAttribute('data-count', '10');

    // Click on Ratio view
    fireEvent.click(ratioButton);
    expect(ratioButton).toHaveClass('active');
    expect(occupancyButton).not.toHaveClass('active');
  });
});

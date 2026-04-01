import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GivingRiver } from './GivingRiver';

// Mock recharts to avoid DOM size issues in JSDOM
vi.mock('recharts', () => {
  const OriginalRecharts = vi.importActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: any) => (
      <div data-testid="responsive-container" style={{ width: 800, height: 600 }}>
        {children}
      </div>
    ),
    Sankey: ({ children }: any) => <div data-testid="sankey-chart">{children}</div>,
    Tooltip: () => <div data-testid="tooltip" />
  };
});

describe('GivingRiver Component', () => {
  it('renders the Giving River header', () => {
    render(<GivingRiver />);
    expect(screen.getByText('The Giving River')).toBeInTheDocument();
  });

  it('renders the Sankey chart', () => {
    render(<GivingRiver />);
    expect(screen.getByTestId('sankey-chart')).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GamificationWidget } from './GamificationWidget';

describe('GamificationWidget', () => {
  it('reports edits made today and records still flagged', () => {
    render(<GamificationWidget editsToday={12} flaggedRecords={340} />);

    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText(/edited today/)).toBeInTheDocument();
    expect(screen.getByText('340')).toBeInTheDocument();
    expect(screen.getByText(/still flagged/)).toBeInTheDocument();
  });

  it('says "edited", never "fixed"', () => {
    // Locus cannot tell whether an edit made a record more correct. The label
    // is the guarantee, so it is worth a test of its own.
    const { container } = render(<GamificationWidget editsToday={3} flaggedRecords={9} />);

    expect(container.textContent).not.toMatch(/fixed/i);
    expect(container.textContent).not.toMatch(/streak/i);
    expect(container.textContent).not.toMatch(/goal/i);
  });

  it('handles a session with nothing done yet', () => {
    render(<GamificationWidget editsToday={0} flaggedRecords={0} />);
    expect(screen.getAllByText('0')).toHaveLength(2);
  });
});

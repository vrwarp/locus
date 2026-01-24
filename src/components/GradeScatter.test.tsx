import { render, screen } from '@testing-library/react';
import { GradeScatter } from './GradeScatter';
import { describe, it, expect } from 'vitest';
// Note: Recharts is hard to query by text. We check for the container or specific SVG elements.

describe('GradeScatter Component', () => {
  it('renders without crashing', () => {
    const mockData = [{ id: '1', age: 7, pcoGrade: 2, name: 'Test Kid' }];
    const { container } = render(<GradeScatter data={mockData} />);
    expect(container.querySelector('.recharts-surface')).toBeInTheDocument();
  });

  it('renders the Diagonal of Truth reference line', () => {
    // Ensure data range covers the reference line segment (3 to 25) so it renders
    const mockData = [
      { id: '1', age: 0, pcoGrade: -5, name: 'Young' },
      { id: '2', age: 30, pcoGrade: 25, name: 'Old' }
    ];
    const { container } = render(<GradeScatter data={mockData} />);
    // Check for the reference line group
    // Note: Text rendering in Recharts depends on layout measurements often missing in JSDOM
    expect(container.querySelector('.recharts-reference-line')).toBeInTheDocument();
  });
});

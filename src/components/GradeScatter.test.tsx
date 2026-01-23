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
});

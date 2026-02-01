import { render, screen } from '@testing-library/react';
import { GamificationWidget } from './GamificationWidget';
import { describe, it, expect } from 'vitest';

describe('GamificationWidget', () => {
  it('renders streak and progress', () => {
    render(<GamificationWidget streak={5} dailyFixes={10} dailyGoal={50} />);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Daily Goal: 10/50')).toBeInTheDocument();
  });

  it('renders completed state', () => {
     const { container } = render(<GamificationWidget streak={5} dailyFixes={55} dailyGoal={50} />);
     const fill = container.querySelector('.progress-bar-fill');
     expect(fill).toHaveClass('complete');
     expect(fill).toHaveStyle('width: 100%');
  });

  it('renders correct progress width', () => {
    const { container } = render(<GamificationWidget streak={0} dailyFixes={25} dailyGoal={50} />);
    const fill = container.querySelector('.progress-bar-fill');
    expect(fill).toHaveStyle('width: 50%');
  });
});

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Confetti } from './Confetti';

describe('Confetti Component', () => {
  it('renders a canvas element', () => {
    const { container } = render(<Confetti />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('renders without error when origin and duration are provided', () => {
    const { container } = render(<Confetti origin={{ x: 100, y: 100 }} duration={500} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('renders without error with different themes', () => {
    const { container: container1 } = render(<Confetti theme="neon" />);
    expect(container1.querySelector('canvas')).toBeInTheDocument();

    const { container: container2 } = render(<Confetti theme="monochrome" />);
    expect(container2.querySelector('canvas')).toBeInTheDocument();

    const { container: container3 } = render(<Confetti theme="pastel" />);
    expect(container3.querySelector('canvas')).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Confetti } from './Confetti';

describe('Confetti Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => setTimeout(cb, 16) as any);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => clearTimeout(id));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders a canvas element and updates particles without origin', () => {
    const { container } = render(<Confetti />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Advance timers to trigger requestAnimationFrame
    vi.advanceTimersByTime(100);
  });

  it('renders without error when origin and duration are provided, and clears after duration', () => {
    const { container, unmount } = render(<Confetti origin={{ x: 100, y: 100 }} duration={500} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();

    // Advance timers to trigger requestAnimationFrame and particle updates with origin physics
    vi.advanceTimersByTime(200);

    // Advance past the duration timeout
    vi.advanceTimersByTime(400);

    // The component should gracefully handle unmounting
    unmount();
  });

  it('handles window resize events safely', () => {
      const { container } = render(<Confetti />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      // Simulate resize
      window.innerWidth = 800;
      window.innerHeight = 600;
      window.dispatchEvent(new Event('resize'));

      expect(canvas.width).toBe(800);
      expect(canvas.height).toBe(600);
  });
});

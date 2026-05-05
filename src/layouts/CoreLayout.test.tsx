import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CoreLayout } from './CoreLayout';

describe('CoreLayout', () => {
  it('renders children content', () => {
    render(
      <CoreLayout currentView="dashboard" onChangeView={vi.fn()} anomaliesCount={0} totalFixes={0}>
        <div data-testid="child-content">Test Content</div>
      </CoreLayout>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders SidebarCore with correct props', () => {
      const onChangeViewMock = vi.fn();
      render(
        <CoreLayout currentView="dashboard" onChangeView={onChangeViewMock} anomaliesCount={3} totalFixes={0}>
          <div>Child</div>
        </CoreLayout>
      );

      // Sidebar should render Locus Core
      expect(screen.getByText('Locus Core')).toBeInTheDocument();
      // Should show anomalies badge
      expect(screen.getByText('3')).toBeInTheDocument();

      // Clicking a link inside the layout (from the sidebar) should call onChangeView
      fireEvent.click(screen.getByRole('button', { name: /Bounty Board/i }));
      expect(onChangeViewMock).toHaveBeenCalledWith('bounties');
  });
});

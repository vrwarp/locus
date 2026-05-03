import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntelligenceLayout } from './IntelligenceLayout';

describe('IntelligenceLayout', () => {
  it('renders children content', () => {
    render(
      <IntelligenceLayout currentView="copilot" onChangeView={vi.fn()}>
        <div data-testid="child-content">Test Intelligence Content</div>
      </IntelligenceLayout>
    );
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Test Intelligence Content')).toBeInTheDocument();
  });

  it('renders SidebarIntelligence with correct props', () => {
      const onChangeViewMock = vi.fn();
      render(
        <IntelligenceLayout currentView="copilot" onChangeView={onChangeViewMock}>
          <div>Child</div>
        </IntelligenceLayout>
      );

      // Sidebar should render Locus Intelligence
      expect(screen.getByText('Locus Intelligence')).toBeInTheDocument();

      // Clicking a link inside the layout (from the sidebar) should call onChangeView
      fireEvent.click(screen.getByRole('button', { name: /Global Pulse/i }));
      expect(onChangeViewMock).toHaveBeenCalledWith('global-pulse');
  });
});

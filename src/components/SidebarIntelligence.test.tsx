import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarIntelligence } from './SidebarIntelligence';

describe('SidebarIntelligence', () => {
  it('renders title and subtitle', () => {
    render(<SidebarIntelligence currentView="copilot" onChangeView={vi.fn()} />);
    expect(screen.getByText('Locus Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Executive Dashboard')).toBeInTheDocument();
  });

  it('renders navigation items and active class', () => {
    render(<SidebarIntelligence currentView="copilot" onChangeView={vi.fn()} />);

    // Check for an active item
    const copilotBtn = screen.getByRole('button', { name: /Pastoral Co-Pilot/i });
    expect(copilotBtn).toBeInTheDocument();
    expect(copilotBtn).toHaveClass('active');

    // Check for an inactive item
    const burnoutBtn = screen.getByRole('button', { name: /Burnout Risk/i });
    expect(burnoutBtn).toBeInTheDocument();
    expect(burnoutBtn).not.toHaveClass('active');
  });

  it('handles onChangeView click', () => {
    const onChangeViewMock = vi.fn();
    render(<SidebarIntelligence currentView="copilot" onChangeView={onChangeViewMock} />);

    // We use GetAllByText because 'Attrition' is duplicated in the menu
    const driftBtn = screen.getAllByText(/Attrition/i)[0];
    fireEvent.click(driftBtn);
    expect(onChangeViewMock).toHaveBeenCalledWith('attrition');
  });

  it('renders other intelligence specific items', () => {
    render(<SidebarIntelligence currentView="copilot" onChangeView={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Global Pulse/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sentiment Pulse/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bus Factor/i })).toBeInTheDocument();
  });

  it('renders all intelligence specific items', () => {
    render(<SidebarIntelligence currentView="copilot" onChangeView={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Newsletter Architect/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Missing Volunteers/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recruitment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retention/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Attendance/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check-in Velocity/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Volunteer Web/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Solar System/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Heatmap of Life/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Demographics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Map View/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sermon Correlator/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Giving River/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Stripe Trends/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prayer Partner Match/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Small Group Sorter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Locus Public/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Automations/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Emergency Alerts/i })).toBeInTheDocument();
  });
});

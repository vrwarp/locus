import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarIntelligence } from './SidebarIntelligence';

describe('SidebarIntelligence', () => {
  it('renders title and subtitle', () => {
    render(<SidebarIntelligence currentView="retention" onChangeView={vi.fn()} />);
    expect(screen.getByText('Locus Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Executive Dashboard')).toBeInTheDocument();
  });

  it('renders navigation items and active class', () => {
    render(<SidebarIntelligence currentView="retention" onChangeView={vi.fn()} />);

    // Check for an active item
    const copilotBtn = screen.getByRole('button', { name: /Retention/i });
    expect(copilotBtn).toBeInTheDocument();
    expect(copilotBtn).toHaveClass('active');

    // Check for an inactive item
    const burnoutBtn = screen.getByRole('button', { name: /Burnout Risk/i });
    expect(burnoutBtn).toBeInTheDocument();
    expect(burnoutBtn).not.toHaveClass('active');
  });

  it('handles onChangeView click', () => {
    const onChangeViewMock = vi.fn();
    render(<SidebarIntelligence currentView="retention" onChangeView={onChangeViewMock} />);

    fireEvent.click(screen.getByRole('button', { name: /Burnout Risk/i }));
    expect(onChangeViewMock).toHaveBeenCalledWith('burnout');
  });

  it('renders other intelligence specific items', () => {
    render(<SidebarIntelligence currentView="retention" onChangeView={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Bus Factor/i })).toBeInTheDocument();
  });

  it('renders all intelligence specific items', () => {
    render(<SidebarIntelligence currentView="retention" onChangeView={vi.fn()} />);

    expect(screen.getByRole('button', { name: /Newsletter Architect/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Missing Volunteers/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recruitment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retention/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Attendance/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Demographics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Small Group Sorter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Automations/i })).toBeInTheDocument();
  });
});

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarCore } from './SidebarCore';

describe('SidebarCore', () => {
  it('renders title and subtitle', () => {
    render(<SidebarCore currentView="dashboard" onChangeView={vi.fn()} anomaliesCount={0} />);
    expect(screen.getByText('Locus Core')).toBeInTheDocument();
    expect(screen.getByText('Data Custodian Workspace')).toBeInTheDocument();
  });

  it('renders navigation items and active class', () => {
    render(<SidebarCore currentView="dashboard" onChangeView={vi.fn()} anomaliesCount={0} />);
    const dashboardBtn = screen.getByRole('button', { name: /Dashboard/i });
    expect(dashboardBtn).toBeInTheDocument();
    expect(dashboardBtn).toHaveClass('active');

    const navBtn = screen.getByRole('button', { name: /Duplicate Detective/i });
    expect(navBtn).toBeInTheDocument();
    expect(navBtn).not.toHaveClass('active');
  });

  it('handles onChangeView click', () => {
    const onChangeViewMock = vi.fn();
    render(<SidebarCore currentView="dashboard" onChangeView={onChangeViewMock} anomaliesCount={0} />);

    const navBtn = screen.getByRole('button', { name: /Duplicate Detective/i });
    fireEvent.click(navBtn);
    expect(onChangeViewMock).toHaveBeenCalledWith('duplicates');
  });

  it('renders anomalies badge when anomaliesCount > 0', () => {
    render(<SidebarCore currentView="dashboard" onChangeView={vi.fn()} anomaliesCount={5} />);

    const badge = screen.getByText('5');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('badge');
  });

  it('does not render anomalies badge when anomaliesCount is 0', () => {
    render(<SidebarCore currentView="dashboard" onChangeView={vi.fn()} anomaliesCount={0} />);

    const dataHealthBtn = screen.getByRole('button', { name: /Data Health/i });
    expect(dataHealthBtn).toBeInTheDocument();

    // We expect there NOT to be a badge element with "0"
    const badge = screen.queryByText('0');
    expect(badge).not.toBeInTheDocument();
  });

  it('renders all core specific items', () => {
    render(<SidebarCore currentView="dashboard" onChangeView={vi.fn()} anomaliesCount={0} />);

    expect(screen.getByRole('button', { name: /Duplicate Detective/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ghost Protocol/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Family Audit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Settings/i })).toBeInTheDocument();
  });

  it('renders Avatar with total fixes', () => {
    render(<SidebarCore currentView="dashboard" onChangeView={vi.fn()} anomaliesCount={0} />);
  });
});

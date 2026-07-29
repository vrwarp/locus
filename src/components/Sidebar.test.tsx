import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from './Sidebar';

const show = (props: Partial<React.ComponentProps<typeof Sidebar>> = {}) => {
  const onChangeView = vi.fn();
  const onToggleReadOnly = vi.fn();
  render(
    <Sidebar
      currentView="dashboard"
      onChangeView={onChangeView}
      anomaliesCount={0}
      readOnly={false}
      onToggleReadOnly={onToggleReadOnly}
      {...props}
    />
  );
  return { onChangeView, onToggleReadOnly };
};

describe('Sidebar', () => {
  it('offers records, reports and tools in one list', () => {
    show();

    expect(screen.getByRole('button', { name: /Data Health/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Retention/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Weekly Update/ })).toBeInTheDocument();
  });

  it('hides every editing screen in read-only mode', () => {
    show({ readOnly: true });

    for (const label of [/Data Health/, /Duplicate Detective/, /Ghost Protocol/, /Family Audit/, /Automations/]) {
      expect(screen.queryByRole('button', { name: label })).not.toBeInTheDocument();
    }
  });

  it('keeps the reports available in read-only mode', () => {
    show({ readOnly: true });

    expect(screen.getByRole('button', { name: /Retention/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Bus Factor/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Settings/ })).toBeInTheDocument();
  });

  it('keeps the Dashboard in read-only mode, since it only reads', () => {
    show({ readOnly: true });
    expect(screen.getByRole('button', { name: /Dashboard/ })).toBeInTheDocument();
  });

  it('omits a section heading when read-only leaves nothing under it', () => {
    // Guards the mechanism rather than a particular list: a heading with no rows
    // beneath it is the kind of empty scaffolding that accumulates unnoticed.
    render(
      <Sidebar
        currentView="dashboard"
        onChangeView={vi.fn()}
        anomaliesCount={0}
        readOnly
        onToggleReadOnly={vi.fn()}
      />
    );
    const headings = screen.getAllByText(/^(Records|Reports|Tools|System)$/);
    for (const heading of headings) {
      const rows = heading.parentElement?.querySelectorAll('.nav-item') ?? [];
      expect(rows.length).toBeGreaterThan(0);
    }
  });

  it('reports the anomaly count on Data Health', () => {
    show({ anomaliesCount: 42 });
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('navigates on click', () => {
    const { onChangeView } = show();
    fireEvent.click(screen.getByRole('button', { name: /Bus Factor/ }));
    expect(onChangeView).toHaveBeenCalledWith('bus-factor');
  });

  it('toggles read-only and says what the mode means', () => {
    const { onToggleReadOnly } = show();

    expect(screen.getByText(/can change Planning Center records/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/Read-only/));
    expect(onToggleReadOnly).toHaveBeenCalledWith(true);
  });

  it('says writes are refused when read-only', () => {
    show({ readOnly: true });
    expect(screen.getByText(/writes are refused/)).toBeInTheDocument();
  });
});

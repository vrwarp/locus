import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { IntegrationsHub } from './IntegrationsHub';
import type { AppConfig } from '../utils/storage';

describe('IntegrationsHub', () => {
  const defaultConfig: AppConfig = {
    graderOptions: {},
    integrations: {
      mailchimp: false,
      zoom: false,
      eventbrite: false,
      typeform: false,
    }
  };

  it('renders the header and integration cards', () => {
    render(<IntegrationsHub config={defaultConfig} onSaveConfig={vi.fn()} />);

    expect(screen.getByText('Locus Integrations')).toBeInTheDocument();
    expect(screen.getByText('Mailchimp')).toBeInTheDocument();
    expect(screen.getByText('Zoom')).toBeInTheDocument();
    expect(screen.getByText('Eventbrite')).toBeInTheDocument();
    expect(screen.getByText('Typeform')).toBeInTheDocument();
  });

  it('shows disconnected status when integrations are disabled', () => {
    render(<IntegrationsHub config={defaultConfig} onSaveConfig={vi.fn()} />);

    const disabledStatuses = screen.getAllByText('Disconnected');
    expect(disabledStatuses).toHaveLength(4); // Mailchimp, Zoom, Eventbrite, Typeform
  });

  it('shows active status and mock data when integrations are enabled', () => {
    const activeConfig: AppConfig = {
      ...defaultConfig,
      integrations: {
        mailchimp: true,
        zoom: false,
        eventbrite: true,
        typeform: false,
      }
    };

    render(<IntegrationsHub config={activeConfig} onSaveConfig={vi.fn()} />);

    // Mailchimp is active
    expect(screen.getByText('Syncing 423 profiles. 12 ghosts paused.')).toBeInTheDocument();

    // Eventbrite is active
    expect(screen.getByText('Event "Fall Retreat" mapped. 54 tickets synced.')).toBeInTheDocument();

    // Others are disconnected
    const disabledStatuses = screen.getAllByText('Disconnected');
    expect(disabledStatuses).toHaveLength(2); // Zoom, Typeform
  });

  it('calls onSaveConfig when a toggle is clicked', () => {
    const mockSaveConfig = vi.fn();
    render(<IntegrationsHub config={defaultConfig} onSaveConfig={mockSaveConfig} />);

    const zoomToggle = screen.getByTestId('toggle-zoom');
    fireEvent.click(zoomToggle);

    expect(mockSaveConfig).toHaveBeenCalledWith({
      ...defaultConfig,
      integrations: {
        ...defaultConfig.integrations,
        zoom: true
      }
    });
  });

  it('handles undefined integrations object in config safely', () => {
    const configWithoutIntegrations: AppConfig = {
      graderOptions: {}
    };

    render(<IntegrationsHub config={configWithoutIntegrations} onSaveConfig={vi.fn()} />);

    // Everything should render and default to disconnected
    const disabledStatuses = screen.getAllByText('Disconnected');
    expect(disabledStatuses).toHaveLength(4);
  });
});

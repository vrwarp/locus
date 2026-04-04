import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SpotifyWidget } from './SpotifyWidget';
import type { AppConfig } from '../utils/storage';

const mockConfig: AppConfig = {
  theme: 'light',
  readOnlyMode: false,
  campus: 'All Campuses',
  partyMode: false,
  enableSpotify: true,
};

describe('SpotifyWidget', () => {
  it('renders correctly when enabled', () => {
    render(<SpotifyWidget config={mockConfig} />);
    expect(screen.getByText('🎧 Worship Playlist')).toBeInTheDocument();
    expect(screen.getByTitle('Spotify Playlist')).toBeInTheDocument();
  });

  it('does not render when disabled', () => {
    const disabledConfig = { ...mockConfig, enableSpotify: false };
    const { container } = render(<SpotifyWidget config={disabledConfig} />);
    expect(container.firstChild).toBeNull();
  });

  it('toggles minimize state', () => {
    render(<SpotifyWidget config={mockConfig} />);

    // Initially not minimized
    expect(screen.getByTitle('Spotify Playlist')).toBeInTheDocument();

    // Click minimize
    fireEvent.click(screen.getByRole('button', { name: '▼' }));

    // Should be minimized (iframe gone)
    expect(screen.queryByTitle('Spotify Playlist')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '▲' })).toBeInTheDocument();

    // Click maximize
    fireEvent.click(screen.getByRole('button', { name: '▲' }));

    // Should be visible again
    expect(screen.getByTitle('Spotify Playlist')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '▼' })).toBeInTheDocument();
  });
});

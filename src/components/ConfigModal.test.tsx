import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigModal } from './ConfigModal';
import { describe, it, expect, vi } from 'vitest';
import type { AppConfig } from '../utils/storage';

describe('ConfigModal', () => {
  const mockConfig: AppConfig = { graderOptions: {} };
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  it('renders correctly when open', () => {
    render(
      <ConfigModal
        isOpen={true}
        currentConfig={mockConfig}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('High Contrast Mode')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <ConfigModal
        isOpen={false}
        currentConfig={mockConfig}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('toggles High Contrast Mode and saves', () => {
    render(
      <ConfigModal
        isOpen={true}
        currentConfig={mockConfig}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const checkbox = screen.getByLabelText('High Contrast Mode');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(screen.getByText('Save Settings'));

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        highContrastMode: true
    }));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('loads existing High Contrast Mode setting', () => {
     render(
      <ConfigModal
        isOpen={true}
        currentConfig={{ ...mockConfig, highContrastMode: true }}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );
    const checkbox = screen.getByLabelText('High Contrast Mode');
    expect(checkbox).toBeChecked();
  });

  it('toggles Colorblind Mode and saves', () => {
    render(
      <ConfigModal
        isOpen={true}
        currentConfig={mockConfig}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const checkbox = screen.getByLabelText('Colorblind Mode');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(screen.getByText('Save Settings'));

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        colorblindMode: true
    }));
  });

  it('loads existing Colorblind Mode setting', () => {
    render(
     <ConfigModal
       isOpen={true}
       currentConfig={{ ...mockConfig, colorblindMode: true }}
       onSave={mockOnSave}
       onClose={mockOnClose}
     />
   );
   const checkbox = screen.getByLabelText('Colorblind Mode');
   expect(checkbox).toBeChecked();
 });

  it('toggles Mute Sounds and saves', () => {
    render(
      <ConfigModal
        isOpen={true}
        currentConfig={mockConfig}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const checkbox = screen.getByLabelText('Mute Sounds');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(screen.getByText('Save Settings'));

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        muteSounds: true
    }));
  });

  it('loads existing Mute Sounds setting', () => {
    render(
     <ConfigModal
       isOpen={true}
       currentConfig={{ ...mockConfig, muteSounds: true }}
       onSave={mockOnSave}
       onClose={mockOnClose}
     />
   );
   const checkbox = screen.getByLabelText('Mute Sounds');
   expect(checkbox).toBeChecked();
 });
});

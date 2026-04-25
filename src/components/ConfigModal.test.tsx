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

  it('toggles Party Mode and saves', () => {
    render(
      <ConfigModal
        isOpen={true}
        currentConfig={mockConfig}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const checkbox = screen.getByLabelText('Party Mode');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(screen.getByText('Save Settings'));

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        partyMode: true
    }));
  });

  it('loads existing Party Mode setting', () => {
    render(
     <ConfigModal
       isOpen={true}
       currentConfig={{ ...mockConfig, partyMode: true }}
       onSave={mockOnSave}
       onClose={mockOnClose}
     />
   );
   const checkbox = screen.getByLabelText('Party Mode');
   expect(checkbox).toBeChecked();
 });

  it('selects Confetti Theme and saves', () => {
    render(
      <ConfigModal
        isOpen={true}
        currentConfig={{ ...mockConfig, partyMode: true }}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const themeSelect = screen.getByLabelText('Confetti Theme:');
    fireEvent.change(themeSelect, { target: { value: 'neon' } });

    fireEvent.click(screen.getByText('Save Settings'));

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        confettiTheme: 'neon'
    }));
  });

  it('loads existing Confetti Theme setting', () => {
    render(
     <ConfigModal
       isOpen={true}
       currentConfig={{ ...mockConfig, partyMode: true, confettiTheme: 'pastel' }}
       onSave={mockOnSave}
       onClose={mockOnClose}
     />
   );
   const themeSelect = screen.getByLabelText('Confetti Theme:');
   expect(themeSelect).toHaveValue('pastel');
 });

  it('toggles Zen Mode and saves', () => {
    render(
      <ConfigModal
        isOpen={true}
        currentConfig={mockConfig}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const checkbox = screen.getByLabelText('Zen Mode');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    fireEvent.click(screen.getByText('Save Settings'));

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        zenMode: true
    }));
  });

  it('loads existing Zen Mode setting', () => {
    render(
     <ConfigModal
       isOpen={true}
       currentConfig={{ ...mockConfig, zenMode: true }}
       onSave={mockOnSave}
       onClose={mockOnClose}
     />
   );
   const checkbox = screen.getByLabelText('Zen Mode');
   expect(checkbox).toBeChecked();
 });

  it('selects Ambient Audio Theme when Zen Mode is enabled and saves', () => {
    render(
      <ConfigModal
        isOpen={true}
        currentConfig={{ ...mockConfig, zenMode: true }}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const themeSelect = screen.getByLabelText('Ambient Audio:');
    fireEvent.change(themeSelect, { target: { value: 'rainfall' } });

    fireEvent.click(screen.getByText('Save Settings'));

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        zenAudioTheme: 'rainfall'
    }));
  });

  it('loads existing Ambient Audio Theme setting', () => {
    render(
     <ConfigModal
       isOpen={true}
       currentConfig={{ ...mockConfig, zenMode: true, zenAudioTheme: 'soft-synths' }}
       onSave={mockOnSave}
       onClose={mockOnClose}
     />
   );
   const themeSelect = screen.getByLabelText('Ambient Audio:');
   expect(themeSelect).toHaveValue('soft-synths');
  });

  it('changes Campus selection and saves', () => {
    render(
      <ConfigModal
        isOpen={true}
        currentConfig={mockConfig}
        onSave={mockOnSave}
        onClose={mockOnClose}
      />
    );

    const dropdown = screen.getByDisplayValue('Main Campus');
    fireEvent.change(dropdown, { target: { value: 'Online' } });

    fireEvent.click(screen.getByText('Save Settings'));

    expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining({
        campus: 'Online'
    }));
  });

  it('loads existing Campus setting', () => {
    render(
     <ConfigModal
       isOpen={true}
       currentConfig={{ ...mockConfig, campus: 'East Campus' }}
       onSave={mockOnSave}
       onClose={mockOnClose}
     />
   );
   expect(screen.getByDisplayValue('East Campus')).toBeInTheDocument();
 });
});

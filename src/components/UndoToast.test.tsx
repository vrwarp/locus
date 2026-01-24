import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UndoToast } from './UndoToast';
import { describe, it, expect, vi } from 'vitest';

describe('UndoToast', () => {
  it('renders message and undo button', () => {
    render(<UndoToast message="Test Message" onUndo={() => {}} />);
    expect(screen.getByText('Test Message')).toBeInTheDocument();
    expect(screen.getByText('Undo')).toBeInTheDocument();
  });

  it('calls onUndo when button is clicked', () => {
    const handleUndo = vi.fn();
    render(<UndoToast message="Test Message" onUndo={handleUndo} />);

    fireEvent.click(screen.getByText('Undo'));
    expect(handleUndo).toHaveBeenCalledTimes(1);
  });
});

import { render, screen, fireEvent } from '@testing-library/react';
import { SmartFixModal } from './SmartFixModal';
import { describe, it, expect, vi } from 'vitest';
import { Student } from '../utils/pco';

describe('SmartFixModal', () => {
  const mockStudent: Student = {
    id: '1',
    age: 10,
    pcoGrade: 4,
    name: 'Test Kid',
    birthdate: '2014-01-01',
    calculatedGrade: 5,
    delta: 1,
    lastCheckInAt: null,
    checkInCount: 0
  };

  it('renders nothing when closed', () => {
    const { container } = render(
      <SmartFixModal isOpen={false} onClose={() => {}} student={mockStudent} onSave={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders student details and default slider value when open', () => {
    render(
      <SmartFixModal isOpen={true} onClose={() => {}} student={mockStudent} onSave={() => {}} />
    );
    expect(screen.getByText('Smart Fix')).toBeInTheDocument();
    expect(screen.getByText('Test Kid')).toBeInTheDocument();

    // Check for "Current" and "Selected" labels
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Selected')).toBeInTheDocument();

    // Default selected should correspond to calculated grade (5)
    // Note: Use getByDisplayValue for input
    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('5');

    // Check formatted values in the boxes
    // Current: 4, Selected: 5
    // Note: Text match might be ambiguous if 4 or 5 appear elsewhere, but in this isolated component it should be fine.
    // To be safe we can scope it, but for now exact match by text content works.

    // Current grade 4
    const gradeValues = screen.getAllByText(/^\d+$/);
    // Depending on render order. 4 is current, 5 is target.
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();

    // Should indicate match initially
    expect(screen.getByText(/Perfect Match/)).toBeInTheDocument();
  });

  it('calls onClose when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <SmartFixModal isOpen={true} onClose={onClose} student={mockStudent} onSave={() => {}} />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('updates target grade and delta warning when slider is moved', () => {
      render(
        <SmartFixModal isOpen={true} onClose={() => {}} student={mockStudent} onSave={() => {}} />
      );

      const slider = screen.getByRole('slider');

      // Move slider to 6
      fireEvent.change(slider, { target: { value: '6' } });

      // Check display updates
      // Selected box should show 6
      expect(screen.getByText('6')).toBeInTheDocument();

      // Button should update
      expect(screen.getByText('Fix Grade to 6')).toBeInTheDocument();

      // Should show warning
      expect(screen.getByText(/Delta: 1 year/)).toBeInTheDocument();
  });

  it('calls onSave with slider value when Fix is clicked', () => {
    const onSave = vi.fn();
    render(
      <SmartFixModal isOpen={true} onClose={() => {}} student={mockStudent} onSave={onSave} />
    );

    const slider = screen.getByRole('slider');
    // Change to 3
    fireEvent.change(slider, { target: { value: '3' } });

    fireEvent.click(screen.getByText('Fix Grade to 3'));

    expect(onSave).toHaveBeenCalledWith({
      ...mockStudent,
      pcoGrade: 3,
      delta: 2 // Expected (5) - Target (3) = 2
    });
  });

  it('handles negative grades (Pre-K) correctly', () => {
      render(
        <SmartFixModal isOpen={true} onClose={() => {}} student={mockStudent} onSave={() => {}} />
      );

      const slider = screen.getByRole('slider');
      fireEvent.change(slider, { target: { value: '-1' } });

      // Should display Pre-K
      expect(screen.getAllByText('Pre-K').length).toBeGreaterThan(0);
      expect(screen.getByText('Fix Grade to Pre-K')).toBeInTheDocument();
  });
});

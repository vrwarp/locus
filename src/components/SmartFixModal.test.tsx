import { render, screen, fireEvent } from '@testing-library/react';
import { SmartFixModal } from './SmartFixModal';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    checkInCount: 0,
    groupCount: 0,
    isChild: true,
    householdId: 'h1'
  };

  beforeEach(() => {
    // Set a consistent date: Sept 1, 2024 (Start of School Year)
    // 2014-01-01 -> Age 10. Grade 5.
    vi.setSystemTime(new Date('2024-09-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders nothing when closed', () => {
    const { container } = render(
      <SmartFixModal isOpen={false} onClose={() => {}} student={mockStudent} onSave={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders student details and default slider value when open (Fix Grade Mode)', () => {
    render(
      <SmartFixModal isOpen={true} onClose={() => {}} student={mockStudent} onSave={() => {}} />
    );
    expect(screen.getByText('Smart Fix')).toBeInTheDocument();
    expect(screen.getByText('Test Kid')).toBeInTheDocument();

    // Check tabs
    expect(screen.getByText('Fix Grade')).toBeInTheDocument();
    expect(screen.getByText('Fix Birthdate')).toBeInTheDocument();

    // Check for "Current" and "Selected" labels (Grade Mode)
    expect(screen.getByText('Current')).toBeInTheDocument();
    expect(screen.getByText('Selected')).toBeInTheDocument();

    const slider = screen.getByRole('slider');
    expect(slider).toHaveValue('5');

    // Current grade 4
    expect(screen.getByText('4')).toBeInTheDocument();
    // Target grade 5
    expect(screen.getByText('5')).toBeInTheDocument();
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

      expect(screen.getByText('6')).toBeInTheDocument();
      expect(screen.getByText('Fix Grade to 6')).toBeInTheDocument();
      expect(screen.getByText(/Delta: 1 year/)).toBeInTheDocument();
  });

  it('calls onSave with updated grade when Fix is clicked (Grade Mode)', () => {
    const onSave = vi.fn();
    render(
      <SmartFixModal isOpen={true} onClose={() => {}} student={mockStudent} onSave={onSave} />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '3' } });

    fireEvent.click(screen.getByText('Fix Grade to 3'));

    expect(onSave).toHaveBeenCalledWith({
      ...mockStudent,
      pcoGrade: 3,
      delta: 2 // Expected (5) - Target (3) = 2
    });
  });

  it('switches to Fix Birthdate mode and updates UI', () => {
      render(
        <SmartFixModal isOpen={true} onClose={() => {}} student={mockStudent} onSave={() => {}} />
      );

      fireEvent.click(screen.getByText('Fix Birthdate'));

      expect(screen.getByLabelText('New Birthdate:')).toBeInTheDocument();
      // Date picker should have current birthdate
      expect(screen.getByLabelText('New Birthdate:')).toHaveValue('2014-01-01');

      // Should show preview info
      // With mocked date 2024-09-01:
      // DOB 2014-01-01 -> Age 10 -> Grade 5.
      // PCO Grade is 4.
      // Differs by 1 year.
      expect(screen.getByText(/Expected Grade is:/)).toBeInTheDocument();
      expect(screen.getByText(/Differs from current grade by 1 year/)).toBeInTheDocument();
  });

  it('updates preview when birthdate changes', () => {
      render(
        <SmartFixModal isOpen={true} onClose={() => {}} student={mockStudent} onSave={() => {}} />
      );

      fireEvent.click(screen.getByText('Fix Birthdate'));

      const dateInput = screen.getByLabelText('New Birthdate:');
      // Change to 2015-01-01 (Age 9 -> Grade 4)
      fireEvent.change(dateInput, { target: { value: '2015-01-01' } });

      // PCO Grade is 4. New Expected is 4. Match!
      // Use Regex to match partial text containing the checkmark
      expect(screen.getByText(/Matches current grade!/)).toBeInTheDocument();
      expect(screen.getByText(/Fix Birthdate to 2015-01-01/)).toBeInTheDocument();
  });

  it('calls onSave with updated birthdate when Fix is clicked (Birthdate Mode)', () => {
     const onSave = vi.fn();

     render(
        <SmartFixModal isOpen={true} onClose={() => {}} student={mockStudent} onSave={onSave} />
      );

      fireEvent.click(screen.getByText('Fix Birthdate'));
      const dateInput = screen.getByLabelText('New Birthdate:');
      fireEvent.change(dateInput, { target: { value: '2015-01-01' } });

      fireEvent.click(screen.getByText(/Fix Birthdate to 2015-01-01/));

      // 2015-01-01 -> Age 9 -> Grade 4. PCO Grade 4. Delta 0.
      expect(onSave).toHaveBeenCalledWith({
          ...mockStudent,
          birthdate: '2015-01-01',
          age: 9,
          calculatedGrade: 4,
          delta: 0
      });
  });
});

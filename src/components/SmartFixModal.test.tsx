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
    delta: 1
  };

  it('renders nothing when closed', () => {
    const { container } = render(
      <SmartFixModal isOpen={false} onClose={() => {}} student={mockStudent} onSave={() => {}} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders student details when open', () => {
    render(
      <SmartFixModal isOpen={true} onClose={() => {}} student={mockStudent} onSave={() => {}} />
    );
    expect(screen.getByText('Smart Fix')).toBeInTheDocument();
    expect(screen.getByText('Test Kid')).toBeInTheDocument();
    // Use regex or partial matching for text nodes that might be split
    expect(screen.getByText(/Current Grade:/)).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // Current grade value likely in its own node or next to label depending on implementation
    expect(screen.getByText(/Suggested Grade:/)).toBeInTheDocument();
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

  it('calls onSave with updated student when Fix is clicked', () => {
    const onSave = vi.fn();
    render(
      <SmartFixModal isOpen={true} onClose={() => {}} student={mockStudent} onSave={onSave} />
    );
    fireEvent.click(screen.getByText('Fix Grade to 5'));

    expect(onSave).toHaveBeenCalledWith({
      ...mockStudent,
      pcoGrade: 5,
      delta: 0
    });
  });
});

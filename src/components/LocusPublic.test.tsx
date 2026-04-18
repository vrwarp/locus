import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LocusPublic } from './LocusPublic';
import type { Student } from '../utils/pco';

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'John Doe',
    birthdate: '1990-01-01',
    pcoGrade: 0,
    calculatedGrade: 0,
    delta: 0,
    email: 'john@example.com',
    phoneNumber: '5551234567',
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345'
    },
    householdId: 'h1',
    isChild: false,
    checkInCount: null,
    groupCount: null,
    lastCheckInAt: null,
    firstTimeGiver: false,
    firstGiftDate: null,
    hasNameAnomaly: false,
    hasEmailAnomaly: false,
    hasAddressAnomaly: false,
    hasPhoneAnomaly: false,
    age: 34
  },
  {
    id: '2',
    name: 'Jane Smith',
    birthdate: '1992-05-15',
    pcoGrade: 0,
    calculatedGrade: 0,
    delta: 0,
    email: 'jane@example.com',
    phoneNumber: '5559876543',
    address: {
      street: '456 Oak Ave',
      city: 'Otherville',
      state: 'NY',
      zip: '67890'
    },
    householdId: 'h2',
    isChild: false,
    checkInCount: null,
    groupCount: null,
    lastCheckInAt: null,
    firstTimeGiver: false,
    firstGiftDate: null,
    hasNameAnomaly: false,
    hasEmailAnomaly: false,
    hasAddressAnomaly: false,
    hasPhoneAnomaly: false,
    age: 32
  }
];

describe('LocusPublic', () => {
  it('renders correctly', () => {
    render(<LocusPublic students={mockStudents} onSave={vi.fn()} />);

    expect(screen.getByText('Locus Public (Member Portal)')).toBeInTheDocument();
    expect(screen.getByLabelText('Simulate Login As:')).toBeInTheDocument();
  });

  it('selects a member and displays their profile', () => {
    render(<LocusPublic students={mockStudents} onSave={vi.fn()} />);

    const select = screen.getByLabelText('Simulate Login As:');
    fireEvent.change(select, { target: { value: '1' } });

    expect(screen.getByText('My Profile')).toBeInTheDocument();

    const nameInput = screen.getByLabelText('Name') as HTMLInputElement;
    const emailInput = screen.getByLabelText('Email Address') as HTMLInputElement;
    const phoneInput = screen.getByLabelText('Phone Number') as HTMLInputElement;
    const streetInput = screen.getByPlaceholderText('Street') as HTMLInputElement;
    const cityInput = screen.getByPlaceholderText('City') as HTMLInputElement;
    const stateInput = screen.getByPlaceholderText('State') as HTMLInputElement;
    const zipInput = screen.getByPlaceholderText('Zip') as HTMLInputElement;

    expect(nameInput.value).toBe('John Doe');
    expect(emailInput.value).toBe('john@example.com');
    expect(phoneInput.value).toBe('5551234567');
    expect(streetInput.value).toBe('123 Main St');
    expect(cityInput.value).toBe('Anytown');
    expect(stateInput.value).toBe('CA');
    expect(zipInput.value).toBe('12345');
  });

  it('allows editing fields and calls onSave with updated and cleaned data', async () => {
    const mockOnSave = vi.fn();
    render(<LocusPublic students={mockStudents} onSave={mockOnSave} />);

    // Select John Doe
    const select = screen.getByLabelText('Simulate Login As:');
    fireEvent.change(select, { target: { value: '1' } });

    // Edit phone and address
    const phoneInput = screen.getByLabelText('Phone Number');
    const streetInput = screen.getByPlaceholderText('Street');

    fireEvent.change(phoneInput, { target: { value: '555-555-0000' } });
    fireEvent.change(streetInput, { target: { value: '789 Pine St.' } });

    // Update
    const updateBtn = screen.getByText('Update Profile');
    fireEvent.click(updateBtn);

    expect(mockOnSave).toHaveBeenCalledTimes(1);

    const savedStudent = mockOnSave.mock.calls[0][0];
    expect(savedStudent.id).toBe('1');
    expect(savedStudent.phoneNumber).toBe('+15555550000'); // Assuming fixPhone formats it this way
    expect(savedStudent.address).toEqual({
        street: '789 Pine Street', // Assuming fixAddress expands St. to Street
        city: 'Anytown',
        state: 'CA',
        zip: '12345'
    });

    // Check for success message
    await waitFor(() => {
      expect(screen.getByText('Profile updated successfully! Points earned!')).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EmergencyAlerts } from './EmergencyAlerts';
import type { Student } from '../utils/pco';

describe('EmergencyAlerts', () => {
  const createStudent = (id: string, name: string, phoneNumber?: string): Student => ({
    id, age: 30, pcoGrade: null, name, firstName: name.split(' ')[0], lastName: name.split(' ')[1] || '',
    birthdate: '', calculatedGrade: 0, delta: 0, lastCheckInAt: null, checkInCount: 0, groupCount: 0,
    isChild: false, householdId: '1', hasNameAnomaly: false, hasEmailAnomaly: false, hasPhoneAnomaly: false, hasAddressAnomaly: false,
    firstTimeGiver: false, firstGiftDate: null, phoneNumber
  });

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly and counts valid recipients', () => {
    const students = [
      createStudent('1', 'Alice', '555-0101'),
      createStudent('2', 'Bob', ''), // No phone
      createStudent('3', 'Charlie', undefined), // No phone property
      createStudent('4', 'Dave', '555-0102')
    ];

    render(<EmergencyAlerts students={students} />);

    expect(screen.getByText(/Send an SMS blast to 2 members/)).toBeDefined();
    expect(screen.getByText('Send SMS Blast')).toBeDefined();
  });

  it('disables send button when message is empty or no recipients', () => {
    const students = [createStudent('1', 'Alice', '555-0101')];
    render(<EmergencyAlerts students={students} />);

    const sendButton = screen.getByText('Send SMS Blast') as HTMLButtonElement;
    expect(sendButton.disabled).toBe(true); // Message is empty

    const textarea = screen.getByPlaceholderText('Type your emergency alert message here...');
    fireEvent.change(textarea, { target: { value: 'Test message' } });

    expect(sendButton.disabled).toBe(false); // Now enabled
  });

  it('shows success message after sending', () => {
      const students = [createStudent('1', 'Alice', '555-0101')];
      render(<EmergencyAlerts students={students} />);

      const textarea = screen.getByPlaceholderText('Type your emergency alert message here...');
      fireEvent.change(textarea, { target: { value: 'Test message' } });

      const sendButton = screen.getByText('Send SMS Blast');
      fireEvent.click(sendButton);

      expect(screen.getByText('Sending...')).toBeDefined();

      act(() => {
        vi.advanceTimersByTime(1500);
      });

      expect(screen.getByText(/SMS blast sent successfully/)).toBeDefined();
  });
});

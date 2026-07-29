import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GhostModal } from './GhostModal';
import type { Student } from '../utils/pco';
import { subMonths, formatISO } from 'date-fns';

const monthsAgo = (n: number) => formatISO(subMonths(new Date(), n));

const person = (over: Partial<Student>): Student => ({
  id: '1', age: 42, pcoGrade: null, name: 'Lapsed Adult',
  firstName: 'Lapsed', lastName: 'Adult', birthdate: '1984-01-01',
  calculatedGrade: 0, delta: 0, lastCheckInAt: monthsAgo(30), checkInCount: 2,
  isChild: false, createdAt: monthsAgo(48), householdId: 'h1',
  hasNameAnomaly: false, hasEmailAnomaly: false, hasAddressAnomaly: false,
  hasPhoneAnomaly: false, firstTimeGiver: false, firstGiftDate: null,
  ...over,
} as Student);

const open = (students: Student[], onArchive = vi.fn()) => {
  render(<GhostModal isOpen students={students} onArchive={onArchive} onClose={vi.fn()} />);
  return onArchive;
};

describe('GhostModal', () => {
  it('selects nothing by default and keeps the archive button disabled', () => {
    open([person({ id: 'a' }), person({ id: 'b', name: 'Second Adult' })]);

    expect(screen.getAllByRole('checkbox').every(box => !(box as HTMLInputElement).checked)).toBe(true);
    expect(screen.getByRole('button', { name: /^Archive/ })).toBeDisabled();
  });

  it('lists every record rather than truncating', () => {
    // The old modal showed ten and archived all of them.
    const many = Array.from({ length: 14 }, (_, i) => person({ id: `p${i}`, name: `Person ${i}` }));
    open(many);

    expect(screen.getAllByRole('checkbox')).toHaveLength(14);
    expect(screen.getByText('Person 13')).toBeInTheDocument();
  });

  it('requires the confirmation word before archiving', () => {
    open([person({ id: 'a' })]);
    fireEvent.click(screen.getByRole('checkbox'));

    const button = screen.getByRole('button', { name: /^Archive/ });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Type/), { target: { value: 'ARCHIVE' } });
    expect(button).toBeEnabled();
  });

  it('archives only what was ticked', () => {
    const onArchive = open([
      person({ id: 'a', name: 'Chosen' }),
      person({ id: 'b', name: 'Untouched' }),
    ]);

    fireEvent.click(screen.getByLabelText('Archive Chosen'));
    fireEvent.change(screen.getByLabelText(/Type/), { target: { value: 'ARCHIVE' } });
    fireEvent.click(screen.getByRole('button', { name: /^Archive/ }));

    expect(onArchive).toHaveBeenCalledTimes(1);
    expect(onArchive.mock.calls[0][0].map((s: Student) => s.id)).toEqual(['a']);
  });

  it('calls out minors in the selection, since a deactivated child record hits the check-in desk', () => {
    open([person({ id: 'kid', name: 'Small Person', age: 7, isChild: true })]);

    expect(screen.getByText('minor')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByText(/including/)).toBeInTheDocument();
    expect(screen.getByText(/under 18/)).toBeInTheDocument();
  });

  it('states why each record qualified', () => {
    open([
      person({ id: 'a', lastCheckInAt: null, createdAt: monthsAgo(36) }),
      person({ id: 'b', name: 'Lapsed', lastCheckInAt: monthsAgo(30) }),
    ]);

    expect(screen.getByText('On file 36 months, never checked in')).toBeInTheDocument();
    expect(screen.getByText('Last check-in 30 months ago')).toBeInTheDocument();
  });
});

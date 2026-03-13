import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BountyBoard } from './BountyBoard';
import type { GamificationState } from '../utils/storage';

const mockState: GamificationState = {
  lastActiveDate: '2023-10-27',
  currentStreak: 1,
  dailyFixes: 0,
  totalFixes: 0,
  unlockedBadges: [],
  bounties: [
    {
      id: 'b1',
      title: 'Fix 10 Phones',
      description: 'We need valid numbers!',
      actionType: 'phone',
      targetCount: 10,
      currentCount: 5,
      reward: 'A cookie',
      createdAt: '2023-10-01'
    },
    {
      id: 'b2',
      title: 'Fix 5 Emails',
      description: 'For the newsletter.',
      actionType: 'email',
      targetCount: 5,
      currentCount: 5,
      reward: 'High five',
      completedAt: '2023-10-15',
      createdAt: '2023-10-01'
    }
  ]
};

describe('BountyBoard', () => {
  it('renders active and completed bounties', () => {
    render(<BountyBoard gamificationState={mockState} onAddBounty={vi.fn()} onDeleteBounty={vi.fn()} />);

    expect(screen.getByText('Fix 10 Phones')).toBeInTheDocument();
    expect(screen.getByText('Fix 5 Emails')).toBeInTheDocument();
    expect(screen.getByText('5 / 10')).toBeInTheDocument(); // active progress
    expect(screen.getByText('Completed!')).toBeInTheDocument(); // completed progress
  });

  it('can open and submit the new bounty form', () => {
    const handleAdd = vi.fn();
    render(<BountyBoard gamificationState={{...mockState, bounties: []}} onAddBounty={handleAdd} onDeleteBounty={vi.fn()} />);

    // Form is initially hidden
    expect(screen.queryByTestId('bounty-form')).not.toBeInTheDocument();

    // Open form
    fireEvent.click(screen.getByText('+ Post New Bounty'));
    expect(screen.getByTestId('bounty-form')).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Test Bounty' } });
    fireEvent.change(screen.getByLabelText('Reward'), { target: { value: 'Test Reward' } });
    fireEvent.change(screen.getByLabelText('Target Count'), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText('Action Type'), { target: { value: 'ghost' } });

    fireEvent.submit(screen.getByTestId('bounty-form'));

    expect(handleAdd).toHaveBeenCalledWith(expect.objectContaining({
      title: 'New Test Bounty',
      reward: 'Test Reward',
      targetCount: 100,
      actionType: 'ghost'
    }));
  });

  it('can delete a bounty', () => {
    const handleDelete = vi.fn();
    render(<BountyBoard gamificationState={mockState} onAddBounty={vi.fn()} onDeleteBounty={handleDelete} />);

    const deleteBtns = screen.getAllByTitle('Delete Bounty');
    fireEvent.click(deleteBtns[0]);

    expect(handleDelete).toHaveBeenCalledWith('b1');
  });
});

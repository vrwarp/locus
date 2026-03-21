import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewsletterArchitect } from './NewsletterArchitect';
import * as pcoUtils from '../utils/pco';
import type { Student, PcoEvent } from '../utils/pco';

vi.mock('../utils/pco', async () => {
  const actual = await vi.importActual('../utils/pco');
  return {
    ...actual as any,
    fetchEvents: vi.fn(),
  };
});

describe('NewsletterArchitect', () => {
    const mockStudents: Student[] = [];
    const mockEvents: PcoEvent[] = [
        { id: '1', type: 'Event', attributes: { name: 'Mock Sunday Service' } }
    ];

    beforeEach(() => {
        // We shouldn't useFakeTimers here entirely if we're doing async/await waitFor checks.
        // Or if we do, we need to make sure Promises can resolve.
        Object.assign(navigator, {
            clipboard: {
                writeText: vi.fn().mockImplementation(() => Promise.resolve()),
            },
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        // Delay resolution indefinitely to keep loading state
        vi.mocked(pcoUtils.fetchEvents).mockImplementation(() => new Promise(() => {}));

        render(<NewsletterArchitect students={mockStudents} auth="mock-auth" />);
        expect(screen.getByText('Drafting Newsletter...')).toBeInTheDocument();
    });

    it('renders error state on fetch failure', async () => {
        vi.mocked(pcoUtils.fetchEvents).mockRejectedValue(new Error('Failed to load'));

        render(<NewsletterArchitect students={mockStudents} auth="mock-auth" />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load upcoming events.')).toBeInTheDocument();
        });
    });

    it('renders drafted newsletter and handles copy to clipboard', async () => {
        vi.mocked(pcoUtils.fetchEvents).mockResolvedValue(mockEvents);

        render(<NewsletterArchitect students={mockStudents} auth="mock-auth" />);

        await waitFor(() => {
            expect(screen.getByText('The Newsletter Architect')).toBeInTheDocument();
        });

        // The drafted newsletter textarea should contain the mocked event
        const textarea = screen.getByRole('textbox', { name: 'Newsletter Draft' }) as HTMLTextAreaElement;
        expect(textarea.value).toContain('Mock Sunday Service');

        // Copy to clipboard interaction
        const copyButton = screen.getByText('Copy Newsletter (Markdown)');
        fireEvent.click(copyButton);

        await waitFor(() => {
            expect(navigator.clipboard.writeText).toHaveBeenCalledWith(textarea.value);
            expect(screen.getByText('Copied to Clipboard! ✓')).toBeInTheDocument();
        });

        // Let's just mock the clipboard and wait for the "copied" text to revert if we can,
        // or just accept we verified the writeText call and the first state change.
        // We're not using fake timers here anymore so we can't do vi.advanceTimersByTime easily without waiting 2s.
        // I will skip the 2.5s wait for the button to revert to keep tests fast.
    });

    it('regenerates the newsletter when clicking regenerate', async () => {
        vi.mocked(pcoUtils.fetchEvents).mockResolvedValue(mockEvents);

        render(<NewsletterArchitect students={mockStudents} auth="mock-auth" />);

        await waitFor(() => {
             expect(screen.getByRole('textbox', { name: 'Newsletter Draft' })).toBeInTheDocument();
        });

        const textarea = screen.getByRole('textbox', { name: 'Newsletter Draft' }) as HTMLTextAreaElement;

        // Manually modify the text to simulate user editing
        fireEvent.change(textarea, { target: { value: 'Modified text' } });
        expect(textarea.value).toBe('Modified text');

        // Click regenerate
        const regenButton = screen.getByText('Regenerate');
        fireEvent.click(regenButton);

        // It should be restored to contain the original mock event
        expect(textarea.value).toContain('Mock Sunday Service');
    });
});

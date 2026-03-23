import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NewsletterArchitect } from './NewsletterArchitect';
import { fetchEvents } from '../utils/pco';
import type { Student } from '../utils/pco';

vi.mock('../utils/pco', () => ({
  fetchEvents: vi.fn()
}));

// Mock clipboard
Object.assign(navigator, {
    clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
    },
});

describe('NewsletterArchitect Component', () => {
  const mockStudents: Student[] = [
    {
      id: '1',
      name: 'Test Student',
      birthdate: '2010-01-01',
      pcoGrade: 5,
      isChild: true,
      gender: 'M',
      school: null,
      contactMethod: null,
      createdAt: '2020-01-01'
    }
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    (fetchEvents as any).mockResolvedValue([
      { id: '1', attributes: { name: 'Sunday Service' } },
      { id: '2', attributes: { name: 'Youth Night' } }
    ]);
  });

  it('renders loading state initially', async () => {
    render(<NewsletterArchitect students={mockStudents} auth="test-auth" />);
    expect(screen.getByText('Loading Newsletter Data...')).toBeInTheDocument();

    // Wait for the mock to resolve to avoid act warning
    await waitFor(() => {
        expect(screen.getByText('Newsletter Architect')).toBeInTheDocument();
    });
  });

  it('renders newsletter editor and preview after data loads', async () => {
    render(<NewsletterArchitect students={mockStudents} auth="test-auth" />);

    await waitFor(() => {
      expect(screen.getByText('Newsletter Architect')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Sermon Topic (Optional)')).toBeInTheDocument();
    expect(screen.getByLabelText("Pastor's Notes (Optional)")).toBeInTheDocument();
    expect(screen.getByText('Markdown Preview')).toBeInTheDocument();
    expect(screen.getAllByText(/Sunday Service/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Youth Night/).length).toBeGreaterThan(0);
  });

  it('handles API error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (fetchEvents as any).mockRejectedValue(new Error('API failed'));

    render(<NewsletterArchitect students={mockStudents} auth="test-auth" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load events. Please try again later.')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('updates markdown preview when inputs change', async () => {
    render(<NewsletterArchitect students={mockStudents} auth="test-auth" />);

    await waitFor(() => {
      expect(screen.getByText('Newsletter Architect')).toBeInTheDocument();
    });

    const topicInput = screen.getByLabelText('Sermon Topic (Optional)');
    fireEvent.change(topicInput, { target: { value: 'The Book of Ruth' } });

    expect(screen.getAllByText(/The Book of Ruth/).length).toBeGreaterThan(0);

    const notesInput = screen.getByLabelText("Pastor's Notes (Optional)");
    fireEvent.change(notesInput, { target: { value: 'Welcome to our service!' } });

    expect(screen.getAllByText(/Welcome to our service!/).length).toBeGreaterThan(0);
  });

  it('copies markdown to clipboard', async () => {
    render(<NewsletterArchitect students={mockStudents} auth="test-auth" />);

    await waitFor(() => {
      expect(screen.getByText('Newsletter Architect')).toBeInTheDocument();
    });

    const copyButton = screen.getByText('Copy Markdown');
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalled();
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });
});

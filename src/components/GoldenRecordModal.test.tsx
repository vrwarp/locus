import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GoldenRecordModal } from './GoldenRecordModal';

// Mock Confetti to avoid canvas issues
vi.mock('./Confetti', () => ({
  Confetti: () => <div data-testid="mock-confetti"></div>
}));

describe('GoldenRecordModal', () => {
    it('renders when open', () => {
        render(<GoldenRecordModal isOpen={true} onClose={() => {}} />);
        expect(screen.getByText('The Golden Record')).toBeInTheDocument();
        expect(screen.getByText('10,000 Fixes')).toBeInTheDocument();
        expect(screen.getByTestId('mock-confetti')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        render(<GoldenRecordModal isOpen={false} onClose={() => {}} />);
        expect(screen.queryByText('The Golden Record')).not.toBeInTheDocument();
    });

    it('calls onClose when button is clicked', () => {
        const onClose = vi.fn();
        render(<GoldenRecordModal isOpen={true} onClose={onClose} />);
        fireEvent.click(screen.getByText('Accept Award'));
        expect(onClose).toHaveBeenCalled();
    });
});

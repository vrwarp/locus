import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Avatar } from './Avatar';

describe('Avatar Component', () => {
    it('renders the initial state correctly (0 fixes)', () => {
        render(<Avatar totalFixes={0} />);
        expect(screen.getByText('Data Novice')).toBeInTheDocument();
        expect(screen.getByText('Level 1')).toBeInTheDocument();
        expect(screen.getByText('🥚')).toBeInTheDocument();
        expect(screen.getByText('0 / 50 fixes')).toBeInTheDocument();
    });

    it('renders Data Ninja correctly (250 fixes)', () => {
        render(<Avatar totalFixes={250} />);
        expect(screen.getByText('Data Ninja')).toBeInTheDocument();
        expect(screen.getByText('Level 3')).toBeInTheDocument();
        expect(screen.getByText('🥷')).toBeInTheDocument();
        expect(screen.getByText('250 / 1000 fixes')).toBeInTheDocument();
    });

    it('renders max level correctly (10000+ fixes)', () => {
        render(<Avatar totalFixes={15000} />);
        expect(screen.getByText('Data Deity')).toBeInTheDocument();
        expect(screen.getByText('Level 6')).toBeInTheDocument();
        expect(screen.getByText('🌟')).toBeInTheDocument();
        expect(screen.queryByText(/fixes/)).not.toBeInTheDocument();
    });
});

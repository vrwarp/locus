import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from './Sidebar';

describe('Sidebar Component', () => {
    it('renders all navigation items', () => {
        const props = {
            currentView: 'dashboard',
            onChangeView: vi.fn(),
            anomaliesCount: 5
        };

        render(<Sidebar {...props} />);

        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Data Health')).toBeInTheDocument();
        expect(screen.getByText('Pastoral Co-Pilot')).toBeInTheDocument(); // New item
        expect(screen.getByText('Burnout Risk')).toBeInTheDocument();
        expect(screen.getByText('Demographics')).toBeInTheDocument();
    });

    it('highlights current view', () => {
        const props = {
            currentView: 'burnout',
            onChangeView: vi.fn(),
            anomaliesCount: 0
        };

        const { container } = render(<Sidebar {...props} />);

        // Find the active element
        const activeItem = container.querySelector('.nav-item.active');
        expect(activeItem).toHaveTextContent('Burnout Risk');
    });

    it('shows anomaly badge', () => {
        const props = {
            currentView: 'dashboard',
            onChangeView: vi.fn(),
            anomaliesCount: 12
        };

        render(<Sidebar {...props} />);

        expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('calls onChangeView when clicked', () => {
        const onChangeView = vi.fn();
        const props = {
            currentView: 'dashboard',
            onChangeView,
            anomaliesCount: 0
        };

        render(<Sidebar {...props} />);

        fireEvent.click(screen.getByText('Pastoral Co-Pilot'));
        expect(onChangeView).toHaveBeenCalledWith('copilot');

        fireEvent.click(screen.getByText('Demographics'));
        expect(onChangeView).toHaveBeenCalledWith('demographics');
    });
});

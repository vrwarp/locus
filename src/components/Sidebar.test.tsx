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
        expect(screen.getByText('Check-in Velocity')).toBeInTheDocument();
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

    it('calls onChangeView for all navigation items', () => {
        const onChangeView = vi.fn();
        const props = {
            currentView: 'dashboard',
            onChangeView,
            anomaliesCount: 0
        };

        render(<Sidebar {...props} />);

        const navigations = [
            { text: 'Dashboard', value: 'dashboard' },
            { text: 'Bounty Board', value: 'bounties' },
            { text: 'Data Health', value: 'data-health' },
            { text: 'Pastoral Co-Pilot', value: 'copilot' },
            { text: 'Small Group Sorter', value: 'small-groups' },
            { text: 'Burnout Risk', value: 'burnout' },
            { text: 'Attrition', value: 'attrition' },
            { text: 'Recruitment', value: 'recruitment' },
            { text: 'Retention', value: 'retention' },
            { text: 'Attendance', value: 'attendance' },
            { text: 'Check-in Velocity', value: 'velocity' },
            { text: 'Bus Factor', value: 'bus-factor' },
            { text: 'Volunteer Web', value: 'network' },
            { text: 'Solar System', value: 'solar-system' },
            { text: 'Achievement Case', value: 'achievements' },
            { text: 'Birthdays', value: 'heatmap' },
            { text: 'Demographics', value: 'demographics' },
            { text: 'Automations', value: 'automations' },
            { text: 'Newsletter Architect', value: 'newsletter' },
            { text: 'Duplicate Detective', value: 'duplicates' },
            { text: 'Ghost Protocol', value: 'ghosts' },
            { text: 'Family Audit', value: 'families' },
            { text: 'Settings', value: 'settings' }
        ];

        navigations.forEach(({ text, value }) => {
            const el = screen.getByText(text);
            fireEvent.click(el);
            expect(onChangeView).toHaveBeenCalledWith(value);
        });
    });
});

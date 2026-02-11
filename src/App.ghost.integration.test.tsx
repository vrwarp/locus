import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './utils/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Student } from './utils/pco';
import * as pco from './utils/pco';

// Mock pco (partial mock to override checkApiVersion)
vi.mock('./utils/pco', async (importOriginal) => {
    const actual = await importOriginal<typeof import('./utils/pco')>();
    return {
        ...actual,
        checkApiVersion: vi.fn().mockResolvedValue(true),
    };
});

// Mock dependencies
vi.mock('./utils/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    interceptors: {
      response: { use: vi.fn() }
    }
  }
}));

// Mock storage
vi.mock('./utils/storage', () => ({
  loadConfig: vi.fn().mockResolvedValue({ graderOptions: {} }),
  saveConfig: vi.fn().mockResolvedValue(undefined),
  loadHealthHistory: vi.fn().mockResolvedValue([]),
  saveHealthSnapshot: vi.fn().mockResolvedValue(undefined),
  loadGamificationState: vi.fn().mockResolvedValue({ currentStreak: 0, dailyFixes: 0, totalFixes: 0, lastActiveDate: '' }),
  saveGamificationState: vi.fn().mockResolvedValue(undefined),
  updateGamificationState: vi.fn((state) => ({ ...state })),
}));

// Mock cache
vi.mock('./utils/cache', () => ({
  saveToCache: vi.fn(),
  loadFromCache: vi.fn().mockResolvedValue(null),
}));

// Mock Components
vi.mock('./components/GradeScatter', () => ({
  GradeScatter: () => <div data-testid="grade-scatter">Scatter</div>
}));
vi.mock('./components/SmartFixModal', () => ({
  SmartFixModal: () => null
}));
vi.mock('./components/ConfigModal', () => ({
  ConfigModal: () => null
}));
vi.mock('./components/FamilyModal', () => ({
  FamilyModal: () => null
}));
vi.mock('./components/RobertReport', () => ({
  RobertReport: () => null
}));
vi.mock('./components/GamificationWidget', () => ({
    GamificationWidget: () => null
}));

// Mock GhostModal with functional buttons
vi.mock('./components/GhostModal', () => ({
  GhostModal: ({ isOpen, onArchive, onAnalyze, onClose, students }: any) => isOpen ? (
    <div data-testid="ghost-modal">
        <p>Found {students.length} ghosts</p>
        <button onClick={() => onAnalyze && onAnalyze(students)}>Analyze Deeply</button>
        <button onClick={() => onArchive(students)}>Archive All</button>
        <button onClick={onClose}>Close</button>
        <ul>
            {students.map((s: Student) => <li key={s.id}>{s.name}</li>)}
        </ul>
    </div>
  ) : null
}));

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: false,
        },
    },
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('Ghost Protocol Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        vi.useRealTimers();
        window.alert = vi.fn();
        (pco.checkApiVersion as any).mockResolvedValue(true);
    });

    it('removes student from ghost list if Analyze Deeply finds group membership (Ghost Rescue)', async () => {
        const ghostCandidate = {
            id: 'g1',
            type: 'Person',
            attributes: {
                birthdate: '2000-01-01',
                grade: 10,
                name: 'Rescue Me',
                last_checked_in_at: '2020-01-01' // Old check-in (> 24 months)
            }
        };

        // Current date: 2024
        vi.setSystemTime(new Date('2024-01-01'));

        (api.get as any).mockResolvedValue({
            data: {
                data: [ghostCandidate]
            }
        });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        // Wait for API call
        await waitFor(() => expect(api.get).toHaveBeenCalledWith(expect.stringContaining('/api/people/v2/people'), expect.anything()), { timeout: 3000 });

        // Wait for data to settle (loading gone)
        // Check that "No data found" is NOT present
        await waitFor(() => expect(screen.queryByText(/No data found/)).not.toBeInTheDocument());

        // Open Ghost Modal
        fireEvent.click(screen.getByText('👻 Ghost Protocol'));
        expect(screen.getByTestId('ghost-modal')).toBeInTheDocument();

        // Should initially be in the list
        await waitFor(() => expect(screen.getByText('Found 1 ghosts')).toBeInTheDocument());
        expect(screen.getByText('Rescue Me')).toBeInTheDocument();

        // Setup Analyze API mocks for the NEXT call
        (api.get as any).mockImplementation((url: string) => {
            if (url.includes('/api/check-ins/v2/people/g1')) {
                return Promise.resolve({ data: { data: { attributes: { check_in_count: 5 } } } });
            }
            if (url.includes('/groups/v2/people/g1/memberships')) {
                 return Promise.resolve({ data: { meta: { total_count: 1 } } });
            }
            // Fallback for any other calls (like re-fetching people if invalidateQueries happened?)
            if (url.includes('/people/v2/people')) {
                return Promise.resolve({ data: { data: [ghostCandidate] } });
            }
            return Promise.resolve({ data: { data: [] } });
        });

        // Click Analyze Deeply
        fireEvent.click(screen.getByText('Analyze Deeply'));

        // Wait for Analyze to complete and UI to update
        await waitFor(() => {
            expect(screen.getByText('Found 0 ghosts')).toBeInTheDocument();
        });

        expect(screen.queryByText('Rescue Me')).not.toBeInTheDocument();
    });
});

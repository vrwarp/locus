import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import * as pco from './utils/pco';

// Mock dependencies
vi.mock('./utils/pco');
vi.mock('./utils/cache', () => ({
    saveToCache: vi.fn(),
    loadFromCache: vi.fn().mockResolvedValue(null)
}));
vi.mock('./utils/storage', () => ({
    loadConfig: vi.fn().mockResolvedValue({ graderOptions: {} }),
    saveConfig: vi.fn(),
    loadHealthHistory: vi.fn().mockResolvedValue([]),
    saveHealthSnapshot: vi.fn(),
    loadGamificationState: vi.fn().mockResolvedValue({}),
    saveGamificationState: vi.fn()
}));

// Mock GradeScatter to simulate selection
vi.mock('./components/GradeScatter', () => ({
    GradeScatter: ({ onPointClick }: any) => (
        <div data-testid="scatter-plot">
            <button onClick={() => onPointClick({
                id: '1',
                name: 'Test Student',
                pcoGrade: 5,
                birthdate: '2010-01-01',
                calculatedGrade: 6,
                delta: 1,
                age: 10,
                firstName: 'Test',
                lastName: 'Student',
                isChild: true,
                householdId: 'h1',
                hasNameAnomaly: false,
                hasEmailAnomaly: false,
                hasAddressAnomaly: false,
                hasPhoneAnomaly: false
            })}>
                Select Student
            </button>
        </div>
    )
}));

// Mock SmartFixModal to control the save
vi.mock('./components/SmartFixModal', () => ({
    SmartFixModal: ({ isOpen, onSave, onClose, student }: any) => isOpen ? (
        <div data-testid="smart-fix-modal">
            <button onClick={() => onSave({ ...student, pcoGrade: 6, delta: 0 })}>Fix Grade</button>
            <button onClick={onClose}>Close</button>
        </div>
    ) : null
}));

// Mock other modals to avoid rendering issues
vi.mock('./components/ReviewMode', () => ({ ReviewMode: () => null }));
vi.mock('./components/ConfigModal', () => ({ ConfigModal: () => null }));
vi.mock('./components/GhostModal', () => ({ GhostModal: () => null }));
vi.mock('./components/FamilyModal', () => ({ FamilyModal: () => null }));
vi.mock('./components/RobertReport', () => ({ RobertReport: () => null }));
vi.mock('./components/GamificationWidget', () => ({ GamificationWidget: () => <div data-testid="gamification-widget" /> }));

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

describe('Undo/Redo Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();

        // Mock PCO API
        (pco.checkApiVersion as any).mockResolvedValue(true);
        (pco.fetchRecentCheckIns as any).mockResolvedValue([]);
        (pco.fetchEvents as any).mockResolvedValue([]);

        (pco.fetchAllPeople as any).mockResolvedValue({
            people: [{
                id: '1',
                type: 'Person',
                attributes: {
                    name: 'Test Student',
                    first_name: 'Test',
                    last_name: 'Student',
                    grade: 5,
                    birthdate: '2010-01-01',
                    child: true,
                    household_id: 'h1'
                }
            }],
            nextUrl: undefined
        });
        (pco.updatePerson as any).mockResolvedValue({
             id: '1',
             type: 'Person',
             attributes: {
                 name: 'Test Student'
             }
        });

        (pco.prepareUpdateAttributes as any).mockImplementation((original: any, updated: any) => {
             if (original.pcoGrade !== updated.pcoGrade) {
                 return { grade: updated.pcoGrade };
             }
             return {};
        });

        // Important: transformPerson must work
        (pco.transformPerson as any).mockImplementation((p: any) => ({
                id: p.id,
                name: p.attributes.name,
                pcoGrade: p.attributes.grade,
                birthdate: p.attributes.birthdate,
                calculatedGrade: 6,
                delta: 1,
                age: 10,
                firstName: 'Test',
                lastName: 'Student',
                isChild: true,
                householdId: 'h1',
                hasNameAnomaly: false,
                hasEmailAnomaly: false,
                hasAddressAnomaly: false,
                hasPhoneAnomaly: false
        }));
    });

    afterEach(() => {
        // cleanup
    });

    it('should allow undoing a committed change', async () => {
        const queryClient = new QueryClient({
            defaultOptions: {
                queries: {
                    retry: false,
                },
            },
        });

        render(
            <QueryClientProvider client={queryClient}>
                <App />
            </QueryClientProvider>
        );

        // Login
        const appIdInput = screen.getByPlaceholderText('Application ID');
        const secretInput = screen.getByPlaceholderText('Secret');
        fireEvent.change(appIdInput, { target: { value: 'test-app' } });
        fireEvent.change(secretInput, { target: { value: 'test-secret' } });

        // Wait for login (debounce 1s + api check)
        await waitFor(() => expect(screen.getByTestId('gamification-widget')).toBeInTheDocument(), { timeout: 3000 });

        // Ensure data loading is done before navigation
        await waitFor(() => expect(screen.queryByText(/Loading/)).not.toBeInTheDocument(), { timeout: 3000 });

        // Navigate to Data Health (where GradeScatter is)
        fireEvent.click(screen.getByText(/Data Health/));

        // Wait for scatter plot to render
        await waitFor(() => expect(screen.getByTestId('scatter-plot')).toBeInTheDocument(), { timeout: 3000 });

        // Select student
        fireEvent.click(screen.getByText('Select Student'));

        // Fix Grade
        fireEvent.click(screen.getByText('Fix Grade'));

        // Wait for commit (5s timeout in App.tsx)
        // We use act to wrap the waiting
        await act(async () => {
            await sleep(6000);
        });

        // Verify updatePerson called
        expect(pco.updatePerson).toHaveBeenCalledWith('1', { grade: 6 }, expect.any(String), expect.any(Boolean));

        // Find Undo button (History Undo)
        const undoButton = screen.getByTitle(/Undo/);
        expect(undoButton).not.toBeDisabled();

        // Click Undo
        await act(async () => {
            fireEvent.click(undoButton);
        });

        // Verify updatePerson called with original value
        expect(pco.updatePerson).toHaveBeenCalledWith('1', { grade: 5 }, expect.any(String), expect.any(Boolean));
    }, 15000);
});

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api from './utils/api';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { Student } from './utils/pco';
import * as storage from './utils/storage';
import * as gamification from './utils/gamification';
import { saveToCache, loadFromCache } from './utils/cache';
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
// Replace axios mock with api mock
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
  loadGamificationState: vi.fn().mockResolvedValue({ currentStreak: 0, dailyFixes: 0, totalFixes: 0, lastActiveDate: '', unlockedBadges: [] }),
  saveGamificationState: vi.fn().mockResolvedValue(undefined),
}));

// Mock gamification
vi.mock('./utils/gamification', () => ({
  updateGamificationState: vi.fn((state) => ({
      newState: { ...state, currentStreak: state.currentStreak + 1, dailyFixes: state.dailyFixes + 1, unlockedBadges: [] },
      newBadges: []
  })),
}));

// Mock cache
vi.mock('./utils/cache', () => ({
  saveToCache: vi.fn(),
  loadFromCache: vi.fn().mockResolvedValue(null),
}));

// Mock GradeScatter to avoid Recharts complexity and easily test interaction
vi.mock('./components/GradeScatter', () => ({
  GradeScatter: ({ data, onPointClick, colorblindMode }: { data: Student[], onPointClick: (s: Student) => void, colorblindMode?: boolean }) => (
    <div data-testid="grade-scatter" data-colorblind-mode={colorblindMode ? 'true' : 'false'}>
      {data.map(s => (
        <button key={s.id} data-testid={`student-${s.id}`} onClick={() => onPointClick(s)}>
          {s.name} - Grade {s.pcoGrade}
        </button>
      ))}
    </div>
  )
}));

// Mock SmartFixModal to simplify assertions
vi.mock('./components/SmartFixModal', () => ({
  SmartFixModal: ({ isOpen, student, onSave, onClose }: any) => isOpen ? (
    <div data-testid="smart-fix-modal">
        <p>{student.name}</p>
        <p>Calculated: {student.calculatedGrade}</p>
        <button onClick={() => {
            onSave({...student, pcoGrade: 5}); // Simulate fixing to grade 5
            onClose();
        }}>Fix</button>
        <button onClick={() => {
            onSave({...student, birthdate: '2015-01-01'}); // Simulate fixing birthdate
            onClose();
        }}>Fix Birthdate</button>
        <button onClick={onClose}>Close</button>
    </div>
  ) : null
}));

vi.mock('./components/ConfigModal', () => ({
  ConfigModal: ({ isOpen, onSave, onClose, currentConfig }: any) => isOpen ? (
    <div data-testid="config-modal">
        <button onClick={() => {
            // Set cutoff to October 1st (Month Index 9)
            onSave({ ...currentConfig, graderOptions: { cutoffMonth: 9, cutoffDay: 1 } });
            onClose();
        }}>Save Config</button>
         <button onClick={() => {
            onSave({ ...currentConfig, highContrastMode: true });
            onClose();
        }}>Save High Contrast</button>
        <button onClick={() => {
            onSave({ ...currentConfig, colorblindMode: true });
            onClose();
        }}>Save Colorblind</button>
        <button onClick={onClose}>Close Config</button>
    </div>
  ) : null
}));

vi.mock('./components/GhostModal', () => ({
  GhostModal: ({ isOpen, onArchive, onAnalyze, onClose, students }: any) => isOpen ? (
    <div data-testid="ghost-modal">
        <p>Found {students.length} ghosts</p>
        <button onClick={() => onAnalyze && onAnalyze(students)}>Analyze Deeply</button>
        <button onClick={() => onArchive(students)}>Archive All</button>
        <button onClick={onClose}>Close</button>
    </div>
  ) : null
}));

vi.mock('./components/FamilyModal', () => ({
  FamilyModal: ({ isOpen, onClose, issues }: any) => isOpen ? (
    <div data-testid="family-modal">
        <p>Found {issues.length} anomalies</p>
        <button onClick={onClose}>Close</button>
    </div>
  ) : null
}));

vi.mock('./components/RobertReport', () => ({
  RobertReport: ({ isOpen, stats, onClose }: any) => isOpen ? (
    <div data-testid="robert-report">
        <p>Health Score: {stats.score}</p>
        <button onClick={onClose}>Close Report</button>
    </div>
  ) : null
}));

vi.mock('./components/ReviewMode', () => ({
  ReviewMode: ({ isOpen, onClose, students, onSave }: any) => isOpen ? (
    <div data-testid="review-mode">
        <p>Reviewing {students.length} students</p>
        <button onClick={() => {
             if (students.length > 0) {
                 onSave({...students[0], pcoGrade: 99}); // Simulate save
             }
        }}>Fix First</button>
        <button onClick={onClose}>Close Review</button>
    </div>
  ) : null
}));

// Mock GamificationWidget to avoid CSS import issues in test environment if any
vi.mock('./components/GamificationWidget', () => ({
  GamificationWidget: ({ streak, dailyFixes }: any) => (
    <div data-testid="gamification-widget">Streak: {streak}, Daily: {dailyFixes}</div>
  )
}));

// Mock Confetti
vi.mock('./components/Confetti', () => ({
    Confetti: () => <div data-testid="confetti">Confetti!</div>
}));

// Mock BadgeToast
vi.mock('./components/BadgeToast', () => ({
    BadgeToast: ({ badge }: any) => <div data-testid="badge-toast">{badge.name}</div>
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

describe('App Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        queryClient.clear();
        vi.useRealTimers();
        // Mock alert
        window.alert = vi.fn();
        // Reset checkApiVersion to success by default
        (pco.checkApiVersion as any).mockResolvedValue(true);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders and allows fixing a student grade', async () => {
        // Mock API Response
        (api.get as any).mockResolvedValue({
            data: {
                data: [{
                    id: '1',
                    type: 'Person',
                    attributes: {
                        birthdate: '2014-01-01',
                        grade: 4,
                        name: 'Problem Kid'
                    }
                }]
            }
        });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-1')).toBeInTheDocument(), { timeout: 2500 });
        expect(screen.getByText('Problem Kid - Grade 4')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('student-1'));
        expect(screen.getByTestId('smart-fix-modal')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Fix'));
        await waitFor(() => expect(screen.queryByTestId('smart-fix-modal')).not.toBeInTheDocument());
        await waitFor(() => expect(screen.getByText('Problem Kid - Grade 5')).toBeInTheDocument());
    });

    it('shows undo toast and reverts on undo click', async () => {
        (api.get as any).mockResolvedValue({
            data: {
                data: [{
                    id: '1',
                    type: 'Person',
                    attributes: {
                        birthdate: '2014-01-01',
                        grade: 4,
                        name: 'Undo Kid'
                    }
                }]
            }
        });

        (api.patch as any).mockResolvedValue({ data: { data: {} } });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-1')).toBeInTheDocument(), { timeout: 2500 });

        fireEvent.click(screen.getByTestId('student-1'));
        fireEvent.click(screen.getByText('Fix'));

        await waitFor(() => expect(screen.getByText(/Updated grade for Undo Kid/)).toBeInTheDocument());
        expect(screen.getByText('Undo Kid - Grade 5')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Undo'));

        await waitFor(() => expect(screen.queryByText(/Updated grade for Undo Kid/)).not.toBeInTheDocument());
        expect(screen.getByText('Undo Kid - Grade 4')).toBeInTheDocument();
        expect(api.patch).not.toHaveBeenCalled();
    });

    it('commits change to API after timeout', async () => {
        // Do not call vi.useFakeTimers() here, wait until data loads

        (api.get as any).mockResolvedValue({
            data: {
                data: [{
                    id: '2',
                    type: 'Person',
                    attributes: {
                        birthdate: '2014-01-01',
                        grade: 4,
                        name: 'Commit Kid'
                    }
                }]
            }
        });
        (api.patch as any).mockResolvedValue({ data: { data: {} } });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-2')).toBeInTheDocument(), { timeout: 2500 });

        // Switch to fake timers
        vi.useFakeTimers();

        fireEvent.click(screen.getByTestId('student-2'));
        fireEvent.click(screen.getByText('Fix'));

        // Ensure toast appears
        expect(screen.getByText(/Updated grade/)).toBeInTheDocument();

        // Verify optimistic update
        expect(screen.getByText('Commit Kid - Grade 5')).toBeInTheDocument();

        // Advance time by 5 seconds
        act(() => {
            vi.advanceTimersByTime(5000);
        });

        // Verify API called
        expect(api.patch).toHaveBeenCalledWith(
            '/api/people/v2/people/2',
            expect.objectContaining({
                data: expect.objectContaining({
                    attributes: { grade: 5 }
                })
            }),
            expect.any(Object)
        );
    }, 15000);

    it('commits birthdate change to API correctly', async () => {
        (api.get as any).mockResolvedValue({
            data: {
                data: [{
                    id: 'bd1',
                    type: 'Person',
                    attributes: { birthdate: '2014-01-01', grade: 4, name: 'Date Kid' }
                }]
            }
        });
        (api.patch as any).mockResolvedValue({ data: { data: {} } });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-bd1')).toBeInTheDocument(), { timeout: 2500 });

        vi.useFakeTimers();

        fireEvent.click(screen.getByTestId('student-bd1'));
        fireEvent.click(screen.getByText('Fix Birthdate'));

        // Advance time
        act(() => {
            vi.advanceTimersByTime(5000);
        });

        // Verify API called with birthdate ONLY
        expect(api.patch).toHaveBeenCalledWith(
            '/api/people/v2/people/bd1',
            expect.objectContaining({
                data: expect.objectContaining({
                    attributes: { birthdate: '2015-01-01' }
                })
            }),
            expect.any(Object)
        );
        // Ensure grade was NOT sent (as it didn't change)
        const callArgs = (api.patch as any).mock.calls[0];
        const payload = callArgs[1].data.attributes;
        expect(payload.grade).toBeUndefined();
    });

    it('flushes previous pending update when a new one is made', async () => {
       (api.get as any).mockResolvedValue({
           data: {
               data: [
                   {
                       id: '1',
                       type: 'Person',
                       attributes: { birthdate: '2014-01-01', grade: 4, name: 'Student 1' }
                   },
                   {
                       id: '2',
                       type: 'Person',
                       attributes: { birthdate: '2014-01-01', grade: 4, name: 'Student 2' }
                   }
               ]
           }
       });
       (api.patch as any).mockResolvedValue({ data: { data: {} } });

       render(<Wrapper><App /></Wrapper>);

       fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
       fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

       await waitFor(() => expect(screen.getByTestId('student-1')).toBeInTheDocument(), { timeout: 2500 });

       vi.useFakeTimers();

       // 1. Fix Student 1
       fireEvent.click(screen.getByTestId('student-1'));
       fireEvent.click(screen.getByText('Fix'));

       // Assert Toast for Student 1
       expect(screen.getByText(/Updated grade for Student 1/)).toBeInTheDocument();

       // Advance time partially (e.g. 2s) - not enough to commit
       act(() => {
           vi.advanceTimersByTime(2000);
       });

       expect(api.patch).not.toHaveBeenCalled();

       // 2. Fix Student 2 immediately
       fireEvent.click(screen.getByTestId('student-2'));
       fireEvent.click(screen.getByText('Fix'));

       // Assert Toast changes to Student 2
       expect(screen.getByText(/Updated grade for Student 2/)).toBeInTheDocument();

       // Assert API was called for Student 1 (flushed)
       expect(api.patch).toHaveBeenCalledWith(
           '/api/people/v2/people/1',
           expect.objectContaining({ data: expect.objectContaining({ id: '1' }) }),
           expect.any(Object)
       );

       // Clear mock
       (api.patch as any).mockClear();

       // Advance time to finish Student 2 commit
       act(() => {
           vi.advanceTimersByTime(5000);
       });

       // Assert API called for Student 2
       expect(api.patch).toHaveBeenCalledWith(
           '/api/people/v2/people/2',
           expect.objectContaining({ data: expect.objectContaining({ id: '2' }) }),
           expect.any(Object)
       );
   }, 15000);

   it('updates student calculated grade when config changes', async () => {
        // Set System Time to Nov 1, 2024 to ensure deterministic calculation
        vi.setSystemTime(new Date('2024-11-01'));

        (api.get as any).mockResolvedValue({
            data: {
                data: [{
                    id: '3',
                    type: 'Person',
                    attributes: {
                        birthdate: '2018-09-15',
                        grade: 0,
                        name: 'Sept Kid'
                    }
                }]
            }
        });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-3')).toBeInTheDocument(), { timeout: 2500 });

        fireEvent.click(screen.getByTestId('student-3'));
        expect(screen.getByTestId('smart-fix-modal')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Close')); // Close fix modal

        // Open Settings
        fireEvent.click(screen.getByText('⚙️ Settings'));
        expect(screen.getByTestId('config-modal')).toBeInTheDocument();

        // Save Config (Change to Oct 1)
        fireEvent.click(screen.getByText('Save Config'));

        // Assert saveConfig was called
        expect(storage.saveConfig).toHaveBeenCalledWith(expect.anything(), 'test-id');

        // Wait for re-render and click student again
        await waitFor(() => expect(screen.getByTestId('student-3')).toBeInTheDocument());
        fireEvent.click(screen.getByTestId('student-3'));

        expect(screen.getByTestId('smart-fix-modal')).toBeInTheDocument();
        // New calculation: Age 6 -> Grade 1
        expect(screen.getByText('Calculated: 1')).toBeInTheDocument();
   }, 15000);

   it('applies high-contrast class when configured', async () => {
       render(<Wrapper><App /></Wrapper>);

       expect(document.body).not.toHaveClass('high-contrast');

       // Trigger login to enable config loading
       fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });

       // Note: loadConfig defaults to empty. So no class yet.

       fireEvent.click(screen.getByText('⚙️ Settings'));
       fireEvent.click(screen.getByText('Save High Contrast'));

       expect(document.body).toHaveClass('high-contrast');
    });

    it('identifies and archives ghosts', async () => {
        const ghostStudent = {
            id: 'g1',
            type: 'Person',
            attributes: {
                birthdate: '2000-01-01',
                grade: 10,
                name: 'Casper',
                last_checked_in_at: null // Never checked in -> Ghost
            }
        };
        const activeStudent = {
            id: 'a1',
            type: 'Person',
            attributes: {
                birthdate: '2000-01-01',
                grade: 10,
                name: 'Alive',
                last_checked_in_at: '2024-01-01' // Recent -> Not Ghost (Assuming mock date is later)
            }
        };

        // Set system time so 'Alive' is considered recent
        vi.setSystemTime(new Date('2024-02-01'));

        (api.get as any).mockResolvedValue({
            data: {
                data: [ghostStudent, activeStudent]
            }
        });
        (api.patch as any).mockResolvedValue({ data: { data: {} } });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-g1')).toBeInTheDocument(), { timeout: 2500 });

        fireEvent.click(screen.getByText('👻 Ghost Protocol'));
        expect(screen.getByTestId('ghost-modal')).toBeInTheDocument();
        expect(screen.getByText('Found 1 ghosts')).toBeInTheDocument();

        // Test analyze flow
        // Mock check-ins API
        (api.get as any).mockImplementation((url: string) => {
            if (url.includes('/api/check-ins/v2/people/g1')) {
                return Promise.resolve({ data: { data: { attributes: { check_in_count: 3 } } } });
            }
            if (url.includes('/groups/v2/people/g1/memberships')) {
                 return Promise.resolve({ data: { meta: { total_count: 0 } } });
            }
            return Promise.resolve({ data: { data: [] } }); // Default for people
        });

        const analyzeBtn = screen.getByText('Analyze Deeply');
        fireEvent.click(analyzeBtn);

        await waitFor(() => expect(api.get).toHaveBeenCalledWith(
            expect.stringContaining('/api/check-ins/v2/people/g1'),
            expect.any(Object)
        ));

        await waitFor(() => expect(api.get).toHaveBeenCalledWith(
            expect.stringContaining('/groups/v2/people/g1/memberships'),
            expect.any(Object)
        ));

        fireEvent.click(screen.getByText('Archive All'));

        await waitFor(() => expect(api.patch).toHaveBeenCalledWith(
            '/api/people/v2/people/g1',
            expect.objectContaining({
                data: expect.objectContaining({
                    attributes: { status: 'inactive' }
                })
            }),
            expect.any(Object)
        ));

        // Wait for alert to confirm completion
        await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringMatching(/Successfully archived 1 ghosts/)));
    });

    it('opens and closes the Family Audit modal', async () => {
        // Mock data with a family anomaly
        const parent = {
            id: 'p1',
            type: 'Person',
            attributes: { birthdate: '2000-01-01', grade: 99, name: 'Parent', household_id: 'h1', child: false }
        };
        const child = {
            id: 'c1',
            type: 'Person',
            attributes: { birthdate: '1990-01-01', grade: 10, name: 'Older Child', household_id: 'h1', child: true }
        };

        (api.get as any).mockResolvedValue({
            data: { data: [parent, child] }
        });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-p1')).toBeInTheDocument(), { timeout: 2500 });

        fireEvent.click(screen.getByText('👨‍👩‍👧‍👦 Family Audit'));
        expect(screen.getByTestId('family-modal')).toBeInTheDocument();
        expect(screen.getByText('Found 1 anomalies')).toBeInTheDocument(); // Child older than parent

        fireEvent.click(screen.getByText('Close'));
        expect(screen.queryByTestId('family-modal')).not.toBeInTheDocument();
    });

    it('opens and closes the Robert Report', async () => {
        // Set date to ensure consistent age calculation
        vi.setSystemTime(new Date('2024-11-01')); // Nov 2024

        (api.get as any).mockResolvedValue({
            data: {
                data: [{
                    id: '1',
                    type: 'Person',
                    attributes: {
                        birthdate: '2014-01-01', // Age 10. Expected Grade 5.
                        grade: 5, // Match -> Score 100
                        name: 'Healthy Kid'
                    }
                }]
            }
        });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-1')).toBeInTheDocument(), { timeout: 2500 });

        fireEvent.click(screen.getByText('📊 Report'));
        expect(screen.getByTestId('robert-report')).toBeInTheDocument();

        expect(screen.getByText('Health Score: 100')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Close Report'));
        expect(screen.queryByTestId('robert-report')).not.toBeInTheDocument();
    });

    it('shows Review Mode button only when anomalies exist and allows fixing', async () => {
        // Set date
        vi.setSystemTime(new Date('2024-11-01'));

        (api.get as any).mockResolvedValue({
            data: {
                data: [
                    {
                        id: 'a1',
                        type: 'Person',
                        attributes: { birthdate: '2014-01-01', grade: 4, name: 'Anomaly Kid' } // Expected 5 -> Delta 1
                    },
                    {
                         id: 'h1',
                         type: 'Person',
                         attributes: { birthdate: '2014-01-01', grade: 5, name: 'Healthy Kid' }
                    }
                ]
            }
        });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-a1')).toBeInTheDocument(), { timeout: 2500 });

        // Check for Review Mode button
        const reviewBtn = screen.getByText(/Review Mode/);
        expect(reviewBtn).toBeInTheDocument();
        expect(reviewBtn).toHaveTextContent('Review Mode (1)');

        // Open Review Mode
        fireEvent.click(reviewBtn);
        expect(screen.getByTestId('review-mode')).toBeInTheDocument();
        expect(screen.getByText('Reviewing 1 students')).toBeInTheDocument();

        // Fix
        fireEvent.click(screen.getByText('Fix First'));

        // Should trigger toast/update logic (mocked in other tests, here we verify onSave was passed correctly)
        // Since we are mocking ReviewMode, we check if the effect happened (e.g. toast appeared)
        await waitFor(() => expect(screen.getByText(/Updated grade for Anomaly Kid/)).toBeInTheDocument());

        // Close
        fireEvent.click(screen.getByText('Close Review'));
        expect(screen.queryByTestId('review-mode')).not.toBeInTheDocument();
    });

    it('hides Review Mode button when no anomalies exist', async () => {
        // Set date
        vi.setSystemTime(new Date('2024-11-01'));

        (api.get as any).mockResolvedValue({
            data: {
                data: [
                    {
                         id: 'h1',
                         type: 'Person',
                         attributes: { birthdate: '2014-01-01', grade: 5, name: 'Healthy Kid' }
                    }
                ]
            }
        });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-h1')).toBeInTheDocument(), { timeout: 2500 });

        expect(screen.queryByText(/Review Mode/)).not.toBeInTheDocument();
    });

    it('uses cache and does not fetch API if valid data exists', async () => {
        const cachedPeople = [{
            id: 'cached-1',
            type: 'Person',
            attributes: {
                birthdate: '2014-01-01',
                grade: 5,
                name: 'Cached Kid'
            }
        }];

        // Return legacy array format to test compatibility
        (loadFromCache as any).mockResolvedValue(cachedPeople);

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-cached-1')).toBeInTheDocument(), { timeout: 2500 });

        expect(loadFromCache).toHaveBeenCalledWith('people_v2_test-id', 'test-id', expect.any(Number));
        expect(api.get).not.toHaveBeenCalled();
        expect(saveToCache).not.toHaveBeenCalled();
    });

    it('passes colorblind mode to GradeScatter when configured', async () => {
       render(<Wrapper><App /></Wrapper>);

       // Trigger login
       fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });

       // Default is false
       expect(screen.getByTestId('grade-scatter')).toHaveAttribute('data-colorblind-mode', 'false');

       fireEvent.click(screen.getByText('⚙️ Settings'));
       fireEvent.click(screen.getByText('Save Colorblind'));

       await waitFor(() => {
           expect(screen.getByTestId('grade-scatter')).toHaveAttribute('data-colorblind-mode', 'true');
       });
    });

    it('fetches from API and saves to cache if cache miss', async () => {
        (loadFromCache as any).mockResolvedValue(null);

        const apiData = [{
            id: 'api-1',
            type: 'Person',
            attributes: {
                birthdate: '2014-01-01',
                grade: 5,
                name: 'API Kid'
            }
        }];

        (api.get as any).mockResolvedValue({
            data: {
                data: apiData
            }
        });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-api-1')).toBeInTheDocument(), { timeout: 2500 });

        expect(loadFromCache).toHaveBeenCalled();
        expect(api.get).toHaveBeenCalled();
        expect(saveToCache).toHaveBeenCalledWith('people_v2_test-id', { people: apiData, nextUrl: undefined }, 'test-id');
    });

    it('loads initial batch and allows loading more', async () => {
        // Mock 6 pages. App fetches 5 initially.
        (api.get as any).mockImplementation((url: string) => {
            let pageNum = 1;
            const match = url.match(/page_(\d+)/);
            if (match) {
                pageNum = parseInt(match[1]);
            } else if (url.includes('/api/people/v2/people')) {
                pageNum = 1;
            } else {
                return Promise.resolve({ data: { data: [] } });
            }

            const nextLink = pageNum < 6 ? `http://api.pco/page_${pageNum + 1}` : undefined;

            return Promise.resolve({
                data: {
                    links: nextLink ? { next: nextLink } : {},
                    data: [{
                        id: `p${pageNum}`,
                        type: 'Person',
                        attributes: { name: `Person ${pageNum}`, birthdate: '2000-01-01', grade: 10 }
                    }]
                }
            });
        });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        // Expect p1 through p5 to be present
        await waitFor(() => expect(screen.getByTestId('student-p5')).toBeInTheDocument(), { timeout: 2500 });
        expect(screen.getByTestId('student-p1')).toBeInTheDocument();

        // Expect p6 to NOT be present yet
        expect(screen.queryByTestId('student-p6')).not.toBeInTheDocument();

        const loadMoreBtn = screen.getByText('Load More Records');
        expect(loadMoreBtn).toBeInTheDocument();

        fireEvent.click(loadMoreBtn);

        await waitFor(() => expect(screen.getByTestId('student-p6')).toBeInTheDocument());

        // Button should disappear as no next link in page 6
        await waitFor(() => expect(screen.queryByText('Load More Records')).not.toBeInTheDocument());
    });

    it('shows error when startup check fails', async () => {
        // Mock checkApiVersion to fail
        (pco.checkApiVersion as any).mockRejectedValue(new Error('API Version Mismatch'));

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByText('API Version Mismatch')).toBeInTheDocument(), { timeout: 2500 });

        // Ensure data fetching was NOT attempted
        expect(api.get).not.toHaveBeenCalled();
    });

    it('updates gamification state when a student is fixed', async () => {
        (api.get as any).mockResolvedValue({
            data: {
                data: [{
                    id: 'g1',
                    type: 'Person',
                    attributes: { birthdate: '2014-01-01', grade: 4, name: 'Gamer Kid' }
                }]
            }
        });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-g1')).toBeInTheDocument(), { timeout: 2500 });

        // Initial state loaded (mocked as 0)
        expect(storage.loadGamificationState).toHaveBeenCalled();

        fireEvent.click(screen.getByTestId('student-g1'));
        fireEvent.click(screen.getByText('Fix'));

        await waitFor(() => expect(gamification.updateGamificationState).toHaveBeenCalled());
        expect(storage.saveGamificationState).toHaveBeenCalledWith(
            expect.objectContaining({ currentStreak: 1 }), // Mock increments by 1
            'test-id'
        );
    });
});

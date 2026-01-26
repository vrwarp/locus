import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Student } from './utils/pco';
import * as storage from './utils/storage';
import { saveToCache, loadFromCache } from './utils/cache';

// Mock dependencies
vi.mock('axios');

// Mock storage
vi.mock('./utils/storage', () => ({
  loadConfig: vi.fn().mockResolvedValue({ graderOptions: {} }),
  saveConfig: vi.fn().mockResolvedValue(undefined),
  loadHealthHistory: vi.fn().mockResolvedValue([]),
  saveHealthSnapshot: vi.fn().mockResolvedValue(undefined),
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
        <button onClick={() => onAnalyze && onAnalyze(students)}>Analyze Check-ins</button>
        <button onClick={() => onArchive(students)}>Archive All</button>
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
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders and allows fixing a student grade', async () => {
        // Mock Axios Response
        (axios.get as any).mockResolvedValue({
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

        await waitFor(() => expect(screen.getByTestId('student-1')).toBeInTheDocument());
        expect(screen.getByText('Problem Kid - Grade 4')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('student-1'));
        expect(screen.getByTestId('smart-fix-modal')).toBeInTheDocument();
        fireEvent.click(screen.getByText('Fix'));
        await waitFor(() => expect(screen.queryByTestId('smart-fix-modal')).not.toBeInTheDocument());
        await waitFor(() => expect(screen.getByText('Problem Kid - Grade 5')).toBeInTheDocument());
    });

    it('shows undo toast and reverts on undo click', async () => {
        (axios.get as any).mockResolvedValue({
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

        (axios.patch as any).mockResolvedValue({ data: { data: {} } });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-1')).toBeInTheDocument());

        fireEvent.click(screen.getByTestId('student-1'));
        fireEvent.click(screen.getByText('Fix'));

        await waitFor(() => expect(screen.getByText(/Updated grade for Undo Kid/)).toBeInTheDocument());
        expect(screen.getByText('Undo Kid - Grade 5')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Undo'));

        await waitFor(() => expect(screen.queryByText(/Updated grade for Undo Kid/)).not.toBeInTheDocument());
        expect(screen.getByText('Undo Kid - Grade 4')).toBeInTheDocument();
        expect(axios.patch).not.toHaveBeenCalled();
    });

    it('commits change to API after timeout', async () => {
        // Do not call vi.useFakeTimers() here, wait until data loads

        (axios.get as any).mockResolvedValue({
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
        (axios.patch as any).mockResolvedValue({ data: { data: {} } });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-2')).toBeInTheDocument());

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
        expect(axios.patch).toHaveBeenCalledWith(
            '/api/people/v2/people/2',
            expect.objectContaining({
                data: expect.objectContaining({
                    attributes: { grade: 5 }
                })
            }),
            expect.any(Object)
        );
    }, 15000);

    it('flushes previous pending update when a new one is made', async () => {
       (axios.get as any).mockResolvedValue({
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
       (axios.patch as any).mockResolvedValue({ data: { data: {} } });

       render(<Wrapper><App /></Wrapper>);

       fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
       fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

       await waitFor(() => expect(screen.getByTestId('student-1')).toBeInTheDocument());

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

       expect(axios.patch).not.toHaveBeenCalled();

       // 2. Fix Student 2 immediately
       fireEvent.click(screen.getByTestId('student-2'));
       fireEvent.click(screen.getByText('Fix'));

       // Assert Toast changes to Student 2
       expect(screen.getByText(/Updated grade for Student 2/)).toBeInTheDocument();

       // Assert API was called for Student 1 (flushed)
       expect(axios.patch).toHaveBeenCalledWith(
           '/api/people/v2/people/1',
           expect.objectContaining({ data: expect.objectContaining({ id: '1' }) }),
           expect.any(Object)
       );

       // Clear mock
       (axios.patch as any).mockClear();

       // Advance time to finish Student 2 commit
       act(() => {
           vi.advanceTimersByTime(5000);
       });

       // Assert API called for Student 2
       expect(axios.patch).toHaveBeenCalledWith(
           '/api/people/v2/people/2',
           expect.objectContaining({ data: expect.objectContaining({ id: '2' }) }),
           expect.any(Object)
       );
   }, 15000);

   it('updates student calculated grade when config changes', async () => {
        // Set System Time to Nov 1, 2024 to ensure deterministic calculation
        vi.setSystemTime(new Date('2024-11-01'));

        (axios.get as any).mockResolvedValue({
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

        await waitFor(() => expect(screen.getByTestId('student-3')).toBeInTheDocument());

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

        (axios.get as any).mockResolvedValue({
            data: {
                data: [ghostStudent, activeStudent]
            }
        });
        (axios.patch as any).mockResolvedValue({ data: { data: {} } });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-g1')).toBeInTheDocument());

        fireEvent.click(screen.getByText('👻 Ghost Protocol'));
        expect(screen.getByTestId('ghost-modal')).toBeInTheDocument();
        expect(screen.getByText('Found 1 ghosts')).toBeInTheDocument();

        // Test analyze flow
        // Mock check-ins API
        (axios.get as any).mockImplementation((url: string) => {
            if (url.includes('/api/check-ins/v2/people/g1')) {
                return Promise.resolve({ data: { data: { attributes: { check_in_count: 3 } } } });
            }
            if (url.includes('/api/groups/v2/people/g1/memberships')) {
                return Promise.resolve({ data: { meta: { total_count: 0 } } });
            }
            return Promise.resolve({ data: { data: [] } }); // Default for people
        });

        const analyzeBtn = screen.getByText('Analyze Check-ins');
        fireEvent.click(analyzeBtn);

        await waitFor(() => expect(axios.get).toHaveBeenCalledWith(
            expect.stringContaining('/api/check-ins/v2/people/g1'),
            expect.any(Object)
        ));

        fireEvent.click(screen.getByText('Archive All'));

        await waitFor(() => expect(axios.patch).toHaveBeenCalledWith(
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

    it('opens and closes the Robert Report', async () => {
        // Set date to ensure consistent age calculation
        vi.setSystemTime(new Date('2024-11-01')); // Nov 2024

        (axios.get as any).mockResolvedValue({
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

        await waitFor(() => expect(screen.getByTestId('student-1')).toBeInTheDocument());

        fireEvent.click(screen.getByText('📊 Report'));
        expect(screen.getByTestId('robert-report')).toBeInTheDocument();

        expect(screen.getByText('Health Score: 100')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Close Report'));
        expect(screen.queryByTestId('robert-report')).not.toBeInTheDocument();
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

        (loadFromCache as any).mockResolvedValue(cachedPeople);

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-cached-1')).toBeInTheDocument());

        expect(loadFromCache).toHaveBeenCalledWith('people_raw_test-id', 'test-id', expect.any(Number));
        expect(axios.get).not.toHaveBeenCalled();
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

        (axios.get as any).mockResolvedValue({
            data: {
                data: apiData
            }
        });

        render(<Wrapper><App /></Wrapper>);

        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        await waitFor(() => expect(screen.getByTestId('student-api-1')).toBeInTheDocument());

        expect(loadFromCache).toHaveBeenCalled();
        expect(axios.get).toHaveBeenCalled();
        expect(saveToCache).toHaveBeenCalledWith('people_raw_test-id', apiData, 'test-id');
    });
});

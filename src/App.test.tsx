import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from './App';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Student } from './utils/pco';

// Mock dependencies
vi.mock('axios');

// Mock GradeScatter to avoid Recharts complexity and easily test interaction
vi.mock('./components/GradeScatter', () => ({
  GradeScatter: ({ data, onPointClick }: { data: Student[], onPointClick: (s: Student) => void }) => (
    <div data-testid="grade-scatter">
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

        // Born Sept 15, 2018.
        // Default Cutoff (Sept 1):
        //   - School Year Start: Sept 1, 2024 (Nov > Sept)
        //   - Age at Sept 1, 2024: 5 (Birthday Sept 15 hasn't happened relative to cutoff)
        //   - Grade: 5 - 5 = 0 (Kindergarten)

        // New Cutoff (Oct 1):
        //   - School Year Start: Oct 1, 2024 (Nov > Oct)
        //   - Age at Oct 1, 2024: 6 (Birthday Sept 15 HAS happened)
        //   - Grade: 6 - 5 = 1 (1st Grade)

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

        // Initial state: Grade 0 (displayed via mock which shows pcoGrade,
        // but we want to verify calculation logic which affects delta/color).
        // Since GradeScatter mock doesn't show calculated grade, we might need to inspect
        // the props passed to it or rely on side effects.
        // However, we can use the SmartFixModal to see the "Suggested Grade".

        fireEvent.click(screen.getByTestId('student-3'));
        expect(screen.getByTestId('smart-fix-modal')).toBeInTheDocument();
        // Since we mocked SmartFixModal too simply, we can't see the text inside.
        // Let's update the SmartFixModal mock to show calculatedGrade?
        // Or better, update the Config test to use a spy on the ConfigModal save.

        // Actually, let's update the GradeScatter mock to show calculated grade?
        // No, let's just open Settings and Save.

        fireEvent.click(screen.getByText('Close')); // Close fix modal

        // Open Settings
        fireEvent.click(screen.getByText('⚙️ Settings'));
        expect(screen.getByTestId('config-modal')).toBeInTheDocument();

        // Save Config (Change to Oct 1)
        fireEvent.click(screen.getByText('Save Config'));

        // Now we expect a re-render.
        // We need to verify that transformPerson was called with new options.
        // Or verify that the student data in GradeScatter has changed.

        // Verify the update via SmartFixModal which displays calculatedGrade

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
            return Promise.reject(new Error('Not Found'));
        });

        const analyzeBtn = screen.getByText('Analyze Check-ins');
        fireEvent.click(analyzeBtn);

        // Should update UI with count (we mocked GhostModal to be simple, but App handles logic)
        // Since we mocked GhostModal, we can't see the tags inside it unless we update the mock.
        // But we can verify axios.get was called.
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
});

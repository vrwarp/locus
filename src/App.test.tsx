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
        <button onClick={() => {
            onSave({...student, pcoGrade: 5}); // Simulate fixing to grade 5
            onClose();
        }}>Fix</button>
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
});

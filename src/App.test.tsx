import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
            onSave({...student, pcoGrade: 5});
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

        // Enter credentials to trigger query
        fireEvent.change(screen.getByPlaceholderText('Application ID'), { target: { value: 'test-id' } });
        fireEvent.change(screen.getByPlaceholderText('Secret'), { target: { value: 'test-secret' } });

        // Wait for data to load and mock GradeScatter to render
        await waitFor(() => expect(screen.getByTestId('student-1')).toBeInTheDocument());

        // Check initial state
        expect(screen.getByText('Problem Kid - Grade 4')).toBeInTheDocument();

        // Click the student (via mock GradeScatter)
        fireEvent.click(screen.getByTestId('student-1'));

        // Check Modal opens
        expect(screen.getByTestId('smart-fix-modal')).toBeInTheDocument();
        expect(screen.getByText('Problem Kid')).toBeInTheDocument();

        // Click Fix in Modal
        fireEvent.click(screen.getByText('Fix'));

        // Check modal closed
        await waitFor(() => expect(screen.queryByTestId('smart-fix-modal')).not.toBeInTheDocument());

        // Verify Optimistic Update: Grade should be updated in the list
        // Since we updated the cache, the component should re-render with new data.
        // Our mock GradeScatter renders "{s.name} - Grade {s.pcoGrade}"
        // The mock onSave set pcoGrade to 5.
        await waitFor(() => expect(screen.getByText('Problem Kid - Grade 5')).toBeInTheDocument());
    });
});

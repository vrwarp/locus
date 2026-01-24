import { useState, useRef, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { GradeScatter } from './components/GradeScatter'
import { SmartFixModal } from './components/SmartFixModal'
import { UndoToast } from './components/UndoToast'
import { transformPerson, updatePerson } from './utils/pco'
import type { Student, PcoApiResponse } from './utils/pco'
import './App.css'

function App() {
  const [appId, setAppId] = useState('')
  const [secret, setSecret] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  // Pending update state for UI (Toast)
  const [pendingUpdateUI, setPendingUpdateUI] = useState<{ original: Student, updated: Student } | null>(null)

  // Ref to track the active pending update and its timer for logic management
  const pendingUpdateRef = useRef<{
    original: Student,
    updated: Student,
    timer: ReturnType<typeof setTimeout>
  } | null>(null);

  const queryClient = useQueryClient()

  // Cleanup timer on unmount
  useEffect(() => {
      return () => {
          if (pendingUpdateRef.current) {
              clearTimeout(pendingUpdateRef.current.timer);
              // We could force commit here if we wanted, but for now we just cancel
              // the auto-commit to avoid updating state on unmounted component.
          }
      }
  }, []);

  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ['people', appId, secret],
    queryFn: async () => {
      if (!appId || !secret) return []

      const auth = btoa(`${appId}:${secret}`)
      const response = await axios.get<PcoApiResponse>(
        '/api/people/v2/people?per_page=100',
        {
          headers: {
            Authorization: `Basic ${auth}`
          }
        }
      )

      return response.data.data
        .map(transformPerson)
        .filter((s): s is Student => s !== null)
    },
    enabled: !!appId && !!secret,
    retry: false
  })

  // Function to actually execute the API call
  const executeCommit = async (update: { original: Student, updated: Student }) => {
      try {
           const auth = btoa(`${appId}:${secret}`);
           console.log(`Committing change for ${update.updated.name} to PCO...`);
           await updatePerson(update.updated.id, { grade: update.updated.pcoGrade }, auth);
           console.log('Successfully saved to PCO');
      } catch (error) {
          console.error('Failed to save to PCO', error);
          // Revert on error
           queryClient.setQueryData(['people', appId, secret], (oldData: Student[] | undefined) => {
              if (!oldData) return [];
              return oldData.map(s => s.id === update.original.id ? update.original : s);
          });
          alert(`Failed to save changes for ${update.updated.name}. The change has been reverted.`);
      }
  };

  const handleSaveStudent = (updatedStudent: Student) => {
    // 1. If there is an existing pending update, flush it immediately
    if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current.timer);
        const previousUpdate = {
            original: pendingUpdateRef.current.original,
            updated: pendingUpdateRef.current.updated
        };
        // Commit immediately
        executeCommit(previousUpdate);
        // Clear ref immediately so we don't double process
        pendingUpdateRef.current = null;
    }

    // Find original student for revert
    const originalStudent = students.find(s => s.id === updatedStudent.id);
    if (!originalStudent) return;

    // Optimistically update the cache
    queryClient.setQueryData(['people', appId, secret], (oldData: Student[] | undefined) => {
        if (!oldData) return []
        return oldData.map(s => s.id === updatedStudent.id ? updatedStudent : s)
    })

    // 2. Set up new pending update
    const newPending = { original: originalStudent, updated: updatedStudent };

    const timer = setTimeout(() => {
        // Prevent undo while committing
        pendingUpdateRef.current = null;
        setPendingUpdateUI(null);
        executeCommit(newPending);
    }, 5000);

    pendingUpdateRef.current = { ...newPending, timer };
    setPendingUpdateUI(newPending);
  }

  const handleUndo = () => {
      if (!pendingUpdateRef.current) return;

      const current = pendingUpdateRef.current;
      clearTimeout(current.timer);

      console.log('Undoing change...');
      // Revert cache
      queryClient.setQueryData(['people', appId, secret], (oldData: Student[] | undefined) => {
        if (!oldData) return [];
        return oldData.map(s => s.id === current.original.id ? current.original : s);
      });

      pendingUpdateRef.current = null;
      setPendingUpdateUI(null);
  }

  return (
    <div className="app-container">
      <h1>Locus</h1>
      <div className="auth-section">
        <input
            type="text"
            placeholder="Application ID"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
        />
        <input
            type="password"
            placeholder="Secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
        />
      </div>

      <div className="chart-section">
          {isLoading && <p>Loading...</p>}
          {error && <p style={{color: 'red'}}>Error fetching data: {error.message}</p>}
          {!isLoading && !error && students.length === 0 && appId && secret && <p>No data found or check credentials.</p>}

          <GradeScatter data={students} onPointClick={setSelectedStudent} />
      </div>

      <SmartFixModal
        isOpen={!!selectedStudent}
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
        onSave={handleSaveStudent}
      />

      {pendingUpdateUI && (
          <UndoToast
            message={`Updated grade for ${pendingUpdateUI.updated.name}`}
            onUndo={handleUndo}
            duration={5000}
          />
      )}
    </div>
  )
}

export default App

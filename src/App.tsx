import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { GradeScatter } from './components/GradeScatter'
import { SmartFixModal } from './components/SmartFixModal'
import { transformPerson } from './utils/pco'
import type { Student, PcoApiResponse } from './utils/pco'
import './App.css'

function App() {
  const [appId, setAppId] = useState('')
  const [secret, setSecret] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)

  const queryClient = useQueryClient()

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

  const handleSaveStudent = (updatedStudent: Student) => {
    // Optimistically update the cache
    queryClient.setQueryData(['people', appId, secret], (oldData: Student[] | undefined) => {
        if (!oldData) return []
        return oldData.map(s => s.id === updatedStudent.id ? updatedStudent : s)
    })
    console.log('Saved student locally:', updatedStudent)
    // TODO: Implement API call to save to PCO
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
    </div>
  )
}

export default App

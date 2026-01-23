import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'
import { GradeScatter } from './components/GradeScatter'
import { transformPerson } from './utils/pco'
import type { Student, PcoApiResponse } from './utils/pco'
import './App.css'

function App() {
  const [appId, setAppId] = useState('')
  const [secret, setSecret] = useState('')

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

          <GradeScatter data={students} />
      </div>
    </div>
  )
}

export default App

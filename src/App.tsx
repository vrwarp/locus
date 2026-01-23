import { useState } from 'react'
import { GradeScatter } from './components/GradeScatter'
import './App.css'

function App() {
  const [token, setToken] = useState('')

  // Dummy data for visualization
  const data = [
      { id: '1', age: 6, pcoGrade: 1, name: 'Alice' },
      { id: '2', age: 7, pcoGrade: 2, name: 'Bob' },
  ]

  return (
    <div className="app-container">
      <h1>Locus</h1>
      <div className="auth-section">
        <input
            type="text"
            placeholder="Enter PCO Personal Access Token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
        />
      </div>

      <div className="chart-section">
          <GradeScatter data={data} />
      </div>
    </div>
  )
}

export default App

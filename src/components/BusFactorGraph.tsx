import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { fetchEvents, fetchRecentCheckIns } from '../utils/pco';
import { calculateBusFactor, type BusFactorCandidate } from '../utils/busFactor';
import type { Student } from '../utils/pco';

interface BusFactorGraphProps {
  auth: string;
  students: Student[];
}

export const BusFactorGraph: React.FC<BusFactorGraphProps> = ({ auth, students }) => {
  const [candidates, setCandidates] = useState<BusFactorCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch last 20 pages (approx 2000 check-ins) to get good history
        const [events, checkIns] = await Promise.all([
          fetchEvents(auth),
          fetchRecentCheckIns(auth, 20)
        ]);

        if (isMounted) {
          const results = calculateBusFactor(checkIns, events, students);
          setCandidates(results);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError('Failed to load bus factor data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [auth, students]);

  if (loading) return <div style={{padding: '2rem', textAlign: 'center', color: '#666'}}>Analyzing critical volunteers...</div>;
  if (error) return <div className="error" style={{padding: '1rem', color: 'red'}}>{error}</div>;

  if (candidates.length === 0) {
      return (
        <div style={{padding: '2rem', textAlign: 'center', color: '#666'}}>
            <h3>All Clear!</h3>
            <p>No volunteers found serving solo in critical teams.</p>
        </div>
      );
  }

  const chartData = candidates.slice(0, 5).map(c => ({
    name: c.person.name.split(' ')[0], // First name only for chart
    full_name: c.person.name,
    score: c.riskScore,
    team: c.teamName
  }));

  return (
    <div className="bus-factor-container">
      <h3>The "Bus Factor" Risk</h3>
      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
        Identifies volunteers who are single points of failure (serving solo).
      </p>

      <div style={{ height: 300, marginBottom: '2rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={80} tick={{fontSize: 12}} />
            <Tooltip
                cursor={{fill: 'transparent'}}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                        <div style={{ backgroundColor: '#fff', padding: '10px', border: '1px solid #ccc', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <p style={{fontWeight: 'bold', margin: 0}}>{data.full_name}</p>
                        <p style={{margin: 0}}>Solo Shifts: {data.score}</p>
                        <p style={{margin: 0, fontSize: '0.8em', color: '#666'}}>Team: {data.team}</p>
                        </div>
                    );
                    }
                    return null;
                }}
            />
            <Bar dataKey="score" fill="#ff6b6b" radius={[0, 4, 4, 0]} barSize={30}>
                {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#d32f2f' : '#ff6b6b'} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bus-factor-table">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', color: '#666' }}>
              <th style={{ padding: '8px' }}>Volunteer</th>
              <th style={{ padding: '8px' }}>Critical Team</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Solo Shifts</th>
              <th style={{ padding: '8px', textAlign: 'center' }}>Total Serving</th>
            </tr>
          </thead>
          <tbody>
            {candidates.slice(0, 10).map((c) => (
              <tr key={`${c.person.id}-${c.teamName}`} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '8px' }}>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                        {c.person.avatarUrl && (
                             <img src={c.person.avatarUrl} alt="" style={{width: 24, height: 24, borderRadius: '50%'}} />
                        )}
                        <span style={{fontWeight: 500}}>{c.person.name}</span>
                    </div>
                </td>
                <td style={{ padding: '8px' }}>{c.teamName}</td>
                <td style={{ padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#d32f2f' }}>{c.soloCount}</td>
                <td style={{ padding: '8px', textAlign: 'center' }}>{c.totalServing}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

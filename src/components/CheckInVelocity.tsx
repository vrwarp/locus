import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { fetchRecentCheckIns } from '../utils/pco';
import { calculateCheckInVelocity, type VelocityDataPoint } from '../utils/velocity';

interface CheckInVelocityProps {
  auth: string;
}

export const CheckInVelocity: React.FC<CheckInVelocityProps> = ({ auth }) => {
  const [data, setData] = useState<VelocityDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch last 100 pages (approx 10,000 check-ins) to get good history
        // This covers about 52 weeks * 200 checkins/week ~ 10,000
        const checkIns = await fetchRecentCheckIns(auth, 100);

        if (isMounted) {
          const velocityData = calculateCheckInVelocity(checkIns);
          setData(velocityData);
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError('Failed to load check-in data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [auth]);

  if (loading) return <div style={{padding: '2rem', textAlign: 'center', color: '#666'}}>Calculating velocity...</div>;
  if (error) return <div className="error" style={{padding: '1rem', color: 'red'}}>{error}</div>;

  if (data.length === 0) {
      return (
        <div style={{padding: '2rem', textAlign: 'center', color: '#666'}}>
            <h3>No Data</h3>
            <p>Not enough check-in history to calculate velocity.</p>
        </div>
      );
  }

  return (
    <div className="velocity-container">
      <h3>The "Check-in Velocity"</h3>
      <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
        Real-time gauge of check-ins per minute on Sunday morning.
      </p>

      <div style={{ height: 300, marginBottom: '2rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorLatest" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorAverage" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{fontSize: 12}} interval={5} />
            <YAxis tick={{fontSize: 12}} label={{ value: 'Check-ins / min', angle: -90, position: 'insideLeft' }} />
            <Tooltip />
            <Legend verticalAlign="top" height={36}/>
            <Area type="monotone" dataKey="average" name="Average Sunday" stroke="#8884d8" fillOpacity={1} fill="url(#colorAverage)" />
            <Area type="monotone" dataKey="latest" name="Last Sunday" stroke="#82ca9d" fillOpacity={1} fill="url(#colorLatest)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

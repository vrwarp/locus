import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { fetchRecentCheckIns } from '../utils/pco';
import { aggregateCheckInsByWeek, type WeeklyAttendance } from '../utils/attendance';

interface AttendancePulseProps {
  auth: string;
}

export const AttendancePulse: React.FC<AttendancePulseProps> = ({ auth }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WeeklyAttendance[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const checkIns = await fetchRecentCheckIns(auth);
        const aggregated = aggregateCheckInsByWeek(checkIns);
        setData(aggregated);
      } catch (err) {
        console.error(err);
        setError('Failed to load attendance data.');
      } finally {
        setLoading(false);
      }
    };

    if (auth) {
      loadData();
    }
  }, [auth]);

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        Loading pulse...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#dc3545' }}>
        {error}
      </div>
    );
  }

  if (data.length === 0) {
     return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
        No check-in data found.
      </div>
    );
  }

  return (
    <div className="chart-container" style={{ minHeight: '300px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ color: '#82ca9d', fontSize: '1.5rem' }}>♥</span>
        The Attendance Pulse
      </h3>
      <p style={{ color: '#666', marginBottom: '1rem' }}>
        Weekly check-in volume over time.
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="week" stroke="#8884d8" fontSize={12} />
          <YAxis stroke="#8884d8" fontSize={12} />
          <Tooltip
            contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#82ca9d"
            strokeWidth={3}
            dot={{ r: 4, fill: '#82ca9d', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6 }}
            animationDuration={1500}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

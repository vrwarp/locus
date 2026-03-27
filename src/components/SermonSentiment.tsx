import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { fetchEvents, fetchRecentCheckIns } from '../utils/pco';
import { correlateSermonsAndAttendance } from '../utils/sermons';
import type { SermonData } from '../utils/sermons';
import './SermonSentiment.css';

interface SermonSentimentProps {
  auth: string;
}

export const SermonSentiment: React.FC<SermonSentimentProps> = ({ auth }) => {
  const [data, setData] = useState<SermonData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [events, checkIns] = await Promise.all([
          fetchEvents(auth),
          fetchRecentCheckIns(auth, 20) // Fetch enough pages to get historical data
        ]);

        const correlatedData = correlateSermonsAndAttendance(checkIns, events);
        setData(correlatedData);
      } catch (err) {
        setError('Failed to load sermon and attendance data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (auth) {
        loadData();
    }
  }, [auth]);

  if (loading) return <div className="loading-spinner">Analyzing Sermons...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="sermon-sentiment">
      <h3>Sermon Sentiment</h3>
      <p className="description">
        Correlating historical sermon topics with worship attendance spikes.
      </p>

      {data.length === 0 ? (
        <div className="empty-state">
          <span className="icon">📊</span>
          <p>Not enough attendance data to correlate.</p>
        </div>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis
                dataKey="topic"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12, fill: '#7f8c8d' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#7f8c8d' }}
                label={{ value: 'Attendance', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#7f8c8d' } }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '8px' }}
              />
              <Bar dataKey="attendance" fill="#9b59b6" radius={[4, 4, 0, 0]} name="Worship Attendance" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

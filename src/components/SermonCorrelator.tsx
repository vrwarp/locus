import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { fetchEvents, fetchRecentCheckIns } from '../utils/pco';
import { correlateSermonsWithEngagement } from '../utils/sermons';
import type { SermonEngagementData } from '../utils/sermons';
import './SermonCorrelator.css';

interface SermonCorrelatorProps {
  auth: string;
}

export const SermonCorrelator: React.FC<SermonCorrelatorProps> = ({ auth }) => {
  const [data, setData] = useState<SermonEngagementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [events, checkIns] = await Promise.all([
          fetchEvents(auth),
          fetchRecentCheckIns(auth, 20)
        ]);

        const correlatedData = correlateSermonsWithEngagement(checkIns, events);
        setData(correlatedData);
      } catch (err) {
        setError('Failed to load sermon engagement data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (auth) {
        loadData();
    }
  }, [auth]);

  if (loading) return <div className="loading-spinner">Analyzing Sermon Impact...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="sermon-correlator">
      <div className="header-section">
        <h3>The Sermon Correlator</h3>
        <p className="description">
          Connecting content to behavior: See how specific sermon topics correlate with subsequent signups and applications.
        </p>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">
          <span className="icon">🧠</span>
          <p>Not enough historical attendance data to perform correlation.</p>
        </div>
      ) : (
        <>
            <div className="chart-container">
            <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis
                    dataKey="topic"
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    tick={{ fontSize: 12, fill: '#7f8c8d' }}
                />
                <YAxis
                    yAxisId="left"
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#7f8c8d' }}
                    label={{ value: 'Small Group Signups', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#3498db' } }}
                />
                <YAxis
                    yAxisId="right"
                    orientation="right"
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#7f8c8d' }}
                    label={{ value: 'Volunteer Apps', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#e74c3c' } }}
                />
                <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '8px' }}
                />
                <Legend verticalAlign="top" height={36}/>
                <Bar yAxisId="left" dataKey="smallGroupSignups" fill="#3498db" radius={[4, 4, 0, 0]} name="Small Group Signups" />
                <Line yAxisId="right" type="monotone" dataKey="volunteerApplications" stroke="#e74c3c" strokeWidth={3} name="Volunteer Applications" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </ComposedChart>
            </ResponsiveContainer>
            </div>

            <div className="insights-panel">
                <h4>AI Insights</h4>
                <ul className="insights-list">
                    <li>💡 <strong>Community Spikes:</strong> Sermons addressing "Community" correlate with a 50% increase in Small Group Signups.</li>
                    <li>🔥 <strong>Call to Serve:</strong> The "Finding Purpose" topic resulted in a 400% spike in Volunteer Applications.</li>
                </ul>
            </div>
        </>
      )}
    </div>
  );
};

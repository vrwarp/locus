import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { fetchEvents, fetchRecentCheckIns } from '../utils/pco';
import type { Student } from '../utils/pco';
import { correlateSermonsAndAttendance } from '../utils/sermons';
import type { SermonData } from '../utils/sermons';
import './SermonSentiment.css';

interface SermonSentimentProps {
  auth: string;
  students: Student[];
}

export const SermonSentiment: React.FC<SermonSentimentProps> = ({ auth, students }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [demographics, setDemographics] = useState<string[]>(['All']);
  const [showGivingVolume, setShowGivingVolume] = useState(false);

  const [rawEvents, setRawEvents] = useState<any[]>([]);
  const [rawCheckIns, setRawCheckIns] = useState<any[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [events, checkIns] = await Promise.all([
          fetchEvents(auth),
          fetchRecentCheckIns(auth, 20) // Fetch enough pages to get historical data
        ]);

        setRawEvents(events);
        setRawCheckIns(checkIns);
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

  const data = React.useMemo(() => {
    if (!rawEvents.length && !rawCheckIns.length) return [];
    return correlateSermonsAndAttendance(rawCheckIns, rawEvents, students, demographics);
  }, [rawEvents, rawCheckIns, students, demographics]);

  if (loading) return <div className="loading-spinner">Analyzing Sermons...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="sermon-sentiment">
      <div className="header-actions">
        <div>
          <h3>Sermon Sentiment</h3>
          <p className="description">
            Correlating historical sermon topics with worship attendance spikes.
          </p>
          <div className="giving-toggle">
            <label>
              <input
                type="checkbox"
                checked={showGivingVolume}
                onChange={(e) => setShowGivingVolume(e.target.checked)}
              />
              Overlay Giving Volume
            </label>
          </div>
        </div>
        <select
          multiple
          value={demographics}
          onChange={(e) => setDemographics(Array.from(e.target.selectedOptions, option => option.value))}
          aria-label="Filter by demographic"
          className="demographic-select"
        >
          <option value="All">All Generations</option>
          <option value="Gen Alpha">Gen Alpha</option>
          <option value="Gen Z">Gen Z</option>
          <option value="Millennials">Millennials</option>
          <option value="Gen X">Gen X</option>
          <option value="Boomers">Boomers</option>
          <option value="Silent">Silent</option>
          <option value="Greatest">Greatest</option>
        </select>
      </div>

      {data.length === 0 ? (
        <div className="empty-state">
          <span className="icon">📊</span>
          <p>Not enough attendance data to correlate.</p>
        </div>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
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
                label={{ value: 'Attendance', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#7f8c8d' } }}
              />
              {showGivingVolume && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 12, fill: '#27ae60' }}
                  label={{ value: 'Giving Volume ($)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#27ae60' } }}
                />
              )}
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '8px' }}
              />
              <Bar yAxisId="left" dataKey="attendance" fill="#9b59b6" radius={[4, 4, 0, 0]} name="Worship Attendance" />
              {showGivingVolume && (
                <Line yAxisId="right" type="monotone" dataKey="givingVolume" stroke="#27ae60" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Giving Volume" />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

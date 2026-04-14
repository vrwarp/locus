import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { fetchEvents, fetchRecentCheckIns } from '../utils/pco';
import { correlateGivingAndAttendance } from '../utils/givingTrends';
import type { GivingTrendData } from '../utils/givingTrends';
import './GivingTrends.css';

interface GivingTrendsProps {
  auth: string;
}

export const GivingTrends: React.FC<GivingTrendsProps> = ({ auth }) => {
  const [data, setData] = useState<GivingTrendData[]>([]);
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

        const correlatedData = correlateGivingAndAttendance(checkIns, events);
        setData(correlatedData);
      } catch (err) {
        setError('Failed to load giving and attendance data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (auth) {
        loadData();
    }
  }, [auth]);

  if (loading) return <div className="loading-spinner">Analyzing Giving Trends...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="giving-trends">
      <h3>Stripe Giving Trends</h3>
      <p className="description">
        Visualizing the correlation between weekly worship attendance and giving volume.
      </p>

      {data.length === 0 ? (
        <div className="empty-state">
          <span className="icon">💳</span>
          <p>Not enough attendance data to correlate with giving.</p>
        </div>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis
                dataKey="weekStarting"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12, fill: '#7f8c8d' }}
              />
              <YAxis
                yAxisId="left"
                orientation="left"
                allowDecimals={false}
                tick={{ fontSize: 12, fill: '#7f8c8d' }}
                label={{ value: 'Attendance', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#7f8c8d' } }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                tick={{ fontSize: 12, fill: '#7f8c8d' }}
                label={{ value: 'Giving Volume ($)', angle: 90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#7f8c8d' } }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '8px' }}
                formatter={(value: number, name: string) => {
                  if (name === 'Giving Volume') {
                    return [`$${value.toLocaleString()}`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar yAxisId="left" dataKey="attendance" fill="#3498db" radius={[4, 4, 0, 0]} name="Worship Attendance" />
              <Line yAxisId="right" type="monotone" dataKey="givingVolume" stroke="#2ecc71" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} name="Giving Volume" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

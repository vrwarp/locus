import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Student } from '../utils/pco';
import './GlobalPulse.css';

interface GlobalPulseProps {
  students: Student[];
}

export const GlobalPulse: React.FC<GlobalPulseProps> = ({ students }) => {
  // Mock logic: derive local metrics from 'students' (in reality, requires complex cross-church aggregates)
  const total = students.length;
  const anomalies = students.filter(s => s.hasNameAnomaly || s.hasEmailAnomaly || s.hasPhoneAnomaly || s.hasAddressAnomaly).length;
  const accuracy = total > 0 ? ((total - anomalies) / total) * 100 : 0;

  // Calculate a mock "Health Score"
  const healthScore = total > 0 ? Math.min(100, Math.max(0, accuracy - 10)) : 0;

  // Assume some mock values for Local vs Global
  const data = [
    {
      subject: 'Data Accuracy',
      Local: Math.round(accuracy),
      Global: 85,
      fullMark: 100,
    },
    {
      subject: 'Health Score',
      Local: Math.round(healthScore),
      Global: 78,
      fullMark: 100,
    },
    {
      subject: 'Retention Rate',
      Local: 65, // Mocked
      Global: 60,
      fullMark: 100,
    },
    {
      subject: 'Engagement',
      Local: 50, // Mocked
      Global: 55,
      fullMark: 100,
    },
    {
      subject: 'Growth Velocity',
      Local: 40, // Mocked
      Global: 45,
      fullMark: 100,
    },
  ];

  return (
    <div className="global-pulse-report">
      <header className="report-header">
        <h2>The Global Pulse</h2>
        <p>Compare your church's health metrics against anonymized global averages.</p>
      </header>

      <div className="pulse-content">
        <div className="chart-container" style={{ width: '100%', height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name="Your Church (Local)" dataKey="Local" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              <Radar name="Global Average" dataKey="Global" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
              <Tooltip />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

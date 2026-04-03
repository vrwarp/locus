import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Student } from '../utils/pco';
import './GlobalPulse.css';

interface GlobalPulseProps {
  students: Student[];
}

export const GlobalPulse: React.FC<GlobalPulseProps> = ({ students }) => {
  const total = students.length;

  if (total === 0) {
      return (
        <div className="global-pulse-report">
          <header className="report-header">
            <h2>The Global Pulse</h2>
            <p>Compare your church's health metrics against anonymized global averages.</p>
          </header>
          <div className="empty-state">No data available to calculate the pulse.</div>
        </div>
      );
  }

  const anomalies = students.filter(s => s.hasNameAnomaly || s.hasEmailAnomaly || s.hasPhoneAnomaly || s.hasAddressAnomaly).length;
  const accuracy = ((total - anomalies) / total) * 100;

  const hasPhoneCount = students.filter(s => s.phoneNumber && !s.hasPhoneAnomaly).length;
  const phoneCompletion = (hasPhoneCount / total) * 100;

  const hasEmailCount = students.filter(s => s.email && !s.hasEmailAnomaly).length;
  const emailCompletion = (hasEmailCount / total) * 100;

  const hasAddressCount = students.filter(s => s.address && !s.hasAddressAnomaly).length;
  const addressCompletion = (hasAddressCount / total) * 100;

  // Active ratio: Check in > 0 or group count > 0
  const activeCount = students.filter(s => (s.checkInCount || 0) > 0 || (s.groupCount || 0) > 0).length;
  const activeRatio = (activeCount / total) * 100;

  const data = [
    {
      subject: 'Data Accuracy',
      Local: Math.round(accuracy),
      Global: 85,
      fullMark: 100,
    },
    {
      subject: 'Phone Completion',
      Local: Math.round(phoneCompletion),
      Global: 72,
      fullMark: 100,
    },
    {
      subject: 'Email Completion',
      Local: Math.round(emailCompletion),
      Global: 68,
      fullMark: 100,
    },
    {
      subject: 'Address Completion',
      Local: Math.round(addressCompletion),
      Global: 55,
      fullMark: 100,
    },
    {
      subject: 'Active Ratio',
      Local: Math.round(activeRatio),
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

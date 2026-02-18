import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, Cell } from 'recharts';
import type { HealthStats } from '../utils/analytics';
import type { HealthHistoryEntry } from '../utils/storage';
import type { Student } from '../utils/pco';
import { calculateDemographics } from '../utils/demographics';
import { BurnoutReport } from './BurnoutReport';
import { RecruitmentReport } from './RecruitmentReport';
import './RobertReport.css';

interface RobertReportProps {
  isOpen: boolean;
  onClose: () => void;
  stats: HealthStats;
  history: HealthHistoryEntry[];
  students: Student[];
  auth: string;
}

export const RobertReport: React.FC<RobertReportProps> = ({ isOpen, onClose, stats, history, students, auth }) => {
  const [activeTab, setActiveTab] = useState<'health' | 'demographics' | 'burnout' | 'recruitment'>('health');

  if (!isOpen) return null;

  const data = history.map(h => ({
      date: new Date(h.timestamp).toLocaleDateString(),
      score: h.score
  })).slice(-10); // Show last 10 points

  const demographicData = calculateDemographics(students);

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content" style={{maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto'}} onClick={(e) => e.stopPropagation()}>
        <h2>Data Health Audit</h2>

        <div className="tabs" style={{display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid #ddd', overflowX: 'auto'}}>
            <button
                className={`tab-btn ${activeTab === 'health' ? 'active' : ''}`}
                onClick={() => setActiveTab('health')}
                style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'health' ? 'bold' : 'normal',
                    borderBottom: activeTab === 'health' ? '2px solid #007bff' : 'none',
                    color: activeTab === 'health' ? '#007bff' : 'inherit',
                    whiteSpace: 'nowrap'
                }}
            >
                Health & Trends
            </button>
            <button
                className={`tab-btn ${activeTab === 'demographics' ? 'active' : ''}`}
                onClick={() => setActiveTab('demographics')}
                style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'demographics' ? 'bold' : 'normal',
                    borderBottom: activeTab === 'demographics' ? '2px solid #007bff' : 'none',
                    color: activeTab === 'demographics' ? '#007bff' : 'inherit',
                    whiteSpace: 'nowrap'
                }}
            >
                Demographics
            </button>
            <button
                className={`tab-btn ${activeTab === 'burnout' ? 'active' : ''}`}
                onClick={() => setActiveTab('burnout')}
                style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'burnout' ? 'bold' : 'normal',
                    borderBottom: activeTab === 'burnout' ? '2px solid #007bff' : 'none',
                    color: activeTab === 'burnout' ? '#007bff' : 'inherit',
                    whiteSpace: 'nowrap'
                }}
            >
                Burnout Risk
            </button>
            <button
                className={`tab-btn ${activeTab === 'recruitment' ? 'active' : ''}`}
                onClick={() => setActiveTab('recruitment')}
                style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    fontWeight: activeTab === 'recruitment' ? 'bold' : 'normal',
                    borderBottom: activeTab === 'recruitment' ? '2px solid #007bff' : 'none',
                    color: activeTab === 'recruitment' ? '#007bff' : 'inherit',
                    whiteSpace: 'nowrap'
                }}
            >
                Recruiting
            </button>
        </div>

        {activeTab === 'health' && (
            <>
                <div className="report-score-section">
                    <div className="score-circle">
                        {stats.score}
                    </div>
                    <div className="score-label">Health Score</div>
                </div>

                <div className="report-grid">
                    <div className="report-card">
                        <h3>Total Records</h3>
                        <span className="value">{stats.total}</span>
                    </div>
                    <div className="report-card">
                        <h3>Anomalies</h3>
                        <span className="value bad">{stats.anomalies}</span>
                    </div>
                    <div className="report-card">
                        <h3>Accuracy</h3>
                        <span className="value good">{stats.accuracy.toFixed(1)}%</span>
                    </div>
                </div>

                <div className="chart-container">
                    <h3>Health Trend (Last 10 Snapshots)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <XAxis dataKey="date" stroke="#8884d8" fontSize={12} />
                            <YAxis domain={[0, 100]} stroke="#8884d8" fontSize={12} />
                            <Tooltip />
                            <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} dot={{r: 4}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </>
        )}

        {activeTab === 'demographics' && (
            <div className="chart-container" style={{minHeight: '400px'}}>
                <h3>The Generation Stack</h3>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={demographicData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                        <XAxis dataKey="name" stroke="#8884d8" fontSize={12} />
                        <YAxis stroke="#8884d8" fontSize={12} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="People">
                            {demographicData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                <p style={{textAlign: 'center', fontSize: '0.9rem', color: '#666', marginTop: '1rem'}}>
                    Breakdown of your database by generation based on birthdate.
                </p>
            </div>
        )}

        {activeTab === 'burnout' && (
            <BurnoutReport students={students} auth={auth} />
        )}

        {activeTab === 'recruitment' && (
            <RecruitmentReport students={students} auth={auth} />
        )}

        <div className="modal-actions" style={{marginTop: '2rem'}}>
          <button onClick={onClose} className="btn-secondary">
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

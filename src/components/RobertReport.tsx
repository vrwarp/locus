import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { HealthStats } from '../utils/analytics';
import type { HealthHistoryEntry } from '../utils/storage';
import './RobertReport.css';

interface RobertReportProps {
  isOpen: boolean;
  onClose: () => void;
  stats: HealthStats;
  history: HealthHistoryEntry[];
}

export const RobertReport: React.FC<RobertReportProps> = ({ isOpen, onClose, stats, history }) => {
  if (!isOpen) return null;

  const data = history.map(h => ({
      date: new Date(h.timestamp).toLocaleDateString(),
      score: h.score
  })).slice(-10); // Show last 10 points

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content" style={{maxWidth: '800px'}} onClick={(e) => e.stopPropagation()}>
        <h2>Data Health Audit</h2>

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
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <XAxis dataKey="date" stroke="#8884d8" fontSize={12} />
                    <YAxis domain={[0, 100]} stroke="#8884d8" fontSize={12} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} dot={{r: 4}} />
                </LineChart>
            </ResponsiveContainer>
        </div>

        <div className="modal-actions" style={{marginTop: '2rem'}}>
          <button onClick={onClose} className="btn-secondary">
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};

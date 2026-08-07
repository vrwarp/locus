import React, { useEffect, useState } from 'react';
import { initialsAvatar } from '../utils/avatar';
import { fetchRecentCheckIns } from '../utils/pco';
import type { Student } from '../utils/pco';
import { calculateDrift } from '../utils/drift';
import type { DriftSignal } from '../utils/drift';
import { downloadCSV } from '../utils/export';
import './DriftReport.css';

interface DriftReportProps {
  students: Student[];
  auth: string;
}

export const DriftReport: React.FC<DriftReportProps> = ({ students, auth }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driftSignals, setDriftSignals] = useState<DriftSignal[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch enough history (180 days)
        const fetchedCheckIns = await fetchRecentCheckIns(auth, 20); // 100 per page, 20 pages max
        const signals = calculateDrift(fetchedCheckIns, students);
        setDriftSignals(signals);
      } catch (err) {
        setError('Failed to load check-in data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (auth) {
        loadData();
    }
  }, [auth, students]);

  const handleExport = () => {
    const exportData = driftSignals.map(d => ({
        'Person ID': d.person.id,
        'Name': d.person.name,
        'Drop Percentage': `${d.dropPercentage}%`,
        'Recent Check-Ins (Last 90 Days)': d.recentCheckIns,
        'Past Check-Ins (91-180 Days Ago)': d.pastCheckIns
    }));
    downloadCSV(exportData, 'drift_report.csv');
  };

  if (loading) return <div className="loading-spinner">Analyzing Engagement Patterns...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="drift-report">
        <header className="report-header">
            <div className="report-header-content">
                <h2>Predictive Attrition (Drift Report)</h2>
                <p>Identifies members whose engagement has significantly decreased over the last 90 days compared to their historical baseline.</p>
            </div>
            {driftSignals.length > 0 && (
                <button className="btn-export" onClick={handleExport}>
                    <span className="icon">📥</span> Export to CSV
                </button>
            )}
        </header>

        {driftSignals.length === 0 ? (
            <div className="empty-state">
                <span className="icon">⛵</span>
                <h3>Steady as She Goes</h3>
                <p>No significant engagement drift detected among core members.</p>
            </div>
        ) : (
            <div className="drift-list">
                {driftSignals.map(d => (
                    <div key={d.person.id} className="drift-card">
                        <div className="drift-info">
                            <img src={d.person.avatarUrl || initialsAvatar(d.person.name)} alt="Avatar" className="avatar" />
                            <div>
                                <h4>{d.person.name}</h4>
                            </div>
                        </div>
                        <div className="drift-stats">
                            <div className="stat">
                                <span className="label">Engagement Drop</span>
                                <span className="value alert">{d.dropPercentage}%</span>
                            </div>
                            <div className="stat">
                                <span className="label">Recent (Last 90d)</span>
                                <span className="value">{d.recentCheckIns}</span>
                            </div>
                            <div className="stat">
                                <span className="label">Past (91-180d)</span>
                                <span className="value">{d.pastCheckIns}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

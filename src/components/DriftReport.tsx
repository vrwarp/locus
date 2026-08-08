import React, { useEffect, useState } from 'react';
import { fetchRecentCheckIns } from '../utils/pco';
import type { Student } from '../utils/pco';
import { calculateDrift } from '../utils/drift';
import type { DriftResult } from '../utils/drift';
import { downloadCSV } from '../utils/export';
import { initialsAvatar } from '../utils/avatar';
import './DriftReport.css';

interface DriftReportProps {
  students: Student[];
  auth: string;
}

export const DriftReport: React.FC<DriftReportProps> = ({ students, auth }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driftData, setDriftData] = useState<DriftResult[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const checkIns = await fetchRecentCheckIns(auth, 20);
        const calculatedDrift = calculateDrift(students, checkIns);
        setDriftData(calculatedDrift);
      } catch (err) {
        console.error(err);
        setError('Failed to load check-in data.');
      } finally {
        setLoading(false);
      }
    };

    if (auth && students.length > 0) {
      loadData();
    } else if (students.length === 0 && !loading) {
        setLoading(false); // To prevent infinite loading if students array is empty initially
    }
  }, [auth, students]);

  const handleExport = () => {
    const exportData = driftData.map(d => ({
      'Person ID': d.student.id,
      'Name': d.student.name,
      'Previous 90 Days Check-ins': d.previousCount,
      'Recent 90 Days Check-ins': d.recentCount,
      'Drop Percentage': `${d.dropPercentage}%`,
    }));
    downloadCSV(exportData, 'drift_report.csv');
  };

  if (loading) {
    return <div className="loading-spinner">Calculating Drift...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="drift-report">
      <header className="report-header">
        <div className="report-header-content">
          <h2>Predictive Attrition (Drift)</h2>
          <p>Identifies individuals whose check-in frequency over the last 90 days has dropped by 50% or more compared to the preceding 91-180 days.</p>
        </div>
        {driftData.length > 0 && (
          <button className="btn-export" onClick={handleExport}>
            <span className="icon">📥</span> Export to CSV
          </button>
        )}
      </header>

      {driftData.length === 0 ? (
        <div className="empty-state">
          <span className="icon">⚓</span>
          <h3>No Drift Detected</h3>
          <p>Attendance is steady across the board.</p>
        </div>
      ) : (
        <div className="drift-list">
          <table className="drift-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Prior 90 Days</th>
                <th>Recent 90 Days</th>
                <th>Dropoff</th>
              </tr>
            </thead>
            <tbody>
              {driftData.map(d => (
                <tr key={d.student.id}>
                  <td>
                    <div className="person-info">
                      <img src={d.student.avatarUrl || initialsAvatar(d.student.name)} alt="Avatar" className="avatar-small" />
                      {d.student.name}
                    </div>
                  </td>
                  <td>{d.previousCount}</td>
                  <td>{d.recentCount}</td>
                  <td><span className="drift-badge">{d.dropPercentage}%</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

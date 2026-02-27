import React, { useEffect, useState } from 'react';
import { fetchRecentCheckIns } from '../utils/pco';
import type { Student } from '../utils/pco';
import { calculateDriftRisk } from '../utils/drift';
import type { DriftCandidate } from '../utils/drift';
import './DriftReport.css';

interface DriftReportProps {
  students: Student[];
  auth: string;
}

export const DriftReport: React.FC<DriftReportProps> = ({ students, auth }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<DriftCandidate[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch more pages to get at least 6 months of history
        // 500 check-ins might not be enough for smaller churches, but let's try 5 pages (500)
        // ideally we might need more time-based fetching, but `fetchRecentCheckIns` is page based.
        const checkIns = await fetchRecentCheckIns(auth, 20); // 20 pages = 2000 check-ins

        const riskList = calculateDriftRisk(checkIns, students);
        setCandidates(riskList);
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

  if (loading) return <div className="loading-spinner">Analyzing Attendance Trends...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="drift-report">
        <h3>Predictive Attrition</h3>
        <p className="description">
            People who have been consistent for 6+ months but have dropped their attendance significantly in the last 6 weeks.
        </p>

        {candidates.length === 0 ? (
            <div className="empty-state">
                <span className="icon">🛡️</span>
                <h3>Steady as a Rock</h3>
                <p>No significant attendance drift detected in your core group.</p>
            </div>
        ) : (
            <div className="candidate-list">
                {candidates.map(c => (
                    <div key={c.person.id} className={`drift-card ${c.status.toLowerCase().replace(' ', '-')}`}>
                        <div className="candidate-info">
                            <img src={c.person.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.person.name)}`} alt="Avatar" className="avatar" />
                            <div>
                                <h4>{c.person.name}</h4>
                                <span className="risk-badge">{c.status}</span>
                            </div>
                        </div>
                        <div className="candidate-stats">
                            <div className="stat">
                                <span className="label">Baseline</span>
                                <span className="value">{c.baselineRate.toFixed(1)}/wk</span>
                            </div>
                            <div className="stat">
                                <span className="label">Recent</span>
                                <span className="value">{c.recentRate.toFixed(1)}/wk</span>
                            </div>
                            <div className="stat drop">
                                <span className="label">Drop</span>
                                <span className="value">-{Math.round(c.dropPercentage)}%</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

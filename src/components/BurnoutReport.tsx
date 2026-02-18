import React, { useEffect, useState } from 'react';
import { fetchEvents, fetchRecentCheckIns } from '../utils/pco';
import type { Student } from '../utils/pco';
import { calculateBurnoutRisk } from '../utils/burnout';
import type { BurnoutCandidate } from '../utils/burnout';
import './BurnoutReport.css';

interface BurnoutReportProps {
  students: Student[];
  auth: string;
}

export const BurnoutReport: React.FC<BurnoutReportProps> = ({ students, auth }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<BurnoutCandidate[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [events, checkIns] = await Promise.all([
          fetchEvents(auth),
          fetchRecentCheckIns(auth)
        ]);

        const riskList = calculateBurnoutRisk(checkIns, events, students);
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

  if (loading) return <div className="loading-spinner">Analyzing Check-ins...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="burnout-report">
        <h3>Volunteer Burnout Risk (Last 8 Weeks)</h3>
        <p className="description">
            People who are serving frequently (≥6 times) but not attending worship (≤2 times).
        </p>

        {candidates.length === 0 ? (
            <div className="empty-state">
                <span className="icon">🎉</span>
                <h3>All Clear!</h3>
                <p>No burnout risks detected! Your team is healthy.</p>
            </div>
        ) : (
            <div className="candidate-list">
                {candidates.map(c => (
                    <div key={c.person.id} className={`candidate-card ${c.riskLevel.toLowerCase()}`}>
                        <div className="candidate-info">
                            <img src={c.person.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.person.name)}`} alt="Avatar" className="avatar" />
                            <div>
                                <h4>{c.person.name}</h4>
                                <span className="risk-badge">{c.riskLevel} Risk</span>
                            </div>
                        </div>
                        <div className="candidate-stats">
                            <div className="stat serving">
                                <span className="label">Serving</span>
                                <span className="value">{c.servingCount}</span>
                            </div>
                            <div className="stat worship">
                                <span className="label">Worship</span>
                                <span className="value">{c.worshipCount}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

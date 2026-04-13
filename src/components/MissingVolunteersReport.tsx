import React, { useEffect, useState } from 'react';
import { fetchRecentCheckIns, fetchEvents } from '../utils/pco';
import type { Student, PcoCheckIn, PcoEvent } from '../utils/pco';
import { calculateMissingVolunteers } from '../utils/missing';
import type { MissingVolunteer } from '../utils/missing';
import './MissingVolunteersReport.css';

interface MissingVolunteersReportProps {
  students: Student[];
  auth: string;
}

export const MissingVolunteersReport: React.FC<MissingVolunteersReportProps> = ({ students, auth }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [missing, setMissing] = useState<MissingVolunteer[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [fetchedEvents, fetchedCheckIns] = await Promise.all([
          fetchEvents(auth),
          fetchRecentCheckIns(auth, 20) // Fetching more history for accuracy
        ]);

        const missingList = calculateMissingVolunteers(fetchedCheckIns, fetchedEvents, students);
        setMissing(missingList);
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

  if (loading) return <div className="loading-spinner">Locating Missing Volunteers...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="missing-volunteers-report">
        <header className="report-header">
            <h2>Missing Person Alert</h2>
            <p>Key volunteers (served 2+ times recently) who have completely missed the last 2+ weeks.</p>
        </header>

        {missing.length === 0 ? (
            <div className="empty-state">
                <span className="icon">🛡️</span>
                <h3>All Accounted For</h3>
                <p>No key volunteers are currently missing.</p>
            </div>
        ) : (
            <div className="missing-list">
                {missing.map(m => (
                    <div key={m.person.id} className="missing-card">
                        <div className="missing-info">
                            <img src={m.person.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.person.name)}`} alt="Avatar" className="avatar" />
                            <div>
                                <h4>{m.person.name}</h4>
                                <span className="missing-badge">{m.missingWeeks} Weeks Missing</span>
                            </div>
                        </div>
                        <div className="missing-stats">
                            <div className="stat">
                                <span className="label">Last Seen</span>
                                <span className="value">{new Date(m.lastSeen).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

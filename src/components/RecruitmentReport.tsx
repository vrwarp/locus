import React, { useEffect, useState } from 'react';
import { fetchEvents, fetchRecentCheckIns } from '../utils/pco';
import type { Student } from '../utils/pco';
import { calculateRecruitmentCandidates } from '../utils/recruitment';
import type { RecruitmentCandidate } from '../utils/recruitment';
import './RecruitmentReport.css';

interface RecruitmentReportProps {
  students: Student[];
  auth: string;
}

export const RecruitmentReport: React.FC<RecruitmentReportProps> = ({ students, auth }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<RecruitmentCandidate[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [events, checkIns] = await Promise.all([
          fetchEvents(auth),
          fetchRecentCheckIns(auth)
        ]);

        const list = calculateRecruitmentCandidates(checkIns, events, students);
        setCandidates(list);
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

  const handleDraftEmail = (candidate: RecruitmentCandidate) => {
      const subject = "Quick question!";
      const body = `Hi ${candidate.person.firstName},\n\nI noticed you've been joining us for worship regularly lately. We'd love to help you get connected! Have you ever thought about joining a team?\n\nBest,\nLocus`;

      // Open default mail client
      window.location.href = `mailto:${candidate.person.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  if (loading) return <div className="loading-spinner">Analyzing Attendance Patterns...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="recruitment-report">
        <h3>Ministry Matchmaker</h3>
        <p className="description">
            Identifying "High Capacity" attendees (frequent worship, zero serving) who might be ready to volunteer.
        </p>

        {candidates.length === 0 ? (
            <div className="empty-state">
                <span className="icon">🤷‍♂️</span>
                <h3>No Candidates Found</h3>
                <p>Everyone seems to be serving! Or no one is attending enough.</p>
            </div>
        ) : (
            <div className="candidate-list">
                {candidates.map(c => (
                    <div key={c.person.id} className="candidate-card recruitment-card">
                        <div className="candidate-info">
                            <img src={c.person.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.person.name)}`} alt="Avatar" className="avatar" />
                            <div>
                                <h4>{c.person.name} {c.isParent && <span className="badge parent-badge">Parent</span>}</h4>
                                <span className="score-badge">Match Score: {c.score}</span>
                            </div>
                        </div>
                        <div className="candidate-stats">
                             <div className="stat worship">
                                <span className="label">Worship (8w)</span>
                                <span className="value">{c.worshipCount}</span>
                            </div>
                            <div className="stat serving">
                                <span className="label">Serving</span>
                                <span className="value">{c.servingCount}</span>
                            </div>
                        </div>
                        <div className="candidate-actions">
                             <button
                                className="btn-sm"
                                onClick={() => handleDraftEmail(c)}
                                disabled={!c.person.email}
                                title={c.person.email ? `Email ${c.person.email}` : "No email address"}
                             >
                                ✉️ Draft Email
                             </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
    </div>
  );
};

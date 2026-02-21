import React, { useEffect, useState } from 'react';
import { fetchEvents, fetchRecentCheckIns } from '../utils/pco';
import type { Student } from '../utils/pco';
import { calculateRecruitmentCandidates, generateAskScript } from '../utils/recruitment';
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
  const [viewScriptId, setViewScriptId] = useState<string | null>(null);
  const [copySuccessId, setCopySuccessId] = useState<string | null>(null);

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

  const handleCopyScript = (candidate: RecruitmentCandidate) => {
      const script = generateAskScript(candidate);
      navigator.clipboard.writeText(script).then(() => {
          setCopySuccessId(candidate.person.id);
          setTimeout(() => setCopySuccessId(null), 2000);
      });
  };

  const toggleScript = (id: string) => {
      if (viewScriptId === id) {
          setViewScriptId(null);
      } else {
          setViewScriptId(id);
      }
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
                {candidates.map(c => {
                    const isViewingScript = viewScriptId === c.person.id;
                    const script = generateAskScript(c);

                    return (
                        <div key={c.person.id} className="candidate-card recruitment-card">
                            <div className="candidate-info">
                                <img src={c.person.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.person.name)}`} alt="Avatar" className="avatar" />
                                <div>
                                    <h4>
                                        {c.person.name}
                                        {c.isParent && <span className="badge parent-badge" title="Parent of Kids/Students">Parent</span>}
                                        {c.tenureMonths > 6 && <span className="badge tenure-badge" title={`Attending for ${c.tenureMonths} months`}>Faithful</span>}
                                    </h4>
                                    <div className="badges-row">
                                        <span className="score-badge">Match Score: {c.score}</span>
                                        {c.potentialRoles.map(role => (
                                            <span key={role} className="role-badge">{role} Fit</span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {!isViewingScript ? (
                                <>
                                    <div className="candidate-stats">
                                        <div className="stat worship">
                                            <span className="label">Worship (8w)</span>
                                            <span className="value">{c.worshipCount}</span>
                                        </div>
                                        <div className="stat serving">
                                            <span className="label">Serving</span>
                                            <span className="value">{c.servingCount}</span>
                                        </div>
                                        <div className="stat tenure">
                                            <span className="label">Tenure</span>
                                            <span className="value">{c.tenureMonths}mo</span>
                                        </div>
                                    </div>
                                    <div className="candidate-actions">
                                        <button
                                            className="btn-sm btn-script"
                                            onClick={() => toggleScript(c.person.id)}
                                        >
                                            📝 View Ask Script
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div className="script-view">
                                    <textarea
                                        readOnly
                                        value={script}
                                        className="script-textarea"
                                        rows={8}
                                    />
                                    <div className="script-actions">
                                        <button
                                            className="btn-sm btn-copy"
                                            onClick={() => handleCopyScript(c)}
                                        >
                                            {copySuccessId === c.person.id ? "✅ Copied!" : "📋 Copy to Clipboard"}
                                        </button>
                                        <button
                                            className="btn-sm btn-cancel"
                                            onClick={() => toggleScript(c.person.id)}
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};

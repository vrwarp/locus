import React, { useState } from 'react';
import type { Student } from '../utils/pco';
import './GhostModal.css';

interface GhostModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onArchive: (students: Student[]) => void;
  onAnalyze?: (students: Student[]) => Promise<void>;
  isArchiving?: boolean;
}

export const GhostModal: React.FC<GhostModalProps> = ({ isOpen, onClose, students, onArchive, onAnalyze, isArchiving }) => {
  const [analyzing, setAnalyzing] = useState(false);

  if (!isOpen) return null;

  const handleAnalyze = async () => {
      if (!onAnalyze) return;
      setAnalyzing(true);
      await onAnalyze(students);
      setAnalyzing(false);
  };

  const isExempt = (s: Student) => {
      const isDonor = (s.donationTotal || 0) > 10000; // > $100
      const isGroupMember = (s.groupCount || 0) > 0;
      return isDonor || isGroupMember;
  };

  const candidates = students.filter(s => !isExempt(s));
  const exemptCount = students.length - candidates.length;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Ghost Protocol</h2>
        <p>{candidates.length} candidates found ({exemptCount} exempt).</p>
        <p className="description">
            These records meet the criteria for archival (Inactive &gt; 24m). High Value Donors (&gt;$100/yr) and Group Members are exempt.
        </p>

        <div className="ghost-list">
            {students.length === 0 ? (
                <p style={{textAlign: 'center', padding: '1rem'}}>No ghosts found.</p>
            ) : (
                <>
                    {students.slice(0, 10).map(s => {
                        const exempt = isExempt(s);
                        return (
                        <div key={s.id} className={`ghost-item ${exempt ? 'ghost-exempt' : ''}`}>
                            <span style={exempt ? {textDecoration: 'line-through', color: '#999'} : {}}>{s.name}</span>
                            <div className="details-group">
                                {s.donationTotal !== null && (s.donationTotal || 0) > 10000 && (
                                    <span className="tag tag-donor">Donor ${(s.donationTotal! / 100).toFixed(0)}</span>
                                )}
                                {s.groupCount !== null && (s.groupCount || 0) > 0 && (
                                    <span className="tag tag-group">Group Member</span>
                                )}
                                {s.checkInCount !== null && (
                                    <span className={`tag ${s.checkInCount > 5 ? 'tag-regular' : 'tag-visitor'}`}>
                                        {s.checkInCount} check-ins
                                    </span>
                                )}
                                <span className="details">Last Seen: {s.lastCheckInAt ? new Date(s.lastCheckInAt).toLocaleDateString() : 'Never'}</span>
                            </div>
                        </div>
                    )})}
                    {students.length > 10 && <p style={{textAlign: 'center', color: '#666', marginTop: '0.5rem'}}>...and {students.length - 10} more.</p>}
                </>
            )}
        </div>

        <div className="modal-actions">
          {onAnalyze && (
              <button
                onClick={handleAnalyze}
                disabled={students.length === 0 || analyzing || isArchiving}
                className="btn-secondary"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Candidates'}
              </button>
          )}
          <button
            onClick={() => onArchive(candidates)}
            disabled={candidates.length === 0 || isArchiving || analyzing}
            className="btn-danger"
          >
            {isArchiving ? 'Archiving...' : `Archive ${candidates.length} Ghosts`}
          </button>
          <button onClick={onClose} disabled={isArchiving} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

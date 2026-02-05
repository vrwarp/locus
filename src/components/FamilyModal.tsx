import React from 'react';
import type { FamilyIssue } from '../utils/family';
import './FamilyModal.css';

interface FamilyModalProps {
  isOpen: boolean;
  onClose: () => void;
  issues: FamilyIssue[];
}

export const FamilyModal: React.FC<FamilyModalProps> = ({ isOpen, onClose, issues }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Family Audit</h2>
        <p>{issues.length} potential anomalies detected.</p>
        <p className="description">
            These records indicate potential data entry errors within families.
        </p>

        <div className="family-modal-list">
            {issues.length === 0 ? (
                <p style={{textAlign: 'center', padding: '1rem'}}>No anomalies found.</p>
            ) : (
                issues.map((issue, index) => (
                    <div key={`${issue.householdId}-${index}`} className="family-issue-item">
                        <div className="family-issue-header">
                            <span className="family-issue-title">{issue.familyName} Family</span>
                            <span className={`family-issue-tag ${issue.type}`}>{issue.type}</span>
                        </div>
                        <div className="family-issue-message">{issue.message}</div>
                        <div className="family-members-list">
                            Members: {issue.members.map(m => `${m.name} (${m.age})`).join(', ')}
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

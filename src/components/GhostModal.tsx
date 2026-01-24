import React from 'react';
import type { Student } from '../utils/pco';
import './GhostModal.css';

interface GhostModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onArchive: (students: Student[]) => void;
  isArchiving?: boolean;
}

export const GhostModal: React.FC<GhostModalProps> = ({ isOpen, onClose, students, onArchive, isArchiving }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Ghost Protocol</h2>
        <p>{students.length} potential ghosts detected.</p>
        <p className="description">
            These records meet the criteria for archival (Inactive &gt; 24m, Low Giving, No Groups).
        </p>

        <div className="ghost-list">
            {students.length === 0 ? (
                <p style={{textAlign: 'center', padding: '1rem'}}>No ghosts found.</p>
            ) : (
                <>
                    {students.slice(0, 10).map(s => (
                        <div key={s.id} className="ghost-item">
                            <span>{s.name}</span>
                            <span className="details">Last Seen: {s.lastCheckInAt ? new Date(s.lastCheckInAt).toLocaleDateString() : 'Never'}</span>
                        </div>
                    ))}
                    {students.length > 10 && <p style={{textAlign: 'center', color: '#666', marginTop: '0.5rem'}}>...and {students.length - 10} more.</p>}
                </>
            )}
        </div>

        <div className="modal-actions">
          <button
            onClick={() => onArchive(students)}
            disabled={students.length === 0 || isArchiving}
            className="btn-danger"
          >
            {isArchiving ? 'Archiving...' : 'Archive All'}
          </button>
          <button onClick={onClose} disabled={isArchiving} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

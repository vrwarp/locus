import React, { useState, useMemo } from 'react';
import type { Student } from '../utils/pco';
import { ghostReason, describeGhostReason, DEFAULT_GHOST_CONFIG } from '../utils/ghost';
import { isMinor } from '../utils/pco';
import './GhostModal.css';

interface GhostModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onArchive: (students: Student[]) => void;
  onAnalyze?: (students: Student[]) => Promise<void>;
  isArchiving?: boolean;
}

const CONFIRM_PHRASE = 'ARCHIVE';

/**
 * Ghost Protocol: choose records to deactivate in Planning Center.
 *
 * This screen used to be a list truncated to ten with one "Archive All" button
 * that acted on the untruncated set — so an admin could read ten names, click
 * once, and deactivate eighty records they never saw. The write bypassed the
 * app's own undo stack, there was no confirmation, and the stated criteria
 * ("Inactive > 24m AND No Groups") described logic that no longer existed.
 *
 * What replaces it: nothing is selected by default, every record is listed with
 * the reason it qualified, minors are called out because a deactivated child
 * record means a second record and an empty allergy list at the check-in desk,
 * and the button acts on exactly what is ticked after the word is typed out.
 */
export const GhostModal: React.FC<GhostModalProps> = ({ isOpen, onClose, students, onArchive, onAnalyze, isArchiving }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmText, setConfirmText] = useState('');

  const rows = useMemo(() => students.map(s => ({
    student: s,
    reason: ghostReason(s),
    minor: isMinor(s),
  })), [students]);

  const selectedStudents = students.filter(s => selected.has(s.id));
  const selectedMinors = selectedStudents.filter(isMinor).length;
  const confirmed = confirmText.trim().toUpperCase() === CONFIRM_PHRASE;
  const canArchive = selectedStudents.length > 0 && confirmed && !isArchiving && !analyzing;

  if (!isOpen) return null;

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAnalyze = async () => {
    if (!onAnalyze) return;
    setAnalyzing(true);
    await onAnalyze(students);
    setAnalyzing(false);
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Ghost Protocol" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Ghost Protocol</h2>
        <p>{students.length} {students.length === 1 ? 'record' : 'records'} may be inactive.</p>
        <p className="description">
          On file at least {DEFAULT_GHOST_CONFIG.minTenureMonths} months, and either never
          checked in or not seen for {DEFAULT_GHOST_CONFIG.checkInThresholdMonths} months.
          Archiving sets the person to inactive in Planning Center. Tick the ones you have
          checked — nothing is selected for you.
        </p>

        <div className="ghost-list">
          {rows.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '1rem' }}>No inactive records found.</p>
          ) : rows.map(({ student, reason, minor }) => (
            <label key={student.id} className="ghost-item ghost-item--selectable">
              <input
                type="checkbox"
                checked={selected.has(student.id)}
                onChange={() => toggle(student.id)}
                disabled={isArchiving}
                aria-label={`Archive ${student.name}`}
              />
              <span className="ghost-name">
                {student.name}
                {minor && <span className="tag tag-minor" title="Under 18">minor</span>}
              </span>
              <div className="details-group">
                {student.checkInCount !== null && (
                  <span className={`tag ${student.checkInCount > 5 ? 'tag-regular' : 'tag-visitor'}`}>
                    {student.checkInCount} check-ins
                  </span>
                )}
                <span className="details">{reason ? describeGhostReason(reason) : 'No longer qualifies'}</span>
              </div>
            </label>
          ))}
        </div>

        {selectedStudents.length > 0 && (
          <div className="ghost-confirm">
            <p>
              About to archive <b>{selectedStudents.length}</b> of {students.length} in Planning Center
              {selectedMinors > 0 && <>, including <b>{selectedMinors}</b> under 18</>}.
            </p>
            <label htmlFor="ghost-confirm-input">
              Type <b>{CONFIRM_PHRASE}</b> to enable the button
            </label>
            <input
              id="ghost-confirm-input"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isArchiving}
              autoComplete="off"
            />
          </div>
        )}

        <div className="modal-actions">
          {onAnalyze && (
            <button
              onClick={handleAnalyze}
              disabled={students.length === 0 || analyzing || isArchiving}
              className="btn-secondary"
            >
              {analyzing ? 'Analyzing...' : 'Look up check-in counts'}
            </button>
          )}
          <button
            onClick={() => onArchive(selectedStudents)}
            disabled={!canArchive}
            className="btn-danger"
          >
            {isArchiving
              ? 'Archiving...'
              : `Archive ${selectedStudents.length || ''} selected`.trim()}
          </button>
          <button onClick={onClose} disabled={isArchiving} className="btn-secondary">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

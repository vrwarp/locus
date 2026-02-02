import React, { useState, useEffect } from 'react';
import type { Student } from '../utils/pco';
import './SmartFixModal.css';

interface SmartFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSave: (student: Student) => void;
}

export const SmartFixModal: React.FC<SmartFixModalProps> = ({ isOpen, onClose, student, onSave }) => {
  const [targetGrade, setTargetGrade] = useState<number>(0);

  useEffect(() => {
    if (student) {
      setTargetGrade(student.calculatedGrade);
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleFix = () => {
      // Calculate new delta based on the manual selection
      // Expected (Calculated) Grade = Age - 5
      // Delta = Expected - Recorded
      const expectedGrade = student.calculatedGrade;
      const newDelta = expectedGrade - targetGrade;

      const updatedStudent: Student = {
          ...student,
          pcoGrade: targetGrade,
          delta: newDelta
      };
      onSave(updatedStudent);
      onClose(); // Close modal after save
  };

  const isMatch = targetGrade === student.calculatedGrade;

  const formatGrade = (grade: number) => {
      if (grade <= -1) return 'Pre-K';
      if (grade === 0) return 'K';
      return `${grade}`;
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Smart Fix</h2>
        <div className="modal-body">
            <h3>{student.name}</h3>
            <p><strong>Birthdate:</strong> {student.birthdate}</p>

            <div className="grade-comparison">
                <div className="grade-box current">
                    <span className="label">Current</span>
                    <span className="value">{formatGrade(student.pcoGrade)}</span>
                </div>
                <div className="arrow">→</div>
                <div className={`grade-box target ${isMatch ? 'match' : ''}`}>
                    <span className="label">Selected</span>
                    <span className="value">{formatGrade(targetGrade)}</span>
                </div>
            </div>

            <div className="slider-container">
                <input
                    id="grade-slider"
                    type="range"
                    min="-1"
                    max="12"
                    step="1"
                    value={targetGrade}
                    onChange={(e) => setTargetGrade(parseInt(e.target.value))}
                    className={`magnetic-slider ${isMatch ? 'matched' : ''}`}
                />
                <div className="slider-labels">
                    <span>Pre-K</span>
                    <span className={isMatch ? 'match-indicator visible' : 'match-indicator'}>
                        Suggested: {formatGrade(student.calculatedGrade)}
                    </span>
                    <span>12</span>
                </div>
            </div>

            <div className="discrepancy-info">
               {isMatch ? (
                   <span className="success-text">✓ Perfect Match (Delta: 0)</span>
               ) : (
                   <span className="warning-text">
                       ⚠️ Delta: {Math.abs(student.calculatedGrade - targetGrade)} year(s)
                   </span>
               )}
            </div>
        </div>
        <div className="modal-actions">
            <button onClick={onClose} className="btn-cancel">Cancel</button>
            <button onClick={handleFix} className="btn-fix">
                Fix Grade to {formatGrade(targetGrade)}
            </button>
        </div>
      </div>
    </div>
  );
};

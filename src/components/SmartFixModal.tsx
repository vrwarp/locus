import React, { useState, useEffect } from 'react';
import type { Student } from '../utils/pco';
import { calculateExpectedGrade } from '../utils/grader';
import type { GraderOptions } from '../utils/grader';
import { differenceInYears } from 'date-fns';
import './SmartFixModal.css';

interface SmartFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSave: (student: Student) => void;
  graderOptions?: GraderOptions;
}

export const SmartFixModal: React.FC<SmartFixModalProps> = ({ isOpen, onClose, student, onSave, graderOptions }) => {
  const [mode, setMode] = useState<'grade' | 'birthdate'>('grade');
  const [targetGrade, setTargetGrade] = useState<number>(0);
  const [targetBirthdate, setTargetBirthdate] = useState<string>('');

  useEffect(() => {
    if (student) {
      setTargetGrade(student.calculatedGrade);
      setTargetBirthdate(student.birthdate);
      setMode('grade'); // Default to grade fix
    }
  }, [student]);

  if (!isOpen || !student) return null;

  const handleFix = () => {
      let updatedStudent: Student;

      if (mode === 'grade') {
          // Fix Grade: Just update grade and delta
          const expectedGrade = student.calculatedGrade;
          const newDelta = expectedGrade - targetGrade;

          updatedStudent = {
              ...student,
              pcoGrade: targetGrade,
              delta: newDelta
          };
      } else {
          // Fix Birthdate: Update birthdate, recalculate age, calculatedGrade, and delta
          const newDob = new Date(targetBirthdate);
          const newAge = differenceInYears(new Date(), newDob);
          const newCalculatedGrade = calculateExpectedGrade(newDob, new Date(), graderOptions);
          // Delta uses the CURRENT pcoGrade because we are fixing birthdate, not grade.
          // But now Expected (newCalculated) vs Recorded (pcoGrade).
          const newDelta = newCalculatedGrade - student.pcoGrade;

          updatedStudent = {
              ...student,
              birthdate: targetBirthdate,
              age: newAge,
              calculatedGrade: newCalculatedGrade,
              delta: newDelta
          };
      }

      onSave(updatedStudent);
      onClose();
  };

  const isMatch = mode === 'grade'
      ? targetGrade === student.calculatedGrade
      : calculateExpectedGrade(new Date(targetBirthdate), new Date(), graderOptions) === student.pcoGrade;

  const formatGrade = (grade: number) => {
      if (grade <= -1) return 'Pre-K';
      if (grade === 0) return 'K';
      return `${grade}`;
  }

  // Calculated preview for Birthdate mode
  const previewCalculatedGrade = mode === 'birthdate' && targetBirthdate
      ? calculateExpectedGrade(new Date(targetBirthdate), new Date(), graderOptions)
      : student.calculatedGrade;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Smart Fix</h2>

        <div className="mode-switcher">
            <button
                className={mode === 'grade' ? 'active' : ''}
                onClick={() => setMode('grade')}
            >
                Fix Grade
            </button>
            <button
                className={mode === 'birthdate' ? 'active' : ''}
                onClick={() => setMode('birthdate')}
            >
                Fix Birthdate
            </button>
        </div>

        <div className="modal-body">
            <h3>{student.name}</h3>

            {mode === 'grade' ? (
                <>
                    <p><strong>Birthdate:</strong> {student.birthdate}</p>
                    <div className="grade-comparison">
                        <div className="grade-box current">
                            <span className="label">Current</span>
                            <span className="value">{formatGrade(student.pcoGrade)}</span>
                        </div>
                        <div className="arrow">→</div>
                        <div className={`grade-box target ${targetGrade === student.calculatedGrade ? 'match' : ''}`}>
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
                            className={`magnetic-slider ${targetGrade === student.calculatedGrade ? 'matched' : ''}`}
                        />
                        <div className="slider-labels">
                            <span>Pre-K</span>
                            <span className={targetGrade === student.calculatedGrade ? 'match-indicator visible' : 'match-indicator'}>
                                Suggested: {formatGrade(student.calculatedGrade)}
                            </span>
                            <span>12</span>
                        </div>
                    </div>
                     <div className="discrepancy-info">
                        {targetGrade === student.calculatedGrade ? (
                            <span className="success-text">✓ Perfect Match (Delta: 0)</span>
                        ) : (
                            <span className="warning-text">
                                ⚠️ Delta: {Math.abs(student.calculatedGrade - targetGrade)} year(s)
                            </span>
                        )}
                    </div>
                </>
            ) : (
                <>
                    <p><strong>Current Grade:</strong> {formatGrade(student.pcoGrade)}</p>
                    <div className="input-container">
                        <label htmlFor="birthdate-picker">New Birthdate:</label>
                        <input
                            id="birthdate-picker"
                            type="date"
                            value={targetBirthdate}
                            onChange={(e) => setTargetBirthdate(e.target.value)}
                            className="date-picker"
                        />
                    </div>

                    <div className="preview-info">
                         <p>Based on this date, Expected Grade is: <strong>{formatGrade(previewCalculatedGrade)}</strong></p>
                         {previewCalculatedGrade === student.pcoGrade ? (
                             <span className="success-text">✓ Matches current grade!</span>
                         ) : (
                             <span className="warning-text">⚠️ Differs from current grade by {Math.abs(previewCalculatedGrade - student.pcoGrade)} year(s)</span>
                         )}
                    </div>
                </>
            )}

        </div>
        <div className="modal-actions">
            <button onClick={onClose} className="btn-cancel">Cancel</button>
            <button onClick={handleFix} className="btn-fix">
                {mode === 'grade' ? `Fix Grade to ${formatGrade(targetGrade)}` : `Fix Birthdate to ${targetBirthdate}`}
            </button>
        </div>
      </div>
    </div>
  );
};

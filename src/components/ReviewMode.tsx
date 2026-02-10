import React, { useState, useEffect } from 'react';
import type { Student } from '../utils/pco';
import { calculateExpectedGrade } from '../utils/grader';
import type { GraderOptions } from '../utils/grader';
import { differenceInYears } from 'date-fns';
import { playTone } from '../utils/audio';
import { fixName } from '../utils/hygiene';
import './ReviewMode.css';

interface ReviewModeProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onSave: (student: Student) => void;
  graderOptions?: GraderOptions;
  muteSounds?: boolean;
}

export const ReviewMode: React.FC<ReviewModeProps> = ({ isOpen, onClose, students, onSave, graderOptions, muteSounds }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<'grade' | 'birthdate' | 'name'>('grade');
  const [targetGrade, setTargetGrade] = useState<number>(0);
  const [targetBirthdate, setTargetBirthdate] = useState<string>('');
  const [targetName, setTargetName] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
        setCurrentIndex(0);
    }
  }, [isOpen]);

  const currentStudent = students[currentIndex];

  useEffect(() => {
    if (currentStudent) {
      setTargetGrade(currentStudent.calculatedGrade);
      setTargetBirthdate(currentStudent.birthdate);
      setTargetName(fixName(currentStudent.name));

      if (currentStudent.hasNameAnomaly) {
          setMode('name');
      } else {
          setMode('grade');
      }
    }
  }, [currentStudent]);

  if (!isOpen || !currentStudent) return null;

  const handleNext = () => {
      if (currentIndex < students.length - 1) {
          setCurrentIndex(currentIndex + 1);
      } else {
          onClose(); // Finished all
      }
  };

  const handleFix = () => {
      let updatedStudent: Student;

      if (mode === 'grade') {
          const expectedGrade = currentStudent.calculatedGrade;
          const newDelta = expectedGrade - targetGrade;

          updatedStudent = {
              ...currentStudent,
              pcoGrade: targetGrade,
              delta: newDelta
          };
      } else if (mode === 'birthdate') {
          const newDob = new Date(targetBirthdate);
          const newAge = differenceInYears(new Date(), newDob);
          const newCalculatedGrade = calculateExpectedGrade(newDob, new Date(), graderOptions);
          const newDelta = newCalculatedGrade - currentStudent.pcoGrade;

          updatedStudent = {
              ...currentStudent,
              birthdate: targetBirthdate,
              age: newAge,
              calculatedGrade: newCalculatedGrade,
              delta: newDelta
          };
      } else {
          // Fix Name
          updatedStudent = {
              ...currentStudent,
              name: targetName,
              firstName: targetName.split(' ')[0],
              lastName: targetName.split(' ').slice(1).join(' '),
              hasNameAnomaly: false
          };
      }

      if (!muteSounds) {
          playTone(523.25, 'sine', 0.2); // High C
      }

      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 500);

      onSave(updatedStudent);
      handleNext();
  };

  const formatGrade = (grade: number) => {
      if (grade <= -1) return 'Pre-K';
      if (grade === 0) return 'K';
      return `${grade}`;
  }

  const previewCalculatedGrade = mode === 'birthdate' && targetBirthdate
      ? calculateExpectedGrade(new Date(targetBirthdate), new Date(), graderOptions)
      : currentStudent.calculatedGrade;

  return (
    <div className="review-mode-overlay">
      <div className={`review-card ${isSuccess ? 'success-glow' : ''}`}>
        <div className="review-header">
            <h2>Review Anomalies</h2>
            <div className="progress">
                {currentIndex + 1} / {students.length}
            </div>
            <button onClick={onClose} className="btn-close">Exit Review</button>
        </div>

        <div className="student-info">
            <h3>{currentStudent.name}</h3>
            <p className="student-meta">Age: {currentStudent.age} • Current Grade: {formatGrade(currentStudent.pcoGrade)}</p>
        </div>

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
             <button
                className={mode === 'name' ? 'active' : ''}
                onClick={() => setMode('name')}
            >
                Fix Name
            </button>
        </div>

        <div className="fix-area">
            {mode === 'grade' ? (
                <>
                    <p>Suggested Grade: <strong>{formatGrade(currentStudent.calculatedGrade)}</strong></p>
                    <div className="slider-container">
                        <input
                            type="range"
                            min="-1"
                            max="12"
                            step="1"
                            value={targetGrade}
                            onChange={(e) => setTargetGrade(parseInt(e.target.value))}
                            className="magnetic-slider"
                        />
                        <div className="slider-value">
                            Selected: {formatGrade(targetGrade)}
                        </div>
                    </div>
                </>
            ) : mode === 'birthdate' ? (
                <>
                    <div className="input-container">
                        <label htmlFor="review-birthdate">New Birthdate:</label>
                        <input
                            id="review-birthdate"
                            type="date"
                            value={targetBirthdate}
                            onChange={(e) => setTargetBirthdate(e.target.value)}
                            className="date-picker"
                        />
                    </div>
                    <p>Expected Grade: <strong>{formatGrade(previewCalculatedGrade)}</strong></p>
                </>
            ) : (
                <>
                    <div className="input-container">
                        <label htmlFor="review-name">Suggested Name:</label>
                        <input
                            id="review-name"
                            type="text"
                            value={targetName}
                            onChange={(e) => setTargetName(e.target.value)}
                            className="text-input"
                        />
                    </div>
                    <p className="hint-text">Current: {currentStudent.name}</p>
                </>
            )}
        </div>

        <div className="review-actions">
            <button onClick={handleNext} className="btn-skip">Skip</button>
            <button onClick={handleFix} className="btn-fix">
                {mode === 'grade' ? `Fix Grade` : mode === 'birthdate' ? `Fix Birthdate` : `Fix Name`}
            </button>
        </div>
      </div>
    </div>
  );
};

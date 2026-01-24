import React from 'react';
import type { Student } from '../utils/pco';
import './SmartFixModal.css';

interface SmartFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
  onSave: (student: Student) => void;
}

export const SmartFixModal: React.FC<SmartFixModalProps> = ({ isOpen, onClose, student, onSave }) => {
  if (!isOpen || !student) return null;

  const handleFix = () => {
      // Create a copy of the student with the fixed grade
      const updatedStudent: Student = {
          ...student,
          pcoGrade: student.calculatedGrade,
          delta: 0 // Delta becomes 0 after fix
      };
      onSave(updatedStudent);
      onClose(); // Close modal after save
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Smart Fix</h2>
        <div className="modal-body">
            <h3>{student.name}</h3>
            <p><strong>Birthdate:</strong> {student.birthdate}</p>
            <p><strong>Current Grade:</strong> {student.pcoGrade}</p>
            <p><strong>Suggested Grade:</strong> {student.calculatedGrade}</p>
            <div className="discrepancy-info">
              <strong>Discrepancy: </strong>
              {Math.abs(student.delta)} year(s) {student.delta > 0 ? 'expected higher' : 'expected lower'}
            </div>
        </div>
        <div className="modal-actions">
            <button onClick={onClose} className="btn-cancel">Cancel</button>
            <button onClick={handleFix} className="btn-fix">Fix Grade to {student.calculatedGrade}</button>
        </div>
      </div>
    </div>
  );
};

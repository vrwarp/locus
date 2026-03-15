import React, { useEffect } from 'react';
import './GoldenRecordModal.css';
import { Confetti } from './Confetti';

interface GoldenRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GoldenRecordModal: React.FC<GoldenRecordModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay golden-record-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <Confetti duration={5000} colors={['#FFD700', '#FFA500', '#FFF8DC', '#DAA520']} />
      <div className="modal-content golden-record-content" onClick={(e) => e.stopPropagation()}>
        <div className="golden-record-icon">📀</div>
        <h2 className="golden-record-title">The Golden Record</h2>
        <p className="description">
            You have achieved something truly monumental.
        </p>
        <div className="golden-record-stats">
            <strong>10,000 Fixes</strong>
        </div>
        <p className="golden-record-message">
            Your dedication has single-handedly transformed the health of your community's data.
            Thank you for being a Data Deity.
        </p>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-primary golden-btn">
            Accept Award
          </button>
        </div>
      </div>
    </div>
  );
};

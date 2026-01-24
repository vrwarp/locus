import React, { useState, useEffect } from 'react';
import type { AppConfig } from '../utils/storage';
import './ConfigModal.css';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: AppConfig;
  onSave: (config: AppConfig) => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose, currentConfig, onSave }) => {
  const [cutoffMonth, setCutoffMonth] = useState(8); // Default Sept (Index 8)
  const [cutoffDay, setCutoffDay] = useState(1);
  const [highContrastMode, setHighContrastMode] = useState(false);

  // Load current config when modal opens
  useEffect(() => {
    if (isOpen) {
        setCutoffMonth(currentConfig.graderOptions.cutoffMonth ?? 8);
        setCutoffDay(currentConfig.graderOptions.cutoffDay ?? 1);
        setHighContrastMode(currentConfig.highContrastMode ?? false);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
        ...currentConfig,
        highContrastMode,
        graderOptions: {
            ...currentConfig.graderOptions,
            cutoffMonth,
            cutoffDay
        }
    });
    onClose();
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Configuration</h2>

        <div className="form-group">
            <label>Grade Cutoff Date</label>
            <div style={{ display: 'flex', gap: '10px' }}>
                <select
                    value={cutoffMonth}
                    onChange={(e) => setCutoffMonth(Number(e.target.value))}
                >
                    {MONTHS.map((month, index) => (
                        <option key={month} value={index}>{month}</option>
                    ))}
                </select>
                <input
                    type="number"
                    min="1"
                    max="31"
                    value={cutoffDay}
                    onChange={(e) => setCutoffDay(Number(e.target.value))}
                    style={{ width: '60px' }}
                />
            </div>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                Students born after this date will be placed in the lower grade.
                (Standard US: September 1st)
            </p>
        </div>

        <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                    type="checkbox"
                    checked={highContrastMode}
                    onChange={(e) => setHighContrastMode(e.target.checked)}
                />
                High Contrast Mode
            </label>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                Use high contrast colors (Black/Cyan/Magenta) for better visibility.
            </p>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={handleSave} className="btn-save">Save Settings</button>
        </div>
      </div>
    </div>
  );
};

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
  const [sandboxMode, setSandboxMode] = useState(false);
  const [colorblindMode, setColorblindMode] = useState(false);
  const [muteSounds, setMuteSounds] = useState(false);
  const [partyMode, setPartyMode] = useState(false);
  const [confettiTheme, setConfettiTheme] = useState('default');
  const [zenMode, setZenMode] = useState(false);
  const [campus, setCampus] = useState('Main Campus');
  const [enableSpotify, setEnableSpotify] = useState(false);

  // Load current config when modal opens
  useEffect(() => {
    if (isOpen) {
        setCutoffMonth(currentConfig.graderOptions.cutoffMonth ?? 8);
        setCutoffDay(currentConfig.graderOptions.cutoffDay ?? 1);
        setHighContrastMode(currentConfig.highContrastMode ?? false);
        setSandboxMode(currentConfig.sandboxMode ?? false);
        setColorblindMode(currentConfig.colorblindMode ?? false);
        setMuteSounds(currentConfig.muteSounds ?? false);
        setPartyMode(currentConfig.partyMode ?? false);
        setConfettiTheme(currentConfig.confettiTheme ?? 'default');
        setZenMode(currentConfig.zenMode ?? false);
        setCampus(currentConfig.campus ?? 'Main Campus');
        setEnableSpotify(currentConfig.enableSpotify ?? false);
    }
  }, [isOpen, currentConfig]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave({
        ...currentConfig,
        highContrastMode,
        sandboxMode,
        colorblindMode,
        muteSounds,
        partyMode,
        confettiTheme,
        zenMode,
        campus,
        enableSpotify,
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
                    checked={enableSpotify}
                    onChange={(e) => setEnableSpotify(e.target.checked)}
                />
                Spotify Integration
            </label>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                Play a worship playlist while cleaning data.
            </p>
        </div>

        <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                    type="checkbox"
                    checked={colorblindMode}
                    onChange={(e) => setColorblindMode(e.target.checked)}
                />
                Colorblind Mode
            </label>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                Use distinct shapes (Triangle vs Circle) for data anomalies.
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

        <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                    type="checkbox"
                    checked={sandboxMode}
                    onChange={(e) => setSandboxMode(e.target.checked)}
                />
                Sandbox Mode
            </label>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                Enable simulation mode. Changes will not be saved to PCO.
            </p>
        </div>

        <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                    type="checkbox"
                    checked={muteSounds}
                    onChange={(e) => setMuteSounds(e.target.checked)}
                />
                Mute Sounds
            </label>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                Disable audio effects and accessibility tones.
            </p>
        </div>

        <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                    type="checkbox"
                    checked={partyMode}
                    onChange={(e) => setPartyMode(e.target.checked)}
                />
                Party Mode
            </label>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                Enable confetti on every click.
            </p>
            {partyMode && (
                <div style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
                    <label style={{ fontSize: '0.9rem', color: '#333' }}>
                        Confetti Theme:
                        <select
                            value={confettiTheme}
                            onChange={(e) => setConfettiTheme(e.target.value)}
                            style={{ marginLeft: '0.5rem', padding: '0.2rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="default">Default</option>
                            <option value="pastel">Pastel</option>
                            <option value="neon">Neon</option>
                            <option value="monochrome">Monochrome (Silver/Gold)</option>
                        </select>
                    </label>
                </div>
            )}
        </div>

        <div className="form-group">
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                    type="checkbox"
                    checked={zenMode}
                    onChange={(e) => setZenMode(e.target.checked)}
                />
                Zen Mode
            </label>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                Disable timers and hide scores for a pressure-free experience.
            </p>
        </div>

        <div className="form-group">
            <label>Campus</label>
            <select
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                style={{ width: '100%', padding: '0.5rem', marginTop: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
            >
                <option value="Main Campus">Main Campus</option>
                <option value="North Campus">North Campus</option>
                <option value="South Campus">South Campus</option>
                <option value="East Campus">East Campus</option>
                <option value="Online">Online</option>
            </select>
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '5px' }}>
                Select your campus to contribute to the Campus Cup leaderboard.
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

import React from 'react';
import type { Badge } from '../utils/gamification';
import './BadgeToast.css';

interface BadgeToastProps {
  badge: Badge;
  onClose?: () => void;
}

export const BadgeToast: React.FC<BadgeToastProps> = ({ badge, onClose }) => {
  return (
    <div className="badge-toast" role="alert">
      <div className="badge-icon">{badge.icon}</div>
      <div className="badge-content">
        <div className="badge-title">Badge Unlocked!</div>
        <div className="badge-name">{badge.name}</div>
        <div className="badge-description">{badge.description}</div>
      </div>
      {onClose && (
        <button className="badge-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
      )}
    </div>
  );
};

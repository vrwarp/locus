import React from 'react';
import { getAvatarForFixes, getNextAvatarLevel } from '../utils/avatar';
import './Avatar.css';

interface AvatarProps {
  totalFixes: number;
}

export const Avatar: React.FC<AvatarProps> = ({ totalFixes }) => {
  const currentAvatar = getAvatarForFixes(totalFixes);
  const nextAvatar = getNextAvatarLevel(currentAvatar.level);

  let progressPercentage = 100;
  if (nextAvatar) {
    const range = nextAvatar.minFixes - currentAvatar.minFixes;
    const progress = totalFixes - currentAvatar.minFixes;
    progressPercentage = Math.min(100, Math.max(0, (progress / range) * 100));
  }

  return (
    <div className="avatar-container" title={`${totalFixes} Total Fixes`}>
      <div className="avatar-icon">{currentAvatar.icon}</div>
      <div className="avatar-details">
        <div className="avatar-title">{currentAvatar.title}</div>
        <div className="avatar-level">Level {currentAvatar.level}</div>
        {nextAvatar && (
          <div className="avatar-progress-bar">
            <div
              className="avatar-progress-fill"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        )}
        {nextAvatar && (
          <div className="avatar-fixes-text">
            {totalFixes} / {nextAvatar.minFixes} fixes
          </div>
        )}
      </div>
    </div>
  );
};

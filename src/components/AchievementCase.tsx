import React from 'react';
import './AchievementCase.css';
import { BADGES } from '../utils/gamification';
import type { GamificationState } from '../utils/storage';

interface AchievementCaseProps {
  gamificationState: GamificationState;
}

export const AchievementCase: React.FC<AchievementCaseProps> = ({ gamificationState }) => {
  const unlockedMap = new Map<string, string>(); // badgeId -> date
  gamificationState.unlockedBadges.forEach(b => {
    unlockedMap.set(b.id, new Date(b.date).toLocaleDateString());
  });

  return (
    <div className="achievement-case">
      <div className="stats-header">
        <div className="stat-pill">Total Fixes: <strong>{gamificationState.totalFixes}</strong></div>
        <div className="stat-pill">Ghosts Cleared: <strong>{gamificationState.ghostsCleared || 0}</strong></div>
        <div className="stat-pill">Birthdates Fixed: <strong>{gamificationState.birthdatesFixed || 0}</strong></div>
        <div className="stat-pill">Grades Fixed: <strong>{gamificationState.gradesFixed || 0}</strong></div>
      </div>

      <div className="badges-grid">
        {BADGES.map((badge) => {
          const isUnlocked = unlockedMap.has(badge.id);
          const unlockedDate = unlockedMap.get(badge.id);

          return (
            <div
              key={badge.id}
              className={`badge-card ${isUnlocked ? 'unlocked' : 'locked'}`}
              title={isUnlocked ? `Unlocked on ${unlockedDate}` : 'Locked'}
            >
              <div className="badge-icon">{isUnlocked ? badge.icon : '🔒'}</div>
              <div className="badge-info">
                <div className="badge-name">{badge.name}</div>
                <div className="badge-description">{badge.description}</div>
                {isUnlocked && <div className="badge-date">Unlocked: {unlockedDate}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

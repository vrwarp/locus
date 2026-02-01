import React from 'react';
import './GamificationWidget.css';

interface GamificationWidgetProps {
  streak: number;
  dailyFixes: number;
  dailyGoal?: number;
}

export const GamificationWidget: React.FC<GamificationWidgetProps> = ({
  streak,
  dailyFixes,
  dailyGoal = 50
}) => {
  const progress = Math.min((dailyFixes / dailyGoal) * 100, 100);
  const isComplete = dailyFixes >= dailyGoal;

  return (
    <div className="gamification-widget" role="status" aria-label="Gamification Stats">
      <div className="streak-container" title={`${streak} Day Streak`}>
        <span className="streak-icon">🔥</span>
        <span>{streak}</span>
      </div>
      <div className="daily-goal-container">
        <div className="daily-goal-label">Daily Goal: {dailyFixes}/{dailyGoal}</div>
        <div className="progress-bar-bg">
          <div
            className={`progress-bar-fill ${isComplete ? 'complete' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

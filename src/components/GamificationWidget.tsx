import React from 'react';
import './GamificationWidget.css';

interface GamificationWidgetProps {
  editsToday: number;
  flaggedRecords: number;
}

/**
 * Two true sentences, and nothing else.
 *
 * This used to show a streak and a progress bar against a 50-a-day goal. The
 * streak measured consecutive days the app was opened; the goal counted field
 * rewrites as though they were verified corrections. Both were replaced with
 * numbers the product can actually stand behind: how many records you have
 * edited today, and how many are still flagged.
 *
 * Note the wording. "Edited", not "fixed" — Locus does not know whether an edit
 * made a record more correct, and a label that says otherwise is the whole
 * defect this widget used to embody.
 */
export const GamificationWidget: React.FC<GamificationWidgetProps> = ({
  editsToday,
  flaggedRecords
}) => (
  <div className="session-summary" role="status" data-testid="gamification-widget">
    <span className="session-stat">
      <b>{editsToday}</b> edited today
    </span>
    <span className="session-divider" aria-hidden="true">·</span>
    <span className="session-stat">
      <b>{flaggedRecords}</b> still flagged
    </span>
  </div>
);

import React, { useMemo, useEffect, useState } from 'react';
import './Dashboard.css';
import { calculateHealthStats } from '../utils/analytics';
import { calculateBurnoutRisk } from '../utils/burnout';
import { calculateRecruitmentCandidates } from '../utils/recruitment';
import { isGhost } from '../utils/ghost';
import { fetchRecentCheckIns, fetchEvents } from '../utils/pco';
import type { Student, PcoCheckIn, PcoEvent } from '../utils/pco';

interface DashboardProps {
  students: Student[];
  onNavigate: (view: string) => void;
  auth: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ students, onNavigate, auth }) => {
  const [checkIns, setCheckIns] = useState<PcoCheckIn[]>([]);
  const [events, setEvents] = useState<PcoEvent[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      if (!auth) return;
      setLoadingStats(true);
      try {
        const [fetchedEvents, fetchedCheckIns] = await Promise.all([
          fetchEvents(auth),
          fetchRecentCheckIns(auth)
        ]);
        if (isMounted) {
          setEvents(fetchedEvents);
          setCheckIns(fetchedCheckIns);
        }
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        if (isMounted) setLoadingStats(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [auth]);

  const stats = useMemo(() => calculateHealthStats(students), [students]);
  const anomaliesCount = students.filter(s => s.delta !== 0 || s.hasNameAnomaly || s.hasEmailAnomaly || s.hasAddressAnomaly || s.hasPhoneAnomaly).length;

  const burnoutCandidates = useMemo(() => {
      if (checkIns.length === 0 || events.length === 0) return [];
      return calculateBurnoutRisk(checkIns, events, students);
  }, [checkIns, events, students]);

  const recruitmentCandidates = useMemo(() => {
      if (checkIns.length === 0 || events.length === 0) return [];
      return calculateRecruitmentCandidates(checkIns, events, students);
  }, [checkIns, events, students]);

  const ghosts = useMemo(() => students.filter(s => isGhost(s)), [students]);
  const activeStudents = students.filter(s => !isGhost(s)).length;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="subtitle">Ministry Intelligence Command Center</div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card health-score" onClick={() => onNavigate('data-health')}>
          <div className="metric-title">Health Score</div>
          <div className="metric-value">{stats.score}</div>
          <div className="metric-trend">
            {stats.score > 80 ? 'Excellent' : stats.score > 50 ? 'Needs Attention' : 'Critical'}
          </div>
        </div>

        <div className="metric-card anomalies" onClick={() => onNavigate('data-health')}>
          <div className="metric-title">Anomalies Detected</div>
          <div className="metric-value">{anomaliesCount}</div>
          <div className="metric-trend">Action Required</div>
        </div>

        <div className="metric-card burnout" onClick={() => onNavigate('burnout')}>
          <div className="metric-title">Burnout Risk</div>
          <div className="metric-value">
              {loadingStats ? '...' : burnoutCandidates.filter(c => c.riskLevel === 'High').length}
          </div>
          <div className="metric-trend">High Risk Volunteers</div>
        </div>

        <div className="metric-card recruitment" onClick={() => onNavigate('recruitment')}>
          <div className="metric-title">Recruitment Pool</div>
          <div className="metric-value">
              {loadingStats ? '...' : recruitmentCandidates.length}
          </div>
          <div className="metric-trend">Potential Volunteers</div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <button className="action-btn primary" onClick={() => onNavigate('data-health')}>
            <span className="icon">🚀</span> Start Review
          </button>
          <button className="action-btn secondary" onClick={() => onNavigate('ghosts')}>
            <span className="icon">👻</span> Manage Ghosts ({ghosts.length})
          </button>
          <button className="action-btn secondary" onClick={() => onNavigate('families')}>
            <span className="icon">👨‍👩‍👧‍👦</span> Family Audit
          </button>
        </div>
      </div>

      <div className="dashboard-insights">
        <h3>Insights</h3>
        <div className="insight-list">
          <div className="insight-item">
            <span className="icon">ℹ️</span>
            <div>
              <strong>Active Population:</strong> {activeStudents} students are currently active (non-ghosts).
            </div>
          </div>
          {!loadingStats && burnoutCandidates.length > 0 && (
              <div className="insight-item">
                <span className="icon">⚠️</span>
                <div>
                  <strong>Burnout Alert:</strong> {burnoutCandidates.length} volunteers are showing signs of burnout.
                </div>
              </div>
          )}
           {!loadingStats && recruitmentCandidates.length > 0 && (
              <div className="insight-item">
                <span className="icon">🌱</span>
                <div>
                  <strong>Growth Opportunity:</strong> Found {recruitmentCandidates.length} potential volunteers based on attendance patterns.
                </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

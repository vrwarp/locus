import React, { useState } from 'react';
import './BountyBoard.css';
import type { GamificationState, Bounty } from '../utils/storage';

interface BountyBoardProps {
  gamificationState: GamificationState;
  onAddBounty: (bounty: Omit<Bounty, 'id' | 'currentCount' | 'createdAt'>) => void;
  onDeleteBounty: (id: string) => void;
}

export const BountyBoard: React.FC<BountyBoardProps> = ({ gamificationState, onAddBounty, onDeleteBounty }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetCount, setNewTargetCount] = useState<number>(50);
  const [newActionType, setNewActionType] = useState<Bounty['actionType']>('general');
  const [newReward, setNewReward] = useState('');

  const bounties = gamificationState.bounties || [];
  const activeBounties = bounties.filter(b => !b.completedAt);
  const completedBounties = bounties.filter(b => !!b.completedAt);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newReward.trim() || newTargetCount <= 0) return;

    onAddBounty({
      title: newTitle.trim(),
      description: newDescription.trim(),
      targetCount: newTargetCount,
      actionType: newActionType,
      reward: newReward.trim()
    });

    setIsFormOpen(false);
    setNewTitle('');
    setNewDescription('');
    setNewTargetCount(50);
    setNewActionType('general');
    setNewReward('');
  };

  const renderBountyCard = (bounty: Bounty) => {
    const isCompleted = !!bounty.completedAt;
    const progress = Math.min((bounty.currentCount / bounty.targetCount) * 100, 100);

    return (
      <div key={bounty.id} className={`bounty-card ${isCompleted ? 'completed' : ''}`}>
        <div className="bounty-header">
          <h3>{bounty.title}</h3>
          <button className="delete-btn" onClick={() => onDeleteBounty(bounty.id)} title="Delete Bounty">×</button>
        </div>
        <p className="bounty-description">{bounty.description}</p>
        <div className="bounty-meta">
          <span className="bounty-type">Target: {bounty.actionType}</span>
          <span className="bounty-reward">🎁 {bounty.reward}</span>
        </div>

        <div className="bounty-progress-container">
          <div className="bounty-progress-bar">
            <div className="bounty-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="bounty-progress-text">
            {isCompleted ? 'Completed!' : `${bounty.currentCount} / ${bounty.targetCount}`}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bounty-board">
      <div className="board-header">
        <h2>Bounty Board</h2>
        <button className="btn-primary" onClick={() => setIsFormOpen(!isFormOpen)}>
          {isFormOpen ? 'Cancel' : '+ Post New Bounty'}
        </button>
      </div>

      {isFormOpen && (
        <form className="bounty-form" onSubmit={handleSubmit} data-testid="bounty-form">
          <h3>Create New Bounty</h3>
          <div className="form-group">
            <label htmlFor="bounty-title">Title</label>
            <input id="bounty-title" type="text" value={newTitle} onChange={e => setNewTitle(e.target.value)} required placeholder="e.g., The Great Email Cleanse" />
          </div>
          <div className="form-group">
            <label htmlFor="bounty-desc">Description</label>
            <textarea id="bounty-desc" value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Explain why this data needs fixing..." />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="bounty-type">Action Type</label>
              <select id="bounty-type" value={newActionType} onChange={e => setNewActionType(e.target.value as Bounty['actionType'])}>
                <option value="general">Any Fix (General)</option>
                <option value="email">Fix Emails</option>
                <option value="phone">Fix Phones</option>
                <option value="address">Fix Addresses</option>
                <option value="ghost">Clear Ghosts</option>
                <option value="birthdate">Fix Birthdates</option>
                <option value="grade">Fix Grades</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="bounty-target">Target Count</label>
              <input id="bounty-target" type="number" min="1" value={newTargetCount} onChange={e => setNewTargetCount(parseInt(e.target.value) || 1)} required />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="bounty-reward">Reward</label>
            <input id="bounty-reward" type="text" value={newReward} onChange={e => setNewReward(e.target.value)} required placeholder="e.g., Free Coffee ☕" />
          </div>
          <button type="submit" className="btn-success">Post Bounty</button>
        </form>
      )}

      <div className="bounty-sections">
        <section className="active-bounties">
          <h3>Active Bounties ({activeBounties.length})</h3>
          {activeBounties.length === 0 ? (
            <p className="empty-state">No active bounties right now. Post one to motivate your team!</p>
          ) : (
            <div className="bounty-grid">
              {activeBounties.map(renderBountyCard)}
            </div>
          )}
        </section>

        {completedBounties.length > 0 && (
          <section className="completed-bounties">
            <h3>Completed Bounties ({completedBounties.length})</h3>
            <div className="bounty-grid">
              {completedBounties.map(renderBountyCard)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

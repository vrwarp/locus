import React, { useState } from 'react';
import type { Student } from '../utils/pco';
import { sortIntoGroups, type SmallGroup } from '../utils/sorter';
import './SmallGroupSorter.css';

interface SmallGroupSorterProps {
  students: Student[];
}

export const SmallGroupSorter: React.FC<SmallGroupSorterProps> = ({ students }) => {
  const [groupCount, setGroupCount] = useState<number>(3);
  const [generations, setGenerations] = useState<number>(500);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [groups, setGroups] = useState<SmallGroup[] | null>(null);

  const handleRunAlgorithm = () => {
    setIsProcessing(true);
    // Use a short timeout to allow UI to render "Evolving..." state
    if (process.env.NODE_ENV === 'test') {
      const result = sortIntoGroups(students, groupCount, generations);
      setGroups(result);
      setIsProcessing(false);
    } else {
      setTimeout(() => {
        const result = sortIntoGroups(students, groupCount, generations);
        setGroups(result);
        setIsProcessing(false);
      }, 50);
    }
  };

  return (
    <div className="small-group-sorter">
      <header className="report-header">
        <h2>Small Group Sorter</h2>
        <p>Genetic algorithm to distribute adults into perfectly balanced small groups by size and age, keeping families together.</p>
      </header>

      <div className="sorter-controls">
        <div className="control-group">
          <label htmlFor="groupCount">Number of Groups:</label>
          <input
            id="groupCount"
            type="number"
            min={2}
            max={20}
            value={groupCount}
            onChange={e => setGroupCount(Number(e.target.value))}
          />
        </div>
        <div className="control-group">
          <label htmlFor="generations">Evolutions (Accuracy):</label>
          <select
            id="generations"
            value={generations}
            onChange={e => setGenerations(Number(e.target.value))}
          >
            <option value={100}>Quick (100 Gen)</option>
            <option value={500}>Balanced (500 Gen)</option>
            <option value={2000}>Deep Search (2000 Gen)</option>
          </select>
        </div>
        <button
          className="btn-run-algorithm"
          onClick={handleRunAlgorithm}
          disabled={isProcessing}
        >
          {isProcessing ? 'Evolving Generations...' : 'Run Algorithm'}
        </button>
      </div>

      {groups && !isProcessing && (
        <div className="sorter-results">
          {groups.map((group, idx) => (
            <div key={idx} className="group-card">
              <div className="group-card-header">
                <h3>Group {idx + 1}</h3>
                <div className="group-stats">
                  <span className="stat-badge size">👥 {group.size} Adults</span>
                  <span className="stat-badge age">🎂 ~{Math.round(group.averageAge)} yrs</span>
                </div>
              </div>
              <ul className="group-member-list">
                {group.members.length === 0 ? (
                  <li className="empty-member">No members assigned.</li>
                ) : (
                  group.members.map(member => (
                    <li key={member.id} className="member-item">
                      <img
                        src={member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}`}
                        alt={member.name}
                        className="member-avatar"
                      />
                      <div className="member-details">
                        <span className="member-name">{member.name}</span>
                        <span className="member-age">{member.age} yrs</span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

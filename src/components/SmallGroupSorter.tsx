import React, { useState } from 'react';
import { initialsAvatar } from '../utils/avatar';
import { isMinor } from '../utils/pco';
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

  // Refuse rather than filter. `sortIntoGroups` drops minors before it starts,
  // but a tool that quietly thins its own input teaches the operator to trust an
  // output that is not what they asked for — and this one builds adult groups
  // from a roster that may include somebody's fourteen-year-old. Say so, name
  // the count, and produce nothing until they hand over the right list.
  const minorsInInput = students.filter(isMinor);

  const handleRunAlgorithm = () => {
    if (minorsInInput.length > 0) return;
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
          disabled={isProcessing || minorsInInput.length > 0}
        >
          {isProcessing ? 'Evolving Generations...' : 'Run Algorithm'}
        </button>
      </div>

      {minorsInInput.length > 0 && (
        <div className="sorter-refusal" role="alert">
          <strong>This roster includes {minorsInInput.length} {minorsInInput.length === 1 ? 'person' : 'people'} under 18.</strong>
          <p>
            This tool builds adult small groups. It will not sort a list containing
            minors, and it will not quietly leave them out either &mdash; grouping
            students needs leader ratios and keep-apart rules it does not have.
            Narrow the roster to adults and run it again.
          </p>
        </div>
      )}

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
                        src={member.avatarUrl || initialsAvatar(member.name)}
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

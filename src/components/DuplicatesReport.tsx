import React, { useMemo } from 'react';
import type { Student } from '../utils/pco';
import { detectDuplicates } from '../utils/duplicates';
import type { DuplicateGroup } from '../utils/duplicates';
import './DuplicatesReport.css';

interface DuplicatesReportProps {
  students: Student[];
}

export const DuplicatesReport: React.FC<DuplicatesReportProps> = ({ students }) => {
  const duplicates = useMemo(() => detectDuplicates(students), [students]);

  if (duplicates.length === 0) {
    return (
      <div className="duplicates-report empty-state">
        <h2>Duplicate Detective</h2>
        <div className="empty-icon">✓</div>
        <p>No duplicate records found.</p>
        <span className="subtitle">Your database is sparkling clean.</span>
      </div>
    );
  }

  return (
    <div className="duplicates-report">
      <div className="report-header">
        <h2>Duplicate Detective</h2>
        <p>Found {duplicates.length} potential duplicate {duplicates.length === 1 ? 'group' : 'groups'} based on matching names and contact information.</p>
      </div>

      <div className="duplicates-list">
        {duplicates.map((group: DuplicateGroup) => (
          <div key={group.id} className="duplicate-card">
            <div className="duplicate-card-header">
              <span className="criteria-badge">{group.criteria}</span>
              <span className="group-name">{group.students[0].name}</span>
            </div>

            <div className="duplicate-members">
              {group.students.map((student) => (
                <div key={student.id} className="member-row">
                  <div className="member-avatar">
                    {student.avatarUrl ? (
                      <img src={student.avatarUrl} alt={student.name} />
                    ) : (
                      <div className="avatar-placeholder">{student.firstName.charAt(0)}</div>
                    )}
                  </div>
                  <div className="member-details">
                    <div className="member-name">
                        {student.name} <span className="member-id">(ID: {student.id})</span>
                    </div>
                    <div className="member-contact">
                        {student.email && <span>📧 {student.email}</span>}
                        {student.phoneNumber && <span>📱 {student.phoneNumber}</span>}
                    </div>
                  </div>
                  <div className="member-actions">
                     <a href={`https://people.planningcenteronline.com/people/${student.id}`} target="_blank" rel="noopener noreferrer" className="btn-view">
                        View in PCO
                     </a>
                  </div>
                </div>
              ))}
            </div>
            <div className="card-footer">
              <p className="instruction-text">Review these profiles in Planning Center to merge them into a single record.</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

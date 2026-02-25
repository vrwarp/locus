import React, { useMemo } from 'react';
import { calculateBirthdayHeatmap } from '../utils/heatmap';
import type { Student } from '../utils/pco';

interface BirthdayHeatmapProps {
  students: Student[];
}

export const BirthdayHeatmap: React.FC<BirthdayHeatmapProps> = ({ students }) => {
  const data = useMemo(() => calculateBirthdayHeatmap(students), [students]);

  const maxCount = useMemo(() => {
    return Math.max(...data.map(c => c.count), 1);
  }, [data]);

  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  // Helper to get color intensity
  const getColor = (count: number) => {
    if (count === 0) return '#f0f0f0'; // Empty
    const intensity = Math.min(count / maxCount, 1);
    // Interpolate opacity
    return `rgba(0, 123, 255, ${Math.max(0.1, intensity)})`;
  };

  return (
    <div className="birthday-heatmap" style={{ padding: '1rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>The Heatmap of Life: Birthdays</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(12, 1fr)', gap: '4px' }}>
        {/* Header Row: Month Names */}
        <div className="header-cell"></div> {/* Corner */}
        {months.map((m) => (
          <div key={m} className="header-cell" style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem' }}>
            {m}
          </div>
        ))}

        {/* Rows: Days 1-31 */}
        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
          <React.Fragment key={`day-${day}`}>
            {/* Day Label */}
            <div className="day-label" style={{ textAlign: 'right', paddingRight: '8px', fontSize: '0.8rem', color: '#666', alignSelf: 'center' }}>
              {day}
            </div>
            {/* Cells for each month */}
            {months.map((_, monthIndex) => {
              const cell = data.find(c => c.monthIndex === monthIndex && c.day === day);

              if (!cell) {
                 // Invalid date (e.g. Feb 30)
                 return <div key={`${monthIndex}-${day}`} style={{ background: '#ccc', borderRadius: '2px', opacity: 0.3 }} title="Invalid Date" />;
              }

              return (
                <div
                  key={`${monthIndex}-${day}`}
                  title={`${months[monthIndex]} ${day}: ${cell.count} birthdays`}
                  style={{
                    backgroundColor: getColor(cell.count),
                    borderRadius: '2px',
                    height: '20px',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  role="gridcell"
                  aria-label={`${months[monthIndex]} ${day}: ${cell.count} birthdays`}
                />
              );
            })}
          </React.Fragment>
        ))}
      </div>
       <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
        <span>Density:</span>
        <div style={{ width: '15px', height: '15px', background: '#f0f0f0', border: '1px solid #ddd' }} title="0"></div>
        <div style={{ width: '15px', height: '15px', background: 'rgba(0, 123, 255, 0.2)' }} title="Low"></div>
        <div style={{ width: '15px', height: '15px', background: 'rgba(0, 123, 255, 0.6)' }} title="Medium"></div>
        <div style={{ width: '15px', height: '15px', background: 'rgba(0, 123, 255, 1)' }} title="High"></div>
      </div>
    </div>
  );
};

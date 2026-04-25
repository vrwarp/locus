import React, { useMemo, useState } from 'react';
import { calculateBirthdayHeatmap, calculateAnniversaryHeatmap, calculateDeathHeatmap } from '../utils/heatmap';
import type { Student } from '../utils/pco';

interface LifeEventsHeatmapProps {
  students: Student[];
}

export const LifeEventsHeatmap: React.FC<LifeEventsHeatmapProps> = ({ students }) => {
  const [eventType, setEventType] = useState<'birthdays' | 'anniversaries' | 'deaths'>('birthdays');

  const data = useMemo(() => {
      switch(eventType) {
          case 'birthdays': return calculateBirthdayHeatmap(students);
          case 'anniversaries': return calculateAnniversaryHeatmap(students);
          case 'deaths': return calculateDeathHeatmap(students);
          default: return calculateBirthdayHeatmap(students);
      }
  }, [students, eventType]);

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3>The Heatmap of Life: {eventType.charAt(0).toUpperCase() + eventType.slice(1)}</h3>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value as any)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
            >
                <option value="birthdays">Birthdays</option>
                <option value="anniversaries">Anniversaries</option>
                <option value="deaths">Deaths</option>
            </select>
        </div>
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
                  title={`${months[monthIndex]} ${day}: ${cell.count} ${eventType}`}
                  style={{
                    backgroundColor: getColor(cell.count),
                    borderRadius: '2px',
                    height: '20px',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                  role="gridcell"
                  aria-label={`${months[monthIndex]} ${day}: ${cell.count} ${eventType}`}
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

import React, { useMemo } from 'react';
import './ContributionGraph.css';

interface ContributionGraphProps {
  fixHistory?: Record<string, number>;
  weeks?: number;
}

const getIntensityClass = (count: number): string => {
  if (count === 0) return 'level-0';
  if (count < 5) return 'level-1';
  if (count < 15) return 'level-2';
  if (count < 30) return 'level-3';
  return 'level-4';
};

export const ContributionGraph: React.FC<ContributionGraphProps> = ({ fixHistory = {}, weeks = 12 }) => {
  const columns = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // To align properly with the day labels (Mon, Wed, Fri), the first row must be Sunday.
    // Calculate how many days we need to offset so the grid ends exactly on "today".
    // today.getDay() returns 0 for Sunday, 1 for Monday, etc.
    const currentDayOfWeek = today.getDay();
    const totalDays = (weeks * 7) - (6 - currentDayOfWeek);

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - totalDays + 1);

    const resultColumns: { date: string, count: number }[][] = [];
    let currentColumn: { date: string, count: number }[] = [];

    for (let i = 0; i < totalDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        // Use local date formatting to avoid timezone shift
        const dateString = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

        currentColumn.push({
            date: dateString,
            count: fixHistory[dateString] || 0
        });

        if (currentColumn.length === 7) {
            resultColumns.push(currentColumn);
            currentColumn = [];
        }
    }

    // If the last column isn't full, push it anyway (it will just have fewer squares)
    if (currentColumn.length > 0) {
        resultColumns.push(currentColumn);
    }

    return resultColumns;
  }, [fixHistory, weeks]);

  const maxCount = Object.values(fixHistory).reduce((a, b) => Math.max(a, b), 0);
  const isAllZero = maxCount === 0;

  return (
    <div className="contribution-graph" data-testid="contribution-graph">
      <div className="graph-header">
         <h4>Your Activity</h4>
         {isAllZero && <span className="subtitle">Start fixing to build your streak!</span>}
      </div>
      <div className="graph-grid-container">
          <div className="graph-days-labels">
              <span>Mon</span>
              <span>Wed</span>
              <span>Fri</span>
          </div>
          <div className="graph-grid">
            {columns.map((col, colIndex) => (
              <div className="graph-col" key={`col-${colIndex}`}>
                {col.map(day => (
                  <div
                    key={day.date}
                    className={`graph-square ${getIntensityClass(day.count)}`}
                    title={`${day.count} fixes on ${day.date}`}
                    data-testid={`square-${day.date}`}
                  />
                ))}
              </div>
            ))}
          </div>
      </div>
      <div className="graph-legend">
         <span>Less</span>
         <div className="graph-square level-0"></div>
         <div className="graph-square level-1"></div>
         <div className="graph-square level-2"></div>
         <div className="graph-square level-3"></div>
         <div className="graph-square level-4"></div>
         <span>More</span>
      </div>
    </div>
  );
};

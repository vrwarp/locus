import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Student } from '../utils/pco';
import { calculateDemographics, GENERATIONS } from '../utils/demographics';

interface GenerationStackProps {
  students: Student[];
}

export const GenerationStack: React.FC<GenerationStackProps> = ({ students }) => {
  const data = useMemo(() => calculateDemographics(students), [students]);

  // Filter out generations with 0 count to make the chart cleaner
  const displayData = data.filter(d => d.count > 0);

  if (displayData.length === 0) {
      return (
          <div className="report-card" style={{ padding: '2rem', textAlign: 'center' }}>
              <p>No demographic data available.</p>
          </div>
      );
  }

  return (
    <div className="report-card" style={{ padding: '1rem', height: '400px' }}>
      <h3 style={{ marginBottom: '1rem' }}>Demographics (Generation Stack)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={displayData}
          layout="vertical"
          margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e0e0e0" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#333' }} />
          <Tooltip
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {displayData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

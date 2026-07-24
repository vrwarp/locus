import React, { useMemo, useState } from 'react';
import './SentimentPulse.css';
import { calculateSentimentPulse } from '../utils/sentiment';
import { GENERATIONS } from '../utils/demographics';
import type { Student } from '../utils/pco';

interface SentimentPulseProps {
  students: Student[];
}

export const SentimentPulse: React.FC<SentimentPulseProps> = ({ students }) => {
  const [selectedDemographic, setSelectedDemographic] = useState<string>('All');

  const data = useMemo(() => calculateSentimentPulse(students, selectedDemographic), [students, selectedDemographic]);

  // Determine relative sizing
  const maxFreq = data.length > 0 ? data[0].value : 1;
  const minFreq = data.length > 0 ? data[data.length - 1].value : 1;

  // Base font size is 1rem, max is 4rem
  const calculateFontSize = (value: number) => {
      if (maxFreq === minFreq) return '2rem';

      const ratio = (value - minFreq) / (maxFreq - minFreq);
      const size = 1 + ratio * 3; // range: 1rem to 4rem
      return `${size.toFixed(2)}rem`;
  };

  if (students.length === 0) {
      return (
          <div className="sentiment-container">
              <div className="sentiment-header">
                  <h2>Spiritual Climate</h2>
                  <p>Wait for data to load...</p>
              </div>
          </div>
      );
  }

  if (data.length === 0) {
      return (
        <div className="sentiment-container">
            <div className="sentiment-header">
                <h2>Spiritual Climate</h2>
                <div className="header-controls">
                    <p>No themes detected for the selected criteria.</p>
                    <div className="filter-group">
                        <label htmlFor="demographic-filter">Target Audience:</label>
                        <select
                            id="demographic-filter"
                            value={selectedDemographic}
                            onChange={(e) => setSelectedDemographic(e.target.value)}
                        >
                            <option value="All">All Generations</option>
                            {GENERATIONS.map(gen => (
                                <option key={gen.name} value={gen.name}>{gen.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <div className="empty-state">No Data Available</div>
        </div>
      );
  }

  return (
    <div className="sentiment-container">
      <div className="sentiment-header">
        <h2>Spiritual Climate</h2>
        <div className="header-controls">
            <p>A word cloud derived from anonymized prayer requests and comment themes.</p>
            <div className="filter-group">
                <label htmlFor="demographic-filter">Target Audience:</label>
                <select
                    id="demographic-filter"
                    value={selectedDemographic}
                    onChange={(e) => setSelectedDemographic(e.target.value)}
                >
                    <option value="All">All Generations</option>
                    {GENERATIONS.map(gen => (
                        <option key={gen.name} value={gen.name}>{gen.name}</option>
                    ))}
                </select>
            </div>
        </div>
      </div>

      <div className="word-cloud-canvas">
        {data.map((item, index) => (
          <span
            key={index}
            className="word-cloud-item"
            style={{
              fontSize: calculateFontSize(item.value),
              opacity: 0.7 + (item.value / maxFreq) * 0.3, // more frequent = more opaque
              color: `hsl(${Math.random() * 360}, 70%, 50%)`, // Random color for standard word cloud feel
              transform: `rotate(${Math.random() > 0.5 ? 0 : 0}deg)`, // Can add random rotations if desired, keeping simple for now
            }}
          >
            {item.text}
          </span>
        ))}
      </div>

      <div className="sentiment-summary">
          Top theme: <strong>{data[0].text}</strong> ({data[0].value} occurrences)
      </div>
    </div>
  );
};
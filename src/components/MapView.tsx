import React, { useMemo, useState } from 'react';
import type { Student } from '../utils/pco';
import { calculateCityClusters, suggestCampusLocations } from '../utils/geospatial';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import './MapView.css';

interface MapViewProps {
  students: Student[];
}

export const MapView: React.FC<MapViewProps> = ({ students }) => {
  const [threshold, setThreshold] = useState(15);

  const { clusters, suggestions } = useMemo(() => {
    const calculatedClusters = calculateCityClusters(students);
    const calculatedSuggestions = suggestCampusLocations(calculatedClusters, threshold);

    return {
      clusters: calculatedClusters.slice(0, 20), // Top 20 for chart readability
      suggestions: calculatedSuggestions,
    };
  }, [students, threshold]);

  if (clusters.length === 0) {
    return (
      <div className="map-view empty">
        <span className="icon">🗺️</span>
        <h3>No Geospatial Data Found</h3>
        <p>Ensure your members have city addresses populated.</p>
      </div>
    );
  }

  const primaryCity = clusters[0]?.city;

  return (
    <div className="map-view">
      <div className="report-header">
        <p className="description">
          Visualizes member distribution across cities to identify potential new campus locations.
        </p>
        <div className="controls">
          <label htmlFor="threshold-slider">Suggestion Threshold: {threshold} members</label>
          <input
            id="threshold-slider"
            type="range"
            min="5"
            max="100"
            step="5"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="dashboard-card chart-card">
          <h3>Member Distribution (Top 20 Cities)</h3>
          <div style={{ height: 400, width: '100%' }}>
            <ResponsiveContainer>
              <BarChart
                data={clusters}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis
                  dataKey="city"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                  tick={{ fontSize: 12, fill: '#8892b0' }}
                />
                <YAxis tick={{ fill: '#8892b0' }} />
                <Tooltip
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                />
                <Bar dataKey="count" name="Members" radius={[4, 4, 0, 0]}>
                  {clusters.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.city === primaryCity ? '#3b82f6' : '#10b981'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
             <span className="legend-item"><span className="swatch primary"></span> Primary Campus ({primaryCity})</span>
             <span className="legend-item"><span className="swatch secondary"></span> Other Cities</span>
          </div>
        </div>

        <div className="dashboard-card suggestions-card">
          <h3>Predictive Planting Suggestions</h3>
          {suggestions.length === 0 ? (
            <div className="empty-state">
              <span className="icon">🌱</span>
              <p>No cities meet the threshold ({threshold} members) for a new campus.</p>
            </div>
          ) : (
            <ul className="suggestion-list">
              {suggestions.map((s, i) => (
                <li key={i} className="suggestion-item">
                  <div className="suggestion-city">
                    <span className="icon">📍</span>
                    <strong>{s.city}</strong>
                  </div>
                  <div className="suggestion-stats">
                    <span className="badge">{s.count} Members</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

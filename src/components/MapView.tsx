import React, { useMemo } from 'react';
import type { Student } from '../utils/pco';
import { calculateGeospatialClusters, suggestCampusPlant } from '../utils/geospatial';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import './MapView.css';

interface MapViewProps {
    students: Student[];
}

export const MapView: React.FC<MapViewProps> = ({ students }) => {
    const clusters = useMemo(() => calculateGeospatialClusters(students), [students]);
    const suggestedPlant = useMemo(() => suggestCampusPlant(clusters), [clusters]);

    if (clusters.length === 0) {
        return (
            <div className="map-view-empty">
                <p>No geographic data available. Ensure student records contain addresses.</p>
            </div>
        );
    }

    return (
        <div className="map-view">
            <div className="map-insights">
                <div className="insight-card">
                    <h3>Current Epicenter</h3>
                    <p className="large-stat">{clusters[0]?.city || 'Unknown'}</p>
                    <span className="stat-label">{clusters[0]?.count || 0} members</span>
                </div>

                {suggestedPlant && (
                    <div className="insight-card suggested-plant">
                        <h3>Suggested Next Campus</h3>
                        <p className="large-stat">{suggestedPlant}</p>
                        <span className="stat-label">Growing cluster with {clusters[1]?.count || 0} members</span>
                    </div>
                )}
            </div>

            <div className="map-chart-container" style={{ height: '400px', width: '100%', marginTop: '2rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={clusters.slice(0, 10)} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis
                            dataKey="city"
                            tick={{ fill: 'var(--text-color)' }}
                            angle={-45}
                            textAnchor="end"
                        />
                        <YAxis tick={{ fill: 'var(--text-color)' }} />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                            itemStyle={{ color: 'var(--primary-color)' }}
                        />
                        <Bar dataKey="count" fill="var(--primary-color)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

import React, { useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ComposedChart } from 'recharts';
import './SmartParking.css';

// Mock data for Smart Parking
const mockParkingData = [
  { time: '08:00 AM', capacity: 500, occupancy: 120, cars: 120, people: 250 },
  { time: '08:30 AM', capacity: 500, occupancy: 250, cars: 250, people: 520 },
  { time: '09:00 AM', capacity: 500, occupancy: 480, cars: 480, people: 1100 },
  { time: '09:30 AM', capacity: 500, occupancy: 490, cars: 490, people: 1150 },
  { time: '10:00 AM', capacity: 500, occupancy: 450, cars: 450, people: 1050 },
  { time: '10:30 AM', capacity: 500, occupancy: 300, cars: 300, people: 700 },
  { time: '11:00 AM', capacity: 500, occupancy: 470, cars: 470, people: 1080 },
  { time: '11:30 AM', capacity: 500, occupancy: 495, cars: 495, people: 1200 },
  { time: '12:00 PM', capacity: 500, occupancy: 200, cars: 200, people: 450 },
  { time: '12:30 PM', capacity: 500, occupancy: 50, cars: 50, people: 100 },
];

export const SmartParking: React.FC = () => {
  const [selectedView, setSelectedView] = useState<'occupancy' | 'ratio'>('occupancy');

  const currentOccupancy = mockParkingData[3].occupancy; // Mock current time as 09:30 AM
  const totalCapacity = mockParkingData[0].capacity;
  const occupancyPercentage = Math.round((currentOccupancy / totalCapacity) * 100);

  return (
    <div className="smart-parking-container">
      <div className="smart-parking-header">
        <h2>Smart Parking Integration</h2>
        <p>Camera integration to count cars vs people and monitor parking lot capacity.</p>
      </div>

      <div className="smart-parking-metrics">
        <div className="metric-card">
          <h3>Total Capacity</h3>
          <p className="metric-value">{totalCapacity}</p>
          <p className="metric-label">Spots Available</p>
        </div>
        <div className="metric-card">
          <h3>Current Occupancy</h3>
          <p className={`metric-value ${occupancyPercentage > 90 ? 'red' : occupancyPercentage > 75 ? 'yellow' : 'green'}`}>
            {currentOccupancy}
          </p>
          <p className="metric-label">{occupancyPercentage}% Full</p>
        </div>
        <div className="metric-card">
          <h3>Avg People / Car</h3>
          <p className="metric-value">2.3</p>
          <p className="metric-label">Based on camera counts</p>
        </div>
      </div>

      <div className="smart-parking-controls">
        <button
          className={selectedView === 'occupancy' ? 'active' : ''}
          onClick={() => setSelectedView('occupancy')}
        >
          Lot Occupancy
        </button>
        <button
          className={selectedView === 'ratio' ? 'active' : ''}
          onClick={() => setSelectedView('ratio')}
        >
          Cars vs People Ratio
        </button>
      </div>

      <div className="smart-parking-chart-wrapper">
        {selectedView === 'occupancy' ? (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={mockParkingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="occupancy" fill="#3b82f6" name="Occupied Spots" />
              <Line yAxisId="left" type="monotone" dataKey="capacity" stroke="#ef4444" name="Total Capacity" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={mockParkingData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="cars" fill="#8b5cf6" name="Cars Counted" />
              <Line yAxisId="right" type="monotone" dataKey="people" stroke="#10b981" name="People Counted" strokeWidth={3} />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { calculateGivingTrends } from '../utils/givingTrends';
import type { PcoCheckIn, PcoEvent } from '../utils/pco';
import './GivingTrends.css';

interface GivingTrendsProps {
  checkIns: PcoCheckIn[];
  events: PcoEvent[];
}

export const GivingTrends: React.FC<GivingTrendsProps> = ({ checkIns, events }) => {
  const data = useMemo(() => calculateGivingTrends(checkIns, events), [checkIns, events]);

  if (data.length === 0) {
    return (
      <div className="giving-trends-container">
        <div className="giving-trends-header">
          <h2>Stripe Giving Trends</h2>
          <p className="subtitle">Visualizing giving trends alongside attendance</p>
        </div>
        <div className="giving-trends-chart">
          <p className="giving-trends-empty">Not enough check-in data to visualize trends.</p>
        </div>
      </div>
    );
  }

  // Calculate some aggregate stats for a summary
  const totalAttendance = data.reduce((sum, d) => sum + d.attendance, 0);
  const totalGiving = data.reduce((sum, d) => sum + d.givingVolume, 0);
  const avgGiving = totalAttendance > 0 ? (totalGiving / totalAttendance).toFixed(2) : 0;

  return (
    <div className="giving-trends-container">
      <div className="giving-trends-header">
        <h2>Stripe Giving Trends</h2>
        <p className="subtitle">Visualizing giving trends alongside attendance</p>
        <p className="summary">
           Avg Giving per Attendee: <strong>${avgGiving}</strong>
        </p>
      </div>

      <div className="giving-trends-chart">
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart
            data={data}
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
            <XAxis
              dataKey="weekStarting"
              stroke="#94a3b8"
              tickFormatter={(val) => {
                 // Format YYYY-MM-DD to MM/DD
                 if (!val) return '';
                 const parts = val.split('-');
                 if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
                 return val;
              }}
            />
            {/* Left Y-Axis for Attendance (Bar) */}
            <YAxis
                yAxisId="left"
                stroke="#60a5fa"
                label={{ value: 'Attendance', angle: -90, position: 'insideLeft', fill: '#60a5fa' }}
            />
            {/* Right Y-Axis for Giving Volume (Line) */}
            <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                tickFormatter={(val) => `$${val}`}
                label={{ value: 'Giving Volume ($)', angle: 90, position: 'insideRight', fill: '#10b981' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }}/>

            <Bar
                yAxisId="left"
                dataKey="attendance"
                name="Attendance"
                fill="#3b82f6"
                radius={[4, 4, 0, 0]}
                barSize={30}
            />
            <Line
                yAxisId="right"
                type="monotone"
                dataKey="givingVolume"
                name="Giving Volume"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4, fill: '#10b981', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from 'recharts';
import type { Student } from '../utils/pco';
import { getFrequencyForGrade, playTone } from '../utils/audio';

interface GradeScatterProps {
  data: Student[];
  onPointClick?: (student: Student) => void;
  colorblindMode?: boolean;
  muteSounds?: boolean;
}

export const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const student = payload[0].payload as Student;
    return (
      <div style={{
        backgroundColor: 'var(--bg-color)',
        border: '1px solid var(--chart-grid-color)',
        padding: '12px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        color: 'var(--text-color)',
        minWidth: '220px',
        zIndex: 1000
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
            {student.avatarUrl ? (
                <img
                    src={student.avatarUrl}
                    alt={student.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '12px', objectFit: 'cover', border: '2px solid var(--chart-grid-color)' }}
                />
            ) : (
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    marginRight: '12px',
                    backgroundColor: 'var(--chart-grid-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid var(--text-color)'
                }}>
                    <span style={{ fontSize: '16px', fontWeight: 'bold' }}>{student.name.charAt(0)}</span>
                </div>
            )}
            <div>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{student.name}</div>
                <div style={{ fontSize: '12px', opacity: 0.7 }}>ID: {student.id}</div>
            </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
            <div>
                <span style={{ opacity: 0.7, display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Age</span>
                <strong>{student.age} yrs</strong>
            </div>
             <div>
                <span style={{ opacity: 0.7, display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Grade</span>
                <strong>{student.pcoGrade}</strong>
            </div>
             <div>
                <span style={{ opacity: 0.7, display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Expected</span>
                <strong>{student.calculatedGrade}</strong>
            </div>
            <div>
                <span style={{ opacity: 0.7, display: 'block', fontSize: '11px', textTransform: 'uppercase' }}>Delta</span>
                <strong style={{ color: student.delta !== 0 ? 'var(--anomaly-color)' : 'var(--safe-color)' }}>
                    {student.delta > 0 ? `+${student.delta}` : student.delta} yrs
                </strong>
            </div>
        </div>
      </div>
    );
  }
  return null;
};

const CustomShape = (props: any) => {
    const { cx, cy, fill, payload, colorblindMode, onPointClick, muteSounds } = props;
    const isAnomaly = Math.abs(payload.delta) > 0;

    const handleFocus = () => {
        if (!muteSounds && payload.pcoGrade !== undefined) {
            const frequency = getFrequencyForGrade(payload.pcoGrade);
            playTone(frequency);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (onPointClick) {
                onPointClick(payload);
            }
        }
    };

    const ariaLabel = `Student: ${payload.name}, Grade: ${payload.pcoGrade}, Delta: ${payload.delta > 0 ? '+' : ''}${payload.delta} years`;

    if (colorblindMode && isAnomaly) {
        // Render a Triangle for anomalies in colorblind mode
        // Manually drawing a triangle path to ensure visibility
        // Pointing up: top (cx, cy-6), bottom-right (cx+6, cy+6), bottom-left (cx-6, cy+6)
        return (
            <path
                d={`M${cx},${cy - 6} L${cx + 6},${cy + 6} L${cx - 6},${cy + 6} Z`}
                fill={fill}
                tabIndex={0}
                aria-label={ariaLabel}
                role="button"
                onFocus={handleFocus}
                onKeyDown={handleKeyDown}
                style={{ cursor: 'pointer' }}
            />
        );
    }

    // Default Circle
    return (
        <circle
            cx={cx}
            cy={cy}
            r={5}
            fill={fill}
            tabIndex={0}
            aria-label={ariaLabel}
            role="button"
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            style={{ cursor: 'pointer' }}
        />
    );
};

export const GradeScatter = ({ data, onPointClick, colorblindMode, muteSounds }: GradeScatterProps) => (
  <ScatterChart
    width={800}
    height={600}
    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
  >
    <XAxis
      type="number"
      dataKey="age"
      name="Age"
      unit="yrs"
      domain={[0, 'auto']}
      tick={{ fill: 'var(--chart-text-color)' }}
      stroke="var(--chart-grid-color)"
    />
    <YAxis
      type="number"
      dataKey="pcoGrade"
      name="Grade"
      domain={[-1, 12]}
      allowDataOverflow={true}
      label={{ value: 'Grade', angle: -90, position: 'insideLeft', fill: 'var(--chart-text-color)' }}
      tick={{ fill: 'var(--chart-text-color)' }}
      stroke="var(--chart-grid-color)"
    />
    <Tooltip
      cursor={{ strokeDasharray: '3 3' }}
      content={<CustomTooltip />}
    />
    <Scatter
      name="Students"
      data={data}
      cursor="pointer"
      shape={
          <CustomShape
              colorblindMode={colorblindMode}
              onPointClick={onPointClick}
              muteSounds={muteSounds}
          />
      }
      onClick={(dataPoint: any) => {
        // Recharts onClick passes an object that contains the payload (original data)
        // This handles mouse clicks on the scatter group/symbol wrapper
        if (onPointClick && dataPoint && dataPoint.payload) {
          onPointClick(dataPoint.payload as Student);
        }
      }}
      onMouseEnter={(dataPoint: any) => {
          const grade = dataPoint.pcoGrade ?? dataPoint.payload?.pcoGrade;
          if (!muteSounds && grade !== undefined) {
              const frequency = getFrequencyForGrade(grade);
              playTone(frequency);
          }
      }}
    >
      {data.map((entry, index) => (
        <Cell
          key={`cell-${index}`}
          fill={Math.abs(entry.delta) > 0 ? 'var(--anomaly-color)' : 'var(--safe-color)'}
        />
      ))}
    </Scatter>
    {/* The Diagonal of Truth: A reference line where x - 5 = y */}
    <ReferenceLine
      segment={[{ x: 0, y: -5 }, { x: 30, y: 25 }]}
      stroke="var(--safe-color)"
      strokeDasharray="3 3"
      label={{ value: "Diagonal of Truth", fill: 'var(--chart-text-color)' }}
      ifOverflow="extendDomain"
    />
  </ScatterChart>
);

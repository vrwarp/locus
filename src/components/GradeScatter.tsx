import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from 'recharts';
import type { Student } from '../utils/pco';

interface GradeScatterProps {
  data: Student[];
  onPointClick?: (student: Student) => void;
}

export const GradeScatter = ({ data, onPointClick }: GradeScatterProps) => (
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
      name="Recorded Grade"
      domain={['auto', 'auto']}
      tick={{ fill: 'var(--chart-text-color)' }}
      stroke="var(--chart-grid-color)"
    />
    <Tooltip
      cursor={{ strokeDasharray: '3 3' }}
      contentStyle={{
        backgroundColor: 'var(--bg-color)',
        color: 'var(--text-color)',
        borderColor: 'var(--chart-grid-color)'
      }}
    />
    <Scatter
      name="Students"
      data={data}
      cursor="pointer"
      onClick={(dataPoint: any) => {
        // Recharts onClick passes an object that contains the payload (original data)
        if (onPointClick && dataPoint && dataPoint.payload) {
          onPointClick(dataPoint.payload as Student);
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

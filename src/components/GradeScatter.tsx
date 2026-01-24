import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';

interface Student {
  id: string;
  age: number;      // X-Axis
  pcoGrade: number; // Y-Axis
  name: string;
}

export const GradeScatter = ({ data }: { data: Student[] }) => (
  <ScatterChart
    width={800}
    height={600}
    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
  >
    <XAxis type="number" dataKey="age" name="Age" unit="yrs" domain={[0, 'auto']} />
    <YAxis type="number" dataKey="pcoGrade" name="Recorded Grade" domain={['auto', 'auto']} />
    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
    <Scatter name="Students" data={data} fill="#8884d8" />
    {/* The Diagonal of Truth: A reference line where x - 5 = y */}
    <ReferenceLine
      segment={[{ x: 0, y: -5 }, { x: 30, y: 25 }]}
      stroke="green"
      strokeDasharray="3 3"
      label="Diagonal of Truth"
      ifOverflow="extendDomain"
    />
  </ScatterChart>
);

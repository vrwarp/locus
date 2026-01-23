import { ScatterChart, Scatter, XAxis, YAxis, Tooltip } from 'recharts';

interface Student {
  id: string;
  age: number;      // X-Axis
  pcoGrade: number; // Y-Axis
  name: string;
}

export const GradeScatter = ({ data }: { data: Student[] }) => (
  <ScatterChart width={800} height={600}>
    <XAxis type="number" dataKey="age" name="Age" unit="yrs" />
    <YAxis type="number" dataKey="pcoGrade" name="Recorded Grade" />
    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
    <Scatter name="Students" data={data} fill="#8884d8" />
    {/* The Diagonal of Truth: A reference line where x - 5 = y */}
  </ScatterChart>
);

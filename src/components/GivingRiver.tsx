import React, { useMemo } from 'react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import { generateMockGivingData } from '../utils/giving';

interface GivingRiverProps {}

const COLORS = ['#8884d8', '#8dd1e1', '#82ca9d', '#ffc658', '#a4de6c', '#d0ed57', '#ff7300'];

const GivingNode = ({ x, y, width, height, index, payload, containerWidth }: any) => {
  const isOut = x + width + 6 > containerWidth;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={COLORS[index % COLORS.length]} />
      <text
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2}
        textAnchor={isOut ? 'end' : 'start'}
        alignmentBaseline="middle"
        fill="#ccc"
        fontSize="12"
      >
        {payload.name}
      </text>
    </g>
  );
};

export const GivingRiver: React.FC<GivingRiverProps> = () => {
  const data = useMemo(() => generateMockGivingData(), []);

  return (
    <div className="report-container giving-river" data-testid="giving-river-container">
      <h2>The Giving River</h2>
      <p>Visualizing the flow of contributions to various funds and destinations.</p>

      <div className="chart-wrapper" style={{ height: 400, marginTop: '2rem' }}>
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={data}
            node={<GivingNode />}
            nodePadding={50}
            margin={{ top: 20, right: 100, bottom: 20, left: 100 }}
            link={{ stroke: '#77c878', strokeOpacity: 0.2 }}
          >
            <Tooltip
              contentStyle={{ backgroundColor: '#2a2a2a', border: 'none', borderRadius: '4px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
              labelStyle={{ color: '#888' }}
              formatter={(value: number) => `$${value.toLocaleString()}`}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

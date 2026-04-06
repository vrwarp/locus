import React, { useMemo } from 'react';
import { Sankey, Tooltip, ResponsiveContainer, Layer, Rectangle } from 'recharts';
import { getGivingFlowData } from '../utils/giving';
import './GivingRiver.css';

// Recharts Sankey requires custom node/link components or relies on defaults.
// We'll use a basic custom node to display names clearly.
const CustomNode = ({ x, y, width, height, index, payload, containerWidth }: any) => {
  const isOut = x + width + 6 > containerWidth;
  return (
    <Layer key={`CustomNode${index}`}>
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill="#3b82f6"
        fillOpacity="1"
      />
      <text
        textAnchor={isOut ? 'end' : 'start'}
        x={isOut ? x - 6 : x + width + 6}
        y={y + height / 2}
        fontSize="12"
        fill="#e2e8f0"
        dominantBaseline="middle"
      >
        {payload.name}
      </text>
    </Layer>
  );
};

export const GivingRiver: React.FC = () => {
  const data = useMemo(() => getGivingFlowData(), []);

  return (
    <div className="giving-river-container">
      <div className="giving-river-header">
        <h2>The Giving River</h2>
        <p className="subtitle">Visualizing the flow of generosity</p>
      </div>

      <div className="giving-river-chart">
        {/* Recharts Sankey requires explicit dimensions or ResponsiveContainer */}
        <ResponsiveContainer width="100%" height={800}>
          <Sankey
            data={data}
            node={<CustomNode />}
            nodePadding={30}
            margin={{
              top: 40,
              right: 150,
              bottom: 40,
              left: 100,
            }}
            link={{ stroke: '#60a5fa', strokeOpacity: 0.3 }}
          >
            <Tooltip
              formatter={(value: number) => `$${value.toLocaleString()}`}
              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
              itemStyle={{ color: '#f8fafc' }}
            />
          </Sankey>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

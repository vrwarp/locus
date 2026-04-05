import React, { useMemo } from 'react';
import { ResponsiveContainer, Sankey, Tooltip, Rectangle, Layer } from 'recharts';
import './GivingRiver.css';

interface GivingRiverProps {
    // Optionally take some auth or config if needed, but for now we'll use mock data
}

export const GivingRiver: React.FC<GivingRiverProps> = () => {
    // Mock data representing giving flow for the last year
    // Nodes:
    // 0: Total Giving
    // 1: General Fund
    // 2: Missions
    // 3: Building Fund
    // 4: Local Outreach
    // 5: Global Missions
    // 6: Staff & Admin
    // 7: Ministry Programs
    // 8: Maintenance & Debt
    const data = useMemo(() => ({
        nodes: [
            { name: "Total Giving" },         // 0
            { name: "General Fund" },         // 1
            { name: "Missions Fund" },        // 2
            { name: "Building Fund" },        // 3
            { name: "Local Outreach" },       // 4
            { name: "Global Missions" },      // 5
            { name: "Staff & Admin" },        // 6
            { name: "Ministry Programs" },    // 7
            { name: "Maintenance" }           // 8
        ],
        links: [
            // Level 1: Total to Funds
            { source: 0, target: 1, value: 1200000 },
            { source: 0, target: 2, value: 300000 },
            { source: 0, target: 3, value: 500000 },

            // Level 2: General Fund Breakdown
            { source: 1, target: 6, value: 700000 },
            { source: 1, target: 7, value: 500000 },

            // Level 2: Missions Fund Breakdown
            { source: 2, target: 4, value: 100000 },
            { source: 2, target: 5, value: 200000 },

            // Level 2: Building Fund Breakdown
            { source: 3, target: 8, value: 500000 }
        ]
    }), []);

    // Custom rendering to handle nodes nicely without default JS DOM measurement errors in testing
    const renderNode = (props: any) => {
        const { x, y, width, height, index, payload } = props;
        // Check if we have valid dimensions to render
        if (typeof x !== 'number' || typeof y !== 'number' || typeof width !== 'number' || typeof height !== 'number') {
            return null;
        }

        const isOut = index > 3 && index !== 0; // Just visual coloring logic
        const fill = index === 0 ? '#8884d8' : index < 4 ? '#82ca9d' : '#ffc658';

        return (
            <Layer key={`CustomNode${index}`}>
                <Rectangle
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    fill={fill}
                    fillOpacity={0.8}
                    data-testid={`sankey-node-${index}`}
                />
                <text
                    textAnchor={isOut ? 'end' : 'start'}
                    x={isOut ? x - 6 : x + width + 6}
                    y={y + height / 2}
                    fontSize="14"
                    fill="#333"
                    dy={5}
                >
                    {payload.name}
                </text>
            </Layer>
        );
    };

    const renderTooltip = (props: any) => {
        const { active, payload } = props;
        if (active && payload && payload.length) {
            const item = payload[0];
            // Format currency
            const formatter = new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
                maximumFractionDigits: 0
            });
            const valueFormatted = formatter.format(item.value);

            return (
                <div className="sankey-tooltip">
                    <p className="label">{item.name}</p>
                    <p className="intro">{valueFormatted}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="giving-river-container">
            <div className="giving-river-header">
                <h2>The Giving River</h2>
                <p>Visualizing the flow of generosity across funds and ministries.</p>
            </div>

            <div className="chart-container">
                <ResponsiveContainer width="100%" height={600}>
                    <Sankey
                        data={data}
                        dataKey="value"
                        nodePadding={50}
                        nodeWidth={20}
                        margin={{ top: 20, right: 150, bottom: 20, left: 20 }}
                        link={{ stroke: '#cbd5e1', strokeOpacity: 0.5 }}
                        node={renderNode}
                    >
                        <Tooltip content={renderTooltip} />
                    </Sankey>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

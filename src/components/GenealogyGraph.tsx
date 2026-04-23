import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { Student } from '../utils/pco';
import { buildGenealogyGraph, computeGenealogyLayout, type GenealogyNode } from '../utils/genealogy';

interface GenealogyGraphProps {
  students: Student[];
}

const HOUSEHOLD_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#F1948A', '#85C1E9', '#82E0AA',
    '#F1C40F', '#E67E22', '#E74C3C', '#2ECC71', '#1ABC9C'
];

const getHouseholdColor = (householdId: string) => {
    let hash = 0;
    for (let i = 0; i < householdId.length; i++) {
        hash = householdId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % HOUSEHOLD_COLORS.length;
    return HOUSEHOLD_COLORS[index];
};

export const GenealogyGraph: React.FC<GenealogyGraphProps> = ({ students }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<GenealogyNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
      const updateDimensions = () => {
          if (containerRef.current) {
              setDimensions({
                  width: containerRef.current.clientWidth,
                  height: 600
              });
          }
      };

      updateDimensions();
      window.addEventListener('resize', updateDimensions);
      return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const graph = useMemo(() => {
      if (!students.length) return null;
      const initialGraph = buildGenealogyGraph(students);
      if (initialGraph.nodes.length === 0) return null;

      const layoutedNodes = computeGenealogyLayout(
          initialGraph.nodes,
          initialGraph.links,
          dimensions.width,
          dimensions.height
      );

      return { nodes: layoutedNodes, links: initialGraph.links };
  }, [students, dimensions]);

  if (!students.length || !graph) {
      return (
          <div className="empty-state" style={{ padding: '2rem', textAlign: 'center' }}>
              <p>Not enough household data to build a genealogy graph.</p>
          </div>
      );
  }

  return (
    <div ref={containerRef} style={{ width: '100%', height: '600px', position: 'relative', background: '#f8f9fa', borderRadius: '8px', overflow: 'hidden' }}>
        <svg width={dimensions.width} height={dimensions.height}>
            <g>
                {graph.links.map((link, i) => {
                    const source = graph.nodes.find(n => n.id === link.source);
                    const target = graph.nodes.find(n => n.id === link.target);
                    if (!source || !target) return null;

                    let strokeDasharray = "0";
                    let strokeWidth = 2;
                    let strokeColor = "#ccc";

                    if (link.type === 'spouse') {
                        strokeColor = "#e74c3c"; // Reddish for marriage
                        strokeWidth = 3;
                    } else if (link.type === 'sibling') {
                        strokeDasharray = "4 4"; // Dashed for siblings
                        strokeWidth = 1.5;
                        strokeColor = "#95a5a6";
                    } else {
                        strokeColor = "#34495e"; // Solid dark for parent-child
                    }

                    return (
                        <line
                            key={`link-${i}`}
                            x1={source.x}
                            y1={source.y}
                            x2={target.x}
                            y2={target.y}
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeDasharray={strokeDasharray}
                            strokeOpacity={0.6}
                        />
                    );
                })}
            </g>

            <g>
                {graph.nodes.map((node) => (
                    <circle
                        key={node.id}
                        cx={node.x}
                        cy={node.y}
                        r={node.radius}
                        fill={getHouseholdColor(node.householdId)}
                        stroke="#fff"
                        strokeWidth={2}
                        onMouseEnter={(e) => {
                            setHoveredNode(node);
                            const rect = containerRef.current?.getBoundingClientRect();
                            if (rect) {
                                setTooltipPos({
                                    x: e.clientX - rect.left + 10,
                                    y: e.clientY - rect.top + 10
                                });
                            }
                        }}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={{ cursor: 'pointer', transition: 'r 0.2s' }}
                    />
                ))}
            </g>
        </svg>

        {hoveredNode && (
            <div style={{
                position: 'absolute',
                top: tooltipPos.y,
                left: tooltipPos.x,
                background: 'rgba(0,0,0,0.8)',
                color: '#fff',
                padding: '8px 12px',
                borderRadius: '4px',
                fontSize: '0.9rem',
                pointerEvents: 'none',
                zIndex: 20,
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}>
                <div style={{ fontWeight: 'bold' }}>{hoveredNode.name}</div>
                <div style={{ fontSize: '0.8em', color: '#ddd' }}>Age: {hoveredNode.age}</div>
                <div style={{ fontSize: '0.8em', color: '#bbb', marginTop: 4 }}>
                    {hoveredNode.isChild ? 'Child' : 'Parent'}
                </div>
            </div>
        )}
    </div>
  );
};

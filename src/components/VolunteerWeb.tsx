import React, { useEffect, useState, useMemo, useRef } from 'react';
import { fetchEvents, fetchRecentCheckIns } from '../utils/pco';
import { buildVolunteerGraph, computeForceLayout, type GraphNode, type GraphLink } from '../utils/volunteerWeb';
import type { Student, PcoCheckIn, PcoEvent } from '../utils/pco';

interface VolunteerWebProps {
  auth: string;
  students: Student[];
}

const TEAM_COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
    '#F7DC6F', '#BB8FCE', '#F1948A', '#85C1E9', '#82E0AA'
];

const getTeamColor = (team: string) => {
    let hash = 0;
    for (let i = 0; i < team.length; i++) {
        hash = team.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % TEAM_COLORS.length;
    return TEAM_COLORS[index];
};

export const VolunteerWeb: React.FC<VolunteerWebProps> = ({ auth, students }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ checkIns: PcoCheckIn[], events: PcoEvent[] } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        // Fetch last 20 pages to get sufficient data for graph
        const [events, checkIns] = await Promise.all([
          fetchEvents(auth),
          fetchRecentCheckIns(auth, 20)
        ]);

        if (isMounted) {
          setData({ checkIns, events });
        }
      } catch (err) {
        if (isMounted) {
          console.error(err);
          setError('Failed to load volunteer data.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [auth]);

  // Handle resize
  useEffect(() => {
    if (containerRef.current) {
        setDimensions({
            width: containerRef.current.clientWidth,
            height: Math.max(500, containerRef.current.clientHeight)
        });
    }
  }, [loading]);

  const graph = useMemo(() => {
      if (!data || !students.length) return null;
      const { nodes, links } = buildVolunteerGraph(data.checkIns, data.events, students);
      // Run layout
      const layoutNodes = computeForceLayout(nodes, links, dimensions.width, dimensions.height);
      return { nodes: layoutNodes, links };
  }, [data, students, dimensions]);

  if (loading) return <div style={{padding: '2rem', textAlign: 'center', color: '#666'}}>Analyzing volunteer connections...</div>;
  if (error) return <div className="error" style={{padding: '1rem', color: 'red'}}>{error}</div>;
  if (!graph || graph.nodes.length === 0) {
      return (
        <div style={{padding: '2rem', textAlign: 'center', color: '#666'}}>
            <h3>No Connections Found</h3>
            <p>Not enough volunteer data to build a network graph.</p>
        </div>
      );
  }

  return (
    <div className="volunteer-web-container" ref={containerRef} style={{ width: '100%', height: '100%', minHeight: '500px', position: 'relative' }}>
        <h3 style={{position: 'absolute', top: 10, left: 10, margin: 0, zIndex: 10, background: 'rgba(255,255,255,0.8)', padding: '5px 10px', borderRadius: 4}}>
            The Volunteer Web
        </h3>
        <p style={{position: 'absolute', top: 40, left: 10, margin: 0, fontSize: '0.8rem', color: '#666', zIndex: 10, background: 'rgba(255,255,255,0.8)', padding: '2px 5px', borderRadius: 4}}>
            Visualizing who serves together. Thicker lines = more shared shifts.
        </p>

        <svg width={dimensions.width} height={dimensions.height} style={{background: '#f8f9fa', borderRadius: 8}}>
            {/* Links */}
            <g>
                {graph.links.map((link, i) => {
                    const source = graph.nodes.find(n => n.id === link.source)!;
                    const target = graph.nodes.find(n => n.id === link.target)!;
                    return (
                        <line
                            key={`link-${i}`}
                            x1={source.x}
                            y1={source.y}
                            x2={target.x}
                            y2={target.y}
                            stroke="#999"
                            strokeOpacity={Math.min(0.8, 0.1 + link.weight * 0.05)}
                            strokeWidth={Math.min(5, Math.sqrt(link.weight))}
                        />
                    );
                })}
            </g>

            {/* Nodes */}
            <g>
                {graph.nodes.map((node) => (
                    <circle
                        key={node.id}
                        cx={node.x}
                        cy={node.y}
                        r={node.radius}
                        fill={getTeamColor(node.team)}
                        stroke="#fff"
                        strokeWidth={2}
                        onMouseEnter={(e) => {
                            setHoveredNode(node);
                            // Calculate tooltip position relative to SVG/Container
                            const rect = containerRef.current?.getBoundingClientRect();
                            if (rect) {
                                setTooltipPos({
                                    x: e.clientX - rect.left + 10,
                                    y: e.clientY - rect.top + 10
                                });
                            }
                        }}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={{cursor: 'pointer', transition: 'r 0.2s'}}
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
                <div style={{fontWeight: 'bold'}}>{hoveredNode.name}</div>
                <div style={{fontSize: '0.8em', color: '#ddd'}}>{hoveredNode.team}</div>
                <div style={{fontSize: '0.8em', color: '#bbb', marginTop: 4}}>Connections: {
                    graph.links.filter(l => l.source === hoveredNode.id || l.target === hoveredNode.id).length
                }</div>
            </div>
        )}
    </div>
  );
};

import React, { useMemo, useState } from 'react';
import type { Student } from '../utils/pco';
import './SolarSystem.css';

interface SolarSystemProps {
    students: Student[];
}

interface FamilySystem {
    householdId: string;
    familyName: string;
    parents: Student[];
    children: Student[];
}

export const SolarSystem: React.FC<SolarSystemProps> = ({ students }) => {
    const [selectedSystem, setSelectedSystem] = useState<FamilySystem | null>(null);

    const systems = useMemo(() => {
        const householdMap = new Map<string, FamilySystem>();

        students.forEach(s => {
            if (!s.householdId) return;

            if (!householdMap.has(s.householdId)) {
                householdMap.set(s.householdId, {
                    householdId: s.householdId,
                    familyName: s.lastName || 'Unknown',
                    parents: [],
                    children: []
                });
            }

            const family = householdMap.get(s.householdId)!;

            if (s.isChild) {
                family.children.push(s);
            } else {
                family.parents.push(s);
            }
        });

        // Filter out households with no children or no parents to make interesting systems
        return Array.from(householdMap.values())
            .filter(f => f.parents.length > 0 && f.children.length > 0)
            .sort((a, b) => a.familyName.localeCompare(b.familyName));
    }, [students]);

    if (systems.length === 0) {
        return (
            <div className="solar-system-container empty">
                <h3>The Solar System</h3>
                <p>No complete family structures (parents + children) found to visualize.</p>
            </div>
        );
    }

    const renderSolarSystem = (system: FamilySystem) => {
        // Find average parent age to determine center star size
        const avgParentAge = system.parents.reduce((sum, p) => sum + p.age, 0) / system.parents.length;

        // Base sizes
        const centerSize = 60 + Math.min(40, avgParentAge * 0.5);
        const maxRadius = 300;

        return (
            <div className="system-view">
                <button className="back-btn" onClick={() => setSelectedSystem(null)}>
                    &larr; Back to Galaxy
                </button>
                <div className="system-header">
                    <h3>The {system.familyName} System</h3>
                    <p>Parents: {system.parents.map(p => `${p.name} (${Math.round(p.age)})`).join(', ')}</p>
                </div>

                <div className="system-stage">
                    <svg viewBox={`-350 -350 700 700`} width="100%" height="100%">
                        {/* Center Star (Parents) */}
                        <circle
                            cx="0"
                            cy="0"
                            r={centerSize / 2}
                            fill="#FDB813"
                            className="sun"
                        />
                        <text x="0" y="5" textAnchor="middle" fill="#fff" fontSize="12" fontWeight="bold">
                            {system.parents.map(p => p.firstName).join(' & ')}
                        </text>

                        {/* Planets (Children) */}
                        {system.children.map((child, index) => {
                            // Distance based on age gap.
                            // Larger age gap = further away
                            const ageGap = avgParentAge - child.age;
                            // Ensure a minimum distance and scale up
                            const distance = Math.max(centerSize, centerSize + (ageGap * 5));

                            // Calculate angle to space them out
                            const angle = (index * (360 / system.children.length)) * (Math.PI / 180);

                            const x = Math.cos(angle) * distance;
                            const y = Math.sin(angle) * distance;

                            // Planet size based on age (older kids are slightly bigger planets)
                            const planetSize = Math.max(10, Math.min(30, child.age * 1.5));

                            return (
                                <g key={child.id} className="planet-group">
                                    {/* Orbit path */}
                                    <circle
                                        cx="0"
                                        cy="0"
                                        r={distance}
                                        fill="none"
                                        stroke="rgba(255, 255, 255, 0.1)"
                                        strokeDasharray="4 4"
                                    />

                                    {/* Planet */}
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={planetSize / 2}
                                        fill="#4ECDC4"
                                        className="planet"
                                    />

                                    {/* Label */}
                                    <text
                                        x={x}
                                        y={y + (planetSize/2) + 15}
                                        textAnchor="middle"
                                        fill="#ccc"
                                        fontSize="12"
                                    >
                                        {child.firstName} ({Math.round(child.age)})
                                    </text>
                                </g>
                            );
                        })}
                    </svg>
                </div>
            </div>
        );
    };

    return (
        <div className="solar-system-container">
            {selectedSystem ? (
                renderSolarSystem(selectedSystem)
            ) : (
                <>
                    <div className="galaxy-header">
                        <h3>The Galaxy</h3>
                        <p>Select a family solar system to explore. Distance represents the age gap.</p>
                    </div>
                    <div className="galaxy-grid">
                        {systems.map(system => (
                            <div
                                key={system.householdId}
                                className="galaxy-card"
                                onClick={() => setSelectedSystem(system)}
                            >
                                <div className="galaxy-card-icon">
                                    <div className="mini-sun"></div>
                                    {system.children.slice(0,3).map((_, i) => (
                                        <div key={i} className={`mini-planet orbit-${i+1}`}></div>
                                    ))}
                                </div>
                                <h4>{system.familyName}</h4>
                                <div className="galaxy-card-stats">
                                    <span>{system.parents.length} Stars</span>
                                    <span>{system.children.length} Planets</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

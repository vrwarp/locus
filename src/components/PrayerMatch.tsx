import React, { useMemo, useState } from 'react';
import type { Student } from '../utils/pco';
import { matchPrayerPartners } from '../utils/prayer';
import type { PrayerMatch as PrayerMatchType } from '../utils/prayer';
import './PrayerMatch.css';

interface PrayerMatchProps {
    students: Student[];
}

export const PrayerMatch: React.FC<PrayerMatchProps> = ({ students }) => {
    // Generate matches once when the component mounts or students change
    const matches = useMemo(() => matchPrayerPartners(students), [students]);

    // Keep it anonymous initially
    const [revealMap, setRevealMap] = useState<Record<number, boolean>>({});

    const toggleReveal = (index: number) => {
        setRevealMap(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    if (matches.length === 0) {
        return (
            <div className="prayer-match-empty">
                <h3>No Prayer Partners Found</h3>
                <p>Ensure that people have a 'prayer_topic' assigned to be matched.</p>
            </div>
        );
    }

    // Group matches by topic for display
    const groupedMatches = matches.reduce((acc, match) => {
        if (!acc[match.topic]) acc[match.topic] = [];
        acc[match.topic].push(match);
        return acc;
    }, {} as Record<string, PrayerMatchType[]>);

    return (
        <div className="prayer-match-container">
            <div className="prayer-header">
                <h2>Prayer Partner Match</h2>
                <p>Matching people with similar life struggles for prayer support (Anonymously at first).</p>
            </div>

            {Object.entries(groupedMatches).map(([topic, topicMatches]) => (
                <div key={topic} className="prayer-topic-section">
                    <h3 className="topic-title">Struggle: {topic}</h3>
                    <div className="matches-grid">
                        {topicMatches.map((match, localIdx) => {
                            // Using the global match index across all topics could be complex,
                            // let's just use a string key or the array index since it's static per render
                            // But we need a unique index for the reveal toggle.
                            // Better: use the index in the original `matches` array
                            const globalIndex = matches.indexOf(match);
                            const isRevealed = !!revealMap[globalIndex];

                            return (
                                <div key={globalIndex} className="match-card">
                                    <div className="partner partner-a">
                                        <div className="avatar-placeholder">
                                            {isRevealed ? (
                                                <img src={match.personA.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.personA.name)}`} alt="Avatar" />
                                            ) : (
                                                <span className="anonymous-icon">👤</span>
                                            )}
                                        </div>
                                        <div className="partner-details">
                                            <h4>{isRevealed ? match.personA.name : `Person ${match.personA.id.substring(0, 3)}`}</h4>
                                            {isRevealed && <span className="contact">{match.personA.email || match.personA.phone || 'No Contact Info'}</span>}
                                        </div>
                                    </div>

                                    <div className="match-connector">
                                        <span className="connector-line"></span>
                                        <span className="connector-icon">🤝</span>
                                        <span className="connector-line"></span>
                                    </div>

                                    <div className="partner partner-b">
                                        {match.personB ? (
                                            <>
                                                <div className="avatar-placeholder">
                                                    {isRevealed ? (
                                                        <img src={match.personB.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(match.personB.name)}`} alt="Avatar" />
                                                    ) : (
                                                        <span className="anonymous-icon">👤</span>
                                                    )}
                                                </div>
                                                <div className="partner-details">
                                                    <h4>{isRevealed ? match.personB.name : `Person ${match.personB.id.substring(0, 3)}`}</h4>
                                                    {isRevealed && <span className="contact">{match.personB.email || match.personB.phone || 'No Contact Info'}</span>}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="partner-details empty">
                                                <h4>Unmatched</h4>
                                                <span className="contact">Waiting for a partner</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="reveal-action">
                                        <button onClick={() => toggleReveal(globalIndex)} className="reveal-btn">
                                            {isRevealed ? 'Hide Identities' : 'Reveal Identities'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { GamificationState } from '../utils/storage';
import './CampusCup.css';

interface CampusCupProps {
    gamificationState?: GamificationState;
    userCampus?: string;
}

const BASE_SCORES = {
    'Main Campus': 15420,
    'North Campus': 12100,
    'South Campus': 9850,
    'East Campus': 7230,
    'Online': 4100
};

export const CampusCup: React.FC<CampusCupProps> = ({ gamificationState, userCampus = 'Main Campus' }) => {
    // We add simulated score updates to make the leaderboard feel alive
    const [liveScores, setLiveScores] = useState<Record<string, number>>(BASE_SCORES);
    const [recentActivity, setRecentActivity] = useState<number>(0);

    // Simulate other users submitting fixes globally
    useEffect(() => {
        const interval = setInterval(() => {
            setLiveScores(prev => {
                const next = { ...prev };
                const campuses = Object.keys(next);
                // Pick a random campus to get a burst of points
                const randomCampus = campuses[Math.floor(Math.random() * campuses.length)];
                next[randomCampus] += Math.floor(Math.random() * 5) + 1;
                return next;
            });

            // Simulate user's campus getting global fixes in the last 24h
            if (Math.random() > 0.5) {
                setRecentActivity(prev => prev + 1);
            }
        }, 3000); // update every 3 seconds

        return () => clearInterval(interval);
    }, []);

    const data = useMemo(() => {
        const totalFixes = gamificationState?.totalFixes || 0;

        const leaderboard = Object.entries(liveScores).map(([campus, baseScore]) => {
            const isUserCampus = campus === userCampus;
            // The user's personal fixes are added on top of the live simulated base score
            return {
                campus,
                score: baseScore + (isUserCampus ? totalFixes : 0),
                isUserCampus
            };
        });

        // Sort by score descending
        return leaderboard.sort((a, b) => b.score - a.score);
    }, [gamificationState, userCampus, liveScores]);

    return (
        <div className="campus-cup">
            <h2>🏆 The Campus Cup</h2>
            <p className="subtitle">Compete globally. Clean locally. Which campus will reign supreme?</p>

            <div className="leaderboard" style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="campus" type="category" width={120} tick={{ fill: '#2c3e50', fontWeight: 'bold' }} />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                            formatter={(value: number) => [value.toLocaleString(), 'Total Fixes']}
                        />
                        <Bar dataKey="score" radius={[0, 4, 4, 0]} isAnimationActive={true} animationDuration={1000}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.isUserCampus ? '#3498db' : '#bdc3c7'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="user-impact">
                <h3>Your Impact</h3>
                <p>
                    You have contributed <strong>{(gamificationState?.totalFixes || 0).toLocaleString()} fixes</strong> to <strong>{userCampus}</strong>!
                </p>
                <p className="recent-activity" style={{ marginTop: '0.5rem', color: '#e67e22' }}>
                    🔥 <strong>{recentActivity} fixes</strong> submitted by your campus in the last 24 hours.
                </p>
            </div>
        </div>
    );
};

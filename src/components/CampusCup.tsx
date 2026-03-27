import React, { useMemo } from 'react';
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
    const data = useMemo(() => {
        const totalFixes = gamificationState?.totalFixes || 0;

        const leaderboard = Object.entries(BASE_SCORES).map(([campus, baseScore]) => {
            const isUserCampus = campus === userCampus;
            return {
                campus,
                score: baseScore + (isUserCampus ? totalFixes : 0),
                isUserCampus
            };
        });

        // Sort by score descending
        return leaderboard.sort((a, b) => b.score - a.score);
    }, [gamificationState, userCampus]);

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
                        <Bar dataKey="score" radius={[0, 4, 4, 0]}>
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
            </div>
        </div>
    );
};

import React, { useEffect, useState } from 'react';
import { FunnelChart, Funnel, Tooltip, LabelList, ResponsiveContainer, Cell } from 'recharts';
import { calculateNewcomerFunnel, type FunnelStep } from '../utils/retention';
import { fetchRecentCheckIns, type PcoCheckIn } from '../utils/pco';

interface NewcomerFunnelProps {
  auth: string;
}

export const NewcomerFunnel: React.FC<NewcomerFunnelProps> = ({ auth }) => {
  const [data, setData] = useState<FunnelStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const checkIns = await fetchRecentCheckIns(auth);
        const funnelData = calculateNewcomerFunnel(checkIns);
        setData(funnelData);
      } catch (err) {
        console.error('Failed to load retention data', err);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (auth) {
      loadData();
    }
  }, [auth]);

  if (loading) return <div className="loading">Loading Retention Data...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="newcomer-funnel">
      <h3>The Newcomer Funnel (Last 12 Months)</h3>
      <div style={{ width: '100%', height: 400 }}>
        <ResponsiveContainer>
          <FunnelChart>
            <Tooltip />
            <Funnel
              dataKey="value"
              data={data}
              isAnimationActive
            >
              <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
              <LabelList position="center" fill="#fff" stroke="none" dataKey="value" />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
      <div className="funnel-legend" style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', gap: '2rem' }}>
          {data.length > 0 && (
              <div style={{textAlign: 'center'}}>
                  <strong>Total Newcomers</strong>
                  <div style={{fontSize: '1.5rem', color: data[0].fill}}>{data[0].value}</div>
              </div>
          )}
           {data.length > 3 && data[0].value > 0 && (
              <div style={{textAlign: 'center'}}>
                  <strong>Retention Rate</strong>
                  <div style={{fontSize: '1.5rem', color: data[3].fill}}>
                      {Math.round((data[3].value / data[0].value) * 100)}%
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

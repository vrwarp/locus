export interface GivingNode {
  name: string;
}

export interface GivingLink {
  source: number;
  target: number;
  value: number;
}

export interface GivingFlowData {
  nodes: GivingNode[];
  links: GivingLink[];
}

export type DateRange = 'all-time' | 'this-year' | 'this-month';

export const getGivingFlowData = (range: DateRange = 'all-time'): GivingFlowData => {
  const multipliers: Record<DateRange, number> = {
    'all-time': 1,
    'this-year': 0.3,
    'this-month': 0.05
  };

  const multiplier = multipliers[range];

  return {
    nodes: [
      { name: 'General Fund' },      // 0
      { name: 'Tithe' },             // 1
      { name: 'Offerings' },         // 2
      { name: 'Missions' },          // 3
      { name: 'Building Fund' },     // 4
      { name: 'Local Outreach' },    // 5
      { name: 'Youth Ministry' },    // 6
      { name: 'Kids Ministry' },     // 7
      { name: 'Global Missions' },   // 8
      { name: 'Disaster Relief' }    // 9
    ],
    links: [
      { source: 1, target: 0, value: Math.round(500000 * multiplier) },
      { source: 2, target: 0, value: Math.round(200000 * multiplier) },
      { source: 0, target: 3, value: Math.round(150000 * multiplier) },
      { source: 0, target: 4, value: Math.round(100000 * multiplier) },
      { source: 0, target: 5, value: Math.round(50000 * multiplier) },
      { source: 0, target: 6, value: Math.round(75000 * multiplier) },
      { source: 0, target: 7, value: Math.round(125000 * multiplier) },
      { source: 3, target: 8, value: Math.round(100000 * multiplier) },
      { source: 3, target: 9, value: Math.round(50000 * multiplier) }
    ]
  };
};

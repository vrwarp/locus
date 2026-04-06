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

export const getGivingFlowData = (): GivingFlowData => {
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
      { source: 1, target: 0, value: 500000 },
      { source: 2, target: 0, value: 200000 },
      { source: 0, target: 3, value: 150000 },
      { source: 0, target: 4, value: 100000 },
      { source: 0, target: 5, value: 50000 },
      { source: 0, target: 6, value: 75000 },
      { source: 0, target: 7, value: 125000 },
      { source: 3, target: 8, value: 100000 },
      { source: 3, target: 9, value: 50000 }
    ]
  };
};

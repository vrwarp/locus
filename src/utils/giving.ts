export interface GivingNode {
  name: string;
}

export interface GivingLink {
  source: number;
  target: number;
  value: number;
}

export interface GivingData {
  nodes: GivingNode[];
  links: GivingLink[];
}

export function generateMockGivingData(): GivingData {
  return {
    nodes: [
      { name: 'General Fund' }, // 0
      { name: 'Missions' },     // 1
      { name: 'Building' },     // 2
      { name: 'Youth' },        // 3
      { name: 'Tithes' },       // 4
      { name: 'Offerings' },    // 5
      { name: 'Special Events' }// 6
    ],
    links: [
      { source: 4, target: 0, value: 50000 },
      { source: 5, target: 0, value: 20000 },
      { source: 6, target: 3, value: 5000 },
      { source: 0, target: 1, value: 15000 },
      { source: 0, target: 2, value: 25000 },
      { source: 0, target: 3, value: 10000 }
    ]
  };
}

import type { Student } from './pco';

export interface GenealogyNode {
  id: string;
  name: string;
  isChild: boolean;
  age: number;
  householdId: string;
  radius: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GenealogyLink {
  source: string;
  target: string;
  type: 'spouse' | 'parent-child' | 'sibling';
}

export const buildGenealogyGraph = (
  students: Student[]
): { nodes: GenealogyNode[]; links: GenealogyLink[] } => {
  const nodes: GenealogyNode[] = [];
  const links: GenealogyLink[] = [];
  const householdMap = new Map<string, Student[]>();

  students.forEach(s => {
    if (!s.householdId) return;

    if (!householdMap.has(s.householdId)) {
      householdMap.set(s.householdId, []);
    }
    householdMap.get(s.householdId)!.push(s);

    nodes.push({
      id: s.id,
      name: s.name,
      isChild: s.isChild,
      age: s.age,
      householdId: s.householdId,
      radius: s.isChild ? 8 : 12,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0
    });
  });

  householdMap.forEach((members, householdId) => {
    const parents = members.filter(m => !m.isChild);
    const children = members.filter(m => m.isChild);

    // Spouses
    if (parents.length >= 2) {
      for (let i = 0; i < parents.length; i++) {
        for (let j = i + 1; j < parents.length; j++) {
          links.push({
            source: parents[i].id,
            target: parents[j].id,
            type: 'spouse'
          });
        }
      }
    }

    // Parent-Child
    parents.forEach(parent => {
      children.forEach(child => {
        links.push({
          source: parent.id,
          target: child.id,
          type: 'parent-child'
        });
      });
    });

    // Siblings
    if (children.length >= 2) {
      for (let i = 0; i < children.length; i++) {
        for (let j = i + 1; j < children.length; j++) {
          links.push({
            source: children[i].id,
            target: children[j].id,
            type: 'sibling'
          });
        }
      }
    }
  });

  return { nodes, links };
};

export const computeGenealogyLayout = (
  nodes: GenealogyNode[],
  links: GenealogyLink[],
  width: number,
  height: number,
  iterations: number = 300
): GenealogyNode[] => {
  // Group nodes by household to initialize them close to each other
  const householdCenters = new Map<string, { x: number, y: number }>();
  let cX = width / 4;
  let cY = height / 4;
  const hSpacing = Math.sqrt((width * height) / (new Set(nodes.map(n => n.householdId)).size + 1));

  nodes.forEach(node => {
    if (!householdCenters.has(node.householdId)) {
        householdCenters.set(node.householdId, {
            x: cX + (Math.random() - 0.5) * 50,
            y: cY + (Math.random() - 0.5) * 50
        });
        cX += hSpacing;
        if (cX > width - hSpacing) {
            cX = width / 4;
            cY += hSpacing;
        }
    }
    const center = householdCenters.get(node.householdId)!;
    node.x = center.x + (Math.random() - 0.5) * 20;
    node.y = center.y + (Math.random() - 0.5) * 20;
    node.vx = 0;
    node.vy = 0;
  });

  const center = { x: width / 2, y: height / 2 };
  const k = Math.sqrt((width * height) / (nodes.length + 1));
  const repulsionForce = 4000;
  const attractionForce = 0.1;
  const centerGravity = 0.05;
  const maxVelocity = 100;
  const damping = 0.85;

  for (let i = 0; i < iterations; i++) {
    // 1. Repulsion
    for (let j = 0; j < nodes.length; j++) {
      for (let l = j + 1; l < nodes.length; l++) {
        const n1 = nodes[j];
        const n2 = nodes[l];

        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        let distSq = dx * dx + dy * dy;

        if (distSq === 0) {
            distSq = 0.1;
        }

        const dist = Math.sqrt(distSq);

        let force = repulsionForce / distSq;

        // Apply a much stronger repulsion if they are from different households
        if (n1.householdId !== n2.householdId) {
            force *= 5; // keep families separate
        }

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        n1.vx += fx;
        n1.vy += fy;
        n2.vx -= fx;
        n2.vy -= fy;
      }
    }

    // 2. Attraction
    links.forEach(link => {
      const source = nodes.find(n => n.id === link.source);
      const target = nodes.find(n => n.id === link.target);

      if (!source || !target) return;

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.1;

      // Adjust ideal distance and pull strength based on relationship type
      let idealDist = k * 0.5;
      let pullForce = attractionForce;

      if (link.type === 'spouse') {
          idealDist = k * 0.3;
          pullForce = attractionForce * 1.5;
      } else if (link.type === 'parent-child') {
          idealDist = k * 0.8;
          pullForce = attractionForce;
      } else if (link.type === 'sibling') {
          idealDist = k * 0.6;
          pullForce = attractionForce * 0.8;
      }

      const force = (dist - idealDist) * pullForce;

      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    });

    // 3. Center Gravity
    nodes.forEach(node => {
      node.vx += (center.x - node.x) * centerGravity;
      node.vy += (center.y - node.y) * centerGravity;
    });

    // 4. Update Positions
    const temp = 1 - (i / iterations);

    nodes.forEach(node => {
      const vMag = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (vMag > maxVelocity) {
          node.vx = (node.vx / vMag) * maxVelocity;
          node.vy = (node.vy / vMag) * maxVelocity;
      }

      node.x += node.vx * temp;
      node.y += node.vy * temp;

      node.vx *= damping;
      node.vy *= damping;

      const padding = node.radius + 10;
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    });
  }

  return nodes;
};

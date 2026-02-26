import { startOfDay, parseISO } from 'date-fns';
import type { Student, PcoCheckIn, PcoEvent } from './pco';
import { classifyEvent } from './burnout';

export interface GraphNode {
  id: string;
  name: string;
  team: string; // Most frequent team
  radius: number; // Based on degree (number of connections)
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface GraphLink {
  source: string;
  target: string;
  weight: number; // Number of shared shifts
}

export const buildVolunteerGraph = (
  checkIns: PcoCheckIn[],
  events: PcoEvent[],
  students: Student[]
): { nodes: GraphNode[]; links: GraphLink[] } => {
  const eventNameMap = new Map<string, string>();
  events.forEach(e => eventNameMap.set(e.id, e.attributes.name));

  // 1. Filter Serving Check-ins
  const servingCheckIns = checkIns.filter(c => {
    const eventId = c.relationships.event.data.id;
    const eventName = eventNameMap.get(eventId) || '';
    const event = events.find(e => e.id === eventId);

    // Check if event is 'Serving' OR check-in kind is 'Volunteer'
    const isServingEvent = event ? classifyEvent(event) === 'Serving' : false;
    return isServingEvent || c.attributes.kind === 'Volunteer';
  });

  // 2. Group by Shift (Event + Date)
  // Key: `${eventId}:${dateString}`
  const shiftGroups = new Map<string, Set<string>>(); // Set of personIds

  servingCheckIns.forEach(c => {
    const eventId = c.relationships.event.data.id;
    if (!c.attributes.created_at) return;

    const date = startOfDay(parseISO(c.attributes.created_at)).toISOString();
    const key = `${eventId}:${date}`;

    if (!shiftGroups.has(key)) {
      shiftGroups.set(key, new Set());
    }
    shiftGroups.get(key)!.add(c.relationships.person.data.id);
  });

  // 3. Build Nodes and Links
  const nodeMap = new Map<string, GraphNode>();
  const linkMap = new Map<string, number>(); // Key: `${sourceId}-${targetId}` (sorted), Value: weight
  const teamCounts = new Map<string, Map<string, number>>(); // personId -> { teamName -> count }

  shiftGroups.forEach((personIds, key) => {
    const eventId = key.split(':')[0];
    const teamName = eventNameMap.get(eventId) || 'Unknown Team';
    const people = Array.from(personIds);

    // Update Nodes & Team Counts
    people.forEach(pid => {
      if (!teamCounts.has(pid)) {
        teamCounts.set(pid, new Map());
      }
      const counts = teamCounts.get(pid)!;
      counts.set(teamName, (counts.get(teamName) || 0) + 1);

      if (!nodeMap.has(pid)) {
        const student = students.find(s => s.id === pid);
        nodeMap.set(pid, {
          id: pid,
          name: student ? student.name : 'Unknown',
          team: 'Unknown', // Set later
          radius: 5,
          x: 0,
          y: 0,
          vx: 0,
          vy: 0
        });
      }
    });

    // Create Links (Clique)
    for (let i = 0; i < people.length; i++) {
      for (let j = i + 1; j < people.length; j++) {
        const p1 = people[i];
        const p2 = people[j];
        // Sort IDs to ensure consistent key
        const [source, target] = p1 < p2 ? [p1, p2] : [p2, p1];
        const linkKey = `${source}:${target}`;
        linkMap.set(linkKey, (linkMap.get(linkKey) || 0) + 1);
      }
    }
  });

  // Finalize Nodes (Assign Primary Team)
  nodeMap.forEach(node => {
    const counts = teamCounts.get(node.id);
    if (counts) {
      let maxCount = 0;
      let bestTeam = 'Unknown';
      counts.forEach((count, team) => {
        if (count > maxCount) {
          maxCount = count;
          bestTeam = team;
        }
      });
      node.team = bestTeam;
    }
  });

  // Calculate Degree (for radius)
  const degrees = new Map<string, number>();
  linkMap.forEach((weight, key) => {
      const [source, target] = key.split(':');
      degrees.set(source, (degrees.get(source) || 0) + weight);
      degrees.set(target, (degrees.get(target) || 0) + weight);
  });

  nodeMap.forEach(node => {
      const degree = degrees.get(node.id) || 0;
      node.radius = 5 + Math.sqrt(degree) * 2; // Scale radius
  });

  const nodes = Array.from(nodeMap.values());
  const links = Array.from(linkMap.entries()).map(([key, weight]) => {
    const [source, target] = key.split(':');
    return { source, target, weight };
  });

  return { nodes, links };
};

export const computeForceLayout = (
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
  iterations: number = 300
): GraphNode[] => {
  // Initialize positions randomly
  nodes.forEach(node => {
    node.x = width / 2 + (Math.random() - 0.5) * 50;
    node.y = height / 2 + (Math.random() - 0.5) * 50;
    node.vx = 0;
    node.vy = 0;
  });

  const center = { x: width / 2, y: height / 2 };
  const k = Math.sqrt((width * height) / (nodes.length + 1)); // Optimal distance
  const repulsionForce = 5000;
  const attractionForce = 0.05;
  const centerGravity = 0.01;
  const maxVelocity = 100;
  const damping = 0.9;

  for (let i = 0; i < iterations; i++) {
    // 1. Repulsion (All pairs)
    for (let j = 0; j < nodes.length; j++) {
      for (let l = j + 1; l < nodes.length; l++) {
        const n1 = nodes[j];
        const n2 = nodes[l];
        let dx = n1.x - n2.x;
        let dy = n1.y - n2.y;
        let distSq = dx * dx + dy * dy;

        if (distSq === 0) {
            dx = (Math.random() - 0.5);
            dy = (Math.random() - 0.5);
            distSq = dx*dx + dy*dy;
        }

        const dist = Math.sqrt(distSq);
        const force = repulsionForce / distSq;

        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        n1.vx += fx;
        n1.vy += fy;
        n2.vx -= fx;
        n2.vy -= fy;
      }
    }

    // 2. Attraction (Links)
    links.forEach(link => {
      const source = nodes.find(n => n.id === link.source)!;
      const target = nodes.find(n => n.id === link.target)!;

      let dx = target.x - source.x;
      let dy = target.y - source.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Force proportional to distance (Spring)
      // High weight = stronger spring (shorter distance preferred?)
      // Actually standard force layout: force = dist / k * attraction
      // Let's make stronger links pull harder.
      const force = (dist - k) * attractionForce * (1 + Math.log(link.weight));

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
    // Temperature (cool down)
    const temp = 1 - (i / iterations);

    nodes.forEach(node => {
      // Limit velocity
      const vMag = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
      if (vMag > maxVelocity) {
          node.vx = (node.vx / vMag) * maxVelocity;
          node.vy = (node.vy / vMag) * maxVelocity;
      }

      node.x += node.vx * temp;
      node.y += node.vy * temp;

      // Damping
      node.vx *= damping;
      node.vy *= damping;

      // Bounds (Keep inside box)
      const padding = node.radius + 10;
      node.x = Math.max(padding, Math.min(width - padding, node.x));
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    });
  }

  return nodes;
};

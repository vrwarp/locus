import { describe, it, expect } from 'vitest';
import { buildVolunteerGraph } from './volunteerWeb';
import type { Student, PcoCheckIn, PcoEvent } from './pco';

describe('buildVolunteerGraph', () => {
  const mockStudents: Student[] = [
    { id: '1', name: 'Alice', firstName: 'Alice', lastName: 'A', age: 30, pcoGrade: null, birthdate: '1990-01-01', calculatedGrade: 0, delta: 0, lastCheckInAt: null, checkInCount: 0, groupCount: 0, isChild: false, householdId: '1', hasNameAnomaly: false, hasEmailAnomaly: false, hasAddressAnomaly: false, hasPhoneAnomaly: false },
    { id: '2', name: 'Bob', firstName: 'Bob', lastName: 'B', age: 32, pcoGrade: null, birthdate: '1988-01-01', calculatedGrade: 0, delta: 0, lastCheckInAt: null, checkInCount: 0, groupCount: 0, isChild: false, householdId: '2', hasNameAnomaly: false, hasEmailAnomaly: false, hasAddressAnomaly: false, hasPhoneAnomaly: false },
    { id: '3', name: 'Charlie', firstName: 'Charlie', lastName: 'C', age: 25, pcoGrade: null, birthdate: '1995-01-01', calculatedGrade: 0, delta: 0, lastCheckInAt: null, checkInCount: 0, groupCount: 0, isChild: false, householdId: '3', hasNameAnomaly: false, hasEmailAnomaly: false, hasAddressAnomaly: false, hasPhoneAnomaly: false },
  ];

  const mockEvents: PcoEvent[] = [
    { id: 'e1', type: 'Event', attributes: { name: 'Kids Ministry Team' } }, // Serving
    { id: 'e2', type: 'Event', attributes: { name: 'Sunday Service' } }, // Worship
  ];

  it('should create links between volunteers in the same shift', () => {
    const checkIns: PcoCheckIn[] = [
      // Shift 1: Alice and Bob serve together
      {
        id: 'c1', type: 'CheckIn',
        attributes: { created_at: '2023-01-01T09:00:00Z', kind: 'Volunteer' },
        relationships: { person: { data: { type: 'Person', id: '1' } }, event: { data: { type: 'Event', id: 'e1' } } }
      },
      {
        id: 'c2', type: 'CheckIn',
        attributes: { created_at: '2023-01-01T09:05:00Z', kind: 'Volunteer' },
        relationships: { person: { data: { type: 'Person', id: '2' } }, event: { data: { type: 'Event', id: 'e1' } } }
      },
      // Charlie serves alone on another day
      {
        id: 'c3', type: 'CheckIn',
        attributes: { created_at: '2023-01-08T09:00:00Z', kind: 'Volunteer' },
        relationships: { person: { data: { type: 'Person', id: '3' } }, event: { data: { type: 'Event', id: 'e1' } } }
      }
    ];

    const { nodes, links } = buildVolunteerGraph(checkIns, mockEvents, mockStudents);

    expect(nodes).toHaveLength(3);
    expect(links).toHaveLength(1);

    const link = links[0];
    expect(link.source).toBe('1');
    expect(link.target).toBe('2');
    expect(link.weight).toBe(1);
  });

  it('should ignore non-serving check-ins unless marked as Volunteer', () => {
    const checkIns: PcoCheckIn[] = [
      // Alice checks in to Worship (Regular) - Should be ignored
      {
        id: 'c1', type: 'CheckIn',
        attributes: { created_at: '2023-01-01T10:00:00Z', kind: 'Regular' },
        relationships: { person: { data: { type: 'Person', id: '1' } }, event: { data: { type: 'Event', id: 'e2' } } }
      },
      // Bob checks in to Worship but marked as Volunteer - Should be included (e.g. Ushering in service)
      {
        id: 'c2', type: 'CheckIn',
        attributes: { created_at: '2023-01-01T10:00:00Z', kind: 'Volunteer' },
        relationships: { person: { data: { type: 'Person', id: '2' } }, event: { data: { type: 'Event', id: 'e2' } } }
      }
    ];

    const { nodes, links } = buildVolunteerGraph(checkIns, mockEvents, mockStudents);

    expect(nodes).toHaveLength(1);
    expect(nodes[0].id).toBe('2');
    expect(links).toHaveLength(0);
  });
});

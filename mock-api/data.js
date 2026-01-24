
export const people = [
  {
    id: '1',
    type: 'Person',
    attributes: {
      name: 'Valid Kindergartner',
      first_name: 'Valid',
      last_name: 'Kindergartner',
      grade: 0,
      birthdate: '2019-01-01'
    }
  },
  {
    id: '2',
    type: 'Person',
    attributes: {
      name: 'Valid Fifth Grader',
      first_name: 'Valid',
      last_name: 'Fifth Grader',
      grade: 5,
      birthdate: '2014-01-01'
    }
  },
  {
    id: '3',
    type: 'Person',
    attributes: {
      name: 'Anomaly Too Old',
      first_name: 'Anomaly',
      last_name: 'Too Old',
      grade: 1,
      birthdate: '2014-01-01'
    }
  },
  {
    id: '4',
    type: 'Person',
    attributes: {
      name: 'Anomaly Too Young',
      first_name: 'Anomaly',
      last_name: 'Too Young',
      grade: 10,
      birthdate: '2019-01-01'
    }
  }
];

// Generate more to test pagination (Total >= 100)
// We already have 4, so add 96 more.
for (let i = 5; i <= 100; i++) {
  const birthYear = 2010 + (i % 10); // Varied birth years
  people.push({
    id: String(i),
    type: 'Person',
    attributes: {
      name: `Student ${i}`,
      first_name: 'Student',
      last_name: String(i),
      grade: i % 13, // Grades 0-12
      birthdate: `${birthYear}-01-01`
    }
  });
}

export const events = [
  {
    id: '1',
    type: 'Event',
    attributes: {
      name: 'Sunday Service',
      frequency: 'weekly'
    }
  },
  {
    id: '2',
    type: 'Event',
    attributes: {
      name: 'Youth Group',
      frequency: 'weekly'
    }
  }
];

// Generate more events (Total >= 100)
// We have 2, add 98
for (let i = 3; i <= 100; i++) {
  events.push({
    id: String(i),
    type: 'Event',
    attributes: {
      name: `Event ${i}`,
      frequency: i % 2 === 0 ? 'weekly' : 'monthly'
    }
  });
}

export const checkIns = [
  {
    id: '1',
    type: 'CheckIn',
    attributes: {
      created_at: '2023-10-01T09:00:00Z',
      kind: 'Regular'
    },
    relationships: {
      person: { data: { type: 'Person', id: '1' } },
      event: { data: { type: 'Event', id: '1' } }
    }
  },
  {
    id: '2',
    type: 'CheckIn',
    attributes: {
      created_at: '2023-10-08T09:00:00Z',
      kind: 'Regular'
    },
    relationships: {
      person: { data: { type: 'Person', id: '1' } },
      event: { data: { type: 'Event', id: '1' } }
    }
  },
  {
    id: '3',
    type: 'CheckIn',
    attributes: {
      created_at: '2023-10-04T18:00:00Z',
      kind: 'Guest'
    },
    relationships: {
      person: { data: { type: 'Person', id: '2' } },
      event: { data: { type: 'Event', id: '2' } }
    }
  }
];

// Generate more checkIns (Total >= 100)
// We have 3, add 97
for (let i = 4; i <= 100; i++) {
  const personId = String((i % 100) + 1); // Link to existing people
  const eventId = String((i % 100) + 1); // Link to existing events
  checkIns.push({
    id: String(i),
    type: 'CheckIn',
    attributes: {
      created_at: '2023-11-01T09:00:00Z', // Static date for generated ones for now
      kind: i % 5 === 0 ? 'Guest' : 'Regular'
    },
    relationships: {
      person: { data: { type: 'Person', id: personId } },
      event: { data: { type: 'Event', id: eventId } }
    }
  });
}

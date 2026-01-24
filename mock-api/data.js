
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

// Generate more to test pagination (Total 30)
for (let i = 5; i <= 30; i++) {
  people.push({
    id: String(i),
    type: 'Person',
    attributes: {
      name: `Student ${i}`,
      first_name: 'Student',
      last_name: String(i),
      grade: i % 13, // Grades 0-12
      birthdate: '2015-01-01'
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

import express from 'express';
import cors from 'cors';
import { people, events, checkIns, donations } from './data.js';
import { fileURLToPath } from 'url';

export const app = express();

app.use(cors());
// Support both standard JSON and JSON:API content type
app.use(express.json({ type: ['application/json', 'application/vnd.api+json'] }));

// In-memory store (copy of seed data)
// We export this or provide a reset function for testing if needed
let db = {
  people: JSON.parse(JSON.stringify(people)),
  events: JSON.parse(JSON.stringify(events)),
  checkIns: JSON.parse(JSON.stringify(checkIns)),
  donations: JSON.parse(JSON.stringify(donations))
};

export const resetDb = () => {
  db = {
    people: JSON.parse(JSON.stringify(people)),
    events: JSON.parse(JSON.stringify(events)),
    checkIns: JSON.parse(JSON.stringify(checkIns)),
    donations: JSON.parse(JSON.stringify(donations))
  };
};

// Generic Pagination Helper
const paginate = (req, collection) => {
  const per_page = parseInt(req.query.per_page) || 25;
  const offset = parseInt(req.query.offset) || 0;

  const paginated = collection.slice(offset, offset + per_page);

  const nextOffset = offset + per_page;
  const hasNext = nextOffset < collection.length;

  // Construct absolute URLs using the request host
  const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;

  const links = {
    self: `${baseUrl}?offset=${offset}&per_page=${per_page}`
  };

  if (hasNext) {
    links.next = `${baseUrl}?offset=${nextOffset}&per_page=${per_page}`;
  }

  return { paginated, links };
};

// People API
app.get('/people/v2/people', (req, res) => {
  const { paginated, links } = paginate(req, db.people);

  res.json({
    links,
    data: paginated,
    meta: {
      total_count: db.people.length,
      count: paginated.length,
      can_include: [],
      parent: {}
    }
  });
});

app.get('/people/v2/people/:id', (req, res) => {
  const person = db.people.find(p => p.id === req.params.id);
  if (!person) return res.status(404).json({ errors: [{ status: '404', title: 'Not found' }] });
  res.json({ data: person });
});

app.patch('/people/v2/people/:id', (req, res) => {
  const personIndex = db.people.findIndex(p => p.id === req.params.id);
  if (personIndex === -1) return res.status(404).json({ errors: [{ status: '404', title: 'Not found' }] });

  // PCO Structure: body.data.attributes
  const updates = req.body?.data?.attributes;

  // Minimal validation
  if (!updates) {
     return res.status(400).json({ errors: [{ status: '400', title: 'Bad Request' }] });
  }

  const current = db.people[personIndex];

  // Deep merge attributes
  const updated = {
    ...current,
    attributes: {
      ...current.attributes,
      ...updates
    }
  };

  db.people[personIndex] = updated;

  res.json({ data: updated });
});

// Giving API
app.get('/giving/v2/people/:id/donations', (req, res) => {
    // Filter donations by person ID
    const personDonations = db.donations.filter(d =>
        d.relationships?.person?.data?.id === req.params.id
    );

    // Sort by date desc (mocking real API behavior usually)
    personDonations.sort((a, b) => new Date(b.attributes.received_at) - new Date(a.attributes.received_at));

    const { paginated, links } = paginate(req, personDonations);

    res.json({
        links,
        data: paginated,
        meta: {
            total_count: personDonations.length,
            count: paginated.length,
            can_include: [],
            parent: {
                id: req.params.id,
                type: 'Person'
            }
        }
    });
});

// Check-Ins API
app.get('/check-ins/v2/check_ins', (req, res) => {
  const { paginated, links } = paginate(req, db.checkIns);

  res.json({
    links,
    data: paginated,
    meta: {
      total_count: db.checkIns.length,
      count: paginated.length,
      can_include: [],
      parent: {}
    }
  });
});

app.get('/check-ins/v2/events', (req, res) => {
  const { paginated, links } = paginate(req, db.events);

  res.json({
    links,
    data: paginated,
    meta: {
      total_count: db.events.length,
      count: paginated.length,
      can_include: [],
      parent: {}
    }
  });
});

// API V2 (Admin/Platform)
app.get('/api/v2', (req, res) => {
  // Return basic root info or empty list for unsupported endpoints
  res.json({
    data: {
      type: 'Organization',
      id: '1',
      attributes: {
        name: 'Mock Church'
      }
    }
  });
});

app.get('/api/v2/connected_applications', (req, res) => {
    res.json({
        data: [],
        meta: { total_count: 0, count: 0 }
    });
});


// Helper to start the server from tests or script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Mock PCO API running on port ${PORT}`);
  });
}

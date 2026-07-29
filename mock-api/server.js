import express from 'express';
import cors from 'cors';
import { people, events, checkIns } from './data.js';
import { fileURLToPath } from 'url';

export const app = express();

app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
});

app.use(cors());

// The Vite dev proxy strips `/api` before forwarding, so the app's own paths
// carry that prefix. Accept it here as well, so this server can stand in for the
// proxy when something addresses it directly — a test, or curl.
//
// Product paths only: `/api/v2/...` below is the platform API, a real route on
// PCO rather than a proxied one, and must not have its prefix eaten.
const PROXY_PREFIX = /^\/api\/(people|check-ins)\//;
app.use((req, res, next) => {
  if (PROXY_PREFIX.test(req.url)) {
    req.url = req.url.slice('/api'.length);
  }
  next();
});

// Support both standard JSON and JSON:API content type
app.use(express.json({ type: ['application/json', 'application/vnd.api+json'] }));

// In-memory store (copy of seed data)
// We export this or provide a reset function for testing if needed
let db = {
  people: JSON.parse(JSON.stringify(people)),
  events: JSON.parse(JSON.stringify(events)),
  checkIns: JSON.parse(JSON.stringify(checkIns)).reverse(), // Newest first
};

export const resetDb = () => {
  db = {
    people: JSON.parse(JSON.stringify(people)),
    events: JSON.parse(JSON.stringify(events)),
    checkIns: JSON.parse(JSON.stringify(checkIns)),
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

// --- A person's contact records, as PCO actually exposes them ----------------
//
// PCO does not keep emails, phone numbers or addresses on the Person: each is
// its own resource under `/people/{id}/<collection>`, addressed by its own id.
// This mock stores them inline, which is convenient and is also why the app was
// written to PATCH them onto the Person — a write real PCO accepts and ignores.
//
// These routes project the inline arrays as the collections PCO serves, and
// write back through to them, so the app's contact edits exercise the same
// request shape here as they do against PCO or pcomirror.
const CONTACT_COLLECTIONS = {
  emails: { attr: 'email_addresses', type: 'Email' },
  phone_numbers: { attr: 'phone_numbers', type: 'PhoneNumber' },
  addresses: { attr: 'addresses', type: 'Address' },
};

// A stable synthetic id: these have no id of their own inline, but PCO's do, and
// the app reads one back to decide between PATCH and POST.
const contactId = (personId, collection, index) => `${personId}-${collection}-${index}`;

const withContacts = (req, res, next) => {
  const meta = CONTACT_COLLECTIONS[req.params.collection];
  if (!meta) return res.status(404).json({ errors: [{ status: '404', title: 'Not found' }] });
  const person = db.people.find(p => p.id === req.params.id);
  if (!person) return res.status(404).json({ errors: [{ status: '404', title: 'Not found' }] });
  req.contact = { meta, person };
  next();
};

app.get('/people/v2/people/:id/:collection', withContacts, (req, res) => {
  const { meta, person } = req.contact;
  const records = person.attributes[meta.attr] || [];
  res.json({
    data: records.map((attributes, i) => ({
      id: contactId(person.id, req.params.collection, i),
      type: meta.type,
      attributes,
    })),
    meta: { total_count: records.length, count: records.length },
  });
});

app.post('/people/v2/people/:id/:collection', withContacts, (req, res) => {
  const { meta, person } = req.contact;
  const attributes = req.body?.data?.attributes;
  if (!attributes) return res.status(400).json({ errors: [{ status: '400', title: 'Bad Request' }] });

  const records = person.attributes[meta.attr] || (person.attributes[meta.attr] = []);
  records.push(attributes);
  res.status(201).json({
    data: {
      id: contactId(person.id, req.params.collection, records.length - 1),
      type: meta.type,
      attributes,
    },
  });
});

app.patch('/people/v2/people/:id/:collection/:recordId', withContacts, (req, res) => {
  const { meta, person } = req.contact;
  const attributes = req.body?.data?.attributes;
  if (!attributes) return res.status(400).json({ errors: [{ status: '400', title: 'Bad Request' }] });

  const records = person.attributes[meta.attr] || [];
  const index = records.findIndex(
    (_, i) => contactId(person.id, req.params.collection, i) === req.params.recordId);
  if (index === -1) return res.status(404).json({ errors: [{ status: '404', title: 'Not found' }] });

  records[index] = { ...records[index], ...attributes };
  res.json({ data: { id: req.params.recordId, type: meta.type, attributes: records[index] } });
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

// Check-Ins API
app.get('/check-ins/v2/people/:id', (req, res) => {
  const person = db.people.find(p => p.id === req.params.id);
  if (!person) return res.status(404).json({ errors: [{ status: '404', title: 'Not found' }] });

  // Return check_in_count in attributes
  res.json({
      data: {
          id: person.id,
          type: 'Person',
          attributes: {
              check_in_count: 5 // mock value for ghost protocol tests
          }
      }
  });
});

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

import express from 'express';
import cors from 'cors';
import { people } from './data.js';
import { fileURLToPath } from 'url';

export const app = express();

app.use(cors());
// Support both standard JSON and JSON:API content type
app.use(express.json({ type: ['application/json', 'application/vnd.api+json'] }));

// In-memory store (copy of seed data)
// We export this or provide a reset function for testing if needed
let db = JSON.parse(JSON.stringify(people));

export const resetDb = () => {
  db = JSON.parse(JSON.stringify(people));
};

app.get('/people/v2/people', (req, res) => {
  const per_page = parseInt(req.query.per_page) || 25;
  const offset = parseInt(req.query.offset) || 0;

  const paginated = db.slice(offset, offset + per_page);

  const nextOffset = offset + per_page;
  const hasNext = nextOffset < db.length;

  // Construct absolute URLs using the request host
  const baseUrl = `${req.protocol}://${req.get('host')}${req.path}`;

  const links = {
    self: `${baseUrl}?offset=${offset}&per_page=${per_page}`
  };

  if (hasNext) {
    links.next = `${baseUrl}?offset=${nextOffset}&per_page=${per_page}`;
  }

  res.json({
    links,
    data: paginated,
    meta: {
      total_count: db.length,
      count: paginated.length,
      can_include: [],
      parent: {}
    }
  });
});

app.get('/people/v2/people/:id', (req, res) => {
  const person = db.find(p => p.id === req.params.id);
  if (!person) return res.status(404).json({ errors: [{ status: '404', title: 'Not found' }] });
  res.json({ data: person });
});

app.patch('/people/v2/people/:id', (req, res) => {
  const personIndex = db.findIndex(p => p.id === req.params.id);
  if (personIndex === -1) return res.status(404).json({ errors: [{ status: '404', title: 'Not found' }] });

  // PCO Structure: body.data.attributes
  const updates = req.body?.data?.attributes;

  // Minimal validation
  if (!updates) {
     return res.status(400).json({ errors: [{ status: '400', title: 'Bad Request' }] });
  }

  const current = db[personIndex];

  // Deep merge attributes
  const updated = {
    ...current,
    attributes: {
      ...current.attributes,
      ...updates
    }
  };

  db[personIndex] = updated;

  res.json({ data: updated });
});

// Helper to start the server from tests or script
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Mock PCO API running on port ${PORT}`);
  });
}

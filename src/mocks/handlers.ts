import { http, HttpResponse } from 'msw';
// @ts-ignore - mock-api is a JS file outside src
import { people as initialPeople, events as initialEvents, checkIns as initialCheckIns } from '../../mock-api/data.js';

// Deep clone to simulate DB state
let db = {
  people: JSON.parse(JSON.stringify(initialPeople)),
  events: JSON.parse(JSON.stringify(initialEvents)),
  checkIns: JSON.parse(JSON.stringify(initialCheckIns))
};

// Generic Pagination Helper
const paginate = (req: Request, collection: any[]) => {
  const url = new URL(req.url);
  const per_page = parseInt(url.searchParams.get('per_page') || '25');
  const offset = parseInt(url.searchParams.get('offset') || '0');

  const paginated = collection.slice(offset, offset + per_page);

  const nextOffset = offset + per_page;
  const hasNext = nextOffset < collection.length;

  // Construct URLs using the request url
  // Note: MSW requests are usually fully qualified.
  // We want to return relative URLs for next links if possible, or absolute.
  // The PCO API returns absolute URLs.

  const baseUrl = `${url.origin}${url.pathname}`;

  const links: { self: string; next?: string } = {
    self: `${baseUrl}?offset=${offset}&per_page=${per_page}`
  };

  if (hasNext) {
    links.next = `${baseUrl}?offset=${nextOffset}&per_page=${per_page}`;
  }

  return { paginated, links };
};

export const handlers = [
  // People API
  http.get('/api/people/v2/people', ({ request }) => {
    const { paginated, links } = paginate(request, db.people);

    return HttpResponse.json({
      links,
      data: paginated,
      meta: {
        total_count: db.people.length,
        count: paginated.length,
        can_include: [],
        parent: {}
      }
    });
  }),

  http.get('/api/people/v2/people/:id', ({ params }) => {
    const { id } = params;
    const person = db.people.find((p: any) => p.id === id);
    if (!person) {
      return HttpResponse.json({ errors: [{ status: '404', title: 'Not found' }] }, { status: 404 });
    }
    return HttpResponse.json({ data: person });
  }),

  http.patch('/api/people/v2/people/:id', async ({ request, params }) => {
    const { id } = params;
    const personIndex = db.people.findIndex((p: any) => p.id === id);

    if (personIndex === -1) {
      return HttpResponse.json({ errors: [{ status: '404', title: 'Not found' }] }, { status: 404 });
    }

    const body = await request.json() as any;
    const updates = body?.data?.attributes;

    if (!updates) {
      return HttpResponse.json({ errors: [{ status: '400', title: 'Bad Request' }] }, { status: 400 });
    }

    const current = db.people[personIndex];

    const updated = {
      ...current,
      attributes: {
        ...current.attributes,
        ...updates
      }
    };

    db.people[personIndex] = updated;

    return HttpResponse.json({ data: updated });
  }),

  // Check-Ins API
  http.get('/api/check-ins/v2/check_ins', ({ request }) => {
    const { paginated, links } = paginate(request, db.checkIns);

    return HttpResponse.json({
      links,
      data: paginated,
      meta: {
        total_count: db.checkIns.length,
        count: paginated.length,
        can_include: [],
        parent: {}
      }
    });
  }),

  http.get('/api/check-ins/v2/events', ({ request }) => {
    const { paginated, links } = paginate(request, db.events);

    return HttpResponse.json({
      links,
      data: paginated,
      meta: {
        total_count: db.events.length,
        count: paginated.length,
        can_include: [],
        parent: {}
      }
    });
  }),

  // Check-Ins Count per person (Utility in pco.ts uses this)
  http.get('/api/check-ins/v2/people/:id', ({ params }) => {
     // This endpoint in the real API returns person details from the check-ins app perspective,
     // often including a summary or we can derive check-in count.
     // The pco.ts `fetchCheckInCount` expects: `response.data.data.attributes.check_in_count`.

     const { id } = params;
     // Calculate check-in count from our mock db
     const count = db.checkIns.filter((ci: any) => ci.relationships?.person?.data?.id === id).length;

     return HttpResponse.json({
         data: {
             type: 'Person',
             id,
             attributes: {
                 check_in_count: count
             }
         }
     });
  }),

  // API V2 (Admin/Platform)
  http.get('/api/api/v2', () => {
     return HttpResponse.json({
        data: {
          type: 'Organization',
          id: '1',
          attributes: {
            name: 'Mock Church'
          }
        }
      });
  }),

  http.get('/api/api/v2/connected_applications', () => {
     return HttpResponse.json({
        data: [],
        meta: { total_count: 0, count: 0 }
    });
  })
];

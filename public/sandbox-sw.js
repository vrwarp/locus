/* eslint-disable no-restricted-globals */
// Service Worker for Sandbox Mode
// Intercepts PATCH/DELETE requests when X-Locus-Sandbox header is present

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Check if it's an API request that modifies data
  if ((request.method === 'PATCH' || request.method === 'DELETE') &&
      request.headers.get('X-Locus-Sandbox') === 'true') {

    event.respondWith(
      (async () => {
        // Read the body if possible
        let body = {};
        if (request.method !== 'DELETE') {
            try {
                body = await request.clone().json();
            } catch (e) {
                // ignore
            }
        }

        console.log(`[Sandbox] Intercepted ${request.method} to ${url.pathname}`, body);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Return synthetic response
        return new Response(JSON.stringify({
            data: {
                id: url.pathname.split('/').pop(),
                type: 'Person',
                attributes: body.data?.attributes || {}
            },
            meta: { sandbox: true }
        }), {
            status: 200,
            statusText: 'OK (Sandbox)',
            headers: {
                'Content-Type': 'application/json',
                'X-Locus-Sandbox-Response': 'true'
            }
        });
      })()
    );
  }
});

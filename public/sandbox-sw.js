
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;

  // Check for the custom sandbox header
  if (request.headers.get('X-Locus-Sandbox') === 'true') {
    // Only intercept PATCH and DELETE (state modifying methods)
    if (request.method === 'PATCH' || request.method === 'DELETE') {
      console.log('[Service Worker] Intercepting sandbox request:', request.method, request.url);

      event.respondWith(
        (async () => {
             // For PATCH, we echo the body back as if it was successfully updated
             if (request.method === 'PATCH') {
                 const json = await request.json();
                 // Construct a PCO-like response
                 return new Response(JSON.stringify({
                     data: {
                         id: json.data.id,
                         type: json.data.type,
                         attributes: json.data.attributes
                     }
                 }), {
                     status: 200,
                     headers: { 'Content-Type': 'application/json' }
                 });
             }

             // For DELETE, just return 204 No Content
             if (request.method === 'DELETE') {
                 return new Response(null, { status: 204 });
             }

             // Fallback
             return new Response(null, { status: 200 });
        })()
      );
      return;
    }
  }

  // Otherwise, fallback to network
  // event.respondWith(fetch(request)); // Standard pattern
});

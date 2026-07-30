# Locus

This project was built exclusively using Jules, an AI software engineer.

## Getting Started

To run Locus locally, start both the Vite development server and the mock API backend.

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start the Mock API Server (Backend):**
    ```bash
    node mock-api/server.js
    ```

3.  **Start the Vite Development Server (Frontend):**
    Open a new terminal window and run:
    ```bash
    npm run dev
    ```

4.  **Login:**
    With the mock API running, use any credentials (e.g., `test` / `test`) to bypass the login overlay.

## Running against pcomirror

[pcomirror](https://github.com/vrwarp/pcomirror) mirrors Planning Center People
into a local store and serves PCO's own API in front of it, so Locus can read a
whole directory without spending the organization's rate budget on every refresh.

Point `VITE_API_TARGET` at it and log in with a pcomirror API key:

```sh
# .env
VITE_API_TARGET=http://localhost:8080
```

The key goes in either credential field — Locus sends HTTP Basic, and pcomirror
accepts a `pcm_…` key as the username or the password:

```sh
pcomirror create-api-key --name locus --scopes 'read:*,passthrough,write'
```

`passthrough` is what lets Locus reach attendance under `/check-ins/v2`, which
pcomirror does not mirror and resolves live against PCO. `write` is only needed
to change records from Review Mode or the Ghost Protocol; leave it off for a
read-only tour.

Locus reads People and Check-Ins only. It does not use PCO Groups.

Two differences from the mock API are worth knowing, because both are the real
PCO behaviour and the mock is the one that is unusual:

* **Contact details are separate resources.** A person's emails, phone numbers
  and addresses are not attributes on the Person. Locus asks for them with
  `include=` and writes them back to their own endpoints; the mock serves those
  endpoints too, so the two behave alike.
* **Page links are relative.** pcomirror rewrites every PCO URL it serves to a
  mirror-relative path, since a caller holding a pcomirror key cannot follow an
  absolute `api.planningcenteronline.com` URL.

## Deploying to GitHub Pages

Locus is a browser-only app: `npm run build` produces a folder of static files,
and every request goes straight from the browser to whichever API you point it
at. There is no server half, so a static host can serve the whole thing.

`.github/workflows/pages.yml` builds and deploys on every push to `main`. Before
the first run, set **Settings → Pages → Build and deployment → Source** to
*GitHub Actions*; nothing publishes until you do.

Two things a static host cannot do for you, and how the build handles them:

* **There is no `/api` proxy.** In development the Vite dev server proxies `/api`
  onto `VITE_API_TARGET`. Nothing does that on Pages, so the deployed app asks
  for an **API address** on the login screen and remembers it in
  `localStorage`. Set the `VITE_API_BASE_URL` repository variable to pre-fill one
  backend and skip the question. Either way the target must return CORS headers
  allowing your Pages origin — Planning Center's own API does not, so point this
  at a [pcomirror](https://github.com/vrwarp/pcomirror) you control, not at
  `api.planningcenteronline.com`. On pcomirror that is its `/admin/cors` page (or
  `PCOMIRROR_CORS_ORIGINS`), naming the origin exactly as the browser sends it —
  `https://<user>.github.io`, no path and no trailing slash. Give the API key
  `passthrough` alongside its read scopes as well: the attendance screens read
  `/check-ins/v2/…`, which pcomirror does not mirror and serves by spending its own
  Planning Center credential, so a key without that scope gets a `403` on them.
* **A project site is served from `/<repo>/`, not `/`.** The workflow passes the
  prefix through `VITE_BASE_PATH` so asset and service-worker URLs carry it. A
  custom domain or a `<user>.github.io` repo resolves to `/` and needs nothing.

Credentials are never part of the build. They stay in the browser of whoever
opens the page, exactly as they do locally — but note that publishing the app
publishes the *client*, so anyone who finds the URL can point it at their own
mirror and type their own key. It grants no access to yours.

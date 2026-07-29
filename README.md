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

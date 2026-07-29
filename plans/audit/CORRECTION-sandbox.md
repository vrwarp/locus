# Correction: Sandbox Mode is not inert

**Status: the audit was wrong about this, in every area that touched it.**

Round 1 of the relational-tools loop reported that Sandbox Mode was a no-op:
`updatePerson` attaches an `X-Locus-Sandbox: true` header and then PATCHes live
Planning Center anyway, and `grep -ri sandbox mock-api/` returns nothing, so
nothing consumes the header. All four critics verified it independently, it was
promoted to a cross-area blocking finding, it was cited in core-hygiene,
gamification and relational-tools, and it appears in `00_synthesis.md` as one of
four headline patterns.

Every one of those checks looked in `mock-api/`. The consumer is not there.

## What is actually true

`public/sandbox-sw.js` is a service worker, registered on load in
`src/main.tsx`, which intercepts `PATCH` and `DELETE` requests carrying the
`X-Locus-Sandbox` header and answers them with a synthetic `200` — including an
`X-Locus-Sandbox-Response` header and `meta.sandbox: true` — without letting the
request reach PCO. The mechanism is real and it does what the banner claims.

The critics all grepped the backend fixture. The interceptor lives in the
browser, in `public/`, which is not a directory any of them searched.

## The defect that does survive, restated correctly

Sandbox Mode **fails open**. Nothing verified the interceptor was actually in
control before attaching the header and sending the write:

* A service worker does not control the page on the first load before it
  activates. `skipWaiting()` and `clients.claim()` narrow that window but do not
  close it.
* Registration can fail — `main.tsx` only logged the failure.
* It requires a secure context.

In each of those cases the header was still attached, the PATCH still went to
Planning Center for real, and the banner still read "Changes are simulated".
That is a narrower fault than "does nothing", and it is still the more dangerous
class of fault, because a safety switch that stops working silently is reached
for precisely by the cautious user.

## What changed in the code

`updatePerson` now refuses to send anything when Sandbox Mode is on and
`navigator.serviceWorker.controller` is absent, throwing
`SandboxUnavailableError` with an explanation. It also checks after the fact that
the reply carried `X-Locus-Sandbox-Response`, so a worker that disappears
mid-session surfaces as an error naming the record rather than a success the
banner will misdescribe.

## What this means for the rest of the audit

Anywhere a report says Sandbox Mode "is inert", "does nothing", "is a fake
safety switch", or counts it as one of the do-nothing safety features, read it as
"fails open when the interceptor is not in control". Specifically:

* `00_synthesis.md` pattern 2 lists three do-nothing safety features. Sandbox
  Mode is not one of them; the other two — Emergency Alerts' fabricated send
  banner, and encryption keyed on a non-secret with a plaintext fallback — stand
  as reported and were verified independently.
* The conclusion that the standing toggle should be replaced by a mandatory
  per-record write preview is **unaffected**. It never rested on the toggle being
  broken; all four critics argued it on the grounds that a mode an operator can
  forget they are in is the wrong shape for a safety control. That reasoning
  survives intact.
* The children's-ministry finding that there was "no safe way to trial a
  write-capable feature against real records" is withdrawn. There was, on any
  load where the worker was in control.

## Why it got through

Four independent critics, five rounds, and a verification pass by the synthesis
agent all reproduced the same negative grep. Agreement was mistaken for
evidence: nobody asked whether the search had covered the right directory, and
consensus across agents that share a blind spot is not corroboration. The
orchestrator (me) then repeated the finding to the user and wrote it into the
synthesis and the published walkthrough without independently checking where a
browser-side interceptor would actually live.

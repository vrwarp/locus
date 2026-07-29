# Area F — Round 3 UXR ruling

## 1. Q5 — Sandbox naming vs. Area A's mandatory preview: one answer

**Adopt Area A's shape. Delete the standing Sandbox Mode toggle (per v2's own
"emergency fallback" clause) in favor of a mandatory per-record before/after
preview inside every batch-write confirm dialog.**

Relabeling to "Preview mode — no changes are sent to Planning Center" is
honest but treats the wrong defect. The defect isn't the label, it's that
Sandbox is a *mode* — a piece of state the operator must remember to turn on
before the risky session and remember to turn off after. v2's own F1
rationale ("a control depending on a human remembering to click it is not a
control") already convicts this shape; it just didn't apply the sentence to
itself. A trained admin who forgets to flip the toggle before the new
volunteer's first session gets zero protection and no signal that they got
zero protection — the exact failure mode v1/v2 spent two rounds fixing for
`sandboxMode` itself. A confirm-dialog preview that fires on *every* write,
unconditionally, cannot be forgotten because there is no switch to forget.

This doesn't fully answer Q5's harder half. Neither shape — client-side
short-circuit nor a diff-only confirm dialog — exercises PCO's validation, so
"this batch would 422 in production" stays invisible either way unless the
preview step also round-trips a dry-run call to PCO. Treat that as an
additive enhancement to Area A's dialog (a validation pass feeding the same
UI), not a reason to keep a separate, rememberable mode around. One answer:
mandatory preview, no standing toggle, real-PCO-validation is future work on
top of it.

## 2. Intelligence surface — end state

Verified: after #44 and #46, `SidebarIntelligence.tsx`'s "Tools" section
(`:204-224`) still literally contains Automations and Emergency Alerts — both
read-only report components (`AutomationsReport`, `EmergencyAlerts`, both take
`students` and render, no `onSave`/PCO write call in either). Taking the
prompt's premise that Area D goes to zero routes and Area E dissolves, and
folding in this round's own #44/#46 cuts and #45's conditional survival: what
remains on Intelligence is a flat list of read-only analytic views, a
workspace picker, a second auth overlay, and a second sidebar/layout shell —
duplicated app chrome around content that is a permission-scoped filter of
Core's own data, not a distinct product.

**Finding: Intelligence no longer justifies a segregated workspace.** Its
original job — "read-only executive view, walled off from write risk" — is
now done more honestly by F2's function-level `userRole !== 'core'` guard
than by a second app shell. Recommend collapsing the surviving report views
into Locus Core as a role-gated tab/filter, retiring `LandingPage.tsx`'s
picker and the "Locus Intelligence" brand, and merging the two sidebars into
one. This removes an entire duplicated auth flow, not just a nav section, and
is the kind of navigation-cost cut this audit exists to make.

## 3. Round-1 items — confirmed picked up

Both confirmed present in v2 §F8, verbatim, not dropped a second time:

- **No help text for generating a PCO token.** Verified live at
  `App.tsx:704-733`: the auth overlay is two bare inputs, no link, no format
  example. v2 F8: "Overlay copy... no link to where in Planning Center to
  generate a token, no example format... Add a deep link and a format
  example." Picked up.
- **Non-401 errors surface raw `e.message`.** Verified: `App.tsx:196`
  `setApiError(e.message || 'Unknown API Error')` unconditionally; only
  `pco.ts:481-483` special-cases 401. v2 F8: "Only 401 gets a real message...
  network, CORS, DNS and PCO-outage failures fall through to raw `e.message`."
  Picked up, and correctly scoped as more urgent post-F7 (new failure
  surfaces from purge/re-key).

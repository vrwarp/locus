# Area F — relational-tools — Round 2 (children's ministry lens)

Reviewer: children's ministry director (birth–5th grade), 300 kids / two services.
Adversarial pass against `plans/audit/rounds/relational-tools/proposal-v1.md`.
Verified independently: `pco.ts:365-373` (`X-Locus-Sandbox` header set, PATCH issued
regardless), `App.tsx:307,356,442,528` (every `sandboxMode` call site — Ghost
Protocol archive, Smart Fix, Review Mode, batch update — threads the same inert
flag), `storage.ts:73-77,108-112` (plaintext `JSON.parse` fallback on decrypt
failure), `mock-api/data.js:96-128` (`prayer_topic` synthesized, not a real PCO
attribute name), `cache.ts` (already AES-GCM-encrypted, appId-keyed, lazy TTL
delete-on-next-read only), `api.ts:16-35` (plaintext localforage, 1h TTL, no
close-time purge), six components using the `ui-avatars.com` fallback pattern.

---

## 1. What gets worse under an inert Sandbox Mode

My r1 never named "sandbox" as a mitigation for #44 or #46 — I evaluated both as
live writes already and CUT them outright, so those two verdicts don't get worse,
they get **vindicated**: I was already assuming the worst case, and it turns out
to be the actual case.

What genuinely gets worse is something my r1 didn't cover at all because it's
outside Area F: **the sandbox checkbox is the safety UI the whole app — not just
this area — offers a director for trialing write-heavy tools against live
children's records.** `App.tsx:307` threads `config.sandboxMode` into
`archivePerson` for Ghost Protocol (Area A #6); `:356,442,528` thread it into
Smart Fix, Review Mode, and batch commit. All of it is downstream of the same
`updatePerson`/`archivePerson` short-circuit that doesn't exist. A children's
director evaluating Locus for the first time, told "check this box, changes are
simulated," who then runs Ghost Protocol or a Smart Fix batch pass against the
real roster to "see how it works," has just archived or overwritten live child
records — including `backgroundCheckExpiresAt` and address fields — while a
banner told them nothing happened. That is worse than any single finding in my
r1: it means **there is no safe way to evaluate any write-capable feature in this
product against real data**, which retroactively raises the stakes on every CUT
and FIX verdict in this area and in Area A. This belongs in the audit's top-line
findings, not buried in Area F.

## 2. `prayer_topic` is dead in production — this strengthens deletion, doesn't weaken it

"Dead in production" is not "safe to leave." Three reasons the fabrication makes
CUT *more* urgent, not less:

1. Real PCO custom fields arrive via `field_data` includes keyed to a
   `field_definition_id`, not a flat `prayer_topic` attribute
   (`pco.ts:18,231,276` assumes the latter). Nothing in this codebase maps a real
   custom field onto that name today — which means the matching/reveal/CSV
   machinery is fully built, fully wired, and simply waiting for someone to add
   that one mapping line. Dead code with a live UI on top of it is a loaded gun
   with the safety on, not a target that's already been cleared.
2. A demo run against the mock API (`mock-api/data.js:96-128`) *does* produce
   adult-child pairings with a working reveal button, because the mock
   fabricates the field for every persona indiscriminately. Anyone who demos
   Locus Intelligence off the mock server — sales, a board member, a
   prospective church — sees this feature "work" and has no way to know
   production behavior differs. That's a sales-demo liability independent of
   whether real PCO ever returns the field.
3. Deleting the consumer (F1) is correct but insufficient given point 1. **My
   answer to the proposal's Q1: no, Locus should not ingest a per-person
   addiction/grief/health disclosure field at all**, real or fabricated, without
   an access-control and consent model that doesn't exist anywhere in this
   codebase. `Student.prayerTopic` (`pco.ts:87`) should carry a loud comment
   that it is unmapped-in-production and must not be wired to a real custom
   field without a redesign, or be removed and handed to Area D as a named
   blocker rather than a footnote — the proposal's "flag as cross-area
   dependency" undersells this.

## 3. Attacking F6 — FIX is not enough for #48, given point 1

I gave SIMPLIFY in r1 too, so I'm reversing myself here on purpose: the sandbox
discovery changes what I'm willing to trust from this team's follow-through.
Proof of pattern: this codebase already ships two convincing-looking safety
features that do nothing — the sandbox banner (§1) and the encrypt-with-plaintext-
fallback in `storage.ts` (§4 below, which the proposal itself flags as [NEW]).
A "FIX" that adds a **manual** "Clear local data" button, sequenced sixth,
wired to a logout control that doesn't exist yet (F5), is exactly the shape of
control this team has twice shipped as theater. On a shared office/front-desk
machine, a manual purge button that a volunteer never clicks is not a purge
path — it's a checkbox for an audit to tick.

**Concrete alternative, in place of F6 as scoped:**

* **Don't persist Student PII to disk at all, by default.** Swap `cache.ts`'s
  `fetchAllPeople` cache and `api.ts`'s response cache for an in-memory `Map`
  scoped to the JS session. Rate limiting and request dedup (`api.ts:37-108`,
  genuinely fine, keep as-is) don't need cross-restart persistence — only the
  hygiene tools' UX-speed goal wants a warm cache, and that goal is fully met
  by memory that survives a tab session, not by disk that survives the machine
  being powered off. This deletes the shared-office-machine risk instead of
  mitigating it, and it doesn't depend on F5 shipping first.
* **If disk persistence is kept for any reason, decouple the purge from logout.**
  Add `visibilitychange`/`beforeunload` listeners that clear the IndexedDB
  stores unconditionally — a volunteer forgetting to click "sign out" is the
  normal case at a folding table, not the edge case, and F6 as written has no
  answer for "the browser was just closed."
* **Field-level minimization, not whole-record encryption.** F6 encrypts (or
  deletes) the full response blob uniformly. Nobody's view needs
  `backgroundCheckExpiresAt` or `address` cached for the duration Data Health or
  Duplicate Detective needs `name`/`grade` cached. Strip the highest-sensitivity
  fields from anything that persists past the request, and refetch them live
  (`cache: false`, the pattern already used at `pco.ts:353,430`) only where a
  view actually renders them.

The KDF fix (appId → secret) and removing the plaintext fallback are correct
and I'm not contesting those parts of F6 — I'm contesting that "encrypt what's
already there, add a button" is a sufficient response to a shared-machine
threat model that this same team has already proven it will implement as a
non-functional gesture once.

## 4. What the proposal dropped

My r1 flagged the `ui-avatars.com` third-party leak pattern (real name sent to
an external CDN with no consent) as present in `PrayerMatch.tsx` **and**
`SmallGroupSorter.tsx:90`, and asked that it be fixed globally since it also
appears in `BurnoutReport.tsx`, `MissingVolunteersReport.tsx`,
`DriftReport.tsx`, and `RecruitmentReport.tsx` (verified — six components,
zero consent screens). F1 deletes the PrayerMatch instance by deleting the
file, which is fine. But F4 rebuilds `SmallGroupSorter.tsx` in place — same
file, same `ui-avatars.com` line — and neither F4 nor the cross-cutting notes
carry the leak forward. It survives the "Life Group Balancer" rewrite
untouched. This should be in F4's bullet list, not dropped.

## 5. Concessions

* The sandbox-header discovery (`pco.ts:371-373`) is the single most important
  finding in this round and I missed it entirely in r1 — I evaluated #44/#46 as
  live writes by inference from the commit pipeline, but never checked whether
  the toggle everyone else was citing as a mitigation actually did anything.
  The proposal did the check I should have done.
* The plaintext-fallback-on-decrypt-failure finding (`storage.ts:73-77,108-112`)
  is real and I missed it — I flagged the weak appId-derived key in r1 but
  didn't notice the encryption can be silently bypassed entirely by anyone who
  can write to `localStorage`, which makes the key-strength argument moot until
  the fallback is closed. Correct catch, and F6 addressing it in the same
  breath as the KDF fix is the right order of operations.

---

## Verdicts this round

| # | Proposal verdict | My position |
|---|---|---|
| 44 | CUT | ACCEPT |
| 45 | SIMPLIFY (rebuild solver, rename) | ACCEPT, with the ui-avatars.com leak added to F4's scope (§4) |
| 46 | CUT | ACCEPT |
| 47 | FIX (relabel + session boundary) | ACCEPT, but the cache-purge trigger in §3 must not be gated behind this shipping first |
| 48 | FIX (encrypt + purge button, KDF fix) | REJECT the persistence design, ACCEPT the KDF/fallback fix — replace disk-persisted Student PII with in-memory-only caching and field-level minimization per §3, given the demonstrated pattern of non-functional safety UI (§1, §5) |

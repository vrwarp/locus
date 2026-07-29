# Area F — relational-tools — Round 1 UXR Critique

Persona lens: Sarah (admin, Core), Emily (volunteer, Core), Dr. Robert (executive
pastor, Intelligence — supposedly read-only).

---

## #44 Prayer Partner Match
`src/components/PrayerMatch.tsx`, `src/utils/prayer.ts`

**Verdict: CUT** (in current form)

**Evidence & defects:**

1. **The feature depends on data that will not exist.** Matching keys entirely
   off `person.prayerTopic`, sourced from a PCO custom field literally named
   `prayer_topic` (`src/utils/pco.ts:18,231,276`). This is not a stock Planning
   Center field — it only populates if a church has built that exact custom
   field and gotten every member to fill it in. `mock-api/data.js:96-99`
   invents it from a hardcoded list purely for demo purposes. The empty state
   (`PrayerMatch.tsx:25-32`, "Ensure that people have a 'prayer_topic'
   assigned") is the realistic default for essentially every real congregation
   on day one — not an edge case, the modal state.
2. **No persistence, no way to act on the result.** `matches` is a `useMemo`
   over `students` that re-shuffles with `Math.random` (`prayer.ts:29-31`)
   every time the `students` reference changes — which happens on every
   "Load More Records" click, every query refetch, every navigation away and
   back if React Query revalidates. There is no save, no lock-in, no export,
   no email/notify action. A pastor who reads the pairing and calls two
   people has no way to reproduce or confirm that pairing later — it's
   already been reshuffled. Compare to Gamification/Config state, which *is*
   persisted (`src/utils/storage.ts`) — this feature was left out of that
   pattern entirely.
3. **"Anonymous" reveal is theater, not privacy.** `revealMap` only toggles
   what's rendered (`PrayerMatch.tsx:16-23,64-72`); full name, email, phone
   and the sensitive struggle topic (Addiction, Grief, Anxiety…) are already
   in the component's memory and DOM-adjacent state at mount. Anyone with
   devtools open sees everything regardless of the "Reveal Identities"
   button. If the intent was to make a pastor consciously commit to viewing
   sensitive struggle data before seeing names, it doesn't do that.
4. Pairing is same-topic-random only — no exclusion for existing spouses/
   household members being paired together on a sensitive personal topic
   (`prayer.ts:26-49` shuffles within a topic with no household check), which
   for "Addiction" or "Grief" topics is a plausible, embarrassing mismatch.

**Cheapest fix:** if kept, this is a "generate a list to skim," not a
maintained pairing tool — say so explicitly (rename to "Prayer Topic Groups"),
drop the "anonymous reveal" performance, and add a CSV export so the one real
action (contacting people) is possible without a second data-entry pass. If
the underlying custom field is speculative, cut the feature until Locus
confirms real churches populate it.

**Open question:** does any pilot church actually have a `prayer_topic`
custom field on Person records? If the answer is "no known church," this is
dead code dressed as a feature.

---

## #45 Small Group Sorter
`src/components/SmallGroupSorter.tsx`, `src/utils/sorter.ts`

**Verdict: SIMPLIFY**

**Evidence & defects:**

1. **Blocks the main thread, and the UI lies about why.** `handleRunAlgorithm`
   sets `isProcessing` and, after a 50ms `setTimeout` "to allow UI to render
   'Evolving...' state" (`SmallGroupSorter.tsx:16-29`), runs
   `sortIntoGroups` synchronously. `sortIntoGroups` is a genetic algorithm:
   population 100, and at "Deep Search" 2000 generations
   (`sorter.ts:135-164`), each generation scoring all 100 chromosomes against
   every household (`evaluateFitness`, O(popSize × households) per
   generation). For a household count in the hundreds (a 5,000-person church
   is roughly 1,500-2,000 households), that's on the order of hundreds of
   millions of array operations run synchronously on the main thread with no
   `requestIdleCallback`/worker chunking. The "Evolving Generations..." label
   implies live progress; in reality the tab freezes solid for however long
   that loop takes and the label is frozen too, indistinguishable from a hang.
   The 50ms setTimeout only proves the label painted *before* the freeze — it
   does nothing to keep the tab responsive during it.
2. **No persistence or export**, same defect class as #44: `groups` lives in
   component state only (`SmallGroupSorter.tsx:14`). Run the (possibly
   multi-second) algorithm, get a result, refresh or navigate away, it's
   gone. No way to hand the assignment to a small-groups coordinator without
   manually retyping it.
3. **Silent partial-data risk.** `students` is whatever's currently loaded in
   the app-wide query — see #48 below. This screen gives no indication that
   only the first batch of records (default 500) is being sorted; a group
   assignment run on 500 of 5,000 members looks complete and correctly
   formatted, with no "N of ~5,000 loaded" caveat anywhere on this screen.
4. Copy claims "keeping families together" but only adults are grouped
   (`sorter.ts:20-21` filters `!s.isChild`); a household's kids never appear
   in the results even though the household stays together conceptually.
   Minor, but "Adults" badge (`SmallGroupSorter.tsx:79`) partially covers for
   this — the header copy oversells it.

**Cheapest fix:** cap "Deep Search" generations to something the main thread
can finish in under ~1s for realistic household counts, or move the search
to a Web Worker so the UI stays responsive and can show real progress. Add a
"results as of N/Total records loaded" note and a CSV export of the group
roster.

**Open question:** what household count and generation count was this
actually profiled against? If never profiled past mock data (~50-100
people), the freeze at real church scale is untested, not just unaddressed.

---

## #46 Locus Public (member self-service portal)
`src/components/LocusPublic.tsx`

**Verdict: CUT / re-scope**

**Evidence & defects:**

1. **This is a write tool with no authentication, sitting inside the
   "read-only executive dashboard."** `LocusPublic` is only reachable from
   `SidebarIntelligence.tsx:206-210` — `SidebarCore.tsx` has no entry for it
   (confirmed by grep, zero matches). The inventory and the persona doc both
   describe Locus Intelligence as "read-only." This screen's core action,
   "Update Profile" (`LocusPublic.tsx:195-197`), calls `onSave` →
   `handleSaveStudent` in `App.tsx:546` → the same `executeCommit`/
   `updatePerson` path used everywhere else in the app, which PATCHes the
   live PCO person and contact records (`src/utils/pco.ts:365-419`). Nothing
   about the write path is different because it originated from
   "Intelligence." The read-only/write-capable split the product claims to
   have does not exist at the code level — it's a sidebar convention, not a
   permission boundary.
2. **"Simulate Login As" is not authentication at all**
   (`LocusPublic.tsx:98-112`): a plain `<select>` of every person's real
   name, populated from the org's full roster. Whoever is holding the
   shared org App ID/Secret (Dr. Robert, or anyone who has it) can pick any
   member and edit their name, email, phone, and address, then write it to
   live PCO with one click. There is no member-facing login, magic link, or
   verification of any kind — the label "self-service portal" describes a
   product this is not; what's shipped is an admin impersonation tool with
   a name-only picker.
3. **No sandbox safety net from this surface.** The sandbox-mode banner and
   toggle live in Settings (`ConfigModal`), which — like every other
   Core-only screen — has no entry in `SidebarIntelligence.tsx`. A church
   that only ever uses the Intelligence surface can never turn sandboxMode
   on; every save from this screen is a live write to production PCO data by
   default, with no confirmation step, no diff shown before saving, and a
   success message reading "Profile updated successfully! Points earned!"
   (`LocusPublic.tsx:199`) — gamification copy bolted onto a real
   production data edit performed by proxy on someone else's behalf.

**Cheapest fix:** either (a) this really is meant to preview what a future
member-authenticated portal would look like — then disable the Save button
entirely and label it a preview/mockup, or (b) it's meant as an admin
"edit on someone's behalf" tool — then move it into Locus Core next to the
other write tools, gate it behind the same sandbox toggle, and drop "Simulate
Login As" framing that implies member self-service. Either way it must not
live, unlabeled, inside the surface the product calls read-only.

**Open question:** was "Locus Public" ever meant to be an actual
member-facing app (separate login) and this is a Core-team preview that
got wired into the wrong sidebar? If so this is a routing bug, not a design
decision, and should be fixed as one.

---

## #47 Landing / auth / role split
`src/components/LandingPage.tsx`, `src/utils/api.ts`, `src/utils/crypto.ts`, `src/App.tsx`

**Verdict: SIMPLIFY** (the flow needs real work; the crypto/retry plumbing is fine)

Concrete moment: Dr. Robert opens Locus for the first time on a Tuesday
before a board meeting, having been handed a link.

**Defects, ranked:**

1. **The "role split" is cosmetic, not a permission boundary — see #46.**
   Both cards on `LandingPage.tsx:14-32` lead to the same credential prompt
   and the same full-access PCO Personal Access Token. Choosing "Locus
   Intelligence" changes which sidebar renders; it does not restrict what
   the underlying `auth` (App ID + Secret, `App.tsx:100-103`) can do. The
   product's own pitch — "Locus Intelligence: read-only" — is not backed by
   anything at the API or state layer.
2. **Refreshing the tab logs everyone out of everything**, silently. `appId`,
   `secret`, and `userRole` are plain `useState` (`App.tsx:73-74,79`) with no
   persistence — no localStorage, no sessionStorage, no URL param. Hit
   refresh (browser crash recovery, an accidental Cmd-R, a laptop sleep/wake
   losing the tab) and Dr. Robert lands back on the role-selection screen,
   then has to retype the Application ID and Secret from scratch. Nothing on
   `LandingPage.tsx` or the auth overlay explains this is expected, and
   there's no "remember me." Meanwhile the *data* cache (IndexedDB via
   `src/utils/cache.ts`) survives refresh just fine — so the app is
   architected to protect against re-fetching PCO but not against re-typing
   a secret key, which is backwards from what would actually frustrate a
   time-pressed executive.
3. **The credential prompt assumes technical fluency the persona doesn't
   have.** The auth overlay (`App.tsx:704-733`) asks for "Application ID"
   and "Secret" with zero explanation, no link to where in Planning Center
   to generate a Personal Access Token, no example format, and no "what do I
   do if I don't have one" path. For Sarah (admin) this is plausible — for
   Dr. Robert (executive, Intelligence persona) this is the wrong audience
   entirely; nothing this dashboard does distinguishes "pastor" from
   "person who manages API credentials."
4. **No back button, no logout, no account switcher.** Once a role is
   selected there's no UI affordance to return to `LandingPage` or swap
   workspace — the only way is a hard refresh, which (per #2) also destroys
   the credentials. Picking the wrong card is a full re-auth, not a
   one-click correction.
5. **Transient unauthenticated shell flash.** The auth-overlay visibility
   condition is `!appId || !secret || apiStatus === 'idle' || apiStatus ===
   'error'` (`App.tsx:704`). During `apiStatus === 'checking'` none of those
   are true, so the overlay unmounts *before* credentials are confirmed
   valid — the full sidebar/toolbar chrome renders underneath with the
   content area stuck on `{isLoading && <p>Loading Data...</p>}` (query is
   `enabled: !!appId && !!secret && apiStatus === 'ok'`, so it never
   transitions out of the loading style while checking). If the credentials
   turn out to be wrong, the overlay snaps back with the app chrome having
   briefly appeared for no reason — a flicker that looks like a bug even
   though it recovers.
6. **Error message quality is inconsistent.** A 401 gets a clear
   "Unauthorized: Invalid credentials." (`src/utils/pco.ts:481-483`). Any
   other failure (network error, CORS misconfig, DNS, PCO outage) falls
   through to `e.message` (`App.tsx:196`), i.e. whatever axios's raw error
   string is — "Network Error" with no next step, shown in the same red
   text position as the clear message, so first-run failures for reasons
   other than a typo'd secret get no actionable guidance.

**Cheapest fix:** persist `appId`/role (not the raw secret, unless behind the
existing PBKDF2 encryption already built for config — reuse
`src/utils/crypto.ts`) to survive refresh; add a visible "Switch Workspace"
control instead of requiring a refresh; and gate the overlay's visibility on
`apiStatus !== 'ok'` broadly (checking included) so the chrome-flash in
defect 5 can't happen.

**Open question:** does the target user for Locus Intelligence (a pastor)
ever generate their own PCO Personal Access Token in practice, or does an
admin always hand them a shared one out of band? That answer decides whether
this is a credentials-UX problem or a distribution/provisioning problem the
UI can't fix alone.

---

## #48 Data layer: PCO fetch, cache, rate limiting, storage
`src/utils/api.ts`, `src/utils/pco.ts`, `src/utils/cache.ts`, `src/utils/storage.ts`, `App.tsx` (query wiring)

**Verdict: SIMPLIFY**

Concrete moment: Sarah manages a 5,000-person congregation. She logs in
Tuesday night for a cleanup shift.

**Defects, ranked:**

1. **The first fetch is capped at 500 people with no indication anywhere
   outside one screen.** `App.tsx:230` calls `fetchAllPeople(auth, undefined,
   5)` — 5 pages × `per_page=100` = 500 records — regardless of
   congregation size. The only UI to get the rest is a "Load More Records"
   button that exists solely inside the Data Health view
   (`App.tsx:798-804`, confirmed absent from every other view in the file).
   For a 5,000-person church that's **9 additional manual clicks**, each
   itself fetching another 500 records, purely to reach feature parity on
   *any other screen in the app*. Prayer Partner Match (#44), Small Group
   Sorter (#45), Dashboard, Duplicate Detective, Burnout, Attrition —
   everything — silently operates on whatever subset happens to be loaded,
   with zero "X of ~5,000 loaded" indicator on any of those screens. Sarah
   opens Small Group Sorter Tuesday night, runs the algorithm, gets a
   complete-looking set of balanced groups — built from 10% of the church.
2. **Every refresh re-runs the credential check against live PCO before
   anything renders** (`App.tsx:183-207`), even though the people data
   itself may already be warm in IndexedDB (`cache.ts`, 5 min TTL as wired
   in `App.tsx:217`). This is cheap per-call, but combined with defect #47.2
   (refresh = re-type secret) means the actual cost of a refresh for Sarah
   is: retype credentials → wait ~1s debounce → wait for the version check →
   wait for a fresh 500-record fetch once 5 minutes have elapsed since the
   last one. None of this is shown as a single coherent progress state; it's
   three sequential silent waits behind one static "Connecting..." line.
3. **`loadMore` failure is a native `alert()`** (`App.tsx:414`,
   `"Failed to load more records."`) — the only place in the reviewed code
   that drops to a browser-native dialog instead of the app's own toast/
   inline-error patterns used everywhere else (`UndoToast`, `BadgeToast`).
   Jarring and inconsistent, and gives no reason for the failure (rate
   limit? network? auth expired mid-session?).
4. **Rate-limit handling is real but invisible.** `src/utils/api.ts:60-108`
   implements genuine 429 detection, `Retry-After` parsing, exponential
   backoff, and a shared `globalBackoffPromise` so concurrent requests don't
   pile on — this is solid engineering. But none of it surfaces to the UI:
   during a backoff window (which the code's own comment says can be
   necessary — "Planning Center rate limit is 100 requests per 20 seconds,"
   `api.ts:42`) the user just sees nothing happen. For Ghost Protocol's
   documented worst case (70 ghosts × 2 requests, `api.ts:39-41`) or a large
   `handleAnalyzeGhosts` batch (`App.tsx:276-282`, `Promise.all` — fully
   parallel, no batching) on a 5,000-person church with proportionally more
   ghosts, a real 429 is plausible and would present as the app silently
   hanging with no spinner tied to the backoff, no "rate limited, retrying
   in 4s" message.
5. **Cache-at-rest encryption uses `appId` as the password, not the
   secret** (`cache.ts:26`, `storage.ts:64,91`, etc.) The PCO "Application
   ID" is the less-sensitive half of the credential pair (comparable to a
   username) and is exposed in every outgoing Basic-Auth header the browser
   sends, visible in devtools Network tab to anyone with local access to the
   machine. Encrypting IndexedDB-cached PII (names, addresses, phone
   numbers, birthdates) with a "password" that's sitting in the same
   browser's network log is closer to security theater than real protection
   — it guards against nothing an attacker with local machine access
   couldn't already get from localStorage/IndexedDB directly, but the UI
   never claims otherwise (there's no "encrypted" messaging shown to the
   user), so this is a quiet defect rather than a broken promise.

**Cheapest fix:** surface loaded/total record count in a persistent place
(header toolbar, next to Undo/Redo) rather than burying "Load More" in one
report; replace the `alert()` with the existing toast pattern; and either
raise the initial fetch cap for known-large orgs or auto-continue paging in
the background (with a visible progress bar) instead of requiring manual
clicks per 500 records.

**Open question:** what's the largest real (or realistic pilot) congregation
size this has been tested against end-to-end, including the "click Load
More nine times" path? If the answer is "only ever tested against mock
data's default roster," the 500-record cliff has never actually been
observed by a human tester in this product's history.

---

## Cross-cutting theme for Area F

Three of five features (#44, #45, #46) generate a result and then have
nowhere for it to go — no persistence, no export, no notify — which matters
more here than elsewhere in the app because these are the *coordination*
tools (pairing people, assigning groups, editing a member's own record) where
the whole point is handing an outcome to someone else. And the area's two
foundation features (#47, #48) fail exactly the scenario the round asked
about: wrong credentials are handled reasonably, but a normal-size
congregation on a normal refresh is not — the app quietly serves partial data
almost everywhere except the one screen built to fix it.

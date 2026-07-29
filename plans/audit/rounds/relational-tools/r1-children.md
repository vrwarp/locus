# Area F — relational-tools — Round 1 (children's ministry lens)

Reviewer: children's ministry director (birth–5th grade), 300 kids / two services.
Scope: features #44–#48. Read `students` type in `src/utils/pco.ts`, and all
implementation files listed in the inventory.

---

## #44 — Prayer Partner Match (`src/components/PrayerMatch.tsx`, `src/utils/prayer.ts`)

**Verdict: CUT** (as built; would need a full redesign to exist at all)

**Safety impact:** Direct. `matchPrayerPartners` (`src/utils/prayer.ts:9-53`) groups
the **entire** `students` array by `prayerTopic` with zero age filter. `PrayerMatch`
is wired in `App.tsx:928` as `<PrayerMatch students={students} />` — the same
unfiltered array that contains every child in the database (`Student.isChild`,
`pco.ts:84`). If a child's PCO record has a `prayer_topic` custom field
populated — which is exactly the kind of field a kids' ministry or family-life
team fills in ("pray for my parents' divorce," "pray for my grandma who's
sick") — `matchPrayerPartners` will Fisher-Yates shuffle that child into a
random 1:1 pairing with an adult stranger from the congregation, purely because
they share a topic string. There is no `isChild` check anywhere in `prayer.ts`
or `PrayerMatch.tsx`.

The "Reveal Identities" toggle (`PrayerMatch.tsx:106-108`) then hands that
adult the child's full name, photo, and email/phone (`match.personA.email ||
match.personA.phone`, line 72/94) with one click, no guardian consent, no
staff review, no chaperone requirement. This is a stranger-danger and
grooming-vector feature, not a hygiene feature. It is exactly the "family
audit logic that pairs adults... will produce output that ranges from useless
to harmful" case called out for this persona, except this isn't even a family
match — it's a random adult-child match on a topic string.

Secondary leak: on reveal, the avatar fallback (`PrayerMatch.tsx:65,87`) sends
the matched person's real name to a third-party service —
`https://ui-avatars.com/api/?name=${encodeURIComponent(match.personA.name)}` —
with no consent screen. If the matched person is a minor, that child's name
goes to an external CDN merely to render an avatar placeholder.

**Sunday-morning cost:** None directly — this doesn't touch the check-in desk.
But it is reachable from Locus Intelligence by anyone with dashboard access,
any day of the week, and a bad pairing surfaces as a phone call to the
children's director on Monday, not a desk problem.

**Household / guardian correctness:** N/A — this feature doesn't reason about
households at all, which is exactly the gap. It has no concept of "this
person is a minor and requires guardian mediation to be introduced to any
adult they don't already know."

**Minor-data flag:** Fails outright. No `isChild` exclusion, no minimum age
gate, no guardian opt-in, PII (name, contact info, photo) exposed to an
unrelated adult on a button click, and that PII forwarded to a third-party
avatar service. This is the single worst finding in the area.

**What would make this worth a volunteer's attention:** Nothing about this in
its current form should reach a volunteer. If prayer matching survives at all,
it needs (a) a hard filter to `!isChild` at the data layer, not just a UI
convention, (b) never matching a minor with anyone outside their own household
under any circumstance, and (c) a "pray for my child" workflow that routes to
the parent/guardian record for adult-to-adult matching instead of matching
the child's own record.

---

## #45 — Small Group Sorter (`src/components/SmallGroupSorter.tsx`, `src/utils/sorter.ts`)

**Verdict: NOT MY LANE** (adults-only feature, correctly scoped) — with one
flag worth noting.

**Safety impact:** None on the sorting logic itself. `buildHouseholds`
(`sorter.ts:20-46`) explicitly filters `students.filter(s => !s.isChild)`
before doing anything — children are excluded from the genetic algorithm
entirely, and household membership (not individual placement) is the atomic
unit being shuffled, so it doesn't split a family's adults across groups. This
is the one feature in the area that got the `isChild` filter right.

**Sunday-morning cost:** None — this runs from Locus Intelligence, not the
check-in desk.

**Household / guardian correctness:** Reasonable given PCO's own household
model: `householdId` is trusted as-is (`sorter.ts:26`), so two divorced
co-parents who already have separate PCO households are handled correctly by
construction; this feature does no separate "merge by surname" logic of the
kind the persona brief warns about. Its correctness is bounded by whatever
PCO's household field already encodes, which this audit takes as a given.

**Minor-data flag:** Same third-party leak as Prayer Match, but for adults
only: `SmallGroupSorter.tsx:90` sends every displayed adult's real name to
`ui-avatars.com` unconditionally, with no reveal-gate at all (unlike Prayer
Match, there's no anonymization step here — names and ages render immediately
for every produced group). Not a minor-data issue since children are filtered
out upstream, but worth a note to Area A/E reviewers: any component using this
`ui-avatars.com` fallback pattern is leaking PII to a third party by default.

**What would make this worth a volunteer's attention:** This isn't a
volunteer-facing tool; it's fine as an admin utility for the small-groups
pastor, as long as the avatar leak is fixed globally.

---

## #46 — Locus Public (member self-service portal) (`src/components/LocusPublic.tsx`)

**Verdict: CUT** (as built — this is not a portal, it's an unauthenticated
write path into live records mislabeled as read-only)

**Safety impact:** Severe and structural. `LocusPublic` is mounted in
`SidebarIntelligence.tsx:205-211` under Locus Intelligence — the surface the
inventory itself documents as the **"read-only Executive Dashboard"**
(`feature-inventory.md:12`, `LandingPage.tsx:23-31`: "Boardroom Ready
Analytics"). It is not read-only. `onSave={handleSaveStudent}`
(`App.tsx:998`) routes into the exact same `executeCommit` → `updatePerson`
pipeline (`App.tsx:339-356`, `pco.ts:365`) used by the hygiene tools, which
PATCHes the real PCO record over HTTP Basic auth using the org's live
`appId`/`secret`. Anyone who can reach the Intelligence dashboard — which per
the app's own framing is meant to be handed to leadership for read-only
reporting — can write to any person record in the organization.

There is no authentication of "member identity" at all. The control is
literally labeled "Simulate Login As" (`LocusPublic.tsx:99`) — a plain
`<select>` populated from the **entire unfiltered `students` array**
(`App.tsx:998`: `<LocusPublic students={students} .../>`, same array passed to
Prayer Match, containing every child in the org). There is no `isChild` guard
on the dropdown. Whoever is sitting at that screen can select any child in
the congregation by name, edit that child's `name`, `email`, `phoneNumber`,
and `address` fields (`LocusPublic.tsx:71-77`), and click "Update Profile."
The edit fires immediately into `handleSaveStudent`, which flushes any
pending change and commits within roughly a second (the app's own debounce
window) — no confirmation dialog, no "are you sure this is your own record,"
no audit trail visible to the person making the change.

Concretely, at the desk: this is not check-in-desk-adjacent, but it is
worse in one respect — check-in desk mistakes are caught by a trained
volunteer within the 8-minute window; a bad edit made here through a
mislabeled "portal" on a shared office or leadership laptop can sit live in
PCO, silently wrong, until the next data-health scan surfaces it — if ever,
since a plausible-looking phone number or address won't trip the anomaly
detectors in `hygiene.ts`.

**Sunday-morning cost:** Not desk-facing, but the downstream cost is real:
any address or contact field this "portal" corrupts becomes the record the
front desk later trusts for pickup/contact decisions.

**Household / guardian correctness:** This is the crux of the task's framing.
A member editing "their own household record" is a defensible feature *if*
identity is verified and the edit is scoped to fields the member is actually
authorized to change. As built: (1) there is no verification the selected
"member" is the person sitting at the keyboard, (2) a household's address is
shared editable state — if a non-custodial parent, an estranged relative, or
simply the wrong person picks a child's name from this dropdown and
overwrites the child's address, that corrupted address is exactly the kind of
data check-in and pickup workflows rely on. Locus has no `custody`,
`authorized_pickup`, or `restricted_contact` field anywhere in `Student`
(`pco.ts:71-99`) — so this feature can't even *know* to block an edit on a
custody-flagged household. It just overwrites.

**Minor-data flag:** Fails. A minor's own contact/address record is directly
editable through an unauthenticated UI control, from a surface documented
elsewhere as read-only, writing to production data.

**What would make this worth a volunteer's attention:** Nothing here should
reach a volunteer as built. To be salvageable this needs: real per-member
auth (not a name dropdown), a hard exclusion of `isChild` records from the
selectable list (children don't have independent logins — their guardian
edits on their behalf, which is a different, explicitly-modeled workflow),
and a block on editing any field PCO or Locus flags as custody-sensitive
without a staff review step.

---

## #47 — Landing / auth / role split (`src/components/LandingPage.tsx`, `src/utils/api.ts`, `src/utils/crypto.ts`)

**Verdict: NOT MY LANE for the landing page UI, but the "auth" label is doing
too much work — flagging as SIMPLIFY/rename.**

**Safety impact:** Indirect but real. `LandingPage.tsx` is not authentication
— it's a two-button role picker (`onSelectRole('core' | 'intelligence')`,
lines 14-31) with no credential check of its own. The actual credential the
app runs on is the PCO `appId`/`secret` pair entered once into React state
(`App.tsx:73-74`) and never persisted to `localStorage` — good, that part is
correct — but also **never invalidated**. There is no logout button anywhere
in `App.tsx` or any component I found. Closing the tab is the only "sign
out," and it does not clear the IndexedDB cache described in #48 below. Given
that Locus Intelligence is framed as safe to hand to leadership/board members
("Boardroom Ready Analytics," `LandingPage.tsx:29`) while actually sharing
one flat credential and one flat data cache with Locus Core, the "role split"
is cosmetic navigation, not a security boundary — which is exactly what makes
#46 possible.

**Sunday-morning cost:** None — not desk software.

**Household / guardian correctness:** N/A.

**Minor-data flag:** The role split itself doesn't touch child data, but it
is the reason nothing else in this app enforces "who is allowed to see or
edit a child's record" — there is exactly one credential level for the whole
org, and the UI-level "Core vs Intelligence" distinction is not backed by any
permission check server-side or client-side beyond which buttons are drawn.

**What would make this worth a volunteer's attention:** This should be
renamed away from "auth" in any internal docs — it is routing, not access
control — and paired with a real session boundary (logout, cache purge,
scoped credentials per role) before anyone treats "Locus Intelligence is
read-only" as a safety property.

---

## #48 — Data layer: PCO fetch, cache, rate limiting, storage
(`src/utils/api.ts`, `src/utils/pco.ts`, `src/utils/storage.ts`, `src/utils/analytics.ts`)

**Verdict: SIMPLIFY** (rate limiting is fine; the caching choice is a
child-data-at-rest problem that needs to be fixed, not iterated on)

**Safety impact:** This is the shared-office-machine question directly.
`api.ts:16-27` wires `axios-cache-interceptor` to `localforage`
(IndexedDB), with `cacheConfig = { storage, ttl: 1000 * 60 * 60 }`
(`api.ts:32`) — a **one-hour cache of the full PCO people response**,
persisted to disk, unencrypted. That response, after `flattenIncluded`
(`pco.ts:173-227`) and `transformPerson` (`pco.ts:229-289`), is (or backs) the
full `Student` record for every person in the org: birthdate, age,
`address`, `phoneNumber`, `email`, `householdId`,
`backgroundCheckExpiresAt`, `prayerTopic`. This is precisely the class of
data — children's addresses, birthdates, contact info — the persona brief
calls the church's most sensitive data. It sits in IndexedDB in plain JSON
on whatever machine ran Locus, readable by anyone with browser devtools
access to that origin, for at least the TTL window and in practice until
something overwrites that cache key (no eviction-on-logout, no clear-on-close
found anywhere in the codebase).

Contrast this with `storage.ts`: `AppConfig`, `HealthHistoryEntry[]`, and
`GamificationState` are all wrapped in AES-GCM via `crypto.ts`
(`storage.ts:64,91,105,132,163,194`) — the *least* sensitive data in the app
(UI preferences, streak counts, badge unlocks) is the data that's encrypted
at rest. The *most* sensitive data — the actual children's PII the whole
check-in system exists to protect — flows through a cache layer with no
encryption at all. That's backwards, and it's the kind of gap that isn't
caught by functional testing because everything still "works."

Two secondary notes: (1) the AES-GCM key for the config/gamification data is
derived from `appId` (`storage.ts:64` etc. pass `appId` as the password to
`encryptData`) — the PCO Application ID is a semi-public identifier paired
with a separate `secret`, not a real user passphrase, so even the encrypted
half of this picture has a weak key. (2) rate limiting (`api.ts:37-108`)
itself is reasonable — global 429 backoff with exponential retry, capped at 3
retries — no safety concern there.

**Sunday-morning cost:** None directly, but a stale/poisoned cache (up to an
hour old, per the TTL) means the front-desk tablet could show a child's
address, allergy-adjacent notes, or `backgroundCheckExpiresAt` for a
volunteer as it stood an hour ago, not as it stands now, on any view that
reads from this cache rather than forcing `cache: false` (only a few call
sites — `writeContact` at `pco.ts:353`, check-in count at `pco.ts:430` — set
`cache: false`; the bulk `fetchAllPeople` path at `pco.ts:456` does not).

**Household / guardian correctness:** N/A directly, but the household ID
this cache carries is exactly the field #45 and #46 trust — a stale or
locally-tampered cache entry is a single point of failure for every feature
in this area that reasons about household membership.

**Minor-data flag:** Fails. Full children's PII cached to disk, unencrypted,
with no purge-on-logout (because there is no logout — see #47) and no
minimum-necessary scoping (the cache holds every field for every person, not
just what the current view needs).

**What would make this worth a volunteer's attention:** This is invisible to
volunteers by design, which is the point — it should stay invisible, but only
if it's fixed: encrypt the cached PCO payload at rest (reuse the existing
`crypto.ts` primitive), purge it on an explicit logout action (which needs to
exist first), and shorten or eliminate caching for the fields the persona
brief flags as most sensitive (address, birthdate) rather than caching the
full record uniformly.

---

## Cross-cutting observation for the audit lead

Features #44 and #46 both consume the same unfiltered `students` array
(`App.tsx:928` and `App.tsx:998`) that Area A's hygiene tools use internally
— but those two features expose it directly to end users (prayer-match
pairing, portal edit-target selection) with no `isChild` gate at the point of
exposure. The bug isn't in any one file; it's that "the list of students" is
treated as one undifferentiated pool everywhere in this app, and nothing
enforces the one distinction that matters most for child protection: a
child's record must never be independently selectable by, or matchable to, an
adult who isn't already their parent/guardian in PCO.

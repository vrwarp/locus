# Area F — Relational Tools — Round 1 Critique (church-admin)

Reviewed: `src/components/PrayerMatch.tsx`, `src/utils/prayer.ts`,
`src/components/SmallGroupSorter.tsx`, `src/utils/sorter.ts`,
`src/components/LocusPublic.tsx`, `src/components/LandingPage.tsx`,
`src/utils/api.ts`, `src/utils/crypto.ts`, `src/utils/storage.ts`,
`src/utils/cache.ts`, `src/utils/pco.ts`, `mock-api/data.js`, `src/App.tsx`
(auth block ~L60-260, ~L700-760, ~L488-570, ~L996-999),
`src/components/SidebarIntelligence.tsx`.

---

## #44 Prayer Partner Match (`PrayerMatch.tsx`, `prayer.ts`)

**Verdict: CUT**

**Would we actually open this?** Once, out of curiosity, then never again. There
is no workflow attached to it — no way to notify the two people, no way to mark
a match "made," no export, no persistence between renders (`useMemo` recomputes
a fresh Fisher-Yates shuffle every time `students` changes, so reopening the
screen produces different pairs). It is a random-pairing generator with a UI
around it, not a ministry tool.

**PCO overlap:** None directly — PCO has no "prayer topic" field or matching
capability. But this is also the tell: because it isn't a real PCO field
(see governance below), the correct PCO-native answer today is a Workflow or a
List built on a genuine custom field the church defines and fills in through a
real intake process (Connection Card → Workflow → staff pairs people by hand
with pastoral judgement). That's what actually happens now, and it happens
with a human reading the context, not a shuffle function.

**Governance / privacy risk: severe.** `mock-api/data.js:95-100` invents
`prayer_topic` from a fixed five-category list — `Financial, Health, Grief,
Anxiety, Addiction` — attached to 30% of adults at random. In `pco.ts:276`
this reads straight off a PCO custom attribute `prayer_topic`, meaning if this
shipped, it would require the church to build and consistently fill a custom
field carrying **addiction** and **grief** disclosures per person, then let
Locus auto-pair total strangers on it. Two design choices compound the risk:

1. Matching logic (`prayer.ts:26-49`) is a **plain Fisher-Yates shuffle**
   within a topic bucket. There is no compatibility logic, no exclusion list,
   no check for existing relationship, no gender consideration, no opt-in
   consent flag. A person going through addiction recovery can be randomly
   paired with anyone else tagged "Addiction," including someone they have a
   restraining order against, an ex-spouse, or their own AA sponsor's rival.
   A person could be re-paired with the same person who caused the trauma
   they disclosed.
2. The "Reveal Identities" toggle (`PrayerMatch.tsx:105-109`) is framed as a
   privacy feature ("Anonymously at first") but it's client-side UI state
   only — the underlying `match.personA`/`personB` objects, full name, email,
   and phone are already in the browser's memory and React tree before the
   toggle is clicked; anyone with devtools sees both identities and both
   struggles immediately. It's privacy theater, not privacy.

No opt-in exists anywhere in this pipeline. A member who checked a box on
Planning Center for something unrelated has no idea their record could
generate this field, let alone that a shuffle algorithm will hand their
"Addiction" tag and name to a stranger. I would not put this in front of the
executive pastor as-is — it is a serious harm-vector, not a MVP gap.

**What would make it worth the licence fee:** Delete the auto-pairing
entirely. Replace with a staff-reviewed queue: person self-discloses a topic
via an explicit consent form (not a silently-populated custom field), a real
human (pastor/care team) proposes the pair, and the tool's only job is to log
the pairing and send a calendar/text nudge. That's a workflow tool, not an
algorithm.

---

## #45 Small Group Sorter (`SmallGroupSorter.tsx`, `sorter.ts`)

**Verdict: DEMOTE**

**Would we actually open this?** Maybe twice a year, by the one staff member
who runs the fall small-group re-shuffle. Not a weekly tool, but the job it
targets (balance N groups by size/age while keeping households together) is
real and currently done by hand in a spreadsheet.

**PCO overlap:** PCO Groups would be the natural home for this, but the
inventory says Groups access was deliberately dropped. Given that, this has
no PCO overlap today — it operates purely on People + household data already
pulled in. That's a legitimate reason for it to exist client-side. Fine.

**Governance / privacy risk: low.** It only rearranges existing household/age
data already visible elsewhere in the tool; no new PII is created or exposed
by the sort itself.

**What's actually wrong:** The "genetic algorithm" framing
(`sorter.ts:52-165`, "Evolutions (Accuracy)" dropdown offering "Quick /
Balanced / Deep Search") is theater on top of a much simpler problem. This is
bin-packing on two variables (household size, average age) — a greedy
largest-household-first assignment or a simple linear-programming pass would
converge to the same or better balance in microseconds, deterministically,
and explainably. Instead we get:

- A **non-deterministic** result — rerun with identical inputs and get a
  different grouping every time (`Math.random()` seeds the population,
  `createRandomChromosome`, `tournamentSelection`, `mutate` all unseeded).
  Sarah cannot reproduce or defend a grouping decision to a family who asks
  "why aren't we with the Andersons anymore" — the honest answer is "the RNG
  decided."
- A fake **500ms `setTimeout`** (`SmallGroupSorter.tsx:24-28`) purely to make
  a sub-second computation feel like it's "evolving," i.e. manufactured
  latency to sell an algorithm that isn't doing anything a spreadsheet
  formula couldn't. This is the kind of thing that erodes trust once a
  technical staffer notices it, and multi-campus churches usually have one.
- No control for **existing relationships** (a couple that just left a group
  due to conflict, a leader who needs to stay with their co-leader) — the
  only two knobs are group count and "accuracy," neither of which is the
  actual constraint staff care about.

**What would make it worth the licence fee:** Keep the balancing goal, drop
the genetic-algorithm cosplay for a fast deterministic solver, add a manual
override/drag-and-drop after auto-sort (the auto-sort is a starting point,
not a final answer), and add a "keep apart" / "keep together" pin so staff
can encode the actual pastoral constraints instead of just size and age.

---

## #46 Locus Public — member self-service portal (`LocusPublic.tsx`)

**Verdict: CUT** (as shipped; the underlying idea survives as a different
product)

**Would we actually open this?** This is not a member-facing portal at all —
it is a screen *inside the staff admin app* with a dropdown labeled "Simulate
Login As" (`LocusPublic.tsx:98-112`) that lets whoever is sitting at the
admin workstation pick **any member by name** and edit their contact info on
their behalf. There is no separate authentication, no magic link, no
member-owned session, no public deployment. Calling this "Locus Public" and
putting "member self-service portal" in the inventory description overstates
what exists by an order of magnitude. As built, staff would open this to
manually edit a person's contact info — which the existing Golden Record /
inline-edit tools in Core already do. It adds nothing beyond a different
form layout wrapped around the same `onSave` (`App.tsx:998` →
`handleSaveStudent`).

**PCO overlap:** This is trying to be Planning Center's actual Public/Church
Center member profile self-edit feature, which already exists, is
production-hardened, member-authenticated, and free with a PCO plan. If the
goal is "let members update their own address," the church should turn that
on in Church Center, not build a shadow version inside an internal tool that
requires the church's own API secret to run.

**Governance / privacy risk: severe, and structural, not incidental.** This
screen is reachable from the **Intelligence role's sidebar**
(`SidebarIntelligence.tsx:204-211`, "Tools → Locus Public"), the role the
landing page explicitly sells as "read-only Executive Dashboard"
(`LandingPage.tsx:23-30`, `feature-inventory.md:12`). Its Save button calls
`handleSaveStudent`, the exact same function Core's hygiene tools use to
patch real PCO records over HTTP Basic auth (`App.tsx:546` →
`executeCommit` → `api.patch`, same credentials as Core). So:

- The "read-only" executive/board persona can, in fact, silently rewrite
  any member's name, email, phone, and address in the live PCO org, with no
  audit trail different from a normal Core edit and no member consent in
  the loop at all.
- Because it impersonates "logging in as" a member without any actual
  member-side authentication, if this were ever pointed at a real deployment
  URL and shared, it would let whoever has the link browse and silently
  edit any household's data, which is exactly the "who can archive a real
  family by mistake" scenario Locus should be defending against, not
  creating.

This is not a UI polish issue — the Core/Intelligence split is being sold as
a permission boundary and this feature proves it isn't one (see #47 below).

**What would make it worth the licence fee:** Nothing about the current
implementation should ship. If the church wants member self-service, that's
PCO Church Center, already built. If Locus wants a genuine "staff assists a
member over the phone" quick-edit flow, call it that, keep it in Core only,
log it distinctly from bulk hygiene fixes, and drop the "Simulate Login As"
framing entirely — it invites exactly the wrong mental model.

---

## #47 Landing / auth / role split (`LandingPage.tsx`, `api.ts`, `crypto.ts`)

**Verdict: CUT the security framing; KEEP as a navigation preset**

**Would we actually open this?** Every session — it's the login screen. But
"every session" is exactly why the gap between what it promises and what it
enforces matters.

**PCO overlap:** None — this replaces nothing PCO does; PCO's own role/
permission system (Manager/Editor/Viewer, People permissions) is the real
thing this should be deferring to and isn't.

**Governance / privacy risk: severe — the role split is cosmetic, not a
security boundary, and #46 proves it by example.**

1. **One credential, one trust level, two skins.** `userRole` is a plain
   `useState<'core'|'intelligence'>` (`App.tsx:79`) chosen by a button click
   *after* the same full-scope PCO Application ID + Secret has already
   authenticated (`App.tsx:100-103`, `184-207`). There is no PCO OAuth scope
   difference, no separate credential, no server enforcing anything — it's a
   client-side `if` that decides which sidebar renders. Anyone in the
   Intelligence role can open devtools, or — as shown above — just click
   into "Locus Public," and reach the exact same write path Core uses.
   Calling Locus Intelligence a "read-only Executive Dashboard" in the
   landing copy (`LandingPage.tsx:26-30`) and the inventory is a claim the
   code does not back up.
2. **The Application ID is used as the encryption password for
   everything cached locally** — `saveConfig`/`loadConfig`,
   `saveHealthSnapshot`, `saveGamificationState` (`storage.ts`), and the
   entire People cache (`cache.ts:22-35`, `App.tsx:215-233`) all call
   `encryptData(data, appId)`/`decryptData(data, appId)` where the password
   is **`appId`, not `secret`**. The Application ID is the *non-secret*
   half of a PCO Personal Access Token — it's typically shared across every
   staffer who uses the same PCO integration, visible in plaintext in the
   login form, and not something anyone is trained to protect. Using it as
   a PBKDF2 password (`crypto.ts:6-12`, 100k iterations, otherwise
   competently implemented AES-256-GCM) gives every legitimate Locus user
   at that church — and anyone who ever saw the appId in a Slack message,
   a support ticket, or a screen-share — the ability to decrypt the full
   cached People dataset, prayer topics and all, from a stolen laptop or a
   shared office machine. This is encryption in name, not in threat model:
   it defends against nothing an actual attacker on a shared machine would
   be stopped by, and it teaches the church a false sense that "our data is
   encrypted at rest" (technically true, functionally meaningless without
   the secret in the KDF).
3. **No session boundary.** There's no logout, no credential expiry, no
   idle timeout visible in this component. On a shared front-desk or check-
   in laptop, the "auth overlay" only reappears if `appId`/`secret` are
   empty — and they live only in React state, so a page refresh does clear
   them (that part is fine), but nothing time-bounds an unattended open tab
   in the interim, and the IndexedDB caches described in #48 persist after
   the tab closes regardless.

**What would make it worth the licence fee:** Either (a) make Core/
Intelligence a real permission boundary — separate PCO OAuth scopes or a
Locus-side backend that mediates write access and denies it to the
Intelligence role server-side — or (b) stop calling it a security boundary
at all and market it honestly as "two dashboards, one login, use your
judgement about who you hand the Intelligence view to." Fix the KDF to use
the *secret*, not the appId, as the local-storage password at minimum;
that's a one-line change with a large trust payoff.

---

## #48 Data layer: PCO fetch, cache, rate limiting, storage (`api.ts`, `pco.ts`, `storage.ts`, `cache.ts`)

**Verdict: SIMPLIFY**

**Would we actually open this?** Not a screen — it's the plumbing under
every screen. Sarah never "opens" it, but she lives with its consequences
every time she logs in on the office's shared front-desk PC.

**PCO overlap:** This replaces PCO's own API client concerns (rate limiting,
pagination) — reasonable to own client-side, PCO doesn't provide this as a
product feature.

**Governance / privacy risk: real, and it's the "shared office machine"
scenario named directly in this round's brief.** There are **two separate,
inconsistent caching layers** writing full congregation PII to disk:

1. `src/utils/cache.ts` — "people_v2_{appId}" — encrypted (weakly, see #47)
   with AES-GCM in a dedicated `locus-db` IndexedDB store. 5-minute TTL in
   practice (`App.tsx:217`) but the TTL is enforced client-side by
   comparing timestamps on read (`cache.ts:45-48`) — the encrypted blob
   itself sits in IndexedDB indefinitely until something reads and expires
   it. Nothing purges it on logout; there is no logout.
2. `src/utils/api.ts:16-35` — a **second, independent** cache via
   `axios-cache-interceptor` + `localforage`, storing raw HTTP responses
   (full PCO People payloads: names, addresses, phone numbers, birthdates,
   background-check-expiry dates, the `prayer_topic` custom field) in a
   **separate, unencrypted** IndexedDB/localForage store, TTL 1 hour
   (`api.ts:32`). This is the general-purpose axios instance every `pco.ts`
   GET call goes through (`pco.ts:456-477` etc.), so every person record
   Locus ever fetches for *any* screen — hygiene grading, burnout scoring,
   giving trends, prayer topics — lands here in plaintext, independent of
   and in addition to the "encrypted" cache above.

On a shared office or volunteer-check-in machine, that second store alone
means: the moment anyone uses Locus, that browser profile now has an
unencrypted, on-disk copy of the full congregation roster — including the
custom fields this audit already flagged as sensitive (prayer topic,
background-check status, giving-adjacent flags) — that outlives the
session, survives a tab close, and isn't cleared by anything in this
codebase. A person with local file access (a shared login, a wiped-but-not-
securely-erased donated machine, a stolen laptop that was left logged into
the OS) gets the data without ever touching PCO or Locus's "encryption."

There's also a **correctness** cost to running two caches with different
TTLs and different keys against the same underlying data: it's possible for
a hygiene fix committed through one path to be visible in one cache and
stale in the other, and nothing here reconciles them.

**What would make it worth the licence fee:** Pick one cache. If the
axios-level HTTP cache is being kept for request dedup on slow connections,
either encrypt it with the same discipline as `cache.ts` (and fix the KDF
issue from #47 first) or cap it hard and clear it on any auth-state change.
At minimum, add an explicit "Clear local data" action and wipe both stores
on it — right now there is no user-facing way to purge what's been cached,
which a church using a shared machine needs on day one, not as a v2 feature.

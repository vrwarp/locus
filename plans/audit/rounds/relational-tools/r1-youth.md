# Area F — relational-tools — Round 1 (youth-ministry critique)

Reviewed: `src/components/PrayerMatch.tsx`, `src/utils/prayer.ts`,
`src/components/SmallGroupSorter.tsx`, `src/utils/sorter.ts`,
`src/components/LocusPublic.tsx`, `src/components/LandingPage.tsx`,
`src/utils/api.ts`, `src/utils/crypto.ts`, `src/utils/pco.ts`,
`src/utils/storage.ts`, `plans/small_group_sorter_implementation.md`,
`plans/progress.md`.

---

## #44 — Prayer Partner Match

**Verdict: CUT** (as currently scoped — not shippable to a youth ministry, and
I'd argue not to the whole-congregation build either, until it has an
age/role boundary)

`matchPrayerPartners` (`src/utils/prayer.ts:9-53`) groups every `Student` with
a non-null `prayerTopic` and pairs within the group with a Fisher-Yates
shuffle. There is no filter on `isChild` anywhere in the function — it takes
the full `people` array the caller hands it. `PrayerMatch.tsx:13` calls it
with `students` unfiltered. Mock topics
(`mock-api/data.js:96`: Financial, Health, Grief, Anxiety, Addiction) are
exactly the categories a 13-year-old's intake form or check-in note would
carry.

**Does it survive the school year?** N/A — this isn't a grade/calendar
feature, but note it re-shuffles on every render via `useMemo` keyed on
`students` reference, so pairings are not stable and not persisted; nothing
here understands a small-group context or a leader relationship at all.

**False positive / false negative cost:** Concretely: a 14-year-old marked
`prayer_topic: Grief` (a parent's cancer, a recent death) can be
algorithmically paired with a 40-year-old man marked `Grief` from an
unrelated family, with **no adult/minor boundary, no gender boundary, no
leader-in-the-loop**. The UI's "Reveal Identities" button
(`PrayerMatch.tsx:105-109`) hands over real name, avatar, and
email-or-phone (`match.personA.email || match.personA.phone`) directly
between the two matched people — i.e., it functions as an introduction
service that puts a stranger adult in direct 1:1 contact with a minor around
a sensitive personal topic, outside any supervised setting. There is no
false-positive/false-negative framing that rescues this: any match across
the isChild boundary is a hard failure, not a tuning problem.

**Minor-safety flag: YES — this is the single worst finding in the area.**
Contacting a minor without a parent/leader in the loop is a safeguarding
failure per my own policy (see agent brief point 5), and this feature does
it by design, automatically, and hands over contact info with one click. It
also exposes a minor's self-disclosed struggle topic (grief, anxiety,
addiction) to a matched stranger with zero access control beyond "logged
into Locus Core."

**What a volunteer leader would need:** Nothing here is built for a leader
at all — there's no leader-mediated step. If this concept has any value in
a youth context it would be: leader-only visibility into *which students*
share a topic (never contact-info reveal), and pairing constrained to
same-age-band, same-gender, same-small-group students, with the small group
leader initiating any conversation. As built, ship it to nobody under 18.

---

## #45 — Small Group Sorter (my lane)

**Verdict: NOT MY LANE, and mislabeled for anyone who is** — this is an
adult/congregational life-group tool, not a youth small-group tool, despite
sitting in an area I was asked to judge as if it were mine.

The implementation doc confirms this outright:
`plans/small_group_sorter_implementation.md:4`: "generate balanced small
groups of **adults** within the congregation." The code enforces it:
`sorter.ts:21` — `buildHouseholds` does `students.filter(s => !s.isChild)`
before anything else runs. `SmallGroupSorter.tsx:36` markets it as
"distribute **adults** into perfectly balanced small groups by size and age,
keeping families together." A student, by definition of `isChild`, cannot
appear in an output group.

Judging it against how I actually build a Sunday small-group roster (grade
band, school, gender, leader capacity, friendship clusters, and the specific
kids who must be kept apart):

- **Grade band:** absent. The only continuous variable is `age` (from
  `birthdate`), minimized by variance across groups — this is an adult
  small-group heuristic (keep a life group from being all 25-year-olds or
  all 70-year-olds), not a grade-band constraint. It has no concept of grade
  at all, let alone the 6th/9th-grade cliffs.
- **School:** absent — no field, no constraint.
- **Gender:** absent. `evaluateFitness` (`sorter.ts:52-87`) optimizes only
  size variance and age variance. A youth leader assigning students must
  keep gender splits, especially for cabin/retreat groupings; there's no
  hook for it.
- **Leader capacity:** absent. `groupCount` is a raw integer the operator
  picks; there's no leader entity, no leader-to-group ratio, no leader skill
  or availability field anywhere in `Student` or `SmallGroup`.
- **Friendship clusters (keep together):** partially present but scoped
  wrong — `buildHouseholds` keeps *household* members together
  (`s.householdId`), i.e., spouses/family, which is the adult use case
  ("don't split a married couple"). It does not know about a peer friend
  group, which is the actual "keep together" unit for a 14-year-old.
- **Keep-apart list (the one that matters most to me):** absent entirely.
  There is no negative-constraint mechanism anywhere in the genetic
  algorithm — no way to say "these two can never end up in the same group,"
  which for a real student roster (an ex-couple, a bullying history, a
  restraining situation) is the single most safety-critical constraint a
  small group tool must support. Shipping this to youth ministry without it
  is worse than not sorting at all, because "the algorithm did it" reads as
  authoritative and a leader is less likely to double-check it than a
  manually-built roster.

**Does it survive the school year?** Not applicable to its actual scope
(adults), but if this were ever pointed at students unmodified, no: it has
zero grade-promotion awareness and zero cliff awareness, and `age` alone is
a bad proxy for grade band (two students can share an age and be a full
grade apart around a September birthday).

**False positive / false negative cost:** If someone in my building points
this at student data expecting a youth small-group roster (a completely
plausible misuse, since it's the only "small group" feature in the app and
sits under the same "Ministry Intelligence" umbrella as youth-adjacent
tools), the cost is a genetics-derived roster with no keep-apart honoring —
i.e., an algorithm could put two students in the same group whom staff know
must never be seated together. That is not a tuning bug, that's a
safeguarding incident waiting to happen, and the UI gives it a veneer of
rigor ("Deep Search (2000 Gen)") that will discourage a leader from
overriding it.

**Minor-safety flag:** Only in the misuse scenario above, but given that the
feature inventory lists this as one of five "relational-tools" alongside
youth-adjacent features, and nothing in the UI (`SmallGroupSorter.tsx`)
warns "adults only" or blocks itself when the input contains minors, I flag
it: nothing stops an operator from running this over a student list and
getting output that looks like a real recommendation.

**What a volunteer leader would need:** This entire tool, if retargeted at
students, would need to be rebuilt from different primitives: grade as the
primary bucket (not age), gender as a hard constraint, a "keep apart" pair
list as a hard constraint (fitness = -infinity on violation, not a soft
penalty), leader assignment and capacity per group, and a friend-cluster
soft-preference. None of that exists today. As shipped, it's a decent
congregational adult-groups tool wearing a name ("Small Group Sorter") that
in youth ministry means something completely different, and I'd insist the
product either rename it (e.g. "Life Group Balancer") or scope a genuinely
separate student version — not stretch this one to cover both.

---

## #46 — Locus Public (member self-service portal)

**Verdict: CUT** as built — this is not a member portal, it's an
unauthenticated impersonation picker sitting inside the staff tool, and the
roadmap direction in `plans/progress.md` makes it worse, not better.

Could a 14-year-old log in and edit their own record? As literally shipped:
no, because "Locus Public" is not separately deployed or reachable outside
Locus Core — it's a view (`locus-public`) inside the same authenticated
Core app, gated only by the app-wide PCO Application ID/Secret entered once
at `App.tsx:705-722` (a single organizational credential, not a per-person
login; confirmed by `LandingPage.tsx`, which is a **workspace picker**
— "Locus Core" vs "Locus Intelligence" — with no authentication logic
whatsoever, contrary to what its inventory label "auth / role split"
implies).

But inside that one shared, staff-side session, the portal simulates being
any member with zero further authentication:
`LocusPublic.tsx:98-112` — "Simulate Login As:" is a plain `<select>`
populated from the **entire unfiltered `students` array**
(`App.tsx:998` — `<LocusPublic students={students} onSave={handleSaveStudent} />`,
no `isChild` filter). Anyone with the browser open can pick any name
— including any student under `isChild: true` — and the form pre-fills
that person's real name, email, phone, and address
(`LocusPublic.tsx:30-47`) and lets the operator edit and submit them.
`handleUpdate` (`LocusPublic.tsx:54-89`) calls `onSave`, which is
`handleSaveStudent` in `App.tsx`, which — per the inventory's standing
context — writes back to the **real PCO record** via `updatePerson`
(`pco.ts:365`). A successful submit shows "Profile updated successfully!
Points earned!" (`LocusPublic.tsx:199`), i.e., the change is gamified as
if the "member" did it themselves.

So: would a parent know? No mechanism exists to notify one. There's no
audit trail distinguishing "the student updated their own contact info via
the portal" from "a staff member impersonated them," no consent step, and
no separate identity check (password, magic link, PCO's own person-level
auth) between selecting a name and writing to production data.

**Does it survive the school year?** N/A.

**False positive / false negative cost:** Not the right frame here — the
risk isn't a wrong insight, it's a real, unaudited write to a minor's
contact record (email/phone/address) that PCO will treat as authoritative,
with no way afterward to tell who actually made the change.

**Minor-safety flag: YES.** Two distinct problems: (1) the dropdown does not
exclude minors, so an operator (deliberately or by misclick) can alter a
student's contact information under the "member self-service" banner
without the student or parent involved at all; (2) the naming and framing
("member self-service portal", points-earning success message) signal that
the intended end state is for the member themselves to use this — and
`plans/progress.md:95` explicitly lists as a next step "changing household
logic directly from the member portal (e.g. moving a child out when they
turn 18 or adding a spouse)." If this is ever actually exposed to end
users with anything resembling the current auth model (a shared
credential, a bare identity picker, no minor-specific gate), it becomes a
live case of a 14-year-old — or anyone claiming to be one — editing their
own PCO record with no parent notified. That must not ship for anyone under
18 without, at minimum, parent/guardian co-authentication and a visible
audit log.

**What a volunteer leader would need:** Not applicable — this bypasses
leaders entirely, which is itself the problem. Any real self-service
surface for a minor must route through a parent/guardian account, not the
student's own unverified selection from a name list.

---

## #47 — Landing / auth / role split

**Verdict: NOT MY LANE**, but flagged because it is load-bearing for #44-46's
safeguarding gaps.

`LandingPage.tsx` is a two-button workspace switcher (Core vs Intelligence),
not an authentication or authorization system — there are no roles, no
per-user identity, and nothing that would prevent whoever has the org's PCO
Application ID/Secret (entered once at `App.tsx:705`) from reaching every
view in Core, including Locus Public and Prayer Partner Match, and from
seeing every student's data including minors' prayer topics and contact
info. For a youth ministry, "the whole church shares one login" is a real
pattern (multi-campus, volunteer turnover), which makes the *lack* of any
per-person access boundary directly relevant to #44 and #46 above — it's the
reason nothing stops a volunteer with Core access from opening Locus Public
and editing a student's phone number, or Prayer Match and revealing a
student's contact info to a stranger.

**Minor-safety flag:** Indirect but real — the absence of role separation
is what turns #44 and #46 from "risky if misused" into "one credential away
from misuse by anyone in the building."

---

## #48 — Data layer: PCO fetch, cache, rate limiting, storage

**Verdict: NOT MY LANE** for the plumbing itself, one flag worth carrying
forward.

`src/utils/api.ts:14-34` caches full PCO API responses — including every
student's name, birthdate, email, phone, and address — in `localforage`
(IndexedDB) with a 1-hour TTL, unencrypted (only the small config/gamification
blobs in `storage.ts` go through `encryptData`/AES-GCM; the person-data cache
in `api.ts` does not). On a shared or unlocked staff device this means a
full roster of minors' PII, including whatever `prayer_topic` and
`background_check_expires_at` carry, sits in browser storage in the clear
for up to an hour after last use. Not disqualifying on its own, but it
compounds #44/#46: the same browser session that can mis-pair a prayer
match or impersonate a student in Locus Public is also holding an
unencrypted local copy of every student's contact details.

---

# Summary

| # | Feature | Verdict |
|---|---------|---------|
| 44 | Prayer Partner Match | CUT |
| 45 | Small Group Sorter | NOT MY LANE (mislabeled — adults only, no keep-apart constraint if ever pointed at students) |
| 46 | Locus Public | CUT |
| 47 | Landing / auth / role split | NOT MY LANE (flag: enables 44/46) |
| 48 | Data layer | NOT MY LANE (flag: unencrypted local cache of minor PII) |

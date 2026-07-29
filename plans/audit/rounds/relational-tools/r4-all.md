# Area F — Round 4 — all four personas

Read against `proposal-v3.md` and each persona's own `r3-*.md`. Per-round
instruction: most items are CONVERGED and not reopened. This round is spent on
Q6 (Intelligence fold-in), Q3 (per-user PCO OAuth), Q2 (adult pin scope), and
verifying the two items shipped this session — `ui-avatars.com` egress fix and
`sorter.ts`'s `isMinor` predicate.

Verified in the working tree before writing any of the four passes:

- `src/utils/avatar.ts:28` — comment-only trace of the old
  `ui-avatars.com` call; `initialsAvatar` (`:32-49`) renders a local SVG data
  URI. `grep -rn ui-avatars src/` returns only that comment. DONE, matches
  proposal.
- `src/utils/pco.ts:122-123` — new shared predicate:
  `export const isMinor = (person) => person.isChild || person.age < 18 || person.age > 110;`
  with a doc comment (`:104-121`) explaining why `isChild` alone is
  insufficient.
- `src/utils/sorter.ts:1,21` — `buildHouseholds` now imports `isMinor` and
  filters with `students.filter(s => !isMinor(s))`, replacing the old
  `!s.isChild` check. This is a **filter hardening**, not a refusal.
- `src/components/SmallGroupSorter.tsx:11-31` — `handleRunAlgorithm` calls
  `sortIntoGroups(students, groupCount, generations)` on the full, unfiltered
  `students` prop with no precondition, no count of excluded minors, no error
  state, and no message. There is no code path in this file that stops the
  algorithm from running or tells the operator anyone was excluded. **The
  input-time refusal F5 specifies is not built.** Whether the filter alone is
  acceptable is answered per-persona below, but the shared fact is: a minor's
  record is still silently dropped from the group list with zero operator
  signal, which is the exact failure mode F5 was written to close, only with
  a more correct predicate now doing the silent dropping.
- `src/components/LocusPublic.tsx`, `PrayerMatch.tsx`,
  `SidebarIntelligence.tsx`, `LandingPage.tsx`, and `App.tsx:677`
  (`userRole === 'core' ? CoreLayout : IntelligenceLayout`) are all still
  present and unmodified. F2/F3/F9 are proposal-stage only this round; no
  guard exists yet at `handleSaveStudent`/`executeCommit`/
  `handleSaveStudentBulk`.

---

## UXR

**Q6 — fold Intelligence into Core.** CONVERGED, no residual objection, and I
want to sharpen the record on what "audit-level ratification" actually
requires rather than just repeat r3. `SidebarIntelligence.tsx:204-226`
verified unchanged this round: the Tools section is still exactly
Automations and Emergency Alerts, both read-only. Nothing in this round's
source changes alters the structural finding. Yes — fold it in. The fold-in
belongs to this audit because the audit is what discovered it: no single
area proposal would ever surface "the second app shell has no job left"
because no single area owns the shell. Declining to ratify it because it
"spans five areas" is exactly the wrong reason to decline — it is precisely
the class of finding an audit exists to make and an area-by-area process
cannot.

**Q3 — per-user PCO OAuth.** Not my lane to settle the architecture, but I'll
name the UX cost of leaving it unnamed: if R4 doesn't pick target-or-non-goal,
F9's "Areas B-E determine how many of the 22 survive" work proceeds blind to
whether the eventual role gate is real (server-enforced) or cosmetic
(client-side `if`). A designer building the role-gated section in Core needs
to know which one they're building toward, because a real permission boundary
supports a different information architecture (a Viewer login can *only* see
gated content, so the gate can be structural — a different login screen) than
a cosmetic one (everything is in one shell and the gate is decoration). Name
it as non-goal for this release if that's the honest answer — but name it.

**Q2 — adult pin/anti-pin.** No objection to the v3 lean (yes-but-after F7).
One addition: a pin list is itself a small persistent artifact ("keep X away
from Y") that needs the same before/after visibility discipline as everything
else in this area — if a pin silently expires or silently fails to apply
because F7's memory-first cache dropped it, the leader who set it up in
January has no way to know their conflict-avoidance pin stopped working in
March. Not a blocker, just don't let the pin-list UI ship without a "your
pins" summary view.

**Sorter filter vs. refusal.** The filter alone is not acceptable and does
not substitute for the refusal. A silently-shorter group list is precisely
the failure mode this whole area has been converging against for three
rounds — Sandbox Mode, F1, and now this are the same shape: a safety
behaviour that happens with no user-visible signal is indistinguishable, from
the seat of the person using the tool, from no safety behaviour at all. The
predicate got smarter; the UI got no better at telling anyone a household was
dropped. Ship the refusal from F5 §"Presentation" before treating this as
closed.

CONVERGED elsewhere: Q5 (mandatory preview, no toggle), #44 CUT, #46 CUT, F7
shape, F8, Idea 1, Idea 2.

---

## Church Administrator

**Q6 — fold Intelligence into Core.** Yes, and from the office chair this is
the easier call than UXR's UX argument makes it sound: I am the person who
has to explain to Dr. Robert why he has two logins for one tool. Right now a
pastor with "Intelligence" access clicks a workspace picker before he has
even authenticated — that's a second product decision imposed on him before
Locus has proven it's worth the first one. Collapsing that into one login
with a role-gated view is not just cleaner engineering, it's fewer support
tickets to my desk ("which one do I use again?") and one less thing to
explain during onboarding. Fold it in. On ownership: an audit that finds a
cross-cutting waste and declines to act on it because "no area owns it" is
exactly the kind of process failure that leaves duplicated software running
for years in real IT shops — I've seen it happen with two competing internal
portals that nobody could kill because no single department was chartered to
kill both halves. Assign it an owner (Area F, since F2's guard is the
precondition and F2 is Area F's item) rather than orphaning it.

**Q3 — per-user PCO OAuth: I need this named, and I need it named as
non-goal for now, honestly.** Getting real per-user OAuth working against
PCO is a project of its own — provisioning, token refresh, mapping PCO
Viewer/Manager roles onto Locus roles, and explaining to a volunteer why
their PCO login now also logs them into Locus. That is not a Round 4 fix,
it's a v2-of-the-product decision. What I need from this audit is honesty in
the interim: **the role gate on the folded-in Intelligence view is a UI
convenience, not a security boundary, until per-user OAuth ships.** Say that
in the commit message and in any internal doc, because the moment Intelligence
folds into Core, "userRole" stops being "which app did you click" and starts
looking, to anyone reading the code casually, like an access-control system.
It isn't one. `secret` is shared org-wide Basic Auth (`App.tsx:100-103`); a
Viewer-labeled user with that `secret` can open devtools and write. F9 does
not change this, it just removes the last bit of security-by-obscurity (a
component not being mounted). Non-goal for this release, named target for
whenever OAuth is prioritized — but not implied-to-exist by phrasing, as the
proposal itself already flagged.

**Sorter filter vs. refusal — the filter alone is not enough, and here's
what it costs a real office.** A volunteer leader runs the sorter Tuesday
night, gets back 5 groups, and nothing tells her a 16-year-old who should
have had `isChild` set (but didn't, because his household record is stale —
this is the single most common data hygiene problem I deal with) got quietly
dropped from the roster instead of quietly *included* in an adult group. She
doesn't know either way. A shorter group list looks exactly like "not
everyone signed up this week," which is the normal, unremarkable case. The
refusal isn't bureaucratic caution, it's the only thing that turns "the
roster looks a little short" into "someone needs to go fix this record before
we run this again." Ship the refusal from F5; the hardened predicate is
necessary but was never sufficient on its own — that was always the point of
specifying an *input-time* check rather than a filter.

CONVERGED elsewhere: Q5 ruling, KDF migration requirements (§2 of my r3),
trusted-device toggle + idle timeout (F8), the shared-Basic-Auth non-issue on
`userRole` persistence.

---

## Youth Ministry

**Q6 — fold Intelligence into Core.** Not my strongest lane, but I'll go on
record: yes. Nothing about a second app shell serves a student-safety
purpose, and one fewer login surface is one fewer place for a leader to get
confused about which tool they're in on a Wednesday night. Agree with UXR and
church-admin's reasoning; no independent objection.

**Q3 — per-user PCO OAuth.** Same answer as church-admin from my seat: name it
as non-goal now, real target later, and say so out loud. The one place this
actually touches my domain: if Intelligence folds into Core and a future
"Viewer" role is ever handed to an outside volunteer coordinator or a
part-time admin, the fact that the boundary is client-side only means that
person's login is functionally a full write credential to student records the
moment they know how to open devtools — which is not a hypothetical for a
19-year-old volunteer leader. Not a blocker on F9, but the non-goal framing
matters more here than in most areas because "Viewer" implied a safety
boundary around minors' data specifically.

**Sorter filter vs. refusal — the filter alone is not acceptable, and I want
to be precise about why, since I signed off on the predicate itself last
round.** I confirmed the `isMinor` predicate is correct (`pco.ts:122-123`) —
that part of my r3 finding is fully addressed and I have no further objection
to the predicate. But `sorter.ts:21`'s hardened filter and an *input-time
refusal* are not the same control, and I said so in the proposal I'm now
re-reading: F5 specifically calls the deletion of the old filter
"load-bearing, not cosmetic" *because* a guard placed anywhere except the
input would let minors vanish from the roster with the operator reading a
short group list as "clean." That is exactly what `SmallGroupSorter.tsx:17-31`
does today — `handleRunAlgorithm` runs unconditionally on the full `students`
array, no precondition, no count, no message. The predicate got fixed; the
control I actually asked for — a full-stop error naming the count and reason,
no partial output — does not exist yet. This is not a new objection, it's the
original one, not yet closed. **Verdict on #45 stands as SIMPLIFY, conditional
on the refusal — ship it before treating F5 as done.**

CONVERGED elsewhere: #45 rename to Life Group Balancer, F6 solver rebuild,
the `age > 110` bound (now implemented inside `isMinor` — confirmed at
`pco.ts:123`, closing that half of my r3 finding), Q7 flagged-not-blocking.

---

## Children's Ministry

**Q6 — fold Intelligence into Core.** Yes, on safety grounds specifically, not
just navigation-cost grounds. A second app shell that a Viewer-labeled
pastor account can reach is one more surface where someone eventually asks
"can I get children's ministry data in here" and the honest engineering
answer, today, is "the boundary is a client-side `if`, so functionally yes."
Collapsing to one shell with F2's guard as the actual (still client-side, see
below) boundary doesn't fix that, but it stops pretending two shells means
two levels of protection. One clearly-labeled, honestly-scoped boundary beats
two chrome layers around the same weak one. Agreed with UXR and church-admin;
no independent objection to raise.

**Q3 — per-user PCO OAuth.** Name it as non-goal for now, but I want the
strongest version of the warning on record: until real per-user auth exists,
**do not let F9's fold-in be described internally as "Viewer-safe" or
"read-only-safe" for children's records.** It is not. The children's ministry
data that matters most for my policy floor — addresses, background-check
status, allergy/medical-adjacent fields where they exist — is gated by
`userRole !== 'core'` client-side only, same shared `secret`. If a church ever
hands an Intelligence-only login to an outside volunteer coordinator or a
part-time comms person because the picker made it feel like a lesser,
safer account, that person has the same write credential as core staff the
moment they open devtools. That's the concrete harm behind "name it as
non-goal, not implied-to-exist."

**Sorter filter vs. refusal.** Not my primary lane (Life Group Balancer sorts
adults), but the pattern is exactly the one I flagged for the batch-write
preview in r3 and I'll say it again here because it's the same shape: **a
safety behaviour with no visible artifact is not a safety behaviour, it's a
silent behaviour that happens to be safe today.** The filter (`isMinor`
applied in `buildHouseholds`) is real progress — it fixes the
`isChild`-alone blind spot I'd flag on any household-shaped logic — but
nothing in `SmallGroupSorter.tsx` tells the operator a record was excluded or
why. Same objection I raised on F1's synthesized dry-run: cosmetic
reassurance (a clean-looking group list) standing in for an artifact that
actually shows what happened. Ship the input-time refusal; the filter alone
is not acceptable.

CONVERGED elsewhere: F7 minimisation at the `saveToCache` boundary including
`avatar`, the trusted-device path using the same stripped `saveToCache`
(acceptance criterion), F3's disposition on `prayer_topic` remaining
ingested/cached as a named blocker for Area D.

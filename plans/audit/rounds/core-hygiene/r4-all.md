# Area A — core-hygiene — Round 4 (all four personas)

Scope per round brief: the ten converged/settled items in `proposal-v3.md` §2
(all **Y** and **S3** rows) are not reopened by anyone this round. This round
is entirely about the five open questions in §4, one per persona:
Q-E and Q-B → church-admin, Q-F → UXR, Q-C → children's, Q-G → youth.

Note for the record, out of core-hygiene's scope and not re-litigated by any
persona below: the newsletter minor filter, the `ui-avatars.com` third-party
egress, and the `saveGamificationState` passphrase bug are already fixed and
committed (`src/utils/avatar.ts:26-29`, `src/App.tsx` gamification call sites).
They do not appear as pending anywhere in this document.

---

## Church-admin — Q-E and Q-B

**Method note:** both questions are checkable against the real PCO People API,
not against opinion, so I pulled the live API reference
(`api.planningcenteronline.com/docs/apps/people/versions/2026-06-04/vertices/*`)
for `Note`, `NoteCategory`, `Grade`, `Organization`, and `SchoolOption`, and
cross-checked against what `src/utils/pco.ts` and `README.md` actually grant
Locus today.

### Q-E — the mandatory PCO-side note: writable, but the proposal hasn't scoped the whole job

The endpoint exists: `POST /people/v2/people/{person_id}/notes`, assignable
attributes `note`, `created_at`, `updated_at`, `display_date`,
`note_category_id`. That last one is not optional in practice — every `Note`
in PCO belongs to a `NoteCategory`, a **separate resource** (`GET/POST
/people/v2/note_categories`, attributes `name`, `locked`) that must already
exist or be created first. Categories also carry sharing/locking
(`NoteCategoryShare`, `NoteCategorySubscription`) — a category Locus creates
for itself is not automatically visible to every staff member with PCO
access, only to whoever the category is shared with.

Against that, `src/utils/pco.ts` today has **zero** code touching
`/notes` or `/note_categories` — not a type, not a call, nothing. The nearest
analogue, `writeContact` (`pco.ts:342-363`), shows the shape this would need
(read-or-create against a sub-resource, sequenced after the person PATCH), but
it doesn't exist for notes and the category bootstrap step has no analogue at
all. `README.md:41-51` documents the `pcomirror create-api-key --scopes
'read:*,passthrough,write'` grant in terms of "change records from Review Mode
or the Ghost Protocol" — it never names notes, note categories, or the
sharing model, so nothing in this repo confirms the `write` scope's
passthrough actually reaches `/people/v2/note_categories`, or that whatever
PCO account holds the real token behind pcomirror has People permission to
create a note (a per-user PCO permission independent of the API scope).

**Surviving objection.** `proposal-v3.md:114-120` (§3.1 A2) and `:374-382`
(Q-E itself) treat "write a PCO-side note" as roughly one line of work once
the ledger schema is right, and `:119` says "R4 does not ship without (i) and
(ii)" with no scoping for: (a) the one-time category-bootstrap/selection step
this now provably requires, (b) who can see the category once created, and
(c) write order and partial-failure handling between the note POST and the
field PATCH — if the grade/status PATCH succeeds and the note POST then fails
(rate limit, missing category, permission), does the batch report success? The
API does not collapse; the proposal's estimate of the remaining work does.
§3.1 and §3.3 need a revised note-write sub-spec before round 5, not just a
"yes it's writable" checkbox.

### Q-B — grade auto-calculate: NOT exposed via the API, settle it as such

I read every attribute PCO's schema publishes for the resources that could
plausibly carry this: `Organization` (`avatar_url`, `church_center_subdomain`,
`contact_website`, `country_code`, `created_at`, `date_format`, `grades`
[array of grade labels, not a toggle], `name`, `time_zone`), `Grade` (just
`key`/`value`, a label lookup), and `SchoolOption` (`beginning_grade`,
`ending_grade`, `school_types`, `sequence`, `value` — a grade-band lookup, not
an org setting). None carries an auto-calculate boolean or anything adjacent;
the only "auto"-prefixed attributes anywhere in the People schema are
`List.auto_refresh_enabled` and `List.has_active_automations`, both unrelated.
This is an org-level People **UI** setting (People → Settings) with no API
surface — confirmed by its absence from the resource that would have to carry
it, `Organization`.

**Answer: readable = no.** `proposal-v3.md:359-363` and `:431-435` (§5.3)
already scope the fallback correctly — keep the standalone cutoff control,
present it as "must match your PCO org setting," state the consequence. That
fallback is no longer conditional; it is simply the answer. Round 5 should
flip §2 row 2's flag from **N** to **Y** on this half and delete the "if
readable" branch from §5.3 as dead text.

---

## UXR — Q-F

Read the actual screen, not the abstract description. `App.tsx:770-806` is
`data-health`'s entire current layout: a header row with two buttons (Review
Mode count, Speed Run — the latter is cut by §3.7), then one `<GradeScatter>`
click-to-drill visualization, then a "Load More Records" footer. That's the
whole container today — one interaction model, one visual region.

`proposal-v3.md` never actually places the promotion batch inside that layout.
§3.3's "Placement and screen accounting" (`:231-235`) says only "Reachable
from Data Health / GradeScatter" and §3.5 (`:249-257`) says only "the screen
now also hosts the promotion batch" — no wireframe, no statement of whether
the batch list replaces the scatter, sits below it, or overlays it, and no
statement of what happens to the scatter's own click-to-drill affordance while
a promotion selection is in progress. Q-F explicitly asked round 4 to "judge
the crowding on the actual layout, not in the abstract" (`:388-389`) — but
there is still no layout to judge. Passive browse-and-drill (click a point →
open Review Mode) and active batch-select-and-write (check rows → typed
confirm → live write) are different enough interaction grammars that stacking
them in one `view-container` with no separation is a real crowding risk
during the one week a year this screen is busiest, not a hypothetical one.

**Surviving objection.** Cheapest fix, consistent with "no new nav
destination" (which I still hold, per my R3 finding that Core's six-surface
count is real progress and shouldn't regress): make promotion a **mode of
the existing header button row**, not concurrent screen real estate. Data
Health's header already switches context via buttons (`App.tsx:774-789`);
add "Promote eligible (N)" there, and when active it *replaces* the scatter
render with the batch-select list (same container, one visible interaction
model at a time), returning to the scatter on cancel or on write completion.
That is a one-paragraph addition to §3.5 and it is the missing piece, not a
new idea — round 5 should require it before this ships, or Q-F stays open a
third round with the same finding.

---

## Children's ministry — Q-C

**Verdict: fund it, but as one line inside work already committed, not as a
new column or a new aggregation feature.**

`Student.householdId` already exists on every record (`src/utils/pco.ts:85`),
so the join this needs — "how many other people at this household are active"
— is a `groupBy` over data already loaded in memory, not a new fetch. That
means the real question isn't engineering cost, it's where it belongs. My
Round 1/2 case for this was never "give me a Household Audit screen" — Family
Audit is dissolved this round for exactly the reason I supported (`family.ts`
household-shape guessing is unsafe) — it was "don't let me archive one kid out
of an otherwise-active family of four without knowing that's what I'm doing."

§3.2's per-record preview (`proposal-v3.md:144-149`) already builds the
exact moment this belongs in: it lists name, `ghostReason`, `lastCheckInAt`
and `createdAt` per record before any write. It does not currently carry
household context at all. Adding one line to that same row — *"3 of 4 people
at this address checked in within the last 24 months"* — costs nothing new
architecturally (the preview already renders per-record, `householdId` is
already on the object) and answers exactly the scenario I raised: an
irregular attender, or a kid checked in under the other parent's profile,
reads very differently when the volunteer can see the rest of the household
is active versus when the whole family has gone quiet. A standalone
roll-up column or a new aggregation screen is not worth building — the
preview is.

**Surviving objection.** `proposal-v3.md` §3.2 (`:140-165`) does not include
this line today. It should, before the ledger/preview work in §3.1 and §5.1
ships, since it's the same component and the same pass.

---

## Youth ministry — Q-G

**Verdict: standing lane, permanently low-volume — not a one-time report
line. Reject the framing that a clean first pass retires this bucket.**

The proposal's own reasoning (`proposal-v3.md:393-396`) is right that the 2+
behind cohort is *overwhelmingly* the manual-override population on the first
pass, and that §5.2's "confirmed correct" flag will silence most of them once
run once. But "overwhelmingly, once" is not "never again." New 2+-behind
records keep arriving for reasons that have nothing to do with the initial
backlog: a family transfers in mid-year from another church's ChMS with a
grade that was never corrected, a homeschool-to-traditional-school switch
lands a kid two grades off PCO's assumption, a birthdate typo gets fixed and
the recalculated `expectedGrade` jumps two grades in one edit, or a genuinely
new held-back decision gets made this August and hasn't been flagged yet.
Every one of those produces a fresh, un-flagged 2+-behind row indistinguishable
from the backlog at read time. A student pastor or children's director who
finds this queue empty for two years and then ignores it the third year is
exactly the false-negative cost my domain cares about most — a kid silently
sitting two grades off roster reality because the team was trained to expect
zero.

This doesn't mean a heavyweight permanent section. §3.3 already routes this
population into "the Data Health anomaly queue" (`:221-224`) — the same
mechanism every other anomaly type already uses, not a bespoke UI. That's the
right shape: after the first pass it should read near-empty most weeks, same
as any other anomaly type currently does, and nobody has to build it as a
separate permanent screen region for that to be true.

**Surviving objection.** `proposal-v3.md:392-398` (Q-G) leaves open the
possibility that round 4 could rule this "a one-time cleanup... a report
line." That framing should be closed, not left ambiguous into round 5: it is
a standing lane by cohort definition (new records enter it every year for
real reasons), it just doesn't need standing screen space beyond the anomaly
queue it already shares. Round 5 should write "standing, low-volume,
no dedicated section" into §3.3 in place of the open question.

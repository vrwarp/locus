# Area F — Round 5 — all four personas

Read against `proposal-v4.md`. Per the round's instruction, the cuts are not
re-litigated. Two things are on the table:

1. **The sequencing claim** (proposal-v4 §6): *"F2's guard is a sufficient
   replacement for the mounting accident that F9 removes."* If it is wrong, F9
   is a regression.
2. **Q2** — adult pin / anti-pin on the Life Group Balancer.

## Shared verification, done once before the four passes

Working tree at HEAD `0e6a9ec`. Full suite green: **80 files, 512 tests**.
`proposal-v4`'s citations were taken at `4b80e00`; nine screens have been deleted
since and `App.tsx` has moved ~15–35 lines in places. Line numbers below are
re-verified at `0e6a9ec` and supersede v4's.

**Shipped and confirmed, not re-opened by anyone this round:** `ui-avatars.com`
egress (`avatar.ts:28` comment only; `grep -rn ui-avatars src/` returns that one
line); shared `isMinor` (`pco.ts:122-123`, doc comment `:104-121`, now with its
own unit test); `sorter.ts:1,21`; `recruitment.ts:96`; the sorter's input-time
refusal (`SmallGroupSorter.tsx:23,26,76,82-92`); de-vacuumed component mocks.

**The state of the "mounting accident" — the fact the whole round turns on.**
The proposal describes Intelligence users as protected because write-capable
components are not mounted in their shell. **That is only two-thirds true at
HEAD, and it was never true for the most destructive path in the app.**

* The `userRole === 'core'` fence in `App.tsx` opens at **`:982`** and closes at
  **`:1008`**. It contains exactly three things: `SmartFixModal`, `ReviewMode`,
  `GoldenRecordModal`.
* **`GhostModal` (`App.tsx:1017-1024`) and `FamilyModal` (`App.tsx:1026-1031`)
  are mounted outside that fence** — they render for an Intelligence-shell user
  today. `GhostModal`'s `onArchive` → `handleArchiveGhosts` (`App.tsx:292`) →
  `archivePerson` (`pco.ts:445`) → `updatePerson` (`pco.ts:389`), which writes
  `status: 'inactive'` to a live PCO person record. `FamilyModal`'s `onFix` →
  `handleFamilySwap` (`App.tsx:412`) constructs a `BatchUpdateCommand` and calls
  `command.execute()` at `App.tsx:445` directly — it does **not** route through
  `executeCommit` or `handleSaveStudentBulk`.
* Both are opened by `handleNavigation` (`App.tsx:666-676`), which already
  branches on `view === 'ghosts'` and `view === 'families'` — **and
  `handleNavigation` is the single `onChangeView` handed to *both* layouts**
  (`App.tsx:709`). The only thing keeping an Intelligence user out of the
  archive dialog today is that `SidebarIntelligence.tsx` has no button that calls
  it. `SidebarCore.tsx:74,82` has both.
* `UndoRedoControls` (`App.tsx:750-755`) sits in the global toolbar inside
  `<Layout>`, ungated. `handleHistoryUndo` (`App.tsx:649`) → `command.undo()` →
  `updatePerson` (`UpdateStudentCommand.ts:43`, `BatchUpdateCommand.ts:51`).
  It is inert for an Intelligence user only because they have no way to push a
  command onto the stack — except via Locus Public, which **is** in their
  sidebar (`SidebarIntelligence.tsx:163-169`).

**So the six write entry points are:** `executeCommit` (`:331`),
`handleSaveStudentBulk` (`:480`), `handleSaveStudent` (`:558`),
`handleArchiveGhosts` (`:292`), `handleFamilySwap` (`:412`),
`handleHistoryUndo`/`handleHistoryRedo` (`:649`, `:655`). **F2 as specified
guards the first three.** All six funnel through one function: `updatePerson`
(`pco.ts:389`).

---

## UXR

**Verdict on the sequencing claim: FAILS AS WRITTEN. Repairable, cheaply.**

Two defects, in order.

**Defect 1 — the guard is placed where the code is readable, not where the
writes are.** Not my lane to audit call graphs, but the shared verification above
is unambiguous and it changes the IA question I actually own. F9's promise is
"one shell, role-gated sections that hide rather than grey out." If three of six
write paths are still protected only by *which buttons the sidebar renders*, then
F9 has not replaced the mounting accident — it has **re-implemented it one layer
up**, as a nav-render conditional inside `SidebarCore`. That is the same
protection with a new name and a worse property: today it is enforced by two
separate sidebar files that are obviously different, and after F9 it is enforced
by an `if` inside one file that a future contributor will read as cosmetic
because that is exactly what the proposal (correctly) tells them it is. Guard at
`updatePerson` (`pco.ts:389`) and the sidebar `if` goes back to being what it
should be — a menu-length decision, not a safety-relevant one.

**Defect 2 — the guard as specified has no user-visible artifact, and this area
has already ruled on that three times.** F2 says `throw new Error(...)`. Follow
that from the seat of the person it fires on. `handleSaveStudent` (`:558`) is
called from `SmartFixModal.tsx:62` and `ReviewMode.tsx:240` inside click
handlers; a synchronous throw there produces a React error surface or, worse in
the async paths, an unhandled rejection and a modal that just sits there. The
user moment: Dr. Robert, in the folded shell after F9, taps something the role
gate should have hidden but a stale render did not. Nothing happens. He taps it
again. **A guard whose entire observable behaviour is "nothing happened" is
indistinguishable from a broken button** — and the area's own signature ruling
is that a safety behaviour with no visible artifact is not a safety behaviour.
This is the fourth instance: the inert sandbox, the synthesised dry-run, the
silent filter, and now the silent guard.

**Cheapest fix:** guard once at `updatePerson`, and make it fail *loudly* — a
toast using the existing pattern, with the same copy discipline as the sorter's
refusal panel (`SmallGroupSorter.tsx:82-92`): name what was refused and why. Not
a console error.

**One free IA cleanup that falls out of this round:** `UndoRedoControls`
(`App.tsx:750-755`) renders for both shells. Post-F9 it renders for every user
including a Viewer who can never populate the stack. Gate it on the same role
flag as the write surfaces, or the folded shell ships a permanently-disabled pair
of buttons in the top-right corner of every analytic screen — the exact "greyed
out rather than hidden" defect the proposal already forbids for the sidebar.

**Q2 — adult pins: IN SCOPE, after F7, condition from r4 stands and gets a
second clause.** No change to my r4 position: do not ship the pin-list UI
without a "your pins" summary view, because a pin that silently stops applying
is the same failure as a household that silently gets dropped. **New clause:** the
summary is not a new nav entry. This area's entire thesis is navigation-cost
subtraction; a pin manager as its own screen would be an addition that deletes
nothing. It is a panel inside the Life Group Balancer, above the results, showing
every active pin and — critically — whether it *applied* in the last run. A pin
that could not be honoured (both people not in the loaded roster; F7 dropped the
record) must say so on the result, not fail quietly.

**Open question I would still need a real user for:** whether a leader who set a
keep-apart pin in January expects it to still be live in June, or expects to be
re-asked. I lean re-asked; I cannot settle it from the code.

---

## Church Administrator

**Verdict on the sequencing claim: NO, not as written — and the gap is the one
path I would actually lose sleep over.**

The proposal guards the three handlers that *edit* a record. It does not guard
the one that **archives** one. `handleArchiveGhosts` (`App.tsx:292-332`) loops
over a list and calls `archivePerson` (`pco.ts:445`) per person, which sets
`status: 'inactive'`. In my office that is not "a write" — that is a member
disappearing from every list, every workflow and every check-in roster the church
runs, in bulk, from a dialog whose primary button says archive-them-all
(`GhostModal.tsx:68-74`). And `GhostModal` is mounted at `App.tsx:1017`, which is
**outside** the `userRole === 'core'` fence that closes at `:1008`. So the
protection the proposal is relying on — "the component isn't mounted for those
users" — is already not true for the most destructive thing Locus does. It is
true only because `SidebarIntelligence.tsx` happens to have no Ghosts button,
while `handleNavigation` (`App.tsx:666-676`) — the *same function* passed to both
layouts — is sitting there ready to open it.

F9's whole job is to merge those two sidebars. **The audit's headline item
dissolves the exact accident the proposal is quietly still depending on, and F2
as specified does not cover the hole it leaves.** That is not a reason to drop
F9; it is a reason to fix F2 before shipping it, which is what the ordering
constraint was always for.

**The same applies to the family swap, and it is worse than it looks.**
`handleFamilySwap` (`App.tsx:412`) builds a `BatchUpdateCommand` and calls
`.execute()` itself at `:445`. It never touches `executeCommit` or
`handleSaveStudentBulk`. So a guard placed on those two functions would pass
review, pass its tests, and leave the family-role swap wide open — and
`FamilyModal` is mounted at `App.tsx:1026`, also outside the fence. A guard that
covers the paths a reviewer thinks of and misses the ones nobody remembers is the
governance failure I've watched happen with every permissions retrofit I've been
through.

**What to do instead — and it is less work, not more.** Every write in this
application, without exception, goes through `updatePerson` (`pco.ts:389`):
`archivePerson` (`:445-446`), `UpdateStudentCommand.ts:33` and `:43`,
`BatchUpdateCommand.ts:36` and `:51`. That is the chokepoint. Guard it there.
Make the caller pass the role as a **required argument** so the compiler refuses
to build a new write path that forgot it — that is D6's lesson ("a guard a stub
can satisfy vacuously is not a guard") applied at the type level rather than the
test level. One function, five call sites, versus three handlers that cover half
the surface.

**Two things I want said out loud so nobody oversells this.** First, it is still
client-side and still sits behind one shared org-wide Basic Auth credential
(`App.tsx:92`, `:182`) — it prevents an accident, not a person. Second, it does
not make the archive path safe generally: `handleArchiveGhosts` reports its
outcome with `alert()` (`App.tsx:324,326`) and swallows per-record failures to
`console.error` (`:302`). A bulk archive that half-succeeds tells the operator a
count and nothing else. That is a separate defect and I am flagging it, not
blocking on it.

**Q2 — adult pins: yes, after F7, and I have a governance condition the other
critics have not raised.**

The use case is real and I would use it: keep a leader with their co-leader; keep
apart a couple who just left a group over a conflict. PCO has no equivalent —
Groups doesn't do constraint-based assignment — so this is not duplication.

But look at what the second half actually is. **"Keep Person A away from Person
B" is a pastorally sensitive record about two named members, created by a
volunteer, stored by the church.** In fifteen years I have never once wanted that
written down in a system I cannot audit. My conditions, all cheap:

1. **No free-text reason field. Ever.** The moment there is a box, someone types
   "she filed for divorce and he's still angry" into it, and now the church holds
   that sentence in an IndexedDB blob. A pin is two person IDs and a direction
   (together / apart). Nothing else.
2. **Owner and timestamp on every pin,** so I can answer "who decided this and
   when" — which is the first question I will be asked about it.
3. **Expiry.** A keep-apart from two years ago is stale pastoral information
   being enforced by software after the situation resolved. Ninety days, or
   re-confirm.
4. **It rides F7's minimisation rules,** not around them. Same `saveToCache`
   path, same stripping discipline, and if the default is memory-only then pins
   are memory-only too and the UI says so.

With those four, it is worth building. Without (1) especially, I would rather
have no pin feature at all.

---

## Youth Ministry

**Verdict on the sequencing claim: NO — and the specific path it misses is the
one that writes the field my whole safeguarding argument rests on.**

Mostly this round is not my lane; the shell question isn't a student-safety
question and I said so in r4. But one thing in the shared verification lands
squarely in it, and it is not a small thing.

`handleFamilySwap` (`App.tsx:412-454`) exists to **flip `isChild` on two
people** — child becomes parent, parent becomes child. The mechanics are at
`BatchUpdateCommand.ts:38-40`: it special-cases the `child` attribute because
`prepareUpdateAttributes` doesn't carry it, and writes it straight to PCO. That
field is the first term of `isMinor` (`pco.ts:122-123`), which is the predicate
this area spent three rounds getting right, which the sorter's refusal
(`SmallGroupSorter.tsx:23`), `sorter.ts:21` and `recruitment.ts:96` all now
depend on.

**So the one unguarded write path in the app that F2 doesn't even mention is the
path that changes who counts as a minor.** And it reaches PCO without passing
through `executeCommit` or `handleSaveStudentBulk` — it calls `command.execute()`
at `App.tsx:445` on its own. Concretely: a two-click swap in a modal that is
mounted for every role (`App.tsx:1026-1031`) marks a 14-year-old as an adult in
Planning Center. From that moment `isMinor` returns false for her — correctly,
given what the record now says — and every guard downstream of it, including the
sorter refusal I asked for and got, waves her through. The safeguarding predicate
is only as good as the field it reads, and this is the code that edits the field.

Guard at `updatePerson` (`pco.ts:389`) and it is covered along with everything
else. Guard at the three handlers and it isn't. That is the whole of my
objection, and it is enough to say the sequencing claim is false as written.

I'll add the obvious corollary since nobody has: the family swap has **no
confirmation step of any kind** and no preview — `onFix` fires and two PCO
records change (`FamilyModal` → `App.tsx:1030`). Area A's `<BatchWriteConfirm>`
scopes itself to the batch path; this is a batch of two that nobody classified as
one. Not Area F's item to build, but F1' should name it the way it already names
`LocusPublic.tsx:79`, because it is the identical shape: a write path that the
preview will be credited with covering and does not cover.

**D4 re-verified, objection stays CLOSED.** `SmallGroupSorter.tsx:23` computes
`minorsInInput`, `:26` returns early, `:76` disables the run button, `:82-92`
renders the `role="alert"` panel naming the count and refusing to produce partial
output. This is what I asked for. My only carry-forward is the one already in
F6: those four lines are trivially lost in a rewrite of the same function, so the
solver rebuild must keep them and must have a test that fails if they go.

**Q2 — adult pins: NOT MY LANE, with one boundary condition.**

Adult group assignment is not youth ministry and I'm not going to invent
relevance. I have no objection.

The boundary condition is this: a keep-apart pin is a *record about a
relationship between two named people*, and if the Balancer is ever pointed at a
student roster it instantly becomes a safeguarding artifact about minors —
"these two students must not be in the same group" is exactly the kind of note
that has a policy, a named owner and a retention rule attached to it in every
church I've worked in, and it is never stored in a general-purpose data tool.
Right now D4 makes that impossible: the tool refuses any roster containing a
minor at input. **So my condition is simply that the pin feature never becomes
the reason someone relaxes D4.** If a future request is "we'd love this for
student groups, can we soften the refusal" — that is the request D4 exists to
refuse, and the answer is a separate tool built to a youth policy, not a flag on
this one.

Also, mechanically: a pin keyed on person IDs must be re-evaluated against
`isMinor` at run time, not at creation time. A pin created when both parties were
19 is still a valid adult pin; a pin created against someone whose birthdate was
later corrected downward is not, and the refusal must still fire.

---

## Children's Ministry

**Verdict on the sequencing claim: NO. And I want this recorded as a safety
objection, not a code-review nitpick.**

The proposal's argument is: today Intelligence users are protected by an
accident of mounting; F2's guard replaces that accident; therefore F9 is safe to
ship after F2. Both halves of that are wrong in a way that matters to me.

**The accident does not currently protect the two paths that touch a child's
record most directly.** The `userRole === 'core'` fence runs `App.tsx:982-1008`.
`GhostModal` (`:1017`) and `FamilyModal` (`:1026`) are outside it. They are
mounted for an Intelligence-shell user right now, today, before F9 changes
anything. What they do:

* **Archive** (`handleArchiveGhosts`, `App.tsx:292` → `archivePerson`,
  `pco.ts:445` → `status: 'inactive'`). For a child, "inactive" is not a
  bookkeeping state. It is the state that determines whether their record is
  findable at the check-in desk on Sunday morning. A volunteer standing at the
  folding table at 9:24 searching for a four-year-old whose record was
  bulk-archived on Thursday by someone tidying "ghosts" does not get an
  explanation — they get no result, and then they hand-enter a duplicate with no
  allergy flag and no authorized-pickup list on it. That is my nightmare
  scenario, arrived at through a data-hygiene feature.
* **Flip the child flag** (`handleFamilySwap`, `App.tsx:412`, writing
  `attributes.child` at `BatchUpdateCommand.ts:38-40`). Marking a child as an
  adult in PCO is a check-in-eligibility change. It affects which rooms they can
  be assigned to, whether ratio counts include them, and whether the system
  treats them as someone who can be released rather than picked up. This is the
  single most safety-load-bearing boolean in the whole integration and it is
  written by a modal with no confirmation, reachable from a handler shared by
  both shells (`App.tsx:666-676`).

**And F2 as specified guards neither of them.** It names `handleSaveStudent`,
`executeCommit` and `handleSaveStudentBulk`. Archive and swap are not in that
list and do not route through it. So the sentence in §5 — "after F9 the 'no
button is mounted' incidental protection is gone for every report view; this
guard is what replaces it" — is not true. It replaces it for half the surface.

**The fix is the same one everyone else landed on, and I support it:** one guard
at `updatePerson` (`pco.ts:389`), which every write in the app already passes
through (`:445-446`, `UpdateStudentCommand.ts:33,43`,
`BatchUpdateCommand.ts:36,51`). **With that change, F9's precondition is
genuinely met and I have no objection to shipping it.** Without it, I do —
because F9's specific effect is to merge the two sidebars, and nav-entry absence
in `SidebarIntelligence.tsx` is currently the only thing standing between a
Viewer-labelled account and the archive dialog.

**The labelling prohibition from r4 gets stronger, not weaker, once the guard
exists.** A guard at the API chokepoint will *feel* like a boundary to whoever
writes the release notes. It is not one. It runs in the browser, on the same
shared `secret` (`App.tsx:92`), and anyone who can open devtools can call
`updatePerson` directly. It prevents an accident and a misclick. It does not
prevent a person. **Do not describe the folded-in view as "Viewer-safe" or
"read-only-safe" for children's records, before or after this guard ships.** The
concrete harm is unchanged from r4: a church hands an outside volunteer
coordinator an "Intelligence" login because it feels like a lesser account, and
that account carries the same write credential as the children's director's.

**Q2 — adult pins: NOT MY LANE, one condition.**

Adult small groups aren't mine. One thing only, and it is the condition I would
attach to any relationship record this product ever holds:

**A keep-apart pin must never appear in an export.** F6 adds CSV export to the
Balancer (`downloadCSV`, flat `{ group, name, age, householdId }`). If pins are
ever added to that file, or to any "here's why the groups look like this"
report, then a spreadsheet leaves the building saying two named members of the
congregation must be kept apart. Church spreadsheets get emailed, forwarded and
left on shared drives; I have found ours in places I did not expect. The pin may
influence the assignment; it must not be printed next to it. Combined with
church-admin's no-free-text rule that keeps the exposure to two names and a
direction — which is still more than I'd want in a CSV.

Otherwise no objection, and the F7 ordering (pins after the data layer is rebuilt
and minimised) is obviously right for exactly the reason the proposal gives.

---

## Round 5 outcome

**Sequencing claim: 4/4 REJECTED as written; 4/4 ACCEPTED with one amendment.**
F2's guard must move from three React handlers to the single API chokepoint,
`updatePerson` (`pco.ts:389`), with the role passed as a required argument.
With that amendment F9's precondition is genuinely satisfied and F9 remains
ratified. Without it, F9 ships a net regression on the archive and family-swap
paths. **The headline finding survives; its precondition is now correctly
specified.**

**Q2: CLOSED — in scope, after F7, with four accumulated conditions.** UXR's
"your pins" panel (inside the Balancer, not a new nav entry, showing whether each
pin applied); church-admin's no-free-text + owner/timestamp + 90-day expiry;
youth's re-evaluate-`isMinor`-at-run-time and never-relax-D4; children's
never-in-an-export.

**No question left open in Area F.** Two defects were flagged rather than
blocked: `handleArchiveGhosts`'s `alert()`-and-swallow error reporting
(`App.tsx:302,324,326`), and the family swap having no confirmation step, which
F1' should name alongside `LocusPublic.tsx:79`.

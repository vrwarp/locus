# Area B — Gamification — Round 5 (final sign-off, all four critics)

Each pass below was written after reading `proposal-v4.md` and the named source.
UXR and children's read `ReviewMode.tsx:123-173` for the first time this round.
Verified against the working tree at HEAD `96daaa0`.

---

## UXR — final ruling

**I have now read `handleFixAll` (`ReviewMode.tsx:123-173`) and the button that
launches it (`:497-501`). It reverses my r4 CONVERGED, in the proposal's
direction, and harder.**

**Verdict:** CUT the score (endorse §1.3 in full). CUT "Smart Fix All". SIMPLIFY
the widget as B7 specifies. KEEP the graph with B8's fixes.

**Evidence and top defects, ranked by the user moment where each bites:**

1. **The button lies in its own tooltip, and the lie is the trust defect my
   charter item 6 exists for.** `ReviewMode.tsx:498` reads
   `title="Auto-fix all safe formatting anomalies (Name, Phone, Address)"`.
   Three of those four words are false. It also fixes **email** (`:138-145`),
   which the tooltip does not mention. "Safe" is contradicted by `fixPhone`
   inventing an area code from a zip (`hygiene.ts:178-183`) and `fixName`
   re-deriving `firstName`/`lastName` from a space split (`:133-134`). And
   "Auto-fix" is accurate in the worst way — Emily clicks one button and the
   entire anomalous roster is PATCHed to live PCO.
2. **There is no confirmation, no preview, and no result.** `:172` calls
   `onClose()` immediately. Emily clicks "Smart Fix All", the modal vanishes,
   and she is returned to the dashboard. She never sees how many records
   changed, which ones, or what they changed to. The writes happen after the
   surface that would have told her about them has unmounted. Compare the
   single-record path, which shows `Current: {name}` beside the suggestion
   (`:490`) — the good design already exists ten lines away.
3. **The score was never measuring the user anyway, and this proves it.** The
   widget's daily goal is 50 (`GamificationWidget.tsx:13`). One click of
   `handleFixAll` on a roster of 1,200 clears it instantly and fills the bar to
   `isComplete` (`:16`). A progress bar that a single click can complete is not
   a progress bar. The proposal is right that no gate fixes this; my r4 position
   was conditioned on a gate existing, and it does not.
4. **My r4 §3 doubt is now answered, not by observation but by subtraction.** I
   asked whether widget+graph is "enough" motivation. That question presumed the
   deleted mechanics were giving something real. They were giving credit for a
   button. There is less to replace than I thought.

**Two corrections to the proposal's own spec — both make it cheaper:**

- **B7's `aria-live="polite"` is redundant.** `GamificationWidget.tsx:19`
  already carries `role="status"`, which implies `aria-live="polite"`. What
  actually needs fixing is the label: `aria-label="Gamification Stats"` on a
  widget that will no longer show any game. Rename it, don't add ARIA.
- **B8's graph a11y item is right and understated.** `ContributionGraph.tsx:79-84`
  renders bare `div`s carrying only `title` — no role, no accessible name.
  `title` on a `div` is not reliably announced and is unreachable by keyboard
  and touch. The 182 squares are, today, invisible to a screen reader and
  hoverless on a tablet at the check-in desk. B8's `role="img"` + `aria-label`
  per square is the correct fix and should not be descoped.

**Cheapest fix:** delete `:497-501` and `:123-173`; the fixers stay where they
already do their honest work, pre-filling the reviewed modal at `:84`/`:90`/`:93`.
Zero replacement UI required, because the single-record path already is it.

**Open question (unchanged, and now the only one):** whether two honest numbers
sustain a Tuesday-night volunteer is still asserted, not observed. Check it with
real volunteers a few weeks after the deletions ship. That is a research task,
not a round-6 argument.

**Objection status: CONVERGED — NO RESIDUAL OBJECTIONS.**

---

## Children's ministry — final ruling

**I have read `ReviewMode.tsx:123-173`. It changes my r4 CONVERGED from
"satisfied" to "satisfied, and I have a new finding in my own lane."**

**Verdict:** CUT the score. CUT `handleFixAll` — and cut it on child-record
grounds independent of anything gamification does.

**Safety impact: real, and not the one the proposal names.** Two findings.

1. **`handleFixAll` re-derives `firstName` and `lastName` from a naive space
   split, and those fields reach PCO.** `ReviewMode.tsx:133-134`:
   ```
   updatedStudent.firstName = updatedStudent.name.split(' ')[0];
   updatedStudent.lastName  = updatedStudent.name.split(' ').slice(1).join(' ');
   ```
   `prepareUpdateAttributes` (`pco.ts:324-328`) emits `first_name` / `last_name`
   whenever they differ, and `BatchUpdateCommand.execute` (`:36`) PATCHes them.
   So one click rewrites the **name fields the check-in desk searches on** for
   every record with a name anomaly. On my roster that is wrong for:
   - a child with a two-word first name — "Mary Ann Smith" becomes
     first `Mary`, last `Ann Smith`;
   - a two-word surname, routine in Hispanic families — "Ana Garcia Lopez"
     becomes last `Garcia Lopez` if it already was, but "GARCIA LOPEZ, ANA"
     (a shape that arrives constantly from CSV imports and from a grandparent
     typing at the kiosk) becomes first `Garcia`, last `Lopez, Ana`;
   - any blended-family child whose stored `name` carries a hyphen or a middle
     name the household does not use.

   **Sunday-morning cost:** at 9:22, a volunteer types "Garcia" into Check-Ins
   and the child does not come up, or comes up under a mangled name that does
   not match what the parent says. That is not a data-quality inconvenience,
   it is the desk stalling with a line behind it. It is one step from the wrong
   label printing. **The proposal discusses `fixName`'s capitalization only
   (§1.1, B10.3) and misses the first/last re-derivation entirely.** The
   capitalization is cosmetic; this is not.

2. **`anomalies` — the list `handleFixAll` loops — is the whole roster,
   children included.** `App.tsx:264` filters all fetched people, and `Student`
   carries `isChild` (`BatchUpdateCommand.ts:31`). Nothing scopes Review Mode to
   students aged 12+. So "Smart Fix All" is a control that rewrites minors'
   names, home addresses and phone numbers in the church's system of record,
   in bulk, with no human reading any of it. **Minor-data flag: raised.** My
   policy floor does not permit a bulk unreviewed write to a child's address or
   phone. That flag stands whether or not a score exists, and it is the reason I
   support cutting the button even though the proposal frames it as an Area A
   ticket.

**Household / guardian correctness:** `split(' ')` is a family-shape assumption —
that a person's name is exactly "first + surname". Every household structure I
deal with breaks it. Same defect class as surname-matched family merging, which
this loop already ruled against.

**On the score itself:** my r4 concern was that a bulk grade or birthdate edit
falls through to `actionType = 'general'` (`App.tsx:493-497`, no grade or
birthdate branch) and so escapes my zero-weight ruling. B11 closes that hole in
the strongest available form: with `GamificationState` reduced to `fixHistory`,
there is no counter for a birthdate edit to leak into. Deleting the far side of
the hole is a better answer than the classifier unification I asked for. My
birthdate veto is honoured.

**What would make this worth a volunteer's attention:** an activity graph is
fine. What is not fine is any number that tells the desk a record is now
*correct*. The record is correct when the family confirms it, and nothing in
this product ever asks them. **Verdict on the widget: SIMPLIFY as specified,
with "Edited", never "fixed".**

**Objection status: CONVERGED — NO RESIDUAL OBJECTIONS,** with the
`firstName`/`lastName` finding added to B10 as a child-safety item, not a
formatting one.

---

## Church admin — final ruling on Q2 (cutting Smart Fix All)

**Verdict: CUT it. The August sweep argument was mine and it was wrong. I am
withdrawing it rather than defending it.**

**Confirmed: `handleFixAll` never touches grade or birthdate.**
`ReviewMode.tsx:131-158` has exactly four branches — `hasNameAnomaly`,
`hasEmailAnomaly`, `hasAddressAnomaly`, `hasPhoneAnomaly`. Grade is edited only
in the single-record path (`handleFix`, `:178-186`) and birthdate only at
`:187-199`. So the promotion sweep I called "the realistic primary path at
volume" is *already* the single-record modal today, one student at a time. This
button was never doing that job. Cutting it costs the August workflow nothing,
because the August workflow never ran through it.

**Would we actually open it?** No — and worse, I would train volunteers not to.
Two governance findings I would raise in a staff meeting:

1. **Partial-write divergence with a reassuring alert.**
   `BatchUpdateCommand.execute` (`:27-40`) PATCHes sequentially, awaiting each.
   If record 400 of 900 throws, records 1–399 are **already written to PCO**.
   `App.tsx:533-540` then catches, tells the volunteer *"Failed to execute bulk
   update. The changes have been reverted"*, and reverts the **local cache for
   every record including the 399 that did succeed**. PCO now holds changes the
   app has told the volunteer were undone and no longer displays. Nobody will
   ever find those 399 records. That is the exact failure mode I care about —
   the tool generating silent work — and it is worse than the passphrase bug,
   because the passphrase bug only lost a score.
2. **It is the worst-case amplifier for the Sandbox lie (B9).** `updatePerson`
   (`pco.ts:389-396`) sets `X-Locus-Sandbox: true` and then issues the same live
   PATCH; nothing in `mock-api/` handles the header. `App.tsx:688` renders
   "⚠️ SANDBOX MODE ACTIVE - Changes are simulated". So a volunteer told they
   are practising can rewrite the entire roster for real, in one click. If one
   thing in this audit ships this week, it is B9.

**PCO overlap:** none, honestly. Planning Center has no native bulk
format-normalize. That means a bulk control has *real* value — which is why I
want it built properly rather than kept in this form. The version I would sign
off on: select a field, show a diff table of every proposed change with the
before and after, let me deselect rows, then write. Until that exists, my
office's answer is what it is today — export a List, fix in a spreadsheet, and
have one person re-enter. Slower, and every change was seen by a human.

**What would make it worth the licence fee:** the preview-diff-then-confirm flow,
with per-record failure reporting instead of a blanket revert alert. That is a
build for Area A, and it inherits the `fixName` and first/last-split defects
before it ships.

**On the score:** cutting `verifiedFixes` closes my durability thread by
deletion, which is fine — I never wanted the number, I wanted it not to lie.
**Q4 stays closed. Objection status: CONVERGED — NO RESIDUAL OBJECTIONS.**

---

## Youth ministry — final ruling on Q1 (is an activity record enough?)

**My reopen trigger fired by my own hand. I am declining to reopen. #14 and #17
stay CUT.**

**First, killing my own darling.** My r4 remedy — credit only when the saved
value diverges from `fixName(original)` / `fixPhone(original, zip)` — is dead,
and §1.2.1 kills it with evidence I should have checked and didn't.
`ReviewMode.tsx:84` pre-fills `targetName` with `fixName(currentStudent.name)`
and `:93` pre-fills `targetPhone` with `fixPhone(...)`. So the leader who opens
one student, actually reads the record, agrees that "MCDONALD" should be
"McDonald"— no, worse: agrees with whatever the tool proposed, and clicks — saves
a value byte-identical to the fixer's output and earns **nothing**. My rule pays
for disagreeing with the tool. That is a worse incentive than the one I was
objecting to. Withdrawn without reservation.

**Now Q1, which is the only question I have left.**

**Is an activity record carrying no correctness claim enough acknowledgment for
a volunteer? Yes — because it is the only thing in this product that is true,
and a volunteer leader can tell the difference.**

My leaders are not motivated by a badge. They are motivated by a student. The
thing that keeps someone coming back on a Wednesday is knowing the work landed.
What Locus can honestly say is "you touched 40 records tonight" and "there are
still 380 flagged." The second number is the one that matters, and it is the
only one in the whole area that is *shared* — it goes down when anyone works,
which is the closest thing to a team mechanic that isn't a fiction on
single-browser state. Bounty Board and Campus Cup were pretending to be that.
The backlog number actually is.

**Is there something they could honestly be congratulated for? Not yet, and I
would rather have nothing than a lie.** The honest congratulation requires a
fact the product does not have: an email that didn't bounce, a text that got a
reply, a parent who confirmed the address at drop-off. Every one of those is a
real signal, none of them exists in Locus today, and **inventing a proxy for
them is exactly what four rounds of this loop have been doing.** §5 is right to
carry nothing forward. When there is a bounce-back, there is a number. Until
then there is an activity graph.

**Two conditions on the surviving copy, and they are not negotiable:**

1. **No streak language anywhere.** `ContributionGraph.tsx:67` currently says
   "Start fixing to build your streak!". A volunteer who misses a Wednesday
   because their own kid had a game must not be told they broke something. B8's
   "Nothing recorded yet" is correct. Also `:82`'s per-square
   `${day.count} fixes on ${day.date}` must become "records edited" — with
   `handleFixAll` gone these are edits a person made, and the word "fixes" is
   the last place in the product that still claims a correction was correct.
2. **"Edited", not "fixed", in the widget.** B7 already says this. It is the
   entire ruling in one word and it should survive review.

**Does it survive the school year?** Yes, better than what it replaces. A
26-week activity graph in June honestly shows a quiet summer. `currentStreak`
(`gamification.ts:103,120-125`) would have shown a broken streak and implied a
failing volunteer. Deleting the streak is a school-year correctness fix, not
just a subtraction.

**Minor-safety flag:** none remaining in Area B once the button is gone. I
endorse the children's finding on `firstName`/`lastName` — same defect on my
students, where nicknames make it worse: a student stored as "Nick Van Der Berg"
comes back with last name "Van Der Berg" if you're lucky and "Der Berg" if the
stored form was anything else. Duplicate detection then treats the result as a
new person. That belongs in B10 above the capitalization item.

**What a volunteer leader needs for this to change a student's week:** nothing
in this area. Area B's honest contribution is that it stops getting in the way.

**Objection status: CONVERGED — NO RESIDUAL OBJECTIONS.** Q1 answered: activity
is enough, correctness is unavailable, and no third option exists.

---

## Round 5 result

4/4 CONVERGED — no residual objections from any critic. Q1 and Q2 both
answered and closed. One new defect added to the work list by children's and
seconded by youth: the `firstName`/`lastName` space-split re-derivation at
`ReviewMode.tsx:133-134` (and `:223-224`), which reaches live PCO via
`pco.ts:324-328`. Area B is closed.

# Area A — core-hygiene — Round 5 (final sign-off, all four personas)

Scope: final ruling on `proposal-v4.md`, plus the two questions left open in its
§4 — **Q-H** (the §5.4 degradation asymmetry: notes unavailable ⇒ archive
blocks, promotion proceeds with a warning) and **Q-I** (a single read of the
now-specified §3.5 scatter-replacement layout, remedy limited to a summary
line).

Every **Y** and **S4** row in v4 §2 is closed to re-argument. Where a persona
below asks for a change, it is a defect inside a spec whose verdict is already
converged, not a reopening of the verdict.

Working tree as read this round: 80 component files, 77 test files, 26
`currentView` branches in `App.tsx`. Nine screens were deleted this session
(Global Pulse, Giving River, Giving Trends, Emergency Alerts, Volunteer Web,
Robert Report, Genealogy, Sermon Sentiment, Sermon Correlator). Line numbers in
`proposal-v4.md` have drifted again as a result; corrected anchors are given
inline below.

---

## UXR — Q-I owner

**Verdict on proposal-v4: SIGN OFF, with two defects that must be fixed inside
work already committed and one factual correction to §3.5.**

### Q-I — does the scatter-replacement swap lose context a leader needs?

**No. The swap is right and I close Q-I on it.** But reading the specified
layout produced a different failure, and the summary line v4 pre-authorised is
*required* — for a reason that has nothing to do with the scatter.

The layout as it stands today is `App.tsx:762-798` (v4 cites `:768-802`; the
nine deletions moved it up six lines). It is: an `<h2>`, a header button row
that renders only inside `{anomalies.length > 0 && ...}` at `:766`, one
`<GradeScatter>` at `:784-789`, and a "Load More Records" footer at `:790-796`.

**The scatter loses nothing when replaced.** `GradeScatter.tsx:136-139` renders
age on x, `pcoGrade` on y, with a diagonal reference line; its per-point
tooltip (`:67-135`) shows name, age, grade, expected grade, delta. Every field
in that tooltip is a field the promotion batch list must show per row anyway.
The scatter's job is *finding* an anomaly you did not know about; the promotion
list's job is *confirming* a set the machine already computed. Those are
sequential tasks, not concurrent ones. Sarah in mid-August is not exploring —
she is checking a list against what she knows about a hundred families. Putting
a 800×600 chart next to that list would be decoration. Swap it.

**Defect 1 (blocking, cheap) — the promote button is nested under the wrong
guard.** `App.tsx:766` wraps the entire header button row in `anomalies.length
> 0`. Promotion eligibility has nothing to do with the anomaly count. A church
that has cleaned its data — which is what Locus is for — arrives at Promotion
Sunday with zero anomalies and **no promote button rendered at all**. The
button's visibility condition must be its own (`eligible.length > 0`), and the
row must render when either count is nonzero. This is a three-line change and
it is the difference between the feature existing and not existing in the
success case.

**Defect 2 (blocking, and this is what the summary line is for) — "Promote
eligible (N)" is a lie while `nextUrl` is non-null.** The screen paginates
(`App.tsx:790-796`, `handleLoadMore`). `students` holds only what has been
loaded. A leader reads "Promote eligible (112)" as "112 students in this
church", writes it, and has silently promoted the first page of the roster. The
permitted remedy — a summary line above the list — is exactly right, but it has
to carry the pagination fact, not scatter context:

> *"112 eligible students found in the 300 records loaded so far. Load all
> records before promoting — this list is not the whole congregation."*

and the confirm button stays disabled while `nextUrl` is set. That is a
sentence and a boolean, no second region, no new destination. Q-I's remedy is
therefore **spent**: it is consumed by pagination honesty, and nothing further
is owed to scatter context.

### Factual correction to §3.5

v4 §3.5 says *"Keep the responsive container, shape-not-colour encoding, and the
exclusion caption."* There is no responsive container.
`GradeScatter.tsx:137-138` is `width={800} height={600}`, hardcoded, with no
`<ResponsiveContainer>` anywhere in the file. On a 13" laptop at the volunteer
desk this clips. Shape-not-colour encoding is real (`CustomShape` draws a
triangle for anomalies under `colorblindMode`, `GradeScatter.tsx:~236-250`); the
responsive container is **pending work**, not a thing to preserve. Correct the
wording or it will be read as done.

### Other findings

- **§3.9's second caption is dead text.** Emergency Alerts was deleted this
  session; `grep -rn -i emergency src/` returns nothing. v4 calls that caption
  *"highest consequence line in the area"* and orders §3.9 first partly on its
  strength. The `transformPerson` widening still earns its place — honest
  Dashboard totals, and the adult roster reaching Duplicate Detective, which is
  the population most dedup value lives in — but the ranking rationale must be
  rewritten and the Emergency Alerts sentence struck. See children's below for
  a hazard the widening now creates.
- **Roving tabindex is more urgent than v4 implies.** `CustomShape` puts
  `tabIndex={0}` on *every* rendered point (both the triangle path and the
  circle). At 300 loaded records that is 300 tab stops between the header and
  the "Load More" button. Keyboard traversal of this screen is currently
  unusable, not merely imperfect. Keep it in §3.9's restored items; it is a
  defect, not a polish item.
- **Screen accounting.** 26 top-level views remain. Nine went this session
  without Area A's own subtraction starting. Area A's plan removes Family Audit,
  Golden Record, Speed Run and the Smart Fix modal, and adds **zero**
  destinations — the promotion mode is a header state inside `data-health`. The
  no-new-nav constraint I have held since R3 is satisfied.

**Open question I would still want observed:** whether Sarah, having pressed
"Promote eligible", understands that Cancel returns her to the scatter rather
than discarding a saved selection. One session with a real admin settles it; it
is not a reason to hold the build.

---

## Church admin — Q-H owner

**Verdict on proposal-v4: SIGN OFF. The Q-H asymmetry is correct — and v4's
stated reason for it is factually wrong. Fix the reason, keep the rule.**

### Q-H — the degradation rule

v4 §5.4.5 justifies blocking archive and permitting promotion like this:
*"Archival is effectively irreversible from the volunteer's seat"* versus *"A
grade PATCH is field-level, undoable."*

**That is not what the code does.** `archivePerson` (`pco.ts:445-447`) is:

```
export const archivePerson = async (id, auth, sandboxMode?) =>
    updatePerson(id, { status: 'inactive' }, auth, sandboxMode);
```

It is a one-field PATCH. It sets `status: 'inactive'`. It deletes nothing. It is
*mechanically identical in reversibility to the grade write* — `status:
'active'` puts the person back, and it rides the same `commandManagerRef` undo
path the grade write would. If the asymmetry rests on reversibility, a
competent engineer reading §5.4 in six months will correctly observe that the
premise is false and drop the block. So the rule has to rest on something true.

**The true axis is detectability, not reversibility.**

- A **wrong promotion is self-announcing inside a week.** The kid shows up on
  Sunday, the check-in label prints the wrong room, a leader says "why is Ava in
  4th, she's in 3rd", and it is fixed. The world audits it for you. The PCO-side
  note is nice-to-have because the error surfaces without it.
- A **wrong archive is silent by construction.** `status: 'inactive'` removes
  the person from exactly the lists, exports, check-in rosters and mailings that
  would have revealed the mistake. There is no Sunday moment. Nobody notices
  until the family notices — and what they notice is that the church stopped
  contacting them. I have watched a mis-scoped list do this to a family. The
  conversation is not recoverable by flipping a bit back.

A write whose own effect suppresses the evidence of its error is the one that
must not happen without a durable, PCO-side record of who did it and why.
Locus's local ledger does not qualify: the machine it lives on is a volunteer's
laptop, and volunteers churn. **So: archive blocks. Promotion proceeds.** Same
ruling, correct rationale. Replace §5.4.5's reversibility sentences with the
detectability argument.

**§5.4 contains a contradiction that would silently convert "proceeds" into
"nothing happens."** §5.4.3 mandates note-first write order and says *"one
record's note failure aborts that record before any mutation."* §5.4.5 says
promotion proceeds when notes are unavailable. Composed literally, the preflight
finds notes unavailable, promotion "proceeds", every record then attempts a note
POST, every POST fails, and §5.4.3 aborts every record before mutation. The
batch reports 0 written / N skipped and the admin is told it succeeded in
degraded mode. The spec must say explicitly: **when the preflight probe
establishes notes are unavailable, the promotion path skips the note POST
entirely** and writes with `context.noteWritten: false` in the ledger. Do not
leave this to the implementer.

**Blocking archive must not be a dead end.** If our PCO account genuinely lacks
note permission, "the confirm button does not go live" leaves the volunteer
staring at a disabled button and me fielding a ticket. Two sentences fix it, and
they cost nothing because the dialog is already rendering the full per-record
list:

1. Name the fix precisely: *"Locus cannot write notes to Planning Center. A
   People administrator must grant this account permission to create notes, and
   share the note category under People → Settings → Note Categories."*
2. Offer the handoff: **"Export this list as CSV"** stays live when the confirm
   button does not. That turns a blocked feature into a work order I can action
   in PCO by hand, which is what I would be doing today without Locus anyway.

**On the counter-argument I considered and reject** — that archive should be
allowed on ledger + CSV alone. It should not, for the reason children's states
below, which is a safety chain and outranks my convenience argument. And on the
other side — that promotion should block too — no. Blocking the August grade
rollover on an unrelated note permission means every roster, every room label
and every small-group list in the building is a year stale until somebody does
it by hand. That is a real, dated, congregation-wide cost imposed to protect
against a write the world audits for free.

### Governance findings on the rest of v4

- **PCO overlap check, final:** nothing in Area A duplicates a native PCO
  capability. PCO has no grade-promotion automation, no ghost detection on
  check-in recency, and no cross-field hygiene pass. The merge punt in §3.10 is
  still correct — PCO's own merge is better than anything Locus would build.
- **§5.4's sharing copy is the single most important sentence in the proposal
  for me.** A note in a category nobody else can see is not a record, it is a
  private diary. Keep it in both places v4 puts it (Settings and the confirm
  dialog).
- **Anchor drift for the implementer:** `config.sandboxMode` is now read at
  `App.tsx:299, 348, 434, 520` and the banner branch is `:673` (v4 says
  304/353/439/525/678). `handleFamilySwap` is `App.tsx:412` (v4 says 420-462).
  `ConfigModal.tsx:21,37,55,150`, `storage.ts:15`, `AutomationsReport.tsx:85`
  and `automations.ts:63-96` are still accurate.
- **Two clocks confirmed, for the record.** `grader.ts:4-5` defaults to a
  **September 1** cutoff; `automations.ts:70-72` hardcodes a **June 1** season
  start. They are unrelated constants that both look authoritative. §3.3's "one
  clock" deletion is correct and should not be softened.
- **Would we open this?** Data Health weekly, Ghost Protocol twice a year,
  promotion once a year in the third week of August. That is the honest
  frequency and the proposal is sized for it.

---

## Youth ministry

**Verdict on proposal-v4: SIGN OFF, with one required amendment to §3.3's
population predicate that costs one line and, unfixed, excludes most of my
students from the highest-value thing this product builds.**

### The amendment — `isChild` must not gate the promotion population

§3.3's population is `isChild === true AND birthdate !== null AND pcoGrade !==
null AND expectedGrade - currentGrade === 1`, and
`automations.ts:84` implements the first clause today as
`.filter(s => s.isChild && s.birthdate)`.

In every church database I have administered, PCO's `child` flag is unreliable
above about 8th grade and gets *worse* the older the student is. It gets flipped
to `false` by well-meaning volunteers when a kid gets a phone number, when they
join a serving team, when a parent updates the profile, when they get an email
address of their own. Nobody flips it back. The result under §3.3 as written:
**a 10th grader with `child: false` and `grade: 9` is never promoted, never
appears in the eligible list, and never lands in the 2+-behind anomaly lane
either** — because that lane is defined off the same population. They just sit
one grade off, forever, invisibly. That is not an edge case; the 8th→9th cliff
and the graduating cohort are precisely where my ministry's attention is, and
precisely where the flag is least reliable.

The fix is to drop `isChild` from the gate and let **`pcoGrade !== null`** carry
the claim. Having a school grade recorded *is* the assertion that this person is
on a school-grade roster; adults do not have one. This is a widening, and it is
safe, because the `expectedGrade - currentGrade === 1` filter does the
protecting: an adult volunteer carrying a stale `grade` from their own youth
group days has an expected grade twenty higher than their recorded one and is
excluded by arithmetic, and §3.3 already forbids any grade-13 PATCH so the
19-year-old-with-grade-12 case cannot fire either.

Per v4 §3.6's own rule this is a **claim** read — it asks what the record
asserts about itself — so it stays off `isMinor`, correctly. The amendment is
one predicate, and without it the feature does not survive the school year for
grades 9–12.

### Q-H

**Concur with the split, and I want the deadline argument on the record beside
the admin's detectability argument, because they are independent and they agree.**

Grade promotion has a hard date. Promotion Sunday is a fixed point in the
calendar; the rollover either happens in the third week of August or it does not
happen that year. Ghost archival has no date at all — it is a twice-a-year tidy
that can wait a week for a PCO administrator to grant a permission. Blocking a
dated, congregation-wide, once-a-year operation on an undated permission gap
imposes a year of wrong rosters, wrong room labels and wrong small-group
assignments to protect against a write whose errors surface on their own within
seven days. That is the wrong trade in both directions at once.

**One tightening to §5.4.5's degraded promotion path.** When notes are
unavailable, the post-write summary must **force the ledger CSV download**, not
offer it. In the degraded case the volunteer's browser is the only place the
record of a hundred grade changes exists, and v4 §5.1 is honest that a browser
data clear is a normal-cycle event. An offered download in a dialog nobody reads
is not a record. Trigger it, and say in the dialog that it was triggered and
where to file it.

### Q-I

The swap is fine and not really my lane — but UXR's pagination finding is my
lane and I want to reinforce it. A **partially loaded promotion is worse than no
promotion.** If "Promote eligible (112)" writes only the first page, I get a
half-promoted cohort: some of my 8th graders are 9th graders in the system and
some are not, sharing a small group, showing up in different Check-Ins rooms,
and there is no field anywhere that distinguishes "promoted" from "not yet
promoted" after the fact. Untangling that costs more than doing the whole
rollover by hand would have. The disabled-until-fully-loaded rule is not a
nicety; treat it as part of the promotion spec, not as a UXR polish item.

### Standing items, confirmed

- §3.3's 2+-behind routing text reads correctly as I argued it in R4 —
  **standing, low-volume, no dedicated section, never bulk-writable.** Closed.
- Speed Run's deletion stands. A timer and a score on writes to minors' PII was
  never defensible.
- §3.2 step 3's child-section-above-the-fold stays on `isChild` as a claim read.
  Correct. Note that this is the *same* unreliable flag I just complained about
  — which is fine here, because its job in the preview is to report what the
  record says, and a teenager wrongly flagged `false` simply appears in the
  general list of a dialog that names every single row anyway.
- **Minor-safety flag on the area as shipped: none outstanding.** The
  `ui-avatars.com` egress, the newsletter minor filter, and the sorter's
  input-time refusal are all landed. Ghost Protocol's gamification strip and
  `enrichZipCodeAsync`'s deletion remain the two open minor-data items and both
  are in the work list.

---

## Children's ministry

**Verdict on proposal-v4: SIGN OFF, with one ordering veto and one one-line
amendment to §3.2's preview row.**

### Q-H — this is not a judgement call, it is a safety chain. Archive blocks.

v4 §4 calls the archive block *"my judgement call and not a fact."* From my
seat it is a domain veto, and I am exercising it, because `status: 'inactive'`
has a specific consequence at a folding table on a Sunday morning.

An inactive person does not appear in Check-Ins. So the chain is:

1. Locus archives a child who is not actually gone — an irregular attender, or
   more commonly a kid who has been checking in under the other parent's profile
   since the divorce, so `lastCheckInAt` on *their* record is two years stale.
2. Sunday, 9:22am. The family arrives. The volunteer types the name. Nothing
   comes up.
3. The window is eight minutes wide and there are forty people behind them. The
   volunteer does the only thing available: **creates a new record.**
4. The new record has no allergy note, no medical flag, and an empty authorized
   pickup list. The security tag prints anyway.

That is a peanut allergy and a wrong-adult pickup in the same step, produced by
a write nobody knew happened. The admin is right that the archive is
mechanically reversible; that is irrelevant here, because nobody knows to
reverse it — and the duplicate record created in step 3 persists after they do.

The PCO-side note is the only artifact that survives into that Sunday: it is
attached to the person, visible to whoever opens the record, and it says *why*
Locus made them inactive. That is what makes step 2 recoverable — the staff
member who checks the record sees a Locus note and reactivates instead of
duplicating. A ledger in a volunteer's browser reaches nobody at that desk.
**No PCO note, no archive.** Uphold the block.

I have no objection to promotion proceeding. A wrong grade puts a kid in the
wrong room for one Sunday with an adult who knows them; that is embarrassing,
not dangerous, and the room's leader fixes it in ten seconds.

### Ordering veto — §3.9 must not land before §3.1's ghost guard

v4's work list puts §3.9 (`transformPerson` widening) at **#1, "depends on:
—"**, and §3.1 (Ghost Protocol, including the tenure floor and the fail-closed
`createdAt` rule) at **#8**. Read together with the code, that ordering is
dangerous:

- `App.tsx:263` is `const ghosts = students.filter(s => isGhost(s));`
- `ghost.ts:12-27` — `isGhost` reads **only** `lastCheckInAt`. Never checked in
  ⇒ ghost, immediately, with no tenure floor today.
- Today those records are invisible because `transformPerson` (`pco.ts:257-259`)
  returns `null` for any person with no birthdate, so they never enter
  `students` at all.

Nursery and preschool records are the single largest population of
birthdate-less records in any church database — a grandparent filling in at the
desk skips the birthdate field constantly, and a newborn added on the phone in
the hospital parking lot has a name and nothing else. §3.9 as ordered admits
every one of them to `students` on day one, where `isGhost` immediately returns
`true` for the ones with no check-in yet, and the Ghost Protocol's archive path
is live and ungated for six more work items.

**§3.9 does not ship before §3.1's tenure floor and fail-closed `createdAt`
rule, or it ships with a `birthdate !== null` guard on the ghost filter in the
same change, removed when §3.1 lands.** Either is fine; shipping §3.9 alone as
"item 1, no dependencies" is not.

This also re-ranks §3.9 on its own merits, since UXR is right that the Emergency
Alerts caption is dead text — that screen is gone, and it was the strongest
argument for doing the widening first. What survives is honest Dashboard totals
and the adult roster reaching duplicate detection. Both good, neither urgent.

### Amendment — flag placeholder birthdates in §3.2's preview row

Nothing in the codebase detects a placeholder birthdate. `grader.ts:12-32`
computes `expectedGrade` from whatever date it is handed with full confidence,
and `pco.ts:108-110`'s doc comment acknowledges the problem for `isMinor` but
nothing acts on it in the grade path. A child entered as `1/1/2016` — which is
what the desk types when a parent says "he's eight, I think" — produces a
perfectly plausible expected grade, a perfectly plausible +1 delta, and lands in
the promotion batch indistinguishable from a real one.

The remedy is one annotation on a row that is already being rendered per record
in §3.2's preview, no new column, no new screen, no new fetch:

> *"Birthdate on file is 1 January — this is often a placeholder. Grade may be
> wrong."*

At two hundred rows nobody reads every line, but they scan for the flagged ones,
and this is the flag that matters in my age band because January 1 is the single
most over-represented birthdate in every children's ministry database I have
ever touched.

### Standing items, confirmed

- **Q-C is correctly written into §3.2 step 2**, including the null-household
  copy (*"no household on file"* rather than omitting the line). That was the
  whole of my ask. Signed off.
- **Family Audit's dissolution stands.** Surname- and age-based household
  inference was never safe for blended families, foster placements or
  grandparent caregivers. The surviving age-inversion check as a claim read is
  the right residue, and §3.6's rule about not "tidying" `family.ts` onto
  `isMinor` should be kept verbatim — it is exactly the change a future
  contributor will try to make.
- **§5.2 remains a veto, not a preference.** Without a confirmed-correct set,
  every legitimate held-back or accelerated child is re-proposed for promotion
  every single year, forever, and now with a bulk write attached. §3.3 does not
  ship without it.
- **Sunday-morning cost of Area A as proposed: zero seconds added at the desk.**
  Nothing in this area touches the check-in flow. That is the right answer.

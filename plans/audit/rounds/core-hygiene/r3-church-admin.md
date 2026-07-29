# Area A — core-hygiene — Round 3 (church-admin)

Scope per round brief: three items only. #4, #6, #7, #8, #11 are converged and
not reopened.

---

## 1. The `transformPerson` roster gap — verified, and it is bigger than Duplicate Detective

I checked the proposal's correction against source, not just against my own
v1/v2 argument.

- `src/utils/pco.ts:233-235` — `transformPerson` returns `null` if `birthdate`
  is absent or unparseable. `src/App.tsx:236-238` filters those nulls out of
  the single `students` array that is computed once, at the top of `App.tsx`,
  from the query result.
- `src/App.tsx:953` passes that same unfiltered-by-grade `students` into
  `DuplicatesReport` — confirmed, the proposal is right that Duplicate
  Detective was never grade-scoped. I conceded this wrong reasoning in v1/v2
  and don't need to re-litigate it.
- What I had not traced until this round: every other consumer at
  `App.tsx:757-983` reads the identical `students` variable — Data Health,
  Family Audit, Automations, Duplicate Detective, and **Emergency Alerts**
  (`App.tsx:946`, `EmergencyAlerts.tsx:16`, which further filters on
  `phoneNumber`).

That last one is the finding that matters most to me. Emergency Alerts is not
a hygiene report — it's the screen a volunteer opens when a parent can't be
reached during a service. Any adult in the database with no birthdate on
file — which in my PCO experience is a large fraction of grandparents,
emergency pickup contacts, and any adult profile entered quickly at a
check-in kiosk without full onboarding — is invisible to that screen, with
no on-screen indication that they were dropped rather than that they simply
have no phone number. The proposal's fix (§3.9: return a `Student` with
`birthdate: null` and let each consumer filter explicitly) is correct and
now looks more urgent to me than it did as a Duplicate Detective bug. I want
the exclusion caption's wording to say plainly, on Emergency Alerts
specifically, that N people are excluded for missing birthdate — that screen
cannot ship the vague "excluded from grade checks" phrasing written for Data
Health; a missing-DOB adult with no phone showing is a different sentence
than a missing-DOB adult whose phone Locus simply never looked at.

**Verdict: concede the proposal's correction on Duplicate Detective, and
widen §3.9's fix requirement to state explicitly that Emergency Alerts is a
downstream victim of the same transform, not just a hygiene screen.**

---

## 2. Sandbox Mode — rule: delete it, do not build it

Weighing this the way I'd weigh any budget line: what does a working dry run
buy that the mechanisms already landing this round (typed-count confirm,
`ArchiveCommand`/`BatchUpdateCommand` undo, §5.1 ledger) don't buy on their
own?

- PCO's own bulk-action pattern — Lists, Workflows, mass-update — is
  preview-then-confirm ("This will update 47 people. Continue?"), never a
  standing toggle the operator must remember they're in. §3.1 R4 and §3.3
  point 2 already put a typed count in front of every bulk write this area
  adds. That is the real dry run: it happens at the moment of the write, not
  in a separate mode set earlier and possibly forgotten.
- A toggle mode is exactly the failure class that got us here. The current
  Sandbox checkbox is dangerous specifically because a volunteer trusts the
  label and forgets to check whether it's still on. A rebuilt sandbox that
  *works* removes the lie but keeps the two-state cognitive burden — "am I
  in sandbox right now" is one more thing a volunteer has to track across a
  session, on top of remembering which of two identically-named undo
  affordances is live (§3.4). Per my own standing rule — anything requiring
  more than one screen of memory does not survive volunteer turnover — a
  mode toggle is worse practice than a per-action confirm, not just cheaper
  or costlier to build.
- The 6-line implementation cost is real but is not the whole cost. The
  proposal is honest that it only works if paired with a standing banner and
  a session write-counter that must be correct every time, forever, or we've
  rebuilt the same lie in a new location. That ongoing correctness burden is
  the actual price, not the 6 lines.

**Ruling: delete the checkbox, `config.sandboxMode`, and the threaded
parameter in `pco.ts`, per §3.2's second option.** Rely on the confirm +
undo + ledger this proposal is already building for both new bulk paths.
This is not a close call on cost — it's a call that a second safety mode is
net-negative for a volunteer-staffed office even at zero engineering cost,
because every mode is something someone can be in without realizing it.
Keep §3.2's first-launch Live/Sandbox choice, but repurpose it as the
one-time "this app writes to your production PCO" acknowledgement the
proposal already names as the fallback.

---

## 3. Durable log — form is close but not sufficient as scoped; extend it to promotion

I adopted A2 (durable archive log) in round 2 as non-negotiable. §5.1
generalizes it into one write ledger (`{personId, name, field, before,
after, at, source, sandbox}`) covering every PCO write, exportable as CSV,
with a session counter. Two gaps before I'd sign off as the person who has
to answer "why did this family disappear from the roster" six weeks later:

1. **The generic shape drops the justification fields I actually asked
   for.** `field`/`before`/`after` captures "status: active → inactive" but
   not *why* — `ghostReason`, `lastCheckInAt`, `createdAt`, `configUsed`.
   Those need to travel as structured metadata on the ledger entry, not get
   collapsed into a diff of one field. An accountability inquiry starts with
   "why did the algorithm think this person was a ghost," and a bare
   before/after doesn't answer it.
2. **"Offer immediate CSV download" and the PCO-side note are described as
   alternatives, with the note as "better."** For a record that has to
   survive outside the volunteer's own machine, the PCO-side note is not a
   nice-to-have, it's the only copy that outlives a laptop wipe, a browser
   data clear, or a reissued office computer — all of which happen in a
   volunteer-staffed office on a normal cycle. Local ledger + optional CSV
   is not durable by my standard; the PCO-side note must be mandatory for
   archive writes, with the local ledger and CSV as the searchable/exportable
   index on top of it, not the record of record.

**Yes — extend the same ledger to the grade-promotion batch write, not just
ghost archival, and at the same durability bar, not a lighter one.** A wrong
bulk grade write during promotion week has the same "someone will ask about
this in six weeks" shape as an archive — a parent asking why their child's
grade changed, a teacher asking why their roster looks wrong on the first
Sunday of the new year — and it touches more people at once than any single
ghost sweep will. There is no principled reason to give archival a durable
audit trail and grade promotion a session-scoped one; both are bulk writes
to PCO born this round, and §5.1's ledger should be the uniform mechanism
for both from day one, not archival-first with promotion added later.

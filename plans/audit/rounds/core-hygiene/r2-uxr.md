# Area A — core-hygiene — Round 2 UXR Critique (attacking proposal-v1)

## 1. Fact-check of the four flagged claims — all CONFIRMED

- `ReviewMode.tsx:497` — `{!isSpeedRun && onSaveBulk && (<button ... >Smart Fix All</button>)}`.
  Speed Run + unreviewed bulk write is genuinely unreachable. Confirmed.
- No `keydown`/`ctrlKey`/`metaKey` anywhere in `src/` (repo-wide grep, zero hits).
  `UndoRedoControls.tsx:17,27`'s Ctrl+Z/Ctrl+Y tooltips are pure fiction. Confirmed.
- `enableSpotify`: written at `storage.ts:23` / `ConfigModal.tsx:29,45,63,108`,
  read nowhere else in the repo. Confirmed dead control.
- `GoldenRecordModal`: `setIsGoldenRecordOpen` appears exactly twice in
  `App.tsx` — the `useState` declaration (`:91`) and the `onClose` handler
  (`:1034`) that sets it back to `false`. No call sets it `true`. Confirmed
  unreachable.

Proposal's corrections to round 1 hold up. Building on them, not re-litigating.

## 2. The SmartFixModal → ReviewMode merge (§3.8) — reuse argument wearing a UX costume, as specified

Read both components in full. The delta-logic duplication is real —
`SmartFixModal.tsx:36-59` (slider, grade/birthdate, Cancel/Fix chrome) is
functionally identical to `ReviewMode.tsx:351-367` (same slider, same delta
math, same "magnetic-slider" class). That part of the merge argument is sound:
extract the shared Fix-Grade/Fix-Birthdate presentational logic once.

But §3.8 doesn't say "extract the shared subcomponent" — it says "route
`onPointClick` into a single-student instance of `ReviewMode`
(`students={[student]}`)" and calls that the whole job. Read literally against
the actual component:

- `ReviewMode.tsx:300-302` renders `{currentIndex + 1} / {students.length}` —
  a single-record entry now shows **"1 / 1"** where SmartFixModal showed
  nothing, because a point-click is not a queue.
- `ReviewMode.tsx:496` — `Skip` — has no defined behavior for a one-item array.
  `handleNext` (not shown above but referenced at :496) presumably advances
  `currentIndex` or closes; either way this button's meaning was never
  designed for N=1 and the proposal doesn't touch it.
- `ReviewMode.tsx:497` — **`Smart Fix All` is gated only on `!isSpeedRun &&
  onSaveBulk`, not on `students.length > 1`.** As specified, merging silently
  attaches an unreviewed bulk name/email/address/phone rewrite button (the
  exact button r1 and this proposal both flag as the highest-risk write path
  in the whole area) to every scatter point-click. SmartFixModal today can
  only ever touch grade/birthdate. Post-merge, one misclick on a scatter dot
  exposes a button that can silently rewrite a phone number via the
  Levenshtein-adjacent `fixEmail`/`fixAddress`/`fixName` bulk path the
  proposal itself is busy gating out of the queue flow in §3.3. That's a new
  attack surface the proposal introduces while patching an old one.

This is judged as a flow, per the prompt's framing: a scatter-point click is
"I'm curious about this one dot," a self-contained, low-commitment lookup.
Review Mode's queue chrome (progress counter, Skip, session-style Exit button,
Smart Fix All) assumes "I am working through a list and might bail partway."
Collapsing the component without gating that chrome for the N=1 case isn't a
UX decision, it's an implementation shortcut presented as one.

**Alternative:** merge the *logic*, not the *shell*. Extract
`<GradeBirthdateFixCard>` (grade slider + birthdate picker + delta preview,
~80 lines) used by both. Keep `SmartFixModal` as a thin wrapper with its
current Cancel/Fix chrome and no Smart-Fix-All, no progress counter, no Skip —
or, if the shells must merge, add `singleRecordMode = students.length === 1`
to `ReviewMode` that hides the progress counter, relabels Exit→Cancel, and
hard-disables Smart Fix All regardless of `onSaveBulk`. Either buys the
code-reuse win claimed without shipping the new bulk-write exposure.

**Verdict: REJECT §3.8 as specified. ACCEPT the underlying premise** (duplicated
delta logic should be one function) **conditional on** the guard above being
part of the same change, not a follow-up.

## 3. Other decisions attacked

**§9 Undo/Redo — verdict says SIMPLIFY but no fix is actually specified.**
The concrete-work section (§3) gives Undo/Redo exactly one line of work: bind
or delete the Ctrl+Z/Ctrl+Y hints (§3.6, bullet 3). The defect I ranked #1 for
this feature in r1 — two systems sharing the word "Undo" with no way for the
user to tell which one currently governs their last action — is entirely
deferred to Q3 ("which undo survives?") with no interim mitigation proposed.
A table verdict of SIMPLIFY with no corresponding R1–R5 work block (contrast
Ghost Protocol's five-step plan) means this is functionally UNRESOLVED
dressed as a decision. **Attack:** don't let Q3 sit open across a round.
Minimum interim fix, cheap and shippable regardless of which system survives:
visually differentiate the two Undo affordances *now* — the toast's button
says "Undo edit," the header buttons get a tooltip stating what they'll
revert (e.g. "Undo: last 3 saved changes") — so a user is never guessing which
one is live. That's ~10 lines and doesn't require Q3 to be settled first.

**§3.7 Settings — Q5 (Sandbox default) same pattern.** Verdict SIMPLIFY,
sectioning work specified, but the one change with actual safety
consequence — should Sandbox Mode default on — is again punted to a question
rather than decided or given an interim mitigation. A cheap interim: on first
launch (no `config` in storage yet), show a one-time modal forcing an explicit
Sandbox/Live choice before any write path is reachable, rather than silently
defaulting to live writes as it does today (`App.tsx:75`, confirmed). This
doesn't require resolving whether Sandbox should default on forever — it just
stops the silent-live-on-first-click failure mode both this round and last
round agree is real.

## 4. Dropped from r1, still unresolved

1. **GradeScatter keyboard trap (r1 §2 top defect #2) — dropped entirely.**
   Proposal's §2 table entry for Data Health lists responsive container,
   shape-not-color default, and exclusion caption — never the `tabIndex={0}`
   on every point (`GradeScatter.tsx:110,127`) with no skip-to-anomaly
   affordance. On a several-hundred-record roster this is still a real
   keyboard trap for a screen reader or keyboard-only user, and it isn't
   mentioned anywhere in §3.9's Dashboard+GradeScatter work item. Not carried
   forward, not explicitly rejected — just absent.
2. **Dashboard's "0 risk vs. no data" ambiguity (r1 §1 top defect #2) —
   dropped.** §3.9 fixes the `total===0` "Critical" framing but the separate
   defect — `burnoutCandidates`/`recruitmentCandidates` rendering `0` with no
   way to distinguish "genuinely healthy" from "Check-Ins data absent for this
   org" — isn't in the proposal's Dashboard work at all.
3. **Duplicate Detective CSV export gap (r1 §5 top defect #1) — dropped.**
   §3.10 adds the sibling-warning banner (good, and correctly scoped) but the
   separate minor finding — exported CSV drops the matched criterion's actual
   value, so an admin working offline can't verify without reopening the app —
   isn't addressed or rejected, just not carried.

None of these are safety-critical the way Ghost Protocol is, which is
presumably why they lost the value-per-effort ordering — but "lost the
ordering" and "dropped without a mention" are different things, and the
proposal does the latter for all three.

## 5. Concession

The Ghost Protocol repair plan (§3.1, R1–R5) is more rigorous than my r1
"cheapest fix" — fail-closed on missing `createdAt`, a real `ArchiveCommand`
symmetrical with `BatchUpdateCommand` rather than my looser "hold behind the
same toast" suggestion, and a typed-confirmation threshold for large batches
that I didn't propose at all. That's a better answer to the finding both of
us agreed was the area's worst.

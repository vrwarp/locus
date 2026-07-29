# Area E — Round 3 — UXR

Scope per instructions: the three narrow items only. All six CUTs, the
`!isChild` gate, and the dissolve-the-nav-section ruling are converged and not
reopened here.

---

## 1. The proposal's rebuttal to Q2 ("cheaper than W7" is false) — PRESS, not concede

Proposal's claim (`proposal-v2.md §3 "Declined"` (ii)): `aggregateCheckInsByWeek`
computes an ISO week key at `attendance.ts:17` and "throws it away," so "the
join key UXR's design needs does not survive into `WeeklyAttendance`."

Read the function in full, `src/utils/attendance.ts:10-33`:

```
17:   const weekKey = format(weekStart, 'yyyy-MM-dd');
19:   counts[weekKey] = (counts[weekKey] || 0) + 1;
...
22:   const result: WeeklyAttendance[] = Object.entries(counts).map(([dateStr, count]) => {
23:     const date = parseISO(dateStr);
24:     return {
25:       week: format(date, 'MMM d'),
26:       date: dateStr,
27:       count,
28:     };
```

`dateStr` at line 26 **is** `weekKey` from line 17 — `Object.entries(counts)`
iterates the exact map keyed by it. It is not discarded; it is written
verbatim into `WeeklyAttendance.date` (declared for exactly this purpose,
`:6`: `// ISO date string for sorting`), and the function's own last line
(`:32`) sorts on it. Every `WeeklyAttendance` record the whole app consumes
already carries the per-week ISO key.

**The proposal's factual predicate for reason (ii) is false.** The join key
Q2's design needs does not require a type change in Area D at all — it exists
today, unconditionally, in the shape `AttendancePulse` already renders
(`AttendancePulse.tsx:27-28` per the proposal's own W1 rationale for #37). The
only genuinely new cost is what the proposal itself already builds once for
W10: an `appId` prop threaded to the consuming component, plus a new
encrypted-storage helper for a `{ week, sermonTopic }` map. That is the same
shape of cost as W10, not larger than W7 (W7 is a five-file deletion with no
new storage).

This doesn't flip Q2 to "build it now" — reasons (i) (a build in a
subtraction-only pass) and (iii) (cold-start / n=1 memory-aid, wrong area's
screen) are untouched by this and are sufficient on their own to keep Q2 out
of Area E's scope. But the specific claim used to argue the estimate was
*wrong* is itself wrong, in the direction that makes Q2 *cheaper* than
represented, not more expensive. The doc should correct §3(ii) rather than
stand on it — as written it will mislead whoever picks up the Area D note in
§3's closing paragraph into re-deriving a type change that isn't needed.

**Verdict: PRESS.** Concede the outcome (declined, routed to Area D), reject
the stated reason (ii).

---

## 2. The end state as an experience — does Area E go to zero?

Reconstructed final `NewsletterArchitect` after W1+W2 (`src/components/NewsletterArchitect.tsx`,
`src/utils/newsletter.ts`): two free-text inputs (sermon topic, pastor notes,
`:76-90`), one real derived list (adult-only birthdays in the next 7 days,
sourced from actual `birthdate` on the full people roster — `Student` here is
the app-wide person type, not a youth-ministry subset; every other screen
(`SolarSystem`, `MapView`, `PrayerMatch`, etc.) consumes the same prop as
"the congregation," confirmed at `App.tsx:757-993`), a static
"paste-your-announcements" placeholder, and a copy-to-clipboard button. No
fetch, no loading state, no error state, no AI call.

**Verdict: it survives, but just barely, and only for one reason — the
birthday list is real automation of a task that is genuinely tedious and
safety-sensitive to do by hand:** cross-referencing birthdate-in-next-7-days
against an age/`isChild` gate across a full people list is exactly the kind of
lookup Sarah would otherwise do by scanning People records in PCO one at a
time. At the mock congregation's scale (`mock-api/data.js:24`, 35 households ×
1-2 adults ≈ 50-60 adults), expected yield is roughly one adult birthday a
week — thin, but real, correct, and non-zero often enough to be worth
checking. The two text fields cost nothing to keep and turn "check the
birthday list" and "draft the bulletin" into one artifact instead of two
tools, which is a legitimate (if small) job.

That is not the screen the name promises, and the proposal's own edits don't
fully catch up to what W1+W2 leave behind:

* **Leftover defect the proposal introduces by not reconciling W1 and W2's
  text edits.** W1 (`§3`) only touches the subtitle at `:65` to delete
  "AI-assisted" and swap "student birthdays"→"birthdays." It does not touch
  "based on upcoming calendar events," and W2 doesn't either. Applied in
  sequence, the surviving subtitle reads: *"markdown drafts based on upcoming
  calendar events and birthdays."* W2 deletes the entire calendar-events fetch
  and replaces it with a static paste-in placeholder — there is no longer any
  calendar-events content in the artifact. The subtitle would ship still
  promising a data source the component no longer touches. This needs a third
  edit at `:65` in the same commit as W1/W2: drop "based on upcoming calendar
  events and" entirely, leaving something like *"Weekly markdown draft with
  real birthdays and space for your own notes."*
* **The nav label and header still say "Newsletter Architect."** "Architect"
  implies structure/composition intelligence that isn't there — two inputs
  and one query is a form, not an architect. I'd rename the nav item
  (`SidebarIntelligence.tsx:44-50`) and header (`NewsletterArchitect.tsx:64`)
  to something that matches the remaining job, e.g. "Weekly Bulletin Draft."
  Not blocking, but "what should this screen look like now" starts with its
  name stopping the overclaim the audit just spent two gates removing from
  its content.

**Bottom line: Area E does not go to zero.** One thin, honest, correctly-gated
utility screen survives. It is worth the one remaining nav slot only if its
copy is rewritten to match what it now does — a name and subtitle promising
"architecture" and "calendar events" over a two-textbox form and a birthday
lookup is the same species of overclaim (#43's fake integration toggles, #37's
fake correlation) that the rest of this area was cut for.

---

## 3. Is "cut, not relabel, because `fetchEvents` is a hook a future agent would
   reach for" sound?

**Verdict: REJECT the stated reasoning as insufficient on its own — the cut
conclusion is still right, for a different and stronger reason the proposal
didn't make.**

The decay argument has real precedent in this exact file, which is worth
crediting: the current defect (`newsletter.ts:15,17,57`) is *exactly* someone
writing date-shaped claims — "next 7 days," a false "no major events this
week" empty-state — around a fetch that returns undated standing definitions.
So "leaving the fetch wired in invites someone to bolt a fake date filter onto
it" is not hypothetical; it is a description of how this file's own defect was
introduced the first time.

But the proposal's own remedy undercuts using that argument as the reason to
prefer *cut* over *relabel*: W2 adds "a one-line comment... that stops someone
re-adding a fake date filter" regardless of the deletion. If a code comment is
what actually prevents recurrence, it prevents recurrence identically whether
it sits above a relabeled `fetchEvents`-backed "Standing Ministries" block or
above the birthdays block in the cut version. The presence of the fetch isn't
what invites the mistake — the *absence of a comment explaining the resource
has no dates* is what invited it the first time, and that's fixed either way.
Judged purely on "does keeping the hook wired in increase future-decay risk
given the deletion already ships a warning comment" — no, not measurably.

**The argument that does hold, and that the proposal should have made
instead:** this is about the *current* UI, not future decay. `fetchEvents`
hits `/check-ins/v2/events` — standing definitions, not occurrences
(`mock-api/data.js:212-238`; confirmed unopposed since round 1). A relabeled
"Standing Ministries" section fed by that endpoint would render the identical
five lines — "Sunday Worship Service," "Kids Ministry Team," "Greeter Team" —
**every single week**, regardless of when the newsletter is generated,
because the resource has no date dimension to vary on. In an artifact whose
entire premise is "this week's update," a block that never changes carries
zero information and duplicates whatever standing-ministries list already
lives in the church's actual bulletin template. Keeping it also keeps the
fetch's loading spinner and error state (`:52-59`) live in a component that,
per §2 above, should render synchronously. That is a same-day usability
defect — a always-identical, unearned network dependency — independent of
whether a future agent later misuses the hook.

**So: cut is correct, relabel was never a live option once you look at what a
correctly-labeled version would actually show — but the proposal's given
reason (decay-prevention via removing the hook) is not what makes it correct,
since the same decay is already prevented by the comment it plans to add
either way.**

---

## Summary for other critics

1. Q2 cost claim: **wrong as argued** — the ISO week key survives into
   `WeeklyAttendance.date` (`attendance.ts:26`) and is already used for
   sorting; no Area D type change is needed. Outcome (declined, routed to
   Area D) still stands on its other two legs.
2. Area E does not go to zero. Newsletter Architect survives as a thin,
   honest utility on the strength of one real query (adult birthdays). Ship
   it with its name and subtitle rewritten to match — flag the `:65` subtitle
   as a third edit needed alongside W1/W2, not just those two.
3. The "future-agent hook" argument for cutting the events block outright is
   not sound in isolation (the planned comment neutralizes the risk whether
   or not the fetch stays); the cut is still right because a relabeled
   version would show unchanging content every week in a "this week" artifact
   plus keep a needless fetch/loading/error surface.

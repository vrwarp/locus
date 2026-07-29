# Area E — Round 3 — church-admin

## 1. Does the newsletter survive?

**Yes — narrowly, and I rule it survives.** Re-read `newsletter.ts` and
`NewsletterArchitect.tsx` with both gates applied on paper:

- W1 removes minors from the birthday block.
- W2 deletes the events block, `fetchEvents`, the `loading`/`error` states, and
  the whole `useEffect` — the component becomes a pure function of `students`
  plus two typed fields.

What's left is not nothing: a page that renders `# Weekly Ministry Update`,
an optional sermon-topic heading, an optional pastor's-notes paragraph, a
static `## Announcements` paste target, and a real `## Birthdays` list built
from actual PCO `birthdate` values for adults — with a copy button. That is a
genuine, if thin, weekly task: today the person who builds the bulletin
either retypes the birthday list from a PCO People report by hand or skips
it. This does that step for them in one click. It is not a toy in the sense
#37–#40 were toys — there is no fabricated number anywhere in what remains.

I will not oversell it. Verdict is **SIMPLIFY, not KEEP-as-is**: it's a
copy-paste macro, not "AI-assisted" anything (right call to delete that
word), and it duplicates a report Planning Center People can already produce
(a birthday-filtered list). Its edge over PCO is the one-click markdown
formatting for a bulletin — a real but small time saving, maybe 5 minutes a
week. That clears my bar. It does not go to zero. If v2 had proposed cutting
the whole screen after both gates, I'd have said no — a five-minute weekly
save with zero remaining fabrication is worth the licence line more than the
four charts we're deleting were.

**Q1, answered from source (this is what Round 3 was for):** `isChild` at
`pco.ts:273` is `!!child` — read straight off PCO's own `child` attribute on
the Person resource, an admin-set checkbox in PCO People, not derived from
household role or any Locus computation. The stale-in-the-unsafe-direction
risk youth raised (§4) is real but it is a PCO data-hygiene risk, not
something Locus's code introduces. It is cheap to close anyway:
`transformPerson` already computes `age` from `birthdate`
(`pco.ts:243`, `differenceInYears(new Date(), dob)`), and `newsletter.ts`
already requires `s.birthdate` to be present before filtering. **Change the
W1 line from**
`students.filter(s => s.birthdate && !s.isChild)` **to**
`students.filter(s => s.birthdate && !s.isChild && s.age >= 18)`.
Zero new fetch, zero new field — `age` is already on `Student`. This closes
the exact gap Q1 names (a genuine minor with `isChild: false`) at the cost of
four characters. I am amending W1 with this, not proposing new scope.

## 2. Deletion budget

**ACCEPT.** I traced every file the plan touches:

- `PcoEvent` / `fetchEvents` (`pco.ts:101-108`, `:492-505`) are used by seven
  other live screens — `BurnoutReport`, `MissingVolunteersReport`,
  `Dashboard`, `BusFactorGraph`, `CoPilot`, `VolunteerWeb`,
  `RecruitmentReport` — and by five utils (`missing.ts`, `recruitment.ts`,
  `burnout.ts`, `busFactor.ts`, `copilot.ts`, `volunteerWeb.ts`). The plan
  correctly deletes only the *import and usage* of these in
  `newsletter.ts`/`NewsletterArchitect.tsx`, and leaves the type and fetch
  function in `pco.ts` untouched. Good — deleting those would have broken
  half the app.
- `giving.ts` → only `GivingRiver.tsx`/`.test.tsx` import it. Safe.
- `givingTrends.ts` → only `GivingTrends.tsx`/`.test.tsx`. Safe.
- `sermons.ts` → only `SermonCorrelator.tsx` and `SermonSentiment.tsx` import
  it; `SERMON_TOPICS` appears nowhere outside `sermons.ts`/`sermons.test.ts`.
  Safe to delete whole, as W6 specifies. `GENERATIONS` in
  `demographics.ts` is a separate file — correctly left alone for Area D.
- `genealogy.ts` → only `GenealogyGraph.tsx` imports it, and
  `GenealogyGraph` itself is only referenced from `RobertReport.tsx`, which
  is dead code (`App.tsx:11`, commented import, never mounted). So W9 is
  deleting code that is already unreachable from any live route. Confirmed,
  nothing else touches it.
- `RobertReport` → confirmed dead in `App.tsx` (commented import), test
  references only in its own test file plus two `vi.mock` stubs the plan
  already lists for cleanup.
- `SidebarIntelligence.tsx` nav buttons for sermons/sermon-correlator/
  giving-river/giving-trends and `SidebarCore.tsx` integrations entry — I
  read the file directly; line numbers and button text in v2 match what's on
  disk.

Nothing I'd miss. No cross-area dependency severed.

## 3. Anything else I object to

None. W7's "no Request-this-integration control" and W2's cut-not-relabel
call both hold up under a second look — a relabelled "Standing Ministries"
list is still useless to a bulletin editor, and leaving `fetchEvents` wired
into a component this area no longer owns is exactly the kind of half-dead
hook that gets "fixed" back into a lie later.

# Area E — content-giving-comms — Round 2 (Children's Ministry)

Adversarial pass against `proposal-v1.md`. Not restating Round 1. Verified
every cited line before writing this.

---

## 1. Fact-check of the proposal's corrections to me

**[CONCEDE] "Exact birthdate" was overstated.** Re-read `newsletter.ts:64-65`:
`dateStr` is `toLocaleDateString('en-US', { month: 'short', day: 'numeric' })`
— no year, confirmed. My r1 said "computed exact birthdate" and "enough to
reconstruct a child's exact age." Both wrong. The payload is full name +
month/day, which is enough to know *when* to approach a specific named child,
not how old they are. That's a real distinction and I was sloppy. Correction
accepted.

**[CONCEDE] Test fixtures are exactly as claimed.** Read
`newsletter.test.ts:13-46, 83-93` myself: `mockStudents` = Alice/Bob/Charlie,
all three `isChild: true`; the leap-year fixture (`Leapling`, line 88) is also
`isChild: true`. Lines 62-63 assert `Charlie (Mar 24)` and `Alice (Mar 26)`
appear in output. The suite is a green light on publishing minors by name.
The proposal is right that fixing `newsletter.ts` without rewriting this file
in the same commit is fixing nothing — the test would fail correctly for the
first time, which is the point.

**One thing the proposal didn't check, and I did:** `firstName` (`pco.ts:75`)
is populated from real `first_name`, and `!isChild` filtering is already
idiomatic in this codebase — `sorter.ts:21,117` and `family.ts:119-120` both
do it. W1's implementation plan is not hypothetical; the pieces it needs
already exist and are already used the same way elsewhere.

---

## 2. The binary question: does the opt-in checkbox exist in the shipped product?

**No — and it should not, as designed in W1. I am revising my own Round 1
position.**

My r1 proposed "opt-in toggle, off by default, first-name-only" as the
acceptable floor. The proposal adopted it verbatim. On rereading the actual
component I have to withdraw it, because I checked something neither round 1
critique did: **who can reach that toggle.**

`NewsletterArchitect` is not gated behind any role check beyond which button a
person clicks on `LandingPage.tsx`. `LandingPage.tsx:8-35` is two buttons —
"Locus Core" and "Locus Intelligence" — with no permission check, no
role-from-server, nothing (`onSelectRole` fires straight from the `onClick`).
Newsletter Architect is wired into the Intelligence sidebar
(`SidebarIntelligence.tsx:44-50`) and *not* the Core sidebar (grep for
"newsletter" across `SidebarCore.tsx` returns nothing). So "who is
accountable for the setting" has no answer in the shipped architecture:
**anyone holding valid PCO Basic-auth credentials who clicks "Locus
Intelligence" at login reaches this screen and this checkbox.** That is every
staff member and any volunteer ever handed API credentials for reporting
purposes — not the children's director specifically, not anyone with
authority over what gets published about a minor.

My r1 remedy assumed "a ministry" would deliberately opt in — i.e., assumed
an accountable decision-maker at the point of the toggle. That assumption is
false in this app. A checkbox with no access control behind it is not an
opt-in decision, it's a coin flip made by whoever is at the keyboard that
week, and per my own policy floor (point 6: "your policy floor is stricter
than the rest of the church's") that is not a defensible place to put a
minor-identifying default-off switch.

**Verdict: the checkbox does not ship.** `generateNewsletter` filters
`!s.isChild` unconditionally, with no `includeChildBirthdays` escape hatch in
the UI at all. If a ministry genuinely wants first-name shout-outs for kids,
that has to be a config-level, admin-only setting set once by whoever owns
`ConfigModal.tsx` (the same admin tier the proposal already trusts with the
Integrations "Not Connected" card in W6) — not a per-session checkbox next to
a Sermon Topic text box that any Intelligence-mode user can tick before
hitting Copy. **Accountable party: the children's director, exercised through
an admin-only config flag — not a run-time checkbox on the newsletter
screen itself, because the app has no run-time mechanism to prove who is
sitting at that screen.**

This lands closer to youth's line than mine did in Round 1, but not
identical to "no minor identifier under any option, ever" — I'd accept a
first-name-only, no-date, admin-configured flag as a floor. I will not accept
a self-service checkbox with zero access control standing in for consent.

---

## 3. Attacks on proposal decisions

**REJECT — N2 (Bulletin Block) makes the exact risk I flagged in r1 worse, not
safer, and the proposal didn't check it against its own veto.**
N2 adds "a second copy button that emits Mailchimp-friendly HTML alongside
the markdown" to replace #43's fake integration card. Read literally, this
optimizes the newsletter's output specifically for landing in Mailchimp — a
third-party system that, unlike a one-time bulletin, retains contact records
indefinitely, is searchable, and is exportable by anyone with list access.
Even under my accepted floor (first name only, no date, admin-gated), a name
that would be ephemeral in a copy-pasted email becomes a durable, joinable
record the moment it's formatted for Mailchimp import. §3's veto text says
"the same app advertising a Mailchimp sync one screen over... is still below
the bar" as an argument *against* the current design — then §7 turns around
and builds a purpose-made Mailchimp export into the surviving feature. N2
needs an explicit statement that the Mailchimp-formatted output runs through
the same `isPublishable` gate (N1) as the markdown, with no separate
carve-out, or it should not ship in the same commit as W1.

**REJECT in part — W9 (delete Genealogy) should stop being "contested," it
should just run.** Proposal's Q4 asks whether PCO exposes confirmed household
*roles* that would justify rebuilding Genealogy instead of cutting it. I
checked: `PEOPLE_INCLUDES` (`pco.ts:444`) is `'emails,phone_numbers,addresses,
households'` — households are fetched only for `household_id` grouping
(`pco.ts:193-222`), and the code has no field for a per-member relationship
role anywhere in the `Household`/`Student` parsing. PCO's People API exposes
household membership and a primary-contact pointer, not a parent/spouse/child
role per member — there is no such role to fetch. Nothing in this repo's own
data layer is being left on the table. W9 is not contested; it just hasn't
been told to proceed. Delete it, and don't let a hypothetical un-fetched PCO
field keep it in limbo past this round.

---

## 4. What it dropped, one line each

- Dropped my r1 cross-cutting note that "Gen Alpha" check-in headcounts get
  folded into adult sermon/giving analytics with no disclosure — moot now
  that #37/38/40 are CUT, but if Q2 revives any sermon-topic screen this
  needs to resurface, and §5/§7 don't flag it as a condition of revival.
- Dropped the youth critic's "no audience/recipient concept exists at all"
  point as a reason the opt-in *design itself* (not just my r1 remedy) is
  hard to make accountable — the proposal treated this as youth's process
  objection to targeting, not as evidence against trusting a checkbox with no
  access control, which is the sharper version of the same finding.

## 5. Where it beat me, one line each

- The "exact birthdate" correction was right and I should have measured the
  actual `toLocaleDateString` call in r1 instead of describing the field from
  memory.
- Citing `sorter.ts`/`family.ts` to show `!isChild` filtering is already
  idiomatic in this codebase turned my "add a filter" request into a concrete,
  low-risk diff instead of a policy demand with no implementation path.

# Area E — content-giving-comms — Round 2 (Youth Ministry critique)

Reviewer: youth-ministry-agent. Responding to `proposal-v1.md`. Re-verified against
`src/utils/newsletter.ts`, `src/components/NewsletterArchitect.tsx`,
`src/utils/pco.ts:71-99,231-273`, `src/utils/automations.ts:105-124`.

---

## 1. The factual correction — conceded

Confirmed at `newsletter.ts:64-65`: `dateStr` is
`toLocaleDateString('en-US', { month: 'short', day: 'numeric' })`, and the emit
line is `` `- ${b.person.name} (${dateStr})` ``. No year, anywhere in the
function. **I overstated this in Round 1** — "full name + birthdate" implied
year-bearing DOB; the actual payload is full name + month/day. I withdraw
"exact birthdate" and "reconstruct a child's exact age." The corrected payload
is weaker than I claimed. Conceded, cleanly.

It does not fix the underlying problem (see §2) — full name plus a specific
calendar day is still enough to single out one child in a congregation-sized
group, which is the only property that mattered to my veto — but I was wrong
about what field is on screen and I'm saying so plainly.

## 2. The binary question — answered

**W1's checkbox must not exist. No minor identifier — not even first-name-only
— may be emitted under any option, until Locus has a real per-guardian consent
record. Reject the opt-in design as scoped.**

Three reasons, not one:

1. **"Opt-in" requires an entity to opt in. None exists.** W1's checkbox is a
   single boolean toggled by whoever is composing that week's newsletter
   (`NewsletterArchitect.tsx` has one `students` prop, one `auth` prop, no
   per-person, per-guardian, or per-household preference anywhere). Flipping it
   applies to *every* minor in the database at once. That is not a family
   choosing to be included — it is a staffer deciding on behalf of every family
   simultaneously, every week, with no record of who agreed to what. Calling
   that "opt-in" describes a UX label, not a consent mechanism. My Round 1 ask
   for audience scoping is conceded as unimplementable (§3) — but the proposal's
   own logic applies here too: you cannot build informed consent for a
   destination you cannot name, and this tool (correctly, per the proposal)
   has no concept of destination or recipient at all. A checkbox with no
   visible destination and no per-family record is worse than no checkbox — it
   lets the org tell itself it has a governed opt-in when it has a light
   switch.
2. **The only gate available, `isChild`, is independently proven unreliable in
   this codebase.** `automations.ts:115` — `.filter(s => s.age === 18 &&
   s.isChild) // Flag 18 year olds who are still marked as children` — exists
   *because* PCO's `child` household-role flag goes stale exactly like grade
   does. A gate that the app's own code documents as going stale is not a
   safety boundary you hang a minor-disclosure decision on with an escape
   hatch attached. Un-stale `isChild` first; don't build an opt-in on top of a
   field the codebase already distrusts.
3. **First name is not de-identifying at church scale.** My brief: leaders and
   families know kids by first name; a "small congregation" newsletter with
   "Charlie, birthday this week" next to a photo-less bulletin is fully
   identifying to every reader who has ever met Charlie at Wednesday night —
   which is the whole intended readership. Stripping the year doesn't strip
   the identification; it strips only the one fact (age) that was already
   overstated in Round 1. First-name-only is a smaller leak, not a safe one.

If a real consent field is added to the data model later (household-level
"may we include our kids' names in ministry communications," stored against
`householdId`, surfaced from PCO or captured in Locus), the checkbox becomes
legitimate and I'll support it immediately. Today it is a design that launders
an unconsented broadcast through the word "opt-in."

## 3. Concessions

- **Withdrawn: "audience scoping" as my Round 1 ask.** The proposal is right
  that the tool has zero recipient model and zero send path
  (`NewsletterArchitect.tsx:47-51` is the only action, and it's a clipboard
  write) — "scope to my small group" has nothing to attach to. I was asking
  for a targeting feature this tool structurally cannot have. Withdrawn, not
  just conceded.
- **Withdrawn: CUT verdict on #41.** Given the no-send-path finding is
  confirmed and the birth-year overstatement is conceded, "cut the one honest
  surface in the area for failing to be a different product" (proposal's
  words) is fair. I accept **FIX** as the verdict on the feature itself. My
  disagreement is narrowly with the mechanism in §2, not the verdict.
- **Concede the year correction outright** (§1).

## 4. What it dropped

Nothing load-bearing from my Round 1 was dropped without a ruling — #42, #43
were addressed and improved on (N1's `isPublishable` is a better fix than
anything I proposed). One thing under-addressed: I flagged in Round 1 that
`isChild` has no distinction from a genuine minor-safety standpoint beyond a
boolean — the proposal's N1 (`isPublishable(person, opts)`) inherits `isChild`
as-is without addressing that the flag itself is known-stale in this exact
codebase (§2.2). N1 is the right shape but will encode the same silent
under-protection until someone also fixes `automations.ts:115`'s underlying
problem. Flag this for whoever owns N1's implementation, cross-referenced to
Area A hygiene, not Area E — but don't let N1 ship as a clean abstraction over
a dirty input without a note.

## 5. Attack: N2 (Bulletin Block / "Copy to Mailchimp" button)

**Reject as scoped.** N2 adds a second copy button emitting "Mailchimp-friendly
HTML" — i.e., a purpose-built export toward a named third-party marketing
platform, which is precisely the "anything sent to a third-party service" hard
line in my brief, now built into the feature the proposal just spent four
paragraphs establishing as safe *because it has no send path*. N2 gives it one.

Concrete alternative: if N2 ships, the Mailchimp-HTML output must run through
N1's `isPublishable` and **always** evaluate `!isChild` for that path
specifically — independent of whatever the plain-markdown opt-in checkbox is
set to, and independent of any future consent field that might someday permit
first-name-only inclusion in the internal/print copy. A checkbox that governs
"do I show this in the copy-paste bulletin I hand a volunteer" is not the same
risk as "do I push this into a third-party mailing list," and N2 currently
collapses them into one button fed by one `generatedMarkdown`/HTML pair. Keep
them separate: minors never appear in the Mailchimp export, full stop, no
matter what the newsletter-level toggle says.

---

## Verdict deltas from Round 1

| # | Round 1 | Round 2 |
|---|---------|---------|
| 41 | CUT (as built) / DEMOTE if kept | **FIX — accepted**, W1 mechanism rejected (see §2) |
| all else | unchanged | unchanged, no new disagreement |

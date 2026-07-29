# Area D — engagement-analytics — Round 3 (Children's Ministry critique)

Reviewer: children's ministry director persona. Attacking `proposal-v2.md`. Scope
per instructions: the `isChild` rejection (§3.2), whether Map View survives as
the last route, and the Check-in Velocity cut. All prior CONVERGED items (D1-D3,
D5-D6, §3.1, §3.3-3.5) are not reopened.

## 1. `isChild` on Map View — CONCEDE

I pushed this in both Round 1 and Round 2. Re-reading v2's argument against my
own policy floor (item 6 of my brief: "addresses ... maps of where kids live" is
the single most sensitive category Locus can produce), I think the proposal has
it right and I had it backwards.

The mechanism that matters is *what is the subject of the artifact*, not just
whether an individual can be picked out of it. `calculateCityClusters`
(`geospatial.ts:8-30`) as it stands takes the full `students` prop — which,
confirmed in `App.tsx:236-246`, is the *whole roster* (every PCO Person,
`isChild: !!child` at `pco.ts:273` is a boolean field on an otherwise
undifferentiated population, not a separate minors-only dataset). Two ways to
fix that:

- **Household dedupe (v2's fix, `geospatial.ts:11`→`householdId`):** the subject
  of the resulting chart stays "general congregation household distribution." A
  minor is never a countable unit — they disappear into whichever household
  contains them. This is a *structural* removal of the child as a
  re-identification vector, not a policy label on top of one.
- **`isChild` filter (my ask):** the subject of the resulting chart becomes,
  explicitly and only, "where do our minors live." Even k-anonymized at
  city-level with a floor, that is categorically the artifact my own policy
  names as worst-case — it hands anyone who obtains it (leak, subpoena, a
  hostile ex-spouse who already knows the child attends this church but not
  which town) a ranked list of towns to search, with the label "these are the
  towns with children" pre-attached. The whole-roster version carries the same
  city-level granularity without that label. Filtering to minors doesn't tighten
  identifiability, it narrows the *subject* to the one population my brief says
  should never be the explicit subject of a location artifact.

My Round 2 second ground ("delivers zero children's-ministry value") was a
fitness complaint, and v2 is right that it loses on fitness: campus siting is a
household question, not a per-child one, so filtering to `isChild` would break
the feature's one legitimate job while making the output more sensitive. Both
of my grounds fail under scrutiny. Conceded, unqualified.

## 2. One residual gap in the household-dedupe fix — new finding, not the isChild ask reopened

`householdId` is typed `string | null` (`pco.ts:85`), and `transformPerson`
(`pco.ts:274`) sets it to `null` whenever a person record has no household
relationship. D9's bullet ("dedupe on `student.householdId`... `geospatial.ts:11`
currently counts people") does not say what happens to `null`-household records.
Two failure modes, both live safety issues:

- If every `null`-household student is deduped into one shared bucket, they are
  undercounted — a null-household city could sit permanently below the floor
  regardless of true count, silently killing coverage for exactly the students
  Area D's own D4 flagged as "children with no linked adult" (`SolarSystem.tsx:44-46`,
  handed to Area A's Family Audit).
- If `null` is instead treated as "no key, so don't collapse" and each such
  record dedupes against itself, then an unlinked-adult child is once again
  counted, and potentially city-suppressed or shown, **as an individual** — the
  exact per-child plotting the floor exists to prevent, silently reintroduced
  through the one population that has no adult to hide behind.

**Blocking, alongside D9's other two blocking items:** `calculateCityClusters`
must explicitly exclude students with `householdId === null` from the map
entirely (they have no household to dedupe into, so they cannot be safely
represented at the household level) rather than let them fall through either
failure mode above. This is the same population D4 already flagged; D9 should
say so rather than leave it implicit in "dedupe on `householdId`."

## 3. Does Map View survive as the last route? — ACCEPT, conditional on §1 + §2 shipping as blocking

I have twice said children's home locations should not be plotted. What D9
describes, if built as specified plus the §2 fix, is not that: no address, no
per-person marker, no name, aggregate counts only, floor scaled to
`max(10, ceil(0.05 * totalHouseholds))` (my own Round 2 formula, adopted
verbatim), null-household students excluded rather than mis-handled. That is
materially different from a map of where kids live — it is closer to a
Census-tract disclosure than a roster export. On that basis I do not join the
call for zero routes on safety grounds; §5.1's frequency argument
("campus siting happens once every several years") is a fitness question for
UXR/church-admin to settle, not mine to relitigate.

The condition is real, though: my ACCEPT is contingent on the k-floor, the
household dedupe, and the §2 null-handling all landing as *blocking* — not
"blocking in principle, shipped as a fast-follow." If any one of the three
ships without the other two, my verdict reverses to zero routes, because a
partial fix (e.g., floor without dedupe, or dedupe without null-handling) is
worse than the status quo: it looks anonymized without being anonymized.

## 4. Check-in Velocity cut, no replacement — ACCEPT

Consistent with my Round 2 finding: velocity was never fixable with the data
model Locus fetches, independent of the D4 merge that has since collapsed.
`calculateCheckInVelocity` (`velocity.ts:12-16`) hard-filtering `getDay() === 0`
only confirms what I already said in Round 2 — Sunday-only by construction,
7am-1pm hardcoded, and with no room/station dimension on `PcoCheckIn`
(`pco.ts:109-121` carries `person` and `event` relationships only), a rush-pace
chart tells a director volume is climbing without ever saying *where* the
backup is. A number that can't be acted on at 9:24am is not a bottleneck
screen, it's a toy with a clock icon. Cutting it with nothing replacing it is
correct.

**What would make it worth revisiting:** a location/room field on
`PcoCheckIn`, sourced the way I named in Round 2 — PCO's real Check-Ins v2 API
supports `include=locations`, and `fetchRecentCheckIns` (`pco.ts:508`) never
requests it. Only once check-ins carry a station relationship does "Preschool
Room 2 is running eight minutes behind" become a computable, actionable
statement instead of an aggregate curve. Until that field exists on the wire,
there is nothing here worth a volunteer's attention, and no chart design fixes
that.

---

## Verdict summary

- **`isChild` filter (§3.2 of v2): CONCEDE.** Household dedupe correctly closes
  re-identification without making the artifact's subject "minors' locations."
- **Map View as Area D's sole route: ACCEPT**, conditional on k-floor +
  household dedupe + explicit `householdId === null` exclusion (§2, new) all
  shipping together as blocking. Any partial ship reverses this to zero routes.
- **Check-in Velocity cut, no replacement: ACCEPT.** Prerequisite for
  revisiting: a station/location field on `PcoCheckIn` (`include=locations`),
  not present today.

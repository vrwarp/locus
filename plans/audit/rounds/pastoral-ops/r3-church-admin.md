# Area C — pastoral-ops — Round 3 (church-admin)

Scope per instructions: items 1–3 only. All CONVERGED rows in proposal-v2.md §2
are not reopened.

---

## 1. N2 — substitute `passed_background_check` for the fabricated expiry field

**Verified independently.** `grep -rn "passed_background_check" src/ mock-api/`
returns zero matches — confirmed. `background_check_expires_at` /
`backgroundCheckExpiresAt` appears in `pco.ts:17,86,231,275`,
`automations.ts:122-151`, `mock-api/data.js:81-93,127`, and four test files —
confirmed read throughout, generated under the literal comment "Simulate
Background Check Expiry" with a `Math.random()` bucket three lines above
`prayer_topic`. Same fabrication pattern as round 1's other invented fields.

**Ruling: keep clearance in the product, on the real boolean, fail-closed, no
expiry.** This is not a close call. A yes/no "has this person passed a
background check" is the question a Kids Ministry coordinator actually asks
before adding someone to a roster — expiry tracking is the second-order
compliance need that PCO itself splits into a separate paid feature many
churches our size don't even license. `passed_background_check` sits on the
same Person resource Locus already fetches for every candidate — this is a
field addition to an existing call, not a new API round-trip, so the "is it
worth the fetch" framing undersells how cheap N2 is. What it cannot do —
"expiring in 30 days" — was never something Locus could honestly promise; that
lane dies and does not come back, correctly.

The alternative — cutting clearance out of the product entirely — is wrong.
It would mean Recruitment's Ask Script and Bus Factor's solo-with-minors tier
both go back to suggesting or flagging people for child-facing roles with zero
signal, which is worse than a boolean with three honest "I don't know" states.
Fail-closed default (**not cleared** unless `true`) is the correct posture for
a null-heavy field — it turns "we don't know" into "don't offer the role"
rather than into an implied pass. N2 approved as specified in §3.2/§4.9/§4.10.

---

## 2. Does "Solo with minors" survive the standard that cut #21, #27, and three Automations lanes?

I re-read `busFactor.ts` end to end. `analyzeCluster` (`:94-124`) counts
distinct people per time-clustered check-in on a serving event and sets
`soloCount` when `teamSize === 1`. That is a real, correctly-derived count of
adults checked into a serving shift alone — not a fabricated field, not a
divide-by-a-wrong-constant bug like `drift.ts`, not a false success banner
like Emergency Alerts. `mock-api/data.js:212-238` confirms children check into
a separate event ("Sunday Kids Church", id 2) from the one volunteers serve on
("Kids Ministry Team", id 4), and `busFactor.ts` never joins the two by time
window — so "children present" is genuinely uncomputable here, exactly as the
proposal states.

**The distinction that matters is not "is this number ever wrong" — every
screen in this audit has a caveat — it is "does the label claim more than the
data supports."** #27's banner said a message sent when it hadn't. The three
Automations lanes read a field the mock generator invents from nothing, and
the codebase that would need a real Background Checks resource never touches
one. Both categories dressed a fabrication as fact. Solo-with-minors, once
gated on §4.3, is a true count of a real thing (adults alone on a
serving-classified event) with an honestly null-aware clearance column.

**Ruling: it survives, but only with the safeguarding framing removed, not
with caveats bolted onto it.** Do not ship a shield icon, do not use the word
"safeguarding" or "Safe Sanctuary" anywhere near it, do not let the row read as
a compliance assurance. Ship it as staffing information — "coverage gap: one
volunteer alone on a kids/student shift" — with the clearance badge rendered
as ops-relevant ("Unknown — verify before scheduling"), not as a pass/fail
credential stamp. That is the same move that saved #24 and the Automations
survivors: real data, named limits, no borrowed authority. If a future version
re-attaches safeguarding language to this tier before the event join exists,
it fails the standard again and should be cut on sight.

---

## 3. Confirm the concessions and rule on the end state

Confirmed against the proposal text: §3.3 moves #24 from SIMPLIFY to **FIX**
(zero live safety findings, two named defects, ships first) — this is my
round-2 point, correctly conceded, not softened into a KEEP that implies no
work. §4.4 restores numeric thresholds to config (my item, with UXR's rarity
question against `historyServingCount >= 2` correctly left open rather than
settled by configurability alone). §4.8 restores the CSV export governance
fix (confirm step, timestamped filename, counts instead of "High Risk" on a
name). §4.9 restores Bus Factor's keyboard/ARIA gap on what is now the area's
compliance-adjacent surface.

**End state — volunteer-risk (merged #20+#22), recruitment, retention,
bus-factor, automations, five nav slots down from ten — is a product I would
deploy.** It is staff-only and weekly-cadence, which is honest given no leader
role or mobile shell exists (§1.4, not reopened). Every surviving screen is
gated on real fetched data with named, UI-visible limitations instead of
invented ones. Zero PCO writes remain outside a read-only out-link, which
matters more now that Sandbox Mode is confirmed inert. The one hard condition
I am not relaxing: `volunteer-risk` and the solo-with-minors tier do not enter
the nav before §4.3 (`classifyEvent` fix) and the `!isChild` gate both land —
until then a merge of two working screens would ship one broken one.

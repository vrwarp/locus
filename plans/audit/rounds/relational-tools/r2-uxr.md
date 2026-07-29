# Area F — relational-tools — Round 2 UXR Critique (adversarial)

Attacking `proposal-v1.md`. Not re-litigating what converged.

---

## 1. Verification of the two new blocking findings

**Sandbox Mode is inert — CONFIRMED, and worse than stated.**
`pco.ts:371-373` sets `X-Locus-Sandbox` only when `sandboxMode` is true, then
`updatePerson` (`pco.ts:391-410`) unconditionally issues the PATCH/POST. I
independently grepped `mock-api/` for `sandbox` (case-insensitive): zero
matches, confirming nothing server-side or client-side short-circuits the
call. I also confirmed the banner text directly:
`App.tsx:681-695` renders "⚠️ SANDBOX MODE ACTIVE - Changes are simulated"
whenever `config.sandboxMode` is true, and `ConfigModal.tsx:150-153` is the
only place a user is told this mode exists — a plain checkbox labeled
"Sandbox Mode" with no caveat. There is no code path anywhere that reads
the header and skips a write. **The finding is correct and, if anything,
undersold**: this isn't a half-built feature, it's a checkbox that lies to
the user about what "Save" is about to do, with a banner reinforcing the lie.

**Encryption's plaintext fallback — CONFIRMED.** `storage.ts:67-81`
(`loadConfig`), `:104-113` (`loadHealthHistory`), `:161-169`
(`loadGamificationState`) all catch a `decryptData` failure and retry with
raw `JSON.parse(stored)`, accepting the result with no signature or
integrity check. Combined with the `appId`-as-KDF-password defect, an
attacker doesn't even need to break AES-256-GCM — they can skip decryption
entirely by writing valid JSON to the three known `localStorage` keys
(`locus_config`, `locus_health_history`, `locus_gamification`) and the app
will consume it silently. This is accurately characterized as "not an
integrity control."

**Judgment on the consequence:** correct, and I'd sharpen it further. The
proposal says "Sandbox must be fixed or removed before it is cited as
mitigation for anything in this area." I'd extend that ban past this area —
any future round or feature (Area A/C write flows) that cites "the user can
just enable Sandbox Mode first" as a safety answer is citing a checkbox that
does nothing. This should be flagged as an audit-wide landmine, not
Area-F-scoped, since `sandboxMode` threads through `App.tsx:307,356,442,528`
into every write path in the app, not just #46.

---

## 2. Verification of the Small Group Sorter benchmark

I ported the exact hot loop (`evaluateFitness`, `createRandomChromosome`,
`tournamentSelection`, `crossover`, `mutate`, the generation loop at
`sorter.ts:142-164`) into a standalone script and ran it against synthetic
households (size 1-3, age 25-75, matching the proposal's stated parameters)
at 200/800/1,800 households, k=8, and against a plain LPT greedy
(sort by size descending, assign to least-loaded group — no age tie-break,
i.e. a *weaker* version than the proposal's F4 spec).

Results (single run, my own numbers, not the proposal's table):

| Households | GA @2000 gen: fitness / time | LPT greedy: fitness / time |
|---|---|---|
| 200 | -46.77 / 4.5s | **-25.89** / <1ms |
| 800 | -79.46 / 15.4s | **-14.38** / 1ms |
| 1,800 | -62.78 / 39.7s | **-6.74** / 1ms |

This independently reproduces the proposal's premise: LPT greedy beats the
GA's best result by 3-10× on the GA's own fitness function, in ~1ms versus
tens of seconds, using a *simpler* tie-break than what F4 proposes. I also
reproduced the non-monotonic "Deep Search isn't more accurate" claim: at
200 households my 500-generation run scored -40.77, beating my own
2000-generation run's -46.77 — same direction as the proposal's table
(worse result at more generations), different exact numbers (expected,
different RNG seed), same conclusion. **The benchmark's premise holds up
under independent replication, not just re-reading the code.**

**Judgment: "delete the algorithm, keep the objective" is right, and even
conservatively stated.** A GA that is strictly dominated on speed *and*
accuracy by a deterministic O(n log n) sort is not a design tradeoff to
preserve optionality on — it is 189 lines of code, a 3-position "accuracy"
dropdown that doesn't control accuracy, a fake progress state, and a
`NODE_ENV === 'test'` branch that exists purely to dodge the timer, all in
service of a worse answer. CUT the algorithm, KEEP the job. No notes.

---

## 3. Where I attack the proposal's decisions

**F5's "credentials out of scope" ruling is broader than its own
justification supports.** F5 declares persisting *any* credential across
refresh out of scope, citing the shared-front-desk-machine threat model as
the reason not to persist "the secret." But the proposal's own F6 section
argues the opposite about the *other* half of the credential pair:
`appId` is "the less-sensitive half... comparable to a username" and is
"exposed in every outgoing Basic-Auth header... visible in devtools Network
tab to anyone with local access to the machine" (inherited verbatim from my
r1 #48.5, and the proposal doesn't dispute it). If `appId` is already
non-confidential by the proposal's own security model, refusing to persist
it buys no security margin — it only guarantees Dr. Robert retypes *two*
fields instead of one on every refresh, laptop sleep/wake, or accidental
Cmd-R. The proposal cites "church-admin wins" as though the dispute were
binary (persist everything vs. persist nothing) when my r1 already proposed
the split it never addresses. **Concrete alternative: persist `appId` and
`userRole` in `localStorage` (already effectively public per F6's own
argument); keep `secret` in-memory only, cleared on refresh.** This gets
Dr. Robert back to a one-field re-auth instead of two, with zero change to
the shared-machine threat model F5 is defending against.

**F4's "determinism removes the unpredictability cost for free" is not
free.** Proposal §5.3 credits the LPT swap with eliminating "Sarah cannot
defend a grouping to a family who asks why they aren't with the Andersons
anymore." That's true *within a single run* — same input, same output,
every time. It is false *across runs with a changed roster*: LPT sorts by
household size descending and greedily fills the least-loaded group: adding
or removing a single household anywhere in the sort order can cascade and
reshuffle which group every subsequent household lands in (classic
bin-packing instability — insertion order is fragile the same way the GA's
random seed was). The GA had this problem too, so the swap doesn't make it
worse, but the proposal's phrasing implies it makes the problem disappear,
and it doesn't. **Alternative: note this explicitly in the F4 caveat copy**
("group assignments can change between runs as membership changes — this
is not a bug") so Sarah isn't caught flat-footed the first time a March
re-sort doesn't match January's, rather than letting the proposal's "for
free" framing set an expectation the algorithm swap can't deliver.

---

## 4. What it dropped from round 1, still unresolved

Two #47 defects from my r1 got zero treatment in F5, despite F5 doing
detailed work on the same feature and citing my other #47 defects by number:

1. **#47.3 — the credential prompt assumes technical fluency the persona
   doesn't have.** The auth overlay (`App.tsx:704-733`) still has no link to
   where in Planning Center to generate a token, no example format, no
   escape hatch for someone who doesn't have one. F5 relabels the landing
   cards and adds a logout control but never touches the overlay copy
   itself. For the Intelligence persona (a pastor, explicitly not an API
   credential manager per the inventory), this is still the first thing
   they see and it's still unexplained.
2. **#47.6 — inconsistent error messaging.** A 401 gets a clear message
   (`pco.ts:481-483`); everything else (network error, CORS, DNS, PCO
   outage) falls through to raw `e.message` from axios (`App.tsx:196`),
   unchanged by any F-item. This matters more, not less, after F1/F2 remove
   two features and F6 adds a new failure surface (`clearAllLocalData`,
   cache purge) that can itself fail in ways a user needs to understand.

Neither is hard to fix and both were in scope of the exact feature (#47)
the proposal did the most rewriting on — they weren't traded off against
something bigger, they were just not mentioned.

---

## 5. Concession

The domain vets on #44 were right and my round-1 "soften to Prayer Topic
Groups + CSV export" was wrong — CSV export makes an unconsented
minor/stranger disclosure more portable, not less, and I missed that a
pure UX fix can't repair a safeguarding defect; CUT is the correct verdict.

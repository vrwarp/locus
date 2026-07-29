# Round 4 — Youth response to proposal-v3

## 1. Can B3 (four fields, detector-flip gate) be gamed the way the grade gate could?

**No — reopened.** It can. Same exploit shape, shipped, not hypothetical.

`ReviewMode.tsx:498-499` ships a one-click **"Smart Fix All"** button
(`handleFixAll`, `ReviewMode.tsx:123-172`) that loops every anomalous student
and applies `fixName` / `fixEmail` / `fixAddress` / `fixPhone`
(`hygiene.ts:18,49,125,172`) with **zero human typing**, then calls
`onSaveBulk` — the exact call site v3 §2/B3(d) already cites as "not a
hypothetical script." It is gated on `isSpeedRun` being false but is otherwise
always reachable, and the *speed-run* mode literally scores this same
auto-fix loop against a clock (`:167-170`). This is the bulk-script exploit
that killed the grade gate, now demonstrated against name/phone/address.

§1.2's claim — "no derivable correct value a script could compute" — is false
on the record for at least two of the four surviving fields:

- **name:** `fixName` (`hygiene.ts:18-26`) blind-title-cases every word.
  `detectNameAnomaly` only checks all-upper/all-lower, so `fixName`'s output
  *always* clears it — 100% deterministic credit, no exception path. It also
  produces wrong output for a known, common population: "MCDONALD" →
  "Mcdonald", "O'BRIEN" → "O'brien", any hyphenated or particle surname
  ("VAN DER BERG" → "Van Der Berg" is defensible; "MACARTHUR" → "Macarthur"
  is not). Silently wrong, credited as verified, nobody reviews it.
- **phone:** `fixPhone` (`hygiene.ts:172-196`) infers a 7-digit number's area
  code from the student's **current** zip via `getAreaCodeFromZip`
  (`areaCodes.ts`) when the stored number lacks one. That is exactly
  `calculateExpectedGrade`'s shape — a public, deterministic formula standing
  in for a fact nobody checked — and it is wrong for the same kind of ordinary
  exception grade's critics named: any family that moved, or any teen who
  kept a cell number from a previous area code (routine in youth ministry).
  The gate re-derives `detectPhoneAnomaly` from the resulting value rather
  than trusting ReviewMode's `hasPhoneAnomaly` flag, so a *failed* fix
  correctly earns no credit — but a *wrong-area-code* fix is still a
  syntactically valid E.164 number, clears the detector, and is credited.

Address and email are lower-risk in practice: `fixEmail` only credits when
`validateEmail(fixedEmail)` passes (`ReviewMode.tsx:140`) and its fuzzy-match
has explicit guardrails; `fixAddress`'s only mis-expansion risk ("St" as
"Saint" → "Street") doesn't touch what `detectAddressAnomaly` actually checks
(presence + zip format), so it can't manufacture a false gate-pass — though it
can still silently corrupt a street field as a side effect of an unrelated
zip fix, uncredited but unreviewed.

**Verdict: SIMPLIFY, not KEEP-as-specified.** The four-field reduction and the
zero-weight ruling for grade/birthdate both stand — that part of the argument
was right and I am not reopening it. What's wrong is the unqualified claim
that the survivors are safe *because* no formula exists for them. One does,
it ships as a button, and it earns `verifiedFixes` credit under N1 with no
human in the loop. Minimum fix: `deriveActionType`/the B3 gate should not
credit a correction whose value is byte-identical to what the shipped fixer
function would have produced unedited — i.e., require the saved value to
diverge from `fixName(original)`/`fixPhone(original, zip)` etc., the same
"prove a human did something" logic already applied to kill the grade gate.
Absent that, `verifiedFixes` measures button-clicks, not verification, for
exactly the fields it claims to certify.

## 2. Reopen triggers — confirmed accurate

v3 §3 records, verbatim and correctly:

1. **Youth (#14/#17):** reopen if N1/N1b or the Contribution Graph is cut in a
   later round — matches my r3 position exactly, no drift.
2. **Admin (N1):** reopen durability if `verifiedFixes` ships without its
   provenance line — recorded correctly, not mine to confirm further.

No correction needed to either entry.

## 3. Objection status

**NOT CONVERGED.** One residual objection: B3's four-field gate is gameable
by the shipped "Smart Fix All" bulk button via the same public-deterministic-
formula pattern that killed the grade gate, concretely for `name` (always)
and `phone` (for any family whose area code has drifted from current zip).
Recommend: gate credit on the saved value diverging from the fixer function's
output, or stop citing "no derivable correct value" as B3's safety argument.

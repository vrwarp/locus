# Area B — Gamification — Round 4 (children's ministry)

## 1. B3's unified classifier vs. the bulk-path hole (`App.tsx:496-510`)

Traced live. `handleSaveStudentBulk`'s inline chain (`:496-500`) branches only
on `name`/`phone`/`email`/`address`; there is no `grade` or `birthdate` check
in that block at all, so a bulk-only grade or birthdate edit falls through to
the `actionType = 'general'` default set at `:496` — and `general` is, by the
proposal's own §1.2 admission, the *most* permissive branch (no gate exists
for it). That is exactly the shape of my original veto: my zero-weight ruling
on birthdate is enforceable only if a birthdate edit is ever classified as
`birthdate` in the first place. Through Review Mode's bulk-fix control
(`ReviewMode.tsx:166-170`), which admin correctly names the realistic primary
path for an August grade/birthdate sweep, the pre-B3 code silently gives full
unconditional credit for exactly the edits both domain vetoes zeroed out.

B3(d)'s `deriveActionType` helper, called from both `handleSaveStudent`
(`:565-577`) and `handleSaveStudentBulk` (`:496-500`), replacing both inline
chains, closes it: bulk edits are now named `grade`/`birthdate` correctly, and
B3(b)'s early branch (`gamification.ts:149-173`) then zero-weights them —
`lastActiveDate`/`fixHistory` only, no counters. Unification plus
zero-weighting together close the hole; unification alone would not (a
correctly-named `general` fallback still needs `general` to score nothing,
which §1.2 also states). Confirmed: this closes the bulk-path gap that made
my birthdate veto unimplementable outside the single-record modal.

## 2. Ghost archival gamification strip — domain veto status

Youth's r1 objection (`r1-youth.md:44-51,182-200`) — that confetti firing on
`handleArchiveGhosts` (`App.tsx:316-324` era) turns archival of a student's
PCO record into an unearned celebration — was upheld unattacked in r2
(`r2-youth.md:110`: "Ghost-clear confetti — upheld in B4, not dropped. No
objection there.") and independently verified by admin the same round
(`r2-church-admin.md:27-28`). Proposal v2 records it as satisfied by deletion
rather than by a narrower fix (`proposal-v2.md:207`), and v3's B4 (§2, this
round CONVERGED 4/4) deletes `Confetti`/`BadgeToast` wholesale, including the
`handleArchiveGhosts` trigger (`:321-322`) — so the strip is total, not
conditional. This is youth's domain veto on tone, not mine, but I verified it
independently in r1 (NOT MY LANE on tone, no safety objection) and have no
basis to reopen it now. It is correctly recorded as settled and outside
Area B's remaining scope.

## 3. Verdict

CONVERGED — NO RESIDUAL OBJECTIONS.

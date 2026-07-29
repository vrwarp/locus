# Area B — Gamification — Round 4 (UXR)

## 1. B3(e) defect verification

Confirmed by direct read of `src/App.tsx` and `src/utils/storage.ts`/`crypto.ts`.
`grep -n "saveGamificationState(" src/App.tsx` returns six call sites, split
exactly as stated: **`auth` at :476, :485, :510** (bounty add, bounty delete,
bulk save); **`appId` at :324, :592, :631** (ghost archive, single-record save,
undo). Proposal's "three sites, not one" is correct.

Consequence confirmed and, if anything, understated: `saveGamificationState`
(`storage.ts:191-197`) calls `encryptData(state, appId)` under AES-GCM with a
key derived via PBKDF2 from the second argument; `loadGamificationState`
(`storage.ts:155-158`) decrypts with `appId`. A GCM decrypt under the wrong
password fails the auth-tag check and throws — confirmed in `crypto.ts`. The
inner `catch` in `loadGamificationState` (`storage.ts:161-170`) then attempts
`JSON.parse` on what is base64 ciphertext, which also throws, and the bare
`catch { return getDefaultGamificationState() }` fires. This path logs
**nothing** — not even the `console.error` the proposal's own text implies —
so the reset is stealthier than described, not less real. `:476`/`:485` are
moot (B2 deletes the bounty handlers outright); `:510` is the one live site
requiring the `appId` fix. Verdict: defect and scope are accurate.

## 2. Objection

CONVERGED — NO RESIDUAL OBJECTIONS. Spot-checked B8 (`ContributionGraph.tsx:67`
streak copy) and B9 (`pco.ts:365-373` sandbox header vs. live PATCH/POST,
`mock-api/` empty) claims as well; both hold as stated.

## 3. Riskiest assumption for a real user

Not a defect, but the proposal's own conditional-reopen list (§3) names it:
cutting Bounty Board, Campus Cup, and Achievement Case removes every social/
team acknowledgment mechanic, leaving a volunteer with only a personal widget
and a look-back graph. That the widget+graph pair is "enough" to sustain a
Tuesday-night volunteer team's motivation is asserted, not observed. Worth a
real check with actual youth/children's volunteers a few weeks after B1/B2/B4/
B6 ship — before the next feature is built on top of this reduced surface.

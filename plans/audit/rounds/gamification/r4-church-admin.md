# Round 4 — church-admin — Area B (gamification)

**Verified, three sites not one.** `grep` on `saveGamificationState(` in
`src/App.tsx` confirms: `:476` and `:485` (bounty handlers, deleted by B2
anyway) and `:510` (`handleSaveStudentBulk`, survives) pass `auth` — where
`auth = btoa(\`${appId}:${secret}\`)` (`:489`), a different string than
`appId`. `:324`, `:592`, `:631` correctly pass `appId`. `storage.ts:191`
confirms `saveGamificationState`'s second arg is the encryption passphrase
(`encryptData(state, appId)`); `loadGamificationState` (`:155-163`) decrypts
with `appId` only. Consequence as claimed: a bulk save (Review Mode's actual
grade-promotion path) re-encrypts `GAMIFICATION_KEY` under `auth`; next load's
`decryptData(stored, appId)` throws, the `JSON.parse` fallback fails on
ciphertext, `getDefaultGamificationState()` returns — silently zeroing
`totalFixes`, `fixHistory`, and the Contribution Graph's history. No error
surfaces to the user; the catch only logs.

**Why 93 test files missed it.** `storage.ts` is mocked wholesale
(`vi.fn().mockResolvedValue(undefined)`) in `App.test.tsx`,
`App.ghost.integration.test.tsx`, `App.undo.integration.test.tsx` — no test
runs the real encrypt/decrypt round-trip. The one assertion that checks a
`saveGamificationState` call's second argument, `App.test.tsx:1054`, targets
the single-record save (`:592`, correct `appId`), not the bulk path.
`ReviewMode.test.tsx` stubs `onSaveBulk` itself and never reaches `App.tsx`'s
implementation. This is the standard failure mode for silent-corruption bugs:
mocking the boundary that would have caught it, and asserting call args on
the one call site that happens to be right. It is a coverage-shape problem,
not a rare edge case — bulk-save is Review Mode's primary control, per the
proposal's own note that `ReviewMode.tsx:166-170` calls it at volume.

**Objections: none survive.** CONVERGED — NO RESIDUAL OBJECTIONS.

**My one reopen condition, confirmed still unbreached.** I said I'd reopen
durability only if `verifiedFixes` ships without its provenance line. N1 in
§4 gates `verifiedFixes` on B3(d) and B9.1 explicitly and is not yet shipped;
N1b's tooltip text is specified alongside it in every mention. No surface in
v3 shows `verifiedFixes` unaccompanied. Condition not triggered — I am not
reopening.

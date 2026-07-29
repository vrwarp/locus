# Area A — core-hygiene — Round 1 UXR Critique

Persona grounding: Sarah (admin) does this work in scheduled cleanup sessions;
Emily (volunteer) does it in short unsupervised shifts, e.g. "Tuesday night,
20 minutes, alone." Both are working against **real PCO data** — every write
in this area (except Sandbox Mode) lands on production records.

---

## 1. Dashboard — `src/components/Dashboard.tsx`

**Verdict: SIMPLIFY**

**Evidence:**
- `Dashboard.tsx:49` `stats.score` comes from `calculateHealthStats` (`src/utils/analytics.ts:10-41`), which returns `score: 0` when `total === 0` (`analytics.ts:12-18`).
- `Dashboard.tsx:82` renders `stats.score > 50 ? 'Needs Attention' : 'Critical'` — a `total===0` roster therefore displays **"Critical"** in red-flavored styling.
- `Dashboard.tsx:92-106` Burnout Risk and Recruitment Pool cards show `'...'` while `loadingStats` is true, but there is no distinct "no check-in data available" state if `checkIns`/`events` come back empty for a reason other than loading (e.g., a church with Check-Ins module disabled) — `burnoutCandidates`/`recruitmentCandidates` silently render `0`, indistinguishable from "genuinely healthy."
- `Dashboard.tsx:130` "Active Population" insight is the only item guaranteed to render; the three conditional insights (`burnoutCandidates.length > 0`, etc.) can all be absent, leaving a mostly-empty "Insights" panel with no message explaining why.

**Top defects:**
1. First-run/empty-roster church opens Locus for the first time, syncs 0 or a handful of records, and the top-left tile screams "Critical" — this is a false alarm before the tool has even seen enough data to judge, and it undermines trust on the very first screen. (Emily's first session.)
2. No visual distinction between "0 burnout risk because things are fine" and "0 burnout risk because Check-Ins data hasn't loaded / doesn't exist for this org." Sarah cannot tell a real green light from a data-absence null.

**Cheapest fix:** Gate the Health Score card on `total >= some minimum (e.g. 10)` and render a neutral "Not enough data yet" state instead of a numeric score below that floor. Add an explicit zero-state message to the Insights panel instead of letting it silently shrink to one line.

**Open question:** Watch a brand-new tenant's first dashboard load with a small (<20 person) People database — does the "Critical" framing produce a support ticket or a shrug?

---

## 2. Data Health (Diagonal of Truth scatter, Load More) — `src/components/GradeScatter.tsx`, `src/utils/grader.ts`

**Verdict: SIMPLIFY**

**Evidence:**
- `GradeScatter.tsx:138-141` the chart is hard-coded to `width={800} height={600}` — not responsive, no container query, no `ResponsiveContainer`. On a narrower viewport (a volunteer laptop, a tablet checked out for cleanup night) the chart either overflows or gets clipped; the surrounding `view-container` (`App.tsx:771`) has no `overflow-x` handling visible.
- `GradeScatter.tsx:120-134` default (non-colorblind) encoding is color-only: anomalies are `var(--anomaly-color)` dots, safe records `var(--safe-color)` dots, same shape, same size. Colorblind Mode (`ConfigModal.tsx:118-130`) exists but is **off by default** — the accessible encoding is opt-in, not the baseline.
- `GradeScatter.tsx:110,127` every point gets `tabIndex={0}` — a church with a few hundred kids means a few hundred stops in the tab order with no "skip" affordance and no virtualization; this is a keyboard trap in practice even though each point is individually reachable in principle.
- `App.tsx:792-797` scatter is fed `students.filter(s => s.pcoGrade !== null)` — students without a recorded grade are silently excluded from the entire Data Health view. There's no count/indicator telling Sarah "N students have no grade on file and are not shown here," which is itself a data-quality fact this tool exists to surface.
- The reference line is labeled "Diagonal of Truth" (`GradeScatter.tsx:200-206`) — a fun name for an axis, but combined with "Ghost Protocol," "Golden Record," etc., the whimsical vocabulary is layered directly onto the one screen that is supposed to read as authoritative data QA, not a game (see #6 Trust).

**Top defects:**
1. Sarah opens Data Health on a Sunday-school roster of ~600 kids on a shared office laptop with a 1366×768 or smaller browser window; the chart is wider than the viewport and either the page scrolls sideways or content is clipped — first impression of the tool's flagship screen is "broken layout."
2. A screen-reader or keyboard-only user attempting to review anomalies via Tab must step through every single student point in DOM order before reaching "Load More" — there is no way to jump straight to anomalies only.
3. Records with no `pcoGrade` vanish from the chart with zero explanation, so "0 anomalies visible" can mean "genuinely clean" or "half the roster isn't graded and we're not telling you."

**Cheapest fix:** Wrap in Recharts' `ResponsiveContainer`; make Colorblind Mode's shape differentiation the default encoding (color as reinforcement, not sole channel); add a one-line "N students excluded (no grade on file)" caption above the chart.

**Open question:** Time an admin's actual anomaly-review pass using only keyboard — how many Tab presses to reach the first flagged point on a realistic roster size?

---

## 3. Smart Fix Modal — `src/components/SmartFixModal.tsx`

**Verdict: MERGE**

**Evidence:**
- `SmartFixModal.tsx` is single-record, single-anomaly-type (grade/birthdate only) and is functionally a strict subset of Review Mode (`ReviewMode.tsx`), which handles grade, birthdate, name, email, address, and phone for the same student, plus "Fix All."
- Both compute the identical `newDelta = expectedGrade - targetGrade` fix-grade logic (`SmartFixModal.tsx:36-37` vs `ReviewMode.tsx:179-180`) — duplicated business logic maintained in two places.
- `SmartFixModal.tsx:66-68` dead code: a commented-out `isMatch` block left in the shipped file.

**Top defects:**
1. Two different UIs exist for "fix this one student's grade," reachable from different entry points (point-click on the scatter → SmartFixModal; "Review Mode" button → ReviewMode). A returning user who learned one workflow gets a different, narrower one when they click a scatter point directly, creating an inconsistent mental model of "what can I fix from here."
2. Grade-only/birthdate-only scope means clicking a point for a student who *also* has a name or phone anomaly shows nothing about it — the user has to separately discover Review Mode to see the full anomaly picture for that same person.

**Cheapest fix:** Delete `SmartFixModal` and route scatter point-clicks into a single-student instance of the Review Mode fixer (it already supports all six fix types); keeps one code path, one set of delta-calculation logic, one set of tests to maintain.

**Open question:** Does anyone actually use point-click Smart Fix over Review Mode in practice, or has Review Mode fully superseded it already?

---

## 4. Review Mode + Speed Run + Zen Mode — `src/components/ReviewMode.tsx`, `src/utils/audio.ts`

**Verdict: SIMPLIFY**

**Evidence:**
- `ReviewMode.tsx:496-501` "Smart Fix All" is available on the very first card of a Review Mode session and silently bulk-writes every student with `hasNameAnomaly`/`hasEmailAnomaly`/`hasAddressAnomaly`/`hasPhoneAnomaly` across the *entire* `students` array passed in (not just the current filtered anomaly set necessarily — depends on caller), applying `fixEmail`/`fixAddress`/`fixPhone`/`fixName` (`src/utils/hygiene.ts`) with **no per-field preview or confirm** before `onSaveBulk` fires.
- `hygiene.ts:74-100` `fixEmail`'s domain auto-correction does fuzzy (Levenshtein) matching against a fixed list of consumer providers (gmail.com, yahoo.com, etc.) and silently rewrites the domain when `distance <= 1` (short domains) or `<=2` (longer). A legitimate but uncommon domain (a small business or personal domain that happens to be 1-2 edits from `aol.com`/`msn.com`/etc.) can be silently "corrected" to the wrong address with no diff shown to the user before the bulk write goes to real PCO data.
- Three overlapping modes (`isSpeedRun`, `zenMode`, plain Review Mode) are three different framings of the identical fix workflow (`ReviewMode.tsx:25`), each with its own header/timer/audio state, tripling the states a new user has to learn for one task.
- Speed Run's 60-second countdown (`ReviewMode.tsx:60-76`) actively pressures the user to click through anomaly fixes fast, right next to "Smart Fix All," which is the exact combination (time pressure + irreversible bulk write to real records) most likely to produce a mis-click a volunteer doesn't notice until later.

**Top defects:**
1. Emily, mid Speed-Run, hits "Smart Fix All" to rack up points; a handful of the "auto-corrected" emails are actually valid uncommon domains that got silently mangled by the Levenshtein fuzzy-match, and the change is already written to PCO by the time anyone notices (bulk fixes bypass the 5-second undo toast used elsewhere — see #9).
2. Three near-identical review UIs (normal / speed run / zen) is IA bloat for what is fundamentally one task ("go through anomalies one at a time"); the gamified variants belong conceptually in Area B, not layered into the core hygiene workflow's only entry point.

**Cheapest fix:** Give "Smart Fix All" a pre-commit diff/preview list (even a simple "N names, M emails, K phones, J addresses will change — review" summary) before it writes. Fold Speed Run/Zen Mode into a single "session style" toggle rather than three code-branching modes inside one component.

**Open question:** In a moderated session, does a volunteer ever catch an incorrect auto-fix from "Smart Fix All" before or after it saves? What fraction of `fixEmail` corrections are actually right on real church rosters?

---

## 5. Duplicate Detective — `src/components/DuplicatesReport.tsx`, `src/utils/duplicates.ts`

**Verdict: KEEP**

**Evidence:**
- `DuplicatesReport.tsx:34-43` has a real, well-written empty state ("Your database is sparkling clean.").
- The feature deliberately does **not** attempt an automated merge — it links out to PCO's own merge tool and gives step-by-step instructions (`DuplicatesReport.tsx:85-113`). That's the right call given Locus has no merge API and merging is destructive; this avoids Locus becoming the thing that corrupts records to fix records.
- Fuzzy address-based matching (`duplicates.ts:97-168`) has a thoughtful anti-false-positive guard for siblings with short, dissimilar first names at the same address (`duplicates.ts:135-149`), and the UI correctly labels which criterion matched (`DuplicatesReport.tsx:61`, `criteria` field) — this is not silently guessing.

**Top defects:**
1. Minor: `handleExport` (`DuplicatesReport.tsx:20-32`) exports flat CSV rows per person but drops the matched criterion's actual key (e.g., which email/phone matched) — an admin doing a bulk review offline can't sort/verify without reopening the app.
2. No count or affordance for the case where a group has >2 members bunched under one card — this can get visually dense with no internal scroll cap (untested at N>5 group size).

**Cheapest fix:** Add the specific matched value (the shared email/phone/address string) as its own CSV column.

**Open question:** Real household sizes with 3+ same-address, similarly-named people (blended families, multi-generation households) — does the merge-instructions panel still read clearly when three or more "View in PCO" links are stacked?

---

## 6. Ghost Protocol — `src/components/GhostModal.tsx`, `src/utils/ghost.ts`

**Verdict: SIMPLIFY (safety-critical)**

**Evidence:**
- `ghost.ts:12-16` **any student with no `lastCheckInAt` at all is unconditionally a ghost**, with no minimum tenure/age check — a brand-new visitor entered into PCO last week who hasn't yet checked in reads identically to someone gone for years.
- `ghost.ts:22-26` — the code's own comment admits the small-group "rescue" signal that was meant to protect active-but-non-attending community members **can never fire**, because it depended on PCO Groups, which this church doesn't use (per the audit's standing context) and the count is always zero. The heuristic silently degraded to "checked in recently, yes or no" and nobody re-verified the false-positive rate after that regression.
- `GhostModal.tsx:31-33` tells the user the criteria is **"Inactive > 24m AND No Groups"** — text that is simply false today; there is no group check happening, so this is misleading the admin about what's about to be archived (Trust violation — the UI states a criterion that isn't real).
- `GhostModal.tsx:68-74` + `App.tsx:300-336` "Archive All" is a single all-or-nothing button (no per-record select/deselect in the modal — `students.slice(0,10)` is even display-truncated, so on a >10-ghost batch the admin cannot see or exclude the 11th+ record before archiving all of them) that calls `archivePerson` (`pco.ts:421-423`, sets PCO `status: 'inactive'`) in a loop against **live production data**.
- Critically: this bulk write path does **not** go through `commandManagerRef`/`UpdateStudentCommand` the way single-record edits do (compare `App.tsx:352-365` for edits vs `App.tsx:300-336` for archiving) — it is **not covered by Undo/Redo at all**. The only recovery after an accidental "Archive All" is manually reactivating each person back in PCO by hand.
- `GhostModal.tsx:44,60-66` the "Analyze Deeply" button fetches real check-in counts to annotate the list, but `isGhost()` never consumes `checkInCount` — analyzing does not change who is or isn't archived, so a user could reasonably believe they've "reviewed" ghosts more rigorously by clicking Analyze when the archive set is unaffected either way.

**Top defects:**
1. Sarah runs Ghost Protocol on a list where several "ghosts" are actually people added in the last month who simply haven't attended yet; she clicks "Archive All" because the modal told her the bar was "24 months inactive AND no groups" (sounds conservative); in reality it's "no check-in ever, no floor," and the write is irreversible in-app. This is the single highest-risk workflow in Area A.
2. The displayed criteria text and the actual filter logic have diverged and nobody updated the copy — this is a credibility problem for the whole hygiene product, not just this feature: if the stated rule for a destructive action is wrong here, why should Sarah trust the stated rule anywhere else?
3. No selection UI + list truncated at 10 entries means "Archive All" can silently include people the admin never saw the name of.

**Cheapest fix (do all, they're small):**
- Fix the modal copy to match reality, or restore an actual secondary signal (e.g., a "joined < N months ago" exemption) so the copy can stay true.
- Route `archivePerson` calls through the same `Command`/undo infrastructure single-record edits already use — at minimum, hold archives behind the same 5-second undo toast pattern, scaled to a batch.
- Add checkboxes so any individual record can be excluded before archiving, and remove the `.slice(0, 10)` display cap (or paginate, but don't archive what wasn't shown).

**Open question:** What is the actual false-positive rate of "never checked in" as a ghost signal on a real congregation roster (adults who don't use Check-Ins, staff records, recently-added visitors)?

---

## 7. Family Audit — `src/components/FamilyModal.tsx`, `src/utils/family.ts`

**Verdict: SIMPLIFY**

**Evidence:**
- `family.ts:149-158` a parent/child age gap under 15 years is flagged as a "Warning" ("Small age gap") — but young parents (16-30 having a child, common in many congregations) will trip this on every single family, generating routine noise flagged the same way as the genuinely useful "child older than parent" Critical case.
- `FamilyModal.tsx:33-44` only the "Swap Roles" `fixType` gets an actionable button; **spouse age-gap issues and split-household issues render as read-only text with no path to act on them** other than closing the modal (`FamilyModal.tsx:55-59`) — the audit surfaces problems it can't help resolve for two of its three issue types.
- `family.ts:78-83` `checkSplitHouseholds` derives a display family name via `hMembers.find(m => !m.isChild)` — if a household has no adult on file (e.g. data entry error where everyone is marked `isChild`), `familyNames` falls back to `hMembers[0]?.lastName || 'Unknown'`, which can silently produce a card titled "Unknown Family" with no way to know which household that actually is without cross-referencing IDs elsewhere.

**Top defects:**
1. A congregation with several young parents will see the Family Audit dominated by "Small age gap" Warnings that are not data errors at all — this is the kind of over-flagging that trains users to stop reading the list ("it's always noisy, ignore it"), which defeats the one Critical signal (parent/child swapped) that's actually worth acting on.
2. Split-household and spouse-age-gap findings are dead-ends: the admin learns "these two households might be one family" but has to leave Locus and go manually reconcile in PCO with no linkage back — the modal doesn't even deep-link to the household records the way Duplicate Detective links to PCO profiles.

**Cheapest fix:** Raise or make configurable the "small age gap" threshold (or drop it to Info-severity, visually distinct from Critical), and add "View in PCO" links to every issue type, matching the pattern Duplicate Detective already established.

**Open question:** On a real roster, what fraction of Family Audit line items are the young-parent false-positive vs. genuine data-entry issues? If it's mostly the former, this feature's signal-to-noise is currently inverted.

---

## 8. Golden Record — `src/components/GoldenRecordModal.tsx`

**Verdict: CUT**

**Evidence:**
- `App.tsx:91` `isGoldenRecordOpen` state exists and the modal is mounted (`App.tsx:1032-1035`), but **`setIsGoldenRecordOpen(true)` is never called anywhere in the codebase** — confirmed by a full-repo search. There is no trigger. The component, its CSS, and its dedicated test (`GoldenRecordModal.test.tsx`) are all unreachable from the running app.
- The achievement it's meant to celebrate already exists and already fires independently: `gamification.ts:55-59` defines `the-golden-record` badge (`totalFixes >= 10000`), which surfaces through the ordinary `BadgeToast`/confetti path (`App.tsx` badge-unlock handling used by every other achievement). So even if wired up, this would be a *second*, redundant celebration for an event the app already celebrates once.

**Top defects:**
1. Dead feature: engineering effort (component + CSS + test) sits in the tree with zero user-facing effect — it cannot be observed, so it cannot currently be "wrong" in front of a user, but it's inventory the team is tracking and testing for nothing.

**Cheapest fix:** Delete `GoldenRecordModal.tsx`, `GoldenRecordModal.css`, `GoldenRecordModal.test.tsx`, and its three references in `App.tsx`. If the intent was a bigger celebratory moment than the standard badge toast at the 10,000-fix milestone specifically, wire it in — but as shipped, it's cut cost with no offsetting benefit.

**Open question:** None — this is a straightforward dead-code finding, not a UX judgment call.

---

## 9. Undo / Redo + Undo toast — `src/components/UndoRedoControls.tsx`, `src/components/UndoToast.tsx`

**Verdict: SIMPLIFY**

**Evidence:**
- There are **two independent, differently-scoped "undo" systems** live at once:
  - A 5-second auto-commit debounce with its own toast (`App.tsx:590-635`, `pendingUpdateRef`/`handleUndo`) — a fix isn't written to PCO for 5 seconds, during which a literal "Undo" button (`UndoToast.tsx`) reverts the local cache; if the user makes a second edit before the 5s elapses, the first is flushed immediately (`App.tsx:546-558`) and the toast disappears without the user necessarily having seen it resolve.
  - A persistent `commandManagerRef` history stack with header buttons (`UndoRedoControls.tsx`, `App.tsx:637-647`) that undoes *already-committed* PCO writes via inverse commands.
  - These are two different mental models ("catch my mistake in the next 5 seconds" vs. "undo committed history whenever") sharing the word "Undo" with no shared visual language — the toast's Undo button and the header's ↩️ Undo button do different things at different times and a user has no way to know, in the moment, which one currently applies to their last action.
- `UndoRedoControls.tsx:17,27` keyboard hints "Ctrl+Z"/"Ctrl+Y" are shown in `title` tooltips, but there is no evidence (no keydown listener found near these controls) that the shortcuts are actually bound — a hint for a shortcut that may not exist is worse than no hint, because it invites a failed attempt.
- Ghost Protocol's bulk archive (see #6) and, more importantly, none of Review Mode's "Smart Fix All" bulk saves pass through the 5-second toast/undo path the single-record flow uses — bulk operations are the ones most likely to need undo and are exactly the ones missing it.

**Top defects:**
1. A user who fixes one record, notices a mistake, and reaches for "Undo" doesn't know whether the 5-second toast is still live or whether they now need the header button — depending on timing, the "right" undo affordance has silently switched underneath them.
2. Bulk operations (the highest-blast-radius actions in the whole app) are the ones excluded from both undo mechanisms.

**Cheapest fix:** Collapse to one system — extend the command-history undo/redo to cover every write path (including bulk fixes and ghost archiving) and drop the separate 5-second-toast debounce, or clearly time-box and visually unify the two so only one "Undo" affordance is ever showing at a time. Verify or remove the Ctrl+Z/Ctrl+Y tooltip claims.

**Open question:** Does removing the 5-second debounce (and just committing + relying on command-history undo) change perceived responsiveness in a noticeable way? Worth a quick timing comparison before deciding which system to keep.

---

## 10. Settings / Config — `src/components/ConfigModal.tsx`

**Verdict: SIMPLIFY**

**Evidence:**
- One flat, unsectioned list mixes a business-logic setting that changes grading accuracy for the whole roster (Grade Cutoff Date, `ConfigModal.tsx:78-102`) with pure novelty toggles (Party Mode confetti + confetti-theme picker, `ConfigModal.tsx:174-203`; Zen Mode ambient audio theme, `ConfigModal.tsx:205-233`) and a completely non-functional control: **"Spotify Integration"** (`ConfigModal.tsx:104-116`) is stored in `AppConfig.enableSpotify` (`storage.ts:23`) but — confirmed by repo-wide search — **is never read or acted on anywhere else in the codebase.** Turning it on does nothing. The label promises "Play a worship playlist while cleaning data" and delivers silence.
- Sandbox Mode ("Changes will not be saved to PCO," `ConfigModal.tsx:150-158`) — arguably the single most consequential toggle in the app, since it's the only thing standing between a session and live writes — gets the exact same visual weight (one plain checkbox + one line of grey helper text) as Party Mode.
- No grouping/headers at all: a user scanning for "how do I make sure this test session doesn't touch real data" has to read through Grade Cutoff, Spotify, Colorblind, High Contrast, and only then reach Sandbox Mode, sixth item down, indistinguishable in styling from the fun toggles around it.

**Top defects:**
1. A checkbox that visibly claims to do something ("Spotify Integration… play a worship playlist") and silently does nothing is a direct hit to the trust principle this persona cares about most — once a user notices one setting is fake, every other number and toggle in the app becomes suspect by association.
2. Sandbox Mode — the safety switch — is one undifferentiated checkbox among ten, several of which are jokes (Party Mode, confetti themes). A time-pressured admin skimming Settings before a bulk cleanup session is one misread away from thinking they're in Sandbox when they're not, or vice-versa.

**Cheapest fix:** Either implement `enableSpotify` or delete it from the UI entirely — do not ship a labeled control with no effect. Split the modal into "Data & Grading" / "Accessibility" / "Safety" (Sandbox Mode gets its own visually distinct, top-of-modal placement, maybe a colored banner state like the one already used at `App.tsx:681-696`) / "Fun" sections.

**Open question:** Has any user ever reported "Spotify Integration doesn't work"? If nobody's noticed yet, that itself says the setting is essentially undiscoverable in its current position — which is its own argument for either removing it or making Settings navigable enough that people actually find and use what's there.

---

## 11. Address / phone / email hygiene utilities — `src/utils/hygiene.ts`, `src/utils/zipCodes.ts`, `src/utils/areaCodes.ts`

**Verdict: SIMPLIFY**

**Evidence:**
- `hygiene.ts:18-26` `fixName` lowercases the entire name then capitalizes only the first letter of each space-separated word. This mis-handles common real name patterns: `McDonald` → `Mcdonald`, `O'Brien` → `O'brien`, `DeLaCruz`-style surnames, hyphenated names (`Smith-Jones` has no internal space so survives, but `Mary-jane` after a space-based fix would still break the inner segment), and suffixes like `III`/`IV` get needlessly lowercased-then-titled to `Iii`/`Iv`. This runs both interactively (Review Mode "Fix Name") and automatically inside "Smart Fix All" (`ReviewMode.tsx:131-137`) — i.e., it can silently rewrite a correctly-formatted name into an incorrect one and commit it.
- `hygiene.ts:74-100` `fixEmail`'s Levenshtein-based domain correction (detailed under #4) is a second silent-rewrite risk from the same file.
- `zipCodes.ts:9-42` the synchronous ZIP-prefix-to-city/state table used for live-typing autofill (`ReviewMode.tsx:437-447`) covers only ~31 major-metro 3-digit prefixes out of roughly 900 possible — any church outside a top-30 metro gets no autofill assist from the fast path at all (silently returns `null`, no "not found" messaging), and only gets real data once 5 full digits are typed and the async `zippopotam.us` call resolves (`zipCodes.ts:50-70`).
- `ReviewMode.tsx:448-457` — when the async zip lookup resolves, it **unconditionally overwrites** whatever city/state the user already typed or the sync map already filled in, even if the user intentionally entered something different (e.g., a PO-box city that differs from the ZIP's primary city).
- `areaCodes.ts` (a genuinely large, real NANP prefix table) is comparatively well-built and is the strongest piece of this group.

**Top defects:**
1. `fixName` corrupts a meaningful minority of real names (Irish/Scottish "Mc/O'" surnames, multi-part surnames, generational suffixes) and is invoked both on single "Fix Name" clicks and inside the unreviewed "Smart Fix All" bulk path — this is a case where the hygiene tool actively de-hygienes correctly-formatted data.
2. Silent unconditional overwrite of user-entered city/state the moment a 5-digit ZIP resolves removes agency from a volunteer who just typed something specific on purpose.

**Cheapest fix:** Add a small denylist of case patterns `fixName` should leave alone (`Mc`, `Mac`, `O'`, all-caps roman-numeral suffixes), or simply don't run `fixName` automatically inside bulk paths — reserve it for the single-record, user-reviewed flow where the "Current → Suggested" comparison is visible before commit. Make the async ZIP autofill only fill blank fields, never overwrite non-empty ones.

**Open question:** Pull a sample of real church rosters (if available) and run `fixName`/`fixEmail` over them to get an actual false-positive rewrite rate — that number would settle whether this is a minor edge case or a systemic quality problem.

---

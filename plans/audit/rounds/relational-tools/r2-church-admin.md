# Area F — Relational Tools — Round 2 Critique (church-admin)

Adversarial pass on `plans/audit/rounds/relational-tools/proposal-v1.md`. Not
restating round 1. Verified against source before ruling.

---

## 1. Ruling on the inert Sandbox Mode — this is not an Area F finding, it is an audit-wide retraction

Both defects confirmed independently:

* `pco.ts:365-373` — `updatePerson` sets `X-Locus-Sandbox: true` on the header
  object and then falls straight through to the same `api.patch` call used
  when sandbox is off. `archivePerson` (`pco.ts:421-423`) calls `updatePerson`
  and inherits the same non-behavior. `grep -rni sandbox mock-api/` — zero
  matches, confirmed. The banner at `App.tsx:681-695` reads "SANDBOX MODE
  ACTIVE — Changes are simulated." That sentence is false on every build
  since this shipped.
* `storage.ts:67-80` (`loadConfig`), `:104-113` (`loadHealthHistory`), and
  `:162-170` (`loadGamificationState`) all catch a decrypt failure and fall
  back to `JSON.parse(stored)`, returning it as trusted state with no
  integrity check. Confirmed — proposal's §1.5 is right. This is worse than
  the KDF bug: fixing `appId`→`secret` (F6) does nothing against a machine
  where someone with localStorage write access — a browser extension, a
  shared profile, a support tech "helping" — replaces the blob with plaintext
  JSON the app will happily load as the user's real config, health history,
  or gamification state.

**My ruling, as the person who signs off on whether this goes near a real
org:** an inert *safety control* is categorically worse than mock data
presented as insight, which is this audit's other standing sin. Mock data
misleads about the world; a fake safety switch misleads about what the tool
itself will do to a stranger's PCO record when the operator has explicitly
asked it not to. It fails exactly the population most likely to need it —
new volunteers, and every reviewer across this audit who cited Sandbox as
the backstop. I went back and checked: `r1-children.md:236-239` and
`:399-420` in **core-hygiene**, `r1-church-admin.md:102,110,135,305,318,325`
in **core-hygiene** (my own round 1, different area — I flagged the checkbox
as under-weighted, not as broken), `r1-uxr.md:200-207` in core-hygiene, and
`r1-youth.md:367-370,442` in core-hygiene all treat Sandbox as a functioning
mitigation whose only flaw is defaulting off or being visually buried. None
of them — including me — checked whether flipping it does anything. It
doesn't. Every one of those findings needs a note appended: *the mitigation
they assume exists does not exist.* This is not a repair I can rule
sufficient by reading Area F's fix in isolation — I am flagging it upward:
**every write-path finding across all six areas that treated "the volunteer
could have used Sandbox Mode" as a mitigating factor is void until F3 lands**,
and F3 must be the client-side short-circuit (proposal's preferred option),
not the delete option — deleting it removes the illusion of safety but also
removes the one thing a trained admin could actually reach for before a bulk
session with a new volunteer. Delete-only is the wrong fallback; if the
short-circuit can't ship this cycle, the banner and checkbox must be pulled
immediately (mislabeled control off the shelf) while the real thing is built.

---

## 2. Is deleting Locus Public sufficient? No — and the proposal knows it, which is why it's still an open question

F2's claim — "the read-only claim becomes true by construction" — is true
today and fragile by the proposal's own admission in Q3: the role gate lives
on three modals (`App.tsx:1010`), not on the `currentView` switch
(`App.tsx:755-1005`) itself, and not on the mutation functions
(`handleSaveStudent`, `executeCommit`, `updatePerson`, `archivePerson`)
themselves. "True by construction" that depends on nobody wiring a save
button into `SidebarIntelligence.tsx` next sprint is not a permission
boundary, it's a tidy accident. I will not sign off on marketing "read-only"
(Idea 3) on that foundation, and I would not deploy this at a real church on
it either.

What I'd require before deployment, in order of what's actually achievable
this cycle:

1. **Minimum, ship this round:** a hard guard *inside* `handleSaveStudent` /
   `executeCommit` / anywhere `updatePerson`/`archivePerson` is called —
   `if (userRole !== 'core') throw` — independent of which component called
   it. This is a ~1 hour change and it is the difference between "no button
   happens to be mounted" and "the write path itself refuses." The proposal
   should have put this in F2, not left it as an unresolved Q3 option (b) to
   "decide later." There is no reason to defer a same-file, same-hour fix.
2. **Real boundary, not this cycle but the honest target:** separate PCO
   credentials with different scopes. This is achievable on Planning
   Center's actual permission model — PCO People supports per-user
   permission levels (Viewer / Editor / Manager) on individual user
   accounts — but Locus doesn't use per-user PCO login today; it uses one
   shared Application ID + Secret via HTTP Basic auth for the whole org
   (`App.tsx:100-103`), which is Manager-equivalent for everyone regardless
   of which Locus "role" they clicked. Getting to a real boundary means
   moving off shared App Secret Basic auth to per-user PCO OAuth, so the
   Intelligence login is a different PCO user with Viewer-only People
   permission and the write calls 403 at PCO's own API, not Locus's. That
   is a real architecture change, bigger than this round's budget, and it
   should be named as the actual target rather than implied to already
   exist by the "true by construction" phrasing.

Deleting Locus Public is necessary and correct — ACCEPT, do it first. But
calling that "sufficient" and shipping the "Reporting views only" copy
(Idea 3) before item 1 above lands is exactly the gap between marketing and
code that got #46 vetoed in the first place. Ship F2 and the one-hour guard
in the same commit, or don't ship the copy change yet.

---

## 3. Where I attack the proposal's FIX (not CUT) calls on #47/#48

**On #47 (F5):** ACCEPT the diagnosis (workspace picker, not auth), REJECT
the "re-label, do not re-architect" framing as the whole answer. A relabel
plus a logout button treats the *words* on the landing card as the risk
surface. They aren't — the risk surface is that whoever hands out the
Intelligence link today, and whoever will hand it out at the next church
that adopts this, will describe it verbally to a board member as "the safe
one," regardless of what the card says, because that's what two visually
distinct roles *signal* architecturally even with perfect copy. My
alternative: don't just relabel — either (a) collapse Core/Intelligence into
one login with a role *chosen after* a permission check the code enforces
(the Q3 hardening, done now, see §2), or (b) if the two-picker UX stays,
require the one-hour write-guard from §2 to ship in the *same PR* as the
copy change, not as a Q3 decision punted to a future round. Relabeling
without hardening is worse than saying nothing, because it converts a
question ("does clicking Intelligence actually stop me from writing?") into
a false answer people stop asking.

Also flagging: F5 answers Q4 ("who is the Intelligence persona, do they hold
a PCO token") by *not* answering it — it's listed as open in §4 but F5's
priority ordering (session boundary before purge) implicitly assumes the
answer is "yes, same shared credential," which is the worst case for urgency
on F6's purge work, not the best case. If a church hands the executive
pastor a personal, lower-scope credential (my target architecture in §2),
the purge-on-logout item drops in priority; if it's the shared App Secret
(today's reality), F6's purge is not a nice-to-have, it's the only thing
standing between "executive saw a dashboard" and "executive's laptop has the
whole congregation's PII in plaintext with no way to clear it." **Q4 should
not have been left open — the codebase already answers it**: there is
exactly one credential input in the entire app (`LandingPage.tsx` → single
auth overlay), so the shared-credential case is not a hypothetical to
resolve later, it is the only case that exists today. Rule it settled: F6's
purge work is P0, not contingent.

**On #48 (F6):** ACCEPT the KDF fix, the fallback removal, and the cache
collapse. REJECT "add a Clear local data button" as sufficient governance
for the shared-machine threat model this round was scoped against. A button
nobody is trained to click does not survive week two, let alone the
volunteer-turnover cycle I flagged in round 1. Concrete alternative: **default
the People cache to memory/sessionStorage, not IndexedDB**, and require an
explicit, once-per-device "Trust this computer" toggle (off by default) before
anything persists past a tab close. Front-desk and check-in-station machines
— the actual shared-machine case — should get zero persisted PII unless a
staffer deliberately opts that specific device in, exactly once. That is one
new toggle plus routing the existing `cache.ts`/`storage.ts` writes through a
"persisted enabled?" check — smaller than F6's own KDF-threading work — and it
removes the dependency on anyone remembering to hit "clear" at all. Add the
clear button too, for the opted-in-device case, but it should not be the
front line.

---

## 4. What the proposal dropped from round 1

* My "keep apart / keep together" pin for #45 (real pastoral constraint: a
  couple that just left a group over conflict, a leader who needs to stay
  with a co-leader) is explicitly refused in F4 ("Do not add
  grade/gender/leader-capacity/keep-apart logic here"). The reasoning in Q2
  (no `restricted_contact`/`custody` field exists, so a keep-apart list
  would be safeguarding data with nowhere honest to live) is a real argument
  I did not have in round 1 — but it answers a *different* pin than the one
  I asked for. Mine was adult small-group balancing (leader/co-leader,
  recent-conflict pairs), not the youth safeguarding case Q2 is actually
  about. That distinction got lost in the merge; F4 should not treat "no
  keep-apart logic, full stop" as settled by an argument about a different
  population.
* My round-1 point that nothing time-bounds an unattended open tab (idle
  timeout, distinct from logout) is not addressed anywhere in F5 — a logout
  button helps only if someone remembers to press it walking away from a
  front-desk machine mid-session. Not fatal on its own now that F6's
  device-trust default (§3) shrinks what's at risk from an idle tab, but it
  should be named, not silently dropped.

## 5. Concessions

* The benchmark table in §5 (GA strictly dominated at 10-60× worse accuracy,
  not just slower) is a stronger, more falsifiable version of my "genetic
  algorithm cosplay" claim — I asserted a simpler solver would be
  as-good-or-better; the proposal proved it and killed "Deep Search" as
  actively misleading, which I didn't go far enough to claim. Concede.
* Both blocking findings in §1 (inert Sandbox, plaintext-fallback
  decryption) were sitting in files I personally cited in round 1
  (`pco.ts`, `storage.ts`) and I missed both. Concede without qualification.

# Area F — Round 3 — church-admin

## 1. Q5 — "Preview mode" vs a real dry run, reconciled with Area A

Ruling: **kill the standing Sandbox toggle. Adopt Area A's shape for the
whole product** — a mandatory, non-skippable per-record before/after preview
inside every batch-write confirm dialog. F1 as scoped (make the toggle
"honest" with a client-side short-circuit) is superseded, not merely
adjusted.

Reasoning, from the office, not the code:

- A standing toggle is a **second mode a person has to remember they're in**.
  That is the exact failure that produced the inert Sandbox checkbox in the
  first place — a volunteer trusted a label and never checked whether it was
  still on. Making the toggle *work* removes the lie but keeps the cognitive
  burden: "am I in sandbox right now" is one more state to track across a
  session, on top of which of two identically-named undo buttons does what.
  I ruled the same way on this exact question in core-hygiene's r3
  (`plans/audit/rounds/core-hygiene/r3-church-admin.md:49-67`) before I saw
  this proposal raise it independently in Area F — that is not a coincidence,
  it is the same control appearing in two areas, and it should get one
  answer, not two.
- PCO's own bulk-action pattern (Lists, Workflows, mass-update) is
  preview-then-confirm at the moment of the write — "This will update 47
  people. Continue?" — never a mode you set earlier and might forget. Locus
  should match the tool staff already know, not invent a second pattern next
  to it.
- On the literal Q5 question — does the preview need to exercise PCO's own
  validation to be honest — no, and don't block shipping on it. What breaks
  trust in an office is not "PCO rejected a batch with a 422," which is
  visible and recoverable (retry, fix, resubmit). What breaks trust is a
  batch of real changes going out that nobody actually looked at before it
  fired. The per-record diff in the confirm dialog is the control that
  matters; PCO's server-side validation is a second, smaller layer on top of
  it. **Label it for what it is** — "This is what will change. Nothing has
  been sent to Planning Center yet" — and do not claim it predicts a PCO
  rejection, because it doesn't. That is honest without needing PCO's own
  validation endpoint, which for most person-write endpoints doesn't exist as
  a dry-run call anyway.
- Consequence for F1: delete the checkbox and banner (`ConfigModal.tsx:150-153`,
  `App.tsx:681-695`) entirely rather than wiring the short-circuit behind
  them. Keep the first-launch Live/PCO acknowledgement core-hygiene already
  named as the fallback — a one-time "this app writes to your production PCO
  data" notice, not a persistent mode. The actual safety work is the confirm
  dialog itself, which F1's short-circuit logic (return a synthesised
  before/after without issuing the request) becomes the diff-preview
  renderer for, not a separate mode.

## 2. KDF swap + fallback removal — required migration

Do not ship (5) and (6) from F7 in the same release without a migration step.
What's at stake for the office is not abstract: the config blob is the
Application ID and Secret Sarah had to get IT or the PCO account owner to
issue her, and the health/gamification state is the only thing making this
tool feel used rather than installed-and-abandoned. Losing either silently on
an update is the kind of thing that gets a tool uninstalled, not reported as
a bug — nobody files a ticket for "the app forgot my settings," they just
stop opening it.

Required:

1. **One-time re-key pass, attempted first.** On load, if a blob exists and
   fails to decrypt under the new `secret`-keyed KDF, attempt decrypt under
   the old `appId`-keyed KDF; on success, re-encrypt under `secret` and
   proceed. Only after that attempt fails does the fallback path run.
2. **No silent reset to defaults.** If re-key fails (no `secret` entered yet,
   or the blob is genuinely unrecoverable), the app must say so explicitly —
   "We couldn't read your saved settings and will need you to reconnect and
   your streak will restart" — and require it be seen, not swallow it into
   the same "returns defaults" path the fallback removal is trying to close
   off. A third silent safety behaviour that just happens to be a data-loss
   path instead of a plaintext-storage path is not progress.
3. **Gate the `[appId, secret]` re-key effect on both fields being
   non-empty**, per the proposal's own note on `App.tsx:143-162` — and
   specifically: the effect must not fire, read "no blob for this key,"
   and treat that as "new user" while the user is mid-way through re-typing a
   `secret` they already had. That reads to the operator as "my history is
   gone" even if the blob is sitting right there under the old key.
4. Test this against a **production-shaped blob** — real config + populated
   health history + non-zero streak — not just a fresh-install empty state.
   The empty-state path is the one this change can't break by definition.

## 3. #47/#48 as rescoped — surviving objection

Not against the shape — memory-first by default, secret never persisted, is
right, and matches what I'd ask for as the person who has to explain a data
breach to the executive pastor. Two things aren't closed:

- **The "Trust this computer" toggle has no access control and no visible
  state.** As written, anyone who gets to `ConfigModal` can flip it, and
  nothing in the UI afterward reminds them the machine is now holding
  congregation data across sessions. In a real office this toggle gets
  flipped once by whoever's fastest to click through a dialog to stop
  retyping a password, and it is exactly as likely to get flipped on the
  front-desk kiosk as on Sarah's own laptop — those two machines do not
  carry the same risk. Require: (a) a persistent, visible indicator whenever
  a device is in trusted state — not a settings-page checkbox nobody
  revisits, and (b) restrict who can enable it to `userRole === 'core'`. This
  should land with F7/F8, not be deferred as polish.
- **Memory-only `secret` protects against the machine being off; it does
  nothing for an unlocked, unattended tab**, which is the more common
  exposure in a front office that gets interrupted every four minutes. F8
  should include an idle timeout (15-30 min, matching whatever the office's
  screen-lock policy already is) that clears `secret` from memory and
  re-shows the credential prompt. This is new scope, not a blocker on
  shipping the rescoped #47/#48 — flag for the round these land in.

One non-issue I want to head off before it's raised as new: persisting
`userRole` to `localStorage` does **not** create a privilege-escalation path
by itself, because it was never a security boundary — `secret` is what makes
a PCO write succeed, and `secret` stays memory-only. A savvy user editing
`userRole` in devtools gets a UI that claims elevated access and a write that
still fails at PCO for lack of a valid credential. This is the same
shared-Basic-Auth finding Q3 already named, not a new hole from the
rescoping.

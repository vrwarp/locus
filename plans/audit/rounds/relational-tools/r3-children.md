# Area F — Round 3 — Children's Ministry

## 1. Ruling on Q5 (Preview mode vs. real dry-run)

**A local-only "Preview mode" does not meet the bar, and yes — it is the third
safety feature in this codebase that does nothing.**

My own bar from Area A: a dry run only earns trust before a batch archive if
it shows a full per-record before/after list with children called out
separately. F1's synthesized short-circuit (`pco.ts:365-421`) fails that test
on two axes, not one:

1. **It never touches PCO's validation.** A batch that would 422 in
   production — a malformed `household_id`, a stale `background_check_expires_at`,
   a guardian relationship PCO itself would reject — reads as clean success in
   "sandbox." A volunteer trusts that green light and runs it live at 9:24 on
   Sunday. That is worse than no sandbox at all, because Sandbox Mode's whole
   marketed job is to be the thing you check *before* you trust a batch touching
   real children's records.
2. **It has no per-record before/after list, and no separate call-out for
   which rows are children.** Even if F1 exercised real PCO validation, "Preview
   mode — no changes are sent" is a blanket banner, not the artifact I said I'd
   accept. It tells the operator nothing about *which* of the 40 rows in a
   household-merge or ratio-fix batch are a 4-year-old's record versus an
   adult's.

**Ruling:** rename honestly to "Preview mode — no changes are sent to Planning
Center" (F1's own suggested copy is fine, as far as it goes) — but do not let
that banner imply the batch was validated. Before any write-capable feature
that can touch a `Student` record is trusted for a real archive/bulk-update
against a live roster, it needs either (a) a genuine PCO-side dry-run/validate
call if PCO exposes one, or (b) failing that, a client-side pre-flight that
renders the actual per-record diff — old value → new value, one row per
person, with an explicit "N of these are children" count — and requires the
operator to scroll and confirm, not just see a summary count. Without one of
those two, "Preview mode" is cosmetic reassurance wearing a safety-feature
costume, same category as the two the proposal already named.

## 2. Confirmed: field minimisation belongs at the `saveToCache` boundary

Verified directly, not taking the proposal's word for it:

- `App.tsx:217-233` — `people` is typed `PcoPerson[]`, loaded via
  `loadFromCache<{ people: PcoPerson[], ... }>` and written back with
  `saveToCache(cacheKey, { people, nextUrl }, appId)` at line 233. This is the
  **raw** API response, not `Student` — the `.map(transformPerson)` that
  produces `Student` happens *after* this save, on the in-memory `people`
  array, and its output is never what's persisted.
- Second call site confirmed at `App.tsx:403` (`saveToCache(cacheKey, { people: newRaw, ... })`)
  in the load-more path — same shape, same exposure. Both threads run through
  the one `saveToCache` function in `cache.ts`, which is the correct — and only
  — choke point to fix once.
- `pco.ts:42` `PcoPerson` interface and the destructure at `pco.ts:231` confirm
  the fields present on every cached record.

**Fields that must never be written to disk**, read directly off the raw
object at that boundary:

- `addresses` (`pco.ts:25`) — a physical location tied to a named child.
- `phone_numbers` (`pco.ts:24`)
- `email_addresses` (`pco.ts:23`)
- `background_check_expires_at` (`pco.ts:17`) — volunteer clearance status;
  belongs in a rostering system with access control, not a browser cache.
- `prayer_topic` (`pco.ts:18`) — already the subject of F3's separate ruling
  (Q1 settled: should not be ingested at all); until that ships, it rides
  along in this same raw blob and must be stripped here too as a second line
  of defense, not an alternative to fixing ingestion.

Strip these at the `saveToCache` call itself (or inside `cache.ts`'s
`saveToCache` function, which is the one-choke-point option and my
preference — it protects every future caller, including one nobody writes a
proposal for) and refetch live for any view that renders them, per the
existing `cache: false` pattern already used at `pco.ts:353,430`.

**One field the proposal didn't name that belongs on the list:** `avatar`
(the photo URL, present on the same raw object). It's PCO-hosted so fetching
it for display is fine (F4 keeps that), but the URL itself is a link to a
minor's photo and there's no reason for it to survive on disk when the
`Student` view that needs it can hold it in memory for the session. Add it to
the strip list; it's the same one-line change already touching this function.

## 3. Surviving objection

The minimisation only protects the **default** (memory-only) path if it's
enforced inside `saveToCache` itself, not inside each call site. F7 item 4
correctly says "at the saveToCache boundary," but the proposal doesn't say
whether that also governs the item-2 "Trust this computer" opt-in path. If a
staffer flips that toggle, the five fields above must still never reach
IndexedDB — the opt-in is about surviving a tab close, not about widening what
gets persisted. This needs to be an explicit acceptance criterion for F7, not
an assumption that falls out of "one function" — confirm the trusted-device
path calls the *same* stripped `saveToCache`, not a raw write that bypasses
it.

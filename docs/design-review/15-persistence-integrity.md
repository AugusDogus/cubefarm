# Persistence, player time and immutable history: adversarial review

Reviewed 2026-10-04. Scope: local saves, export/import, recovery, offline
simulation, restart, reincorporation, arithmetic integrity and historical
employee/cohort traits. The initial review changed only this ledger. A subsequent
assignment implemented stale-write protection in storage.ts, useGame.ts and
storage.test.ts. Initial evidence is retained below; the final section records
fixes and their practical limits.

## Sources actually retrieved

These pages returned HTTP 200 and their article text was inspected, including the
specific autosave and manual-save pages, rather than inferred from search results.

1. [Game Accessibility Guidelines: autosave](https://gameaccessibilityguidelines.com/provide-an-autosave-feature/)
   and [manual save](https://gameaccessibilityguidelines.com/provide-a-manual-save-feature/).
   They recommend both approaches. Autosave helps players who cannot reliably
   remember to save; manual saving supports short sessions and stopping suddenly.
   This supports protecting invested time and providing Save now. It does not
   establish that five seconds is the correct interval for this game.
2. [MDN: browser storage quotas and eviction](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria).
   Browser storage is best-effort by default, storage belongs to an origin, and
   quota exhaustion can raise `QuotaExceededError`. This supports exportable
   backups, caught failures and the phrase "saves to this browser". It does not
   prove a backup is durable after the player deletes it or changes browser.
3. [MDN: storage event](https://developer.mozilla.org/en-US/docs/Web/API/Window/storage_event).
   Changes to localStorage notify other same-origin windows, excluding the
   initiating window. This is a concrete facility for detecting another tab's
   writes. The event is not a lock or transactional concurrency protocol.
4. [MDN: JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify).
   `Infinity` and `NaN` serialize as `null`. A successful localStorage write cannot
   certify that the resulting save remains valid game data.
5. [MDN: Number.MAX_SAFE_INTEGER](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER).
   Integers above `2^53 - 1` cannot reliably preserve distinct integer values.
   This grounds integer-counter and cents representability requirements. It does
   not support a gameplay price cap of $5 or an invented maximum fortune.
6. [Nielsen Norman Group: ten usability heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/).
   Visibility of system status requires appropriate timely feedback. Error
   prevention, user control and recovery also apply to replacing progress and
   failed saves. These are general interface principles, not evidence of fun or
   retention for an incremental game.
7. [Universal Paperclips: main.js](https://www.decisionproblem.com/paperclips/main.js).
   The live implementation uses localStorage save/load operations. This is a
   concrete genre reference, not a reason to copy its persistence limitations
   or claim equivalent game quality. No timing constant in this ledger is
   justified solely by the reference game's implementation.

## Decision ledger

| Decision and code | Rationale | Adversarial objection | Evidence and limit | Verdict |
| --- | --- | --- | --- | --- |
| Autosave every five seconds, save on pagehide/hidden, manual Save now; `useGame.ts`, `Settings.tsx` | Protect sessions and allow the player to leave deliberately. | Browser shutdown can interrupt a lifecycle callback. Multiple independently running tabs currently own the same key. | Accessibility sources support automatic plus manual saves. Tests cover storage helpers, not browser lifecycle or concurrency. Five seconds is a local parameter. | Retain both save methods; resolve tab ownership before calling this robust. |
| Local-only save plus JSON export; `storage.ts:SAVE_KEY`, `useGame.ts:exportSave` | The game can run without an account; a file can move a company or back it up. | Browser eviction or clearing site data can remove the only copy. A file export can also contain invalid generated state if not validated. | MDN grounds browser-local durability limits. Export currently has no output-validation check. | Retain portable backups; never promise permanent browser storage. |
| Recovery preserves unreadable/invalid raw saves and suppresses overwrite; `loadGame`, `useGame.ts:recovery` | A failed migration must not erase the player's only history. | Storage-read failure returns ready with a fresh company, unlike malformed-save recovery. If reads fail transiently while writes later succeed, autosave can replace an unknown old save. | Malformed JSON and invalid current-version tests preserve the original. The read-failure/write-success case is a code-path risk, not an observed browser incident. | Preserve the recovery behavior; treat an unreadable storage area as unknown rather than known empty. |
| Import parses unknown JSON and caps file size at 1 MB; `useGame.ts:importSave`, `parseGame` | Reject malformed data before replacing the current company and limit unnecessary work. | Successful parse is not proof that future arithmetic will remain valid. Success notice currently overwrites a persistence-failure warning. | Schema and migration tests cover many state invariants. One megabyte is a defensive local choice, not a researched gameplay threshold. | Retain boundary parsing and explicit replacement confirmation; propagate save failure after import. |
| Offline progress uses the ordinary simulation, capped at two hours; `loadGame`, `engine.ts:advance` | Reuse production rules and avoid making permanent choices on the player's behalf. | Two hours changes idle value materially. Cash-only feedback hides research, inventory, finite-world progress and new correspondence. | Tests verify capped elapsed time, revenue, paused preservation and waiting decisions. No source validates the two-hour number or human return cadence. | Retain as a disclosed provisional balance rule; summarize material outcomes honestly. |
| Restart requires confirmation; `Settings.tsx`, `useGame.ts:reset` | Prevent an accidental click from deleting a company. | Reset/import in one tab can be undone by a stale second tab. Confirmation alone does not protect against that race. | NNG supports error prevention and user control. Existing helper tests do not exercise multiple tabs. | Retain confirmation and backup wording; fix the writer conflict. |
| Reincorporation creates a fresh company and carries only explicit legacy; `strategy.ts:reincorporate` | Make completed runs meaningful without quietly mutating old employees into new workers. | Maximum accepted legacy counters can overflow on another run. The five-credit award and three ten-level tracks are authored balance choices. | `progression.test.ts` covers both endings and legacy investment. It does not prove replay appeal or maximum-counter arithmetic. | Keep explicit carryover, add arithmetic integrity; do not claim researched replay tuning. |
| Research record, selected hiring genome and inherited employee/cohort genes are separate; `state.ts`, `engine.ts:hire`, `strategy.ts:branch-hire`, `parseGame` | Research unlocks future options; current workers keep the traits with which they were hired. | Historical performance can change when global facilities, equipment or gene formulas change. Immutable genotype is a narrower promise than frozen lifetime output. | Roundtrip and v1/v2 migration tests preserve genes, cultivars, cash and produced history. Old stacked five-gene profiles remain legal; new selected profiles are limited to two. | Retain this separation and the narrow, truthful promise. |
| Finite/nonnegative resources and integer counts; `state.ts`, `corporation.ts`, `network.ts` | Reject negative balances, invalid counts and malformed imported resources. | Finite values can overflow after addition or multiplication. Safe integers can become unsafe after increment. `saveGame` accepts the invalid output. | Direct probes below reproduce both failures. MDN explains why serialization masks them. Normal modeled play does not currently approach these extremes. | Insufficient as a complete arithmetic contract. Preserve the last valid persisted record and bound or guard operations coherently. |
| Remove the arbitrary $0.25 to $5 retail range while keeping cent prices; `strategy.ts:price`, `corporation.ts:price`, price input | Let price express the demand tradeoff instead of imposing an unexplained economic ceiling. | Finite positive input is insufficient: cent multiplication can overflow, positive subcent input can round to zero, extreme elasticity can lose demand to underflow. | Numeric sources justify representable cents, not an arbitrary economy cap. Current code still has the old range during this inspection. | Use one shared price contract for action, parser and UI, with positive representable cents and arithmetic-safe normalization. |

## Findings from the original inspection

### P1: another tab can silently restore stale progress

Each `useGame` instance loads once, owns an independent state/ref and writes the
same localStorage key every five seconds and on pagehide. There is no storage
listener, shared writer ownership or conflict resolution. A second tab can replace
an imported company, a restart or newer progress with its older state.

A storage-helper reproduction wrote a company with $9,000, then wrote the
independently loaded earlier company with $892. The next load returned $892.
This demonstrates last-writer behavior; it is not a full browser lifecycle test.
The source establishes that normal tabs schedule precisely these writes.

Choose and test an explicit policy, such as one active writer with a clearly
reported secondary tab. A storage event alone must not imply transactional safety.
Do not silently merge unrelated runs or advance both copies as one company.

### P2: accepted imported state can produce a corrupt save on its next action

A valid Network fixture with `nodes` and `lost` set to `Number.MAX_VALUE`, pressure
100 and 100% processing passed `GameSchema.safeParse`. After one second,
`lost` became `Infinity`, the schema failed, and `saveGame` returned `{ ok: true }`.
Loading that written save entered recovery because JSON had serialized the value
as `null`.

Separately, an Office fixture with `nextId` and `manualPapers` at
`Number.MAX_SAFE_INTEGER` passed the schema. An ordinary hire and an ordinary
manual process each returned an `ok` state that failed schema validation.

These are parser-accepted extreme imports, not observed normal-run balance
failures. Nevertheless, imports are a supported boundary and must not turn into
success-shaped corruption. Validate before replacing stored data, preserve the
last valid record and make increment/multiplication limits explicit. Test output
validity, rather than merely rejecting literal `NaN` or `Infinity` input.

### P2: import success hides the failure to persist

`importSave` calls `save()`, which reports a storage failure through `setNotice`,
and then immediately replaces that notice with "Save imported. Welcome back to
the office." The separate status can say Save unavailable, but the actionable
warning is hidden. The imported company remains in memory and needs an export
before leaving. Return or propagate the save result so the final message states
both facts. This follows directly from the ordered calls; a rendered integration
test has not yet been run.

### P2: uncapped price requires a numerical contract

`Math.round(1e308 * 100) / 100` is `Infinity` although its input is finite and
positive. A price below half a cent can become zero. A large represented dollar
value also stops preserving individual cents before reaching infinity.

An appropriate limit follows the chosen representation, such as an integer cent
amount inside the safe-integer domain, with validated conversion and normalization.
That is a numerical limit, not a claim that a corporation should be forbidden to
charge more than $5. Apply the same contract to imported saves and action input.
Reject zero, negative, nonfinite, subcent-to-zero and overflow cases. Verify the
result after rounding. Demand may legitimately become tiny at an expensive price,
but all displayed and persisted quantities must remain valid.

## Exploits, recovery and intentional limits

- Wall-clock changes can affect earned offline time. Negative elapsed wall time
  is clamped to zero, then `lastSeen` is reset. Repeated forward/backward edits can
  earn repeated capped periods. This single-player game has no shared stock
  trading or competitive economy. Prefer predictable player-time behavior over
  invasive anti-cheat; do not pretend the client authenticates elapsed time.
- Hand-editing exports can grant resources, research or reset the additive
  supplier-relief flag if the resulting invariants remain legal. Schema validation
  establishes a coherent state, not the truth of its history. Browser-local saves
  cannot certify that every resource was earned.
- The supplier-relief flag defaults to false for older records and preserves true
  current records. This is a deliberate additive migration decision. Changing
  old missing flags into rejected records would sacrifice legitimate saves.
- Valid v2 Network crises are retired during migration because that era no longer
  ticks office crises. Damaged old crises are validated before retirement. These
  behaviors have regression coverage and prevent a permanent inherited penalty.
- Permanent correspondence decisions wait offline and apply once. Employees and
  branch cohorts keep their inherited profiles during upgrades and replacement.
  Supplied tests verify these properties; no visual/browser audit was performed
  by this reviewer.
- The known local stranded fixture with three workers, zero cash/stock and no
  projects is distinct from the user's reported run with 18 workers and $556.
  Neither fixture proves multi-tab or overflow risks happened to the user.

## Checks and required regression evidence

Ran `bun test src/game/storage.test.ts src/game/experience.test.ts`: **31 pass,
0 fail, 289 assertions**. No assertions were weakened. Existing coverage includes
roundtrip traits/funds, offline cap, pause, raw malformed-save preservation,
storage exceptions, duplicate/out-of-capacity employees, v1/v2 migrations,
missing current fields, permanent choices and waiting crises.

Direct temporary command probes, with no committed helper scripts, reproduced
Network infinity, counter overflow, stale-writer replacement and price-rounding
infinity. Required additions are semantic:

1. Two company instances must not silently overwrite each other's reset/import
   or newer progress under the chosen writer policy.
2. Saving invalid generated state must fail and leave the previous valid raw
   record byte-for-byte intact.
3. Every accepted numerical boundary must remain valid after its supported next
   operation, or reject that operation without partial mutation.
4. An import that cannot persist must retain the imported in-memory company and
   display the export-before-closing recovery action.
5. Price action, save parser and UI must agree on cents, zero, finite values and
   the representation limit. Removing the old economic cap must not weaken these
   requirements.

Research supports preserving player time, truthful save feedback, recovery and
numeric integrity. It does not validate the 1 MB, five-second or two-hour values,
prove addictiveness, or establish award quality.


## Follow-up implementation and verification

- `saveGame` now validates before serialization/write and preserves the last
  persisted record when generated data is invalid. Root added resource bounds
  at `Number.MAX_SAFE_INTEGER`, which reject the reproduced `MAX_VALUE` import.
  The original infinity-to-null corruption is closed at persistence. An accepted
  Network state with nodes/lost at the new maximum still advances into a finite
  value above that maximum. Resource bounds alone do not establish arithmetic
  closure; the old save remains protected while the in-memory state can be invalid.
- Root propagated the import save result. A failed write now reports that the
  imported company is running in memory and provides export-before-closing advice.
  This was inspected in code; a rendered import failure test remains outstanding.
- Root added `normalizePrice` and `PriceSchema`. New actions normalize positive
  prices to cents with a safe integer cents limit; the arbitrary $5 cap is gone.
  Historical fractional prices remain accepted intentionally. This is an explicit
  compatibility exception, not a promise that every imported old price is already
  cent-normalized. The design-review tests cover positive cents, prices above $5,
  rejection of unsafe values and save roundtrips.
- This reviewer implemented `SaveSnapshot`, `readSaveSnapshot` and
  `saveGameIfUnchanged`. The browser hook compares stored raw bytes with the bytes
  it last read or successfully wrote before each autosave, manual save and
  lifecycle save. A mismatch blocks the write without replacing local company
  state and tells the player to export it before reloading. Own successful writes
  advance the expected snapshot. Explicitly confirmed import/reset refreshes it
  deliberately. An unknown read blocks writes instead of assuming empty storage.
- Recovery exports now use the captured unreadable/invalid original bytes, so a
  later external write does not change which original file is exported. Conflict
  export continues to serialize the local session, preserving that tab's progress.
- This policy detects sequential stale writes. The localStorage compare/write
  pair is not atomic, so it is not a lock and cannot guarantee exclusion of two
  simultaneously interleaved writers. No atomic concurrency claim is made.

New tests verify stale replacement is blocked byte-for-byte, local state remains
available, successive own writes succeed, confirmed replacement can refresh its
snapshot, and a failed read cannot overwrite the prior save. The tests were run
red before adding the exports, then green. Existing assertions were retained.

Final targeted check: `bun test src/game/storage.test.ts src/game/design-review.test.tsx`
returned **16 pass, 0 fail, 87 assertions**. `bun run typecheck` passed. Browser
lifecycle/interleaving and rendered import failure were not exercised by this
reviewer. Root received the remaining safe-increment recommendations for employee
IDs, manual counters and other bounded accumulating values.

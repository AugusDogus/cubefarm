# Swarm code-quality review

Independent review using the installed thermo-nuclear-code-quality-review rubric. Scope is the current tender, discovery feedback, automation diagnostics and receipts, Network coordination/credit/routing, and Hairline simulation binding. The existing game was already untracked, so scope follows these changed domains rather than the repository-wide diff. Production code and tests were not edited by this reviewer.

## Findings and responses

1. **Schema dependency cycle.** `corporation.ts` initially imported tender schemas through the operational tender facade, loading automation and returning to Corporation. The final import targets the pure `tender-state` module. The state boundary no longer depends on tender orchestration.
2. **Duplicate Network diagnosis policy.** Moving the headline guard chain out of JSX was insufficient while `allocationAdvice` still selected a different problem independently. Headline and advice could disagree about losses versus discovery, with separate coordination thresholds. The final correction deletes `allocationAdvice`; each selected diagnosis now owns its headline, explanation, and suggested plan (`network.ts:68`). This removes a policy chain instead of merely moving it.
3. **Redundant receipt identifiers.** A receipt stored sequence and client both directly and in its brief, then validated their equality. The tender worker removed the duplicate fields (`tender-state.ts:33`). UI and announcement consumers now read `receipt.brief.sequence` and `receipt.brief.client`. Committed quotes and credited payouts remain useful historical records. Derived net/outcome fields are explicitly validated, so retaining them does not require weakening corruption tests.
4. **Discovery lifecycle boundary.** Highlight IDs initially survived reset, import, and reincorporation, suppressing animation in subsequent runs. `useGame` now increments a UI revision only when the company is replaced. App clears highlights, transient cues, navigation, and settlement baselines on that revision. Ordinary simulation ticks retain UI history.
5. **Tender transition API without callers.** The original settlement helper was tested directly but unused by production transitions. Sovereign workflow and ending now settle the committed bid before replacing the era. This preserves pause and clocks without stranding the paid stake.

## Structure assessment

- Tender lifecycle states use a discriminated union. Cash and research debits update atomically after all submission guards and the outcome sample succeed.
- Research-cost versioning is justified compatibility work. Missing versions default to the earlier cash-only terms; current quotes use the newer research cost. Validation recomputes terms using the stored version. Earlier submissions receive no retroactive fee. A manual Network bid can compete with procedure research while respecting the explicit knowledge reserve; automatic commissioning keeps its separate research-first policy.
- The optional legacy receipt fields are parsed at the boundary and normalized to required internal fields. No unsafe assertions or TypeScript `any` were introduced in the reviewed production scope.
- `routedWork` owns intensive-routing work and costs for both simulation and infrastructure forecasting. This removes duplicated route formulas without introducing a generic policy framework.
- Automation explanation and execution use the same funding guards. The shared funding calculation includes supplies, payroll, maintenance, and operating reserves.
- No reviewed production file approaches the rubric's 1,000-line threshold. The larger existing strategy dispatcher remains direct; this change does not justify a repository-wide refactor.

## Verification

The initial independent focused run passed 39 tests and failed one new procedure-discovery fixture expectation, with 338 assertions. The fixture exposed both prerequisite-free procedures but expected only one. The owner corrected the expectation to include Efficient and Distributed, and to reveal Compression after Efficient. Future-procedure rejection, acknowledgment persistence, and existing affordability assertions remain intact.

The final independent focused run passed 42 tests with 354 assertions across tender, discovery feedback, Network coordination, and contract feedback. `bun run typecheck` passed. Root owns final full-suite, build, pacing, and browser verification. This reviewer made only this documentation change.

No outstanding structural blocker remains in the reviewed scope. The resolved findings above are required parts of the approval, not requests deferred to later work.

## Final plan and controller follow-up

- Clear's discovery share is `U * P / (U * P + (U + B) * D)`, where U is undiscovered work, B is located backlog, and D/P are the currently researched baseline capacities (`network.ts:57`). This directly balances the time to locate the remaining pool against the time to clear the full queue. The common final-procedure multiplier cancels. It does not inspect future resources, force a routing selection, or change allocation during ticks.
- Standard Clear with manual investment reserves the current coordination load, because that plan creates no new coordination debt. Expanding or intensive plans retain the maximum future load margin. This distinction is local to the existing pure plan constructor.
- Institutional memory exposes a `stability-surplus` diagnosis when existing stabilization exceeds the earned procedure's future-safe margin (`network.ts:86`). The diagnosis only returns explanatory text and a Grow/Survey suggestion. Applying it requires the existing explicit plan action. Repairing coordination likewise offers an explicit Clear refresh; it does not auto-allocate.
- An intermediate legal staged player added one bounded Grow refresh after earning Institutional memory. That action used the normal cadence-limited `attempt → act` path, but further comparison exposed its real coordination-repair cost. The final baseline removes the forced refresh (`testing/playthrough.ts:124`). It keeps the existing Grow-to-Clear sequence, normal decision cadence, interaction counter, and action log. The player-facing surplus hint now says Compare and discloses slower repair and potentially lower work efficiency. There is no hidden production controller or automatic allocation change.

An intermediate independent run passed 25 tests and failed the original mechanical-cadence assertion, observing 690 seconds against its unchanged 600-second ceiling. Root resolved the wait through an explicit final-procedure adjustment from 20 to 24 times productivity, retaining its 25,000-knowledge cost. The final multiplier has one named constant shared by the work and coordination formulas (`network.ts:5`). This changes actual game behavior instead of hiding the wait in the test controller or relaxing the assertion.

Final independent verification: all five pacing tests passed with 218 assertions, including the original 300/600-second deadlines across both paths and three seeds; typecheck passed. The slower-player four-hour ceiling remains unchanged. Root separately reported a passing full suite of 184 tests and 1,828 assertions and a passing build. This reviewer did not independently rerun that full suite or build. The earlier 690-second failure is resolved, not an outstanding finding.

This review assesses maintainability and tested state contracts. It does not establish enjoyment or award quality.

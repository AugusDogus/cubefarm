# Network agency: correctness and integrity review

Reviewed 2026-10-04. Scope: commissioning, computing routes, standing investment,
knowledge reserves, migration/import gates, finite-world conservation, failure
atomicity and the new interface. This reviewer owns only this document. No
production changes, assertion weakening or fixture edits were made by this reviewer.
The final disposition below records independently verified fixes by the implementers.

## Decision ledger

| Decision and code | Rationale | Adversarial objection | Evidence and limits | Assessment |
| --- | --- | --- | --- | --- |
| Immediate office commissions cost cash and knowledge; `network-capital.ts`, `strategy.ts:network-commission` | Give surplus headquarters cash a direct Network use, while keeping knowledge valuable for procedures. | Cash alone must not buy unbounded offices or reset the price after losses. | Cost uses lifetime commissioned installations, a 1,000 batch limit and 1,000,000 lifetime limit. Tests verify two-resource payment, split-batch equality, atomic failures and numeric headroom. These values are authored balance parameters, not externally validated thresholds. | Accounting is coherent for valid inputs. |
| Linear cumulative cost summed exactly | The same offices cost the same whether launched together or separately. | A batch formula can create a discount exploit through rounding or lost-office repricing. | At the allowed limits the installation sum, 125 cash multiplier and /8 knowledge division remain representable. Tests inspect several counts including the late lifetime boundary. Price depends on commissioned, not current nodes. | No split-order or loss-reset exploit found. |
| Distributed computing gates commissioning, routing and policies; `strategy.ts`, `NetworkInvestment.tsx` | Reveal a new use for resources through an earned procedure. | An import must obey the same prerequisite as an action. Hidden active settings cannot be explained or disabled by the player. | Action gate is covered. Original `NetworkSchema` omitted the gate for new routing and capital settings; direct reproduction below accepted and activated hidden bonuses. | P2 import-integrity gap until schema refinement is added. |
| Missing additive fields default to zero, Standard and Manual; `NetworkSchema` | Existing companies load without unexpected spending or resource diversion. | Defaults must not silently replace explicitly malformed choices. | Missing-field tests prove defaults and unchanged tick output. Invalid enum values and negative commissioned values are rejected. The defaults are compatibility choices; historical data cannot prove earlier commission counts. | Appropriate additive migration; test prerequisites alongside malformed values. |
| Survey spends 0.25 compute per extra located workflow | Turn spare servers into discovery without redirecting baseline offices. | It must pay for actual finite work and preserve natural replication first. | `tickNetwork` reserves growth compute first, bounds bonuses by baseline work, remaining undiscovered pool and spare compute. Scarce-compute test preserves growth exactly. | Cost and finite-work behavior are coherent. |
| Parallel spends 0.5 compute and 0.1 knowledge per extra cleared workflow | Offer faster clearance at the expense of procedure knowledge. | It must not spend against imaginary backlog, go negative or stop normal work when knowledge runs out. | Bounds include discovered backlog, spare compute and knowledge above the explicit reserve. Exhaustion falls back to baseline processing. Exact final-eight-workflows test charges only two bonus workflows. | Coherent tradeoff; enjoyment and tuning remain separate questions. |
| Knowledge reserve protects commissions and Parallel; `strategy.ts`, `network-investment.ts`, `tickNetwork` | Player can constrain automatic resource diversion and preserve research options. | A policy must not bypass a reserve by subtracting it twice, replacing it, or spending the protected amount later in the tick. | Manual quote uses surplus knowledge, then applies cost to original knowledge. Automatic quote uses surplus, while commission applies cost to original balance. Parallel uses the same explicit reserve. A 600-second integrated probe remained valid and above its reserve. | No double-subtraction or reserve bypass found in realistic states. |
| Research first retains cheapest currently eligible procedure cost above explicit reserve | Make launch automation sensitive to research opportunity without purchasing research automatically. | The name can imply protection from Parallel or a player's preferred expensive next procedure. | It affects automatic commissions only; Parallel and explicit manual purchases follow the player reserve. UI says it retains the cheapest available procedure's cost. Explicit procedures may use protected reserves. | Correct to the stated contract; do not broaden the promise. |
| Automatic launch before delegated infrastructure and Network work; `tickInfrastructure`, `economy.ts` | Newly launched offices can receive capacity and participate in the same simulation step. | Large investment can buy offices that current power cannot activate. An order bug can spend twice or use stale network fields. | Investment returns a new typed phase; infrastructure reads it afterward; economy narrows phase before calling `tickNetwork`. Surplus cash protection is applied on every purchase. Limited power remains a disclosed strategic consequence. | Order is coherent. |
| Forecast routing capacity accounts for bonus compute and current knowledge budget; `infrastructureNeed` | Delegated servers should support the selected priority without buying capacity for blocked bonuses. | It is a one-second forecast, while infrastructure projects a minute of growth. Future knowledge/investment can change needs. | Tests prove reserve-blocked Parallel does not create extra server demand and funded routes can. Forecast is conservative about current knowledge, not a guaranteed future rate. | Retain bounded forecast claims. |
| Total compute expense displayed as Extra compute / s; `NetworkInvestment.tsx` | Give the player a visible resource cost near route controls. | Total includes baseline natural replication, so the label attributes an existing cost to the selected bonus. | Standard routing reproduced 0.6565 compute/s and rendered Extra compute / s as 1. | P3: rename Compute spent / s or calculate the actual routing-only difference. |

## Original finding: import could activate locked, hidden routing

The original schema accepts nonstandard routing without Distributed computing,
even though the action and whole investment component require that protocol.
`parseGame` and `GameSchema` therefore admit an active configuration the player
cannot yet access in the interface.

Using a valid Network fixture with no protocols, 100 offices, adequate power and
compute, and a real finite backlog:

- Standard discovery: 750/s. Imported Survey: 1,500/s.
- Standard clearance: 360/s. Imported Parallel: 720/s.
- `NetworkSchema`, `GameSchema` and `parseGame` all accepted both states.

The schema also admits a nonmanual capital policy before the protocol. Automatic
investment is initially inert because its tick checks Distributed computing, but
can activate later without a deliberate visible selection. Require that
nonstandard routing and nonmanual policy imply the protocol, alongside the
existing balanced-infrastructure prerequisite. Missing historical fields still
default to Standard and Manual and remain compatible.

This is a supported-boundary integrity issue, not evidence the user's actual save
was malformed. No user save was changed or needed to reproduce it.

## Independent checks

Ran `bun test src/game/network-agency.test.ts src/game/network-investment.test.tsx`:
**17 pass, 0 fail, 133 assertions**. Existing tests were inspected for whether they
exercise behavior rather than merely mirror formulas. Batch-split accounting,
finite-work charging, progression gates, depletion fallback, reserve protection
and migration roundtrip assertions are meaningful. The missing import gate is
not covered by the passing suite.

Additional temporary command probes, no retained scripts:

- 9,000 deterministic ticks over 300 varied valid realistic networks, all three
  routes, quarter-second and one-second steps, different resource balances and
  all procedures: zero schema/resource failures. Maximum finite-world sum drift
  was `9.5367431640625e-7` against a pool of 1,000,000,000.
- A configured automatic Expansion first plus Parallel plus balanced-building
  company remained valid after 600 seconds. Knowledge ended at 9,561.2553 above
  its explicit 9,000 reserve, cash remained nonnegative, and it launched 240
  offices. This demonstrates one integrated path, not all possible policies.
- Unaffordable 1,000-office action failed and left the original company unchanged.
- `MAX_VALUE`, `MAX_SAFE_INTEGER`, `NaN` and `Infinity` commission counts all failed.
- Existing/new fields survived a configured save parse. Explicit malformed enums
  and negative lifetime launches failed existing targeted assertions.
- Rendered Standard-mode markup reproduced the misleading Extra compute label.

The realistic probes do not close the previously documented extreme resource
boundary problem: imported values at `MAX_SAFE_INTEGER` can accumulate beyond the
schema cap. Persistence validation protects the stored record but is not a proof
of complete simulation arithmetic closure. That remains separate from the
commission batch, which checks its own headroom.

## Research grounding and limits

The verified sources in [15-persistence-integrity.md](15-persistence-integrity.md)
apply here: Game Accessibility Guidelines support protecting player time through
autosave/manual save; MDN grounds serialization and numeric precision; Nielsen
Norman Group grounds truthful system feedback and error prevention. They justify
compatible defaults, coherent import/action gates, atomic failures and honest
resource labels. They do not validate a 0.25, 0.5 or 0.1 conversion rate, 1,000
launch batch, 1,000,000 lifetime limit, or the claim that the new loop is fun.

The published sources were retrieved during the preceding integrity review and
are not presented as new game-specific experimental evidence. Award quality,
strategic interest and human pacing require the separate design review and
independent playtesting.


## Final disposition after corrections

**P2 import prerequisite gap: resolved.** `NetworkSchema` now rejects Survey,
Parallel and Research first without Distributed computing. Independent probes
confirmed that `GameSchema` and `parseGame` reject these combinations in both
version 3 and version 2 records. Historical Network records missing the additive
fields still parse in both versions and receive Standard/Manual defaults. New
regression assertions cover locked rejection and unlocked acceptance. The full
save parser was checked independently rather than inferred solely from a
NetworkSchema unit test.

**P3 misleading compute metric: resolved.** The interface now says Compute spent
/ s, matching the total that includes natural replication. Rendered markup tests
reject the old Extra compute wording and confirm the new label.

**Expansion first: removed from the final feature.** The final typed policy list
and interface expose Manual and Research first only. Explicit Expansion first
save input is rejected. This experimental option was introduced during the
current implementation and is not a pre-existing user-save field. The original
600-second probe above remains evidence of that earlier implementation only.
The revised test still proves Research first invests, preserves both procedure
and player reserves, respects operating cash and leaves Manual/paused states
unchanged. Removing an authored policy is a scope/design decision; it does not
weaken the accounting or finite-work requirements.

**Launch feedback and interface contract: verified.** The component now displays
both resource balances above reserve, exact launch cost, the next office's cost
when unavailable, and whether cash or knowledge is insufficient. It blocks
completed-world, lifetime-limit and node-limit launches before dispatch. Routing
costs are visible before changing priority, and explanatory text explicitly
limits Research first to automatic launches. Manual commissions and Parallel
follow the separate minimum knowledge reserve. This resolves the concrete
mismatch between the visible policy name and its actual scope without pretending
that research is immune to every deliberate expenditure.

Final independent rerun:
`bun test src/game/network-agency.test.ts src/game/network-investment.test.tsx`
returned **19 pass, 0 fail, 151 assertions**. `bun run typecheck` passed. The
reviewed import gate and metric issues have no remaining correctness blocker.
The separately documented extreme accumulating-resource boundary and human
pacing/economic-balance questions remain outside these fixes. Browser interaction
is being verified by the root agent and was not duplicated here.

# Adversarial pacing and evidence review

Scope: `BALANCE.md`, `src/game/testing/playthrough.ts`, `report.ts`, progression and experience tests, pacing targets, reward classification and completion conditions. This is an independent audit of the initial implementation, not a human playtest or a claim of enjoyment. Experimental numbers below describe the pre-fix audit snapshot.

## Research actually retrieved

Retrieved successfully over HTTPS on 2026-10-04:

1. Hunicke, LeBlanc and Zubek, [MDA: A Formal Approach to Game Design and Game Research](https://users.cs.northwestern.edu/~hunicke/MDA.pdf), 2004. The introduction says “iterative, qualitative and quantitative analyses” help refine implementation and results. The framework distinguishes mechanics, emergent dynamics and experienced aesthetics. It supports checking simulated mechanics against observed player experience. It does not certify that a particular completion time or click count is fun.
2. Anthony Pecorella, [The Math of Idle Games, Part I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i), 2016. Discusses exponential costs against slower production, marginal income versus cost, changing investment priorities and bulk buying. Crucially: “Players aren't going to follow this exactly because the optimal choice will often be far too micromanage-y for a human.” Supports using a legal optimization benchmark as one diagnostic, alongside imperfect policies. No source support for Cube Farm's exact constants.
3. Kate Moran, [Quantitative User-Research Methodologies: An Overview](https://www.nngroup.com/articles/quantitative-user-research-methods/), 2018. Usability participants perform realistic tasks; measured outcomes include time and success. Observations and quantitative benchmarks answer different questions. This is UX methodology, not incremental-game balancing guidance. It supports separating modeled controls from observed interactions, without imposing its sample-size advice on small diagnostic playtests.

## Decision ledger

| Decision | Justification and evidence | Adversarial objection | Disposition |
| --- | --- | --- | --- |
| Legal seeded players, no injected resources | Reproducible proof that the economy and prerequisites admit a path. Nonempty fixtures separately check inherited traits. | The policy reads formulas, instantly evaluates purchases and acts every 10 simulated seconds. Reachability does not establish discoverability. | Retain as a mechanical baseline; never label as human playtesting. |
| Three seeds on both management paths | Detects obvious random variation and asymmetric route failure at low runtime cost. | Six runs are sparse, deterministic coverage. All share one purchasing policy and favorable information. | Retain existing assertions; add imperfect policies and broader sensitivity before generalizing. |
| First worker after 28 manual forms, within 60 seconds | At $1.25 per form, 28 sales earn the $35 hire. Simulation uses 0.5-second intervals, earning automation in 14 seconds. Demonstrates work before management. | Sixty seconds is a chosen tolerable opening budget, not a research result. Real reading, motor input and pricing discovery are absent. | Retain provisional target; verify fresh opening with a novice. |
| First development within 5 minutes; Enterprise 8–15 minutes; Conglomerate 20–35; finale 45–90 | Authorial pacing budget makes automation precede system expansion, then allows strategic Network decisions. Baseline six finales span 58.4–65.1 minutes. | Tests enforce upper limits only. Fast Conglomerate runs reach 17.7 minutes. The declared lower limits are not validated and do not prove comprehensible pacing. | Treat ranges as hypotheses, upper bounds as regression gates. Do not add arbitrary lower-bound tests to pad playtime. |
| Retain the original 4-hour completion ceiling | Guards catastrophic slowdown and softlocks after deeper pacing requirements were added. | Same policy could still conceal a novice trap. Passing does not mean four hours is satisfying. | Retain unchanged, supplement with slower policies. |
| Fewer than 350 commands and modeled interactions | Models successful actions, edit/submit and workspace changes; useful regression ceiling for chores. | Excludes reading, thought, scrolling, optional inspection and failed attempts. Four quick actions and one difficult action are not equivalent. | Retain as a workload proxy, label honestly; actual task-based observation remains needed. |
| Count letters and protocols together as Network rewards, gap under 6 minutes | Both offer authored discoveries; correspondence can connect expansion to consequences. Initial combined longest gap: 340 seconds. | A letter can satisfy the metric without changing strategy or granting a mechanic. Mechanical protocol gap is 1,430 seconds after the last protocol, and the first new protocol takes 540 seconds. | Keep narrative cadence evidence, report mechanical cadence separately. Do not call text-only cadence proof of frequent mechanical rewards. |
| Clear plan around 5,000 nodes | Seed-7 sensitivity finds a broad near-optimal region, rather than a one-node precision puzzle. 3,500–10,000 nodes finish Network in 39.2–40.8 minutes versus 38.0 at 5,000. | The script knows the correct transition; the player relies on the estimate and authored hint. Clearing at 1,000 takes 70.8 minutes. | Retain the approximate hint, show its comparative effect, validate player interpretation. |
| Static Grow and Survey remain legal strategies | Grow reaches finale in 79.7 minutes; Survey in 151.4. The staged policy is materially better with at most three plan actions. | Survey is substantially slower, and allowing every strategy does not make every strategy equally readable or interesting. | Preserve strategic consequences, expose bottleneck information, test recovery from an early poor choice. |
| Economic and biological numerical caps | Bounded headcount and genes support legible management; bounded growth avoids runaway representation. | A schema cap is not automatically an authored challenge. Exact constants require their own economic or usability rationale. | Cross-reference economy, genetics and Network reviews; label numerical safeguards separately from gameplay gates. |
| Finite one-billion-workflow finale and two endings | Provides an actual finish and contextual choice, instead of indefinite exponential continuation. Legal playthrough tests reach both endings, and ending advance is frozen. | The story may offer a choice after the economic consequences have become negligible; elapsed time is not narrative satisfaction. | Retain finite completion, defer ending stakes to narrative/economy reviews and observe player interpretation. |
| Reincorporation and five legacy credits | Optional replay preserves completed endings; tests establish reset, credit spending and untouched new-hire genomes. | Technical correctness does not demonstrate that replay differs enough to be worth repeating. | Retain as optional authored content; no replay-engagement claim. |

## Additional adversarial experiments

No production code or tests were changed for these experiments. All runs start fresh, use legal actions and deterministic seed 7 on stewardship. These remain formula-informed policies, not synthetic humans.

| Policy perturbation | Finale, minutes | Modeled interactions | Interpretation |
| --- | ---: | ---: | --- |
| Baseline staged player | 65.1 | 333 | Eager, informed reference policy |
| Leave the original $1.25 price; still market | 78.7 | 323 | Pricing optimization is not required to finish |
| Never market; still optimize price | 70.9 | 336 | Other demand routes prevent this omission from deadlocking |
| Leave price and never market | 85.2 | 305 | These two omissions remain recoverable under the rest of the informed policy |
| At most one successful post-opening action every 10 seconds | 71.9 | 307 | Action batching affects timing |
| At most one every 30 seconds | 105.6 | 296 | A moderate decision-delay model exceeds the 90-minute target |
| At most one every 60 seconds | 217.1 | 354 | Near the 4-hour ceiling; fewer decisions per minute do not imply fewer eventual actions |

The delay experiment preserves initial manual input, blocks successful post-opening actions until the next permitted timestamp and advances the same 10-second ticks. Network plan flags must change only when their action succeeds. A scratch version initially marked a blocked Grow attempt as complete and falsely deadlocked with zero replication. That was a test-harness artifact, corrected before recording results. Any persistent delayed-player helper must guard these flags on success.

Reproduce Network switch and mechanical-cadence sensitivity with:

```sh
bun -e "import { playthrough } from './src/game/testing/playthrough'; for (const clearAt of [1000,2500,3500,5000,7500,10000]) { const r=playthrough('stewardship',7,undefined,'staged',clearAt); const start=r.transitions.find(t=>t.phase==='network')?.seconds??0; const rewards=r.actions.filter(a=>a.phase==='network'&&a.type==='protocol'&&a.seconds>start); const times=[start,...rewards.map(a=>a.seconds),r.state.elapsed]; console.log({clearAt,finale:r.state.elapsed/60,network:(r.state.elapsed-start)/60,mechanicalGap:Math.max(...times.slice(1).map((t,i)=>t-(times[i]??0)))}); }"
```

The omission experiments disable only the relevant pricing/marketing condition in a temporary copy of the existing policy. Decision-delay experiments add a timestamp guard before `act` and update that timestamp after success. Temporary files are removed after review.

## Implemented audit follow-up

The permanent playthrough helper now accepts an optional final `decisionIntervalSeconds` argument, defaults to zero and applies only after the first hire. Plan flags change only after their action succeeds. `pacing-review.test.ts` preserves the default benchmark's exact actions/state, verifies that the 60-second policy completes all finite work within the original four-hour ceiling, and checks every recorded post-opening decision interval. No existing test or threshold was weakened.

`report.ts` now separately prints first protocol and longest protocol gap, alongside the combined letter/protocol cadence. It also generates zero/30/60-second policy rows. Following concurrent balance fixes elsewhere in this audit, the generated report records 62.4, 103.6 and 194.6 minutes respectively, with 326, 296 and 319 modeled interactions. These replace the initial snapshot as current regression evidence. The mechanical Network tail remains 1,430 seconds.

Reproduce the permanent slower policy with:

```sh
bun -e "import { playthrough } from './src/game/testing/playthrough'; const run=playthrough('stewardship',7,undefined,'staged',5000,60); console.log({minutes:run.state.elapsed/60,interactions:run.interactions});"
bun test src/game/pacing-review.test.ts
bun run balance
```

Verification: both new tests pass (187 assertions); TypeScript compilation passes. Human playtesting remains outside this mechanical evidence.

## Observed stalled run

A subsequently supplied real save changes the evidence available: the player had 11.96 offices, 100% processing, zero discovery, zero replication and zero stabilization. Only 3,728 discovered workflows remained despite nearly one billion undiscovered. Power and compute were abundant (75,437 plants and 14,089 servers), so buying more infrastructure could not repair the allocation bottleneck.

Read-only simulation of that exact save and a compact fixture with the same mechanical Network fields produced identical outcomes. The fixture uses the existing legal Network test scaffold and retains no user workforce records. Waiting 200 seconds empties the discovered queue, reduces offices to 6.56 and leaves both processing and discovery at zero. Applying Grow before the same wait produces 35.89 offices, increases knowledge from 316.88 to 740.75 and restores discovery to 153.48 workflows/second without further office loss.

The legal recovery policy applies Grow, buys available protocols, keeps delegated infrastructure and switches to Clear near 5,000 offices. From the submitted state it finishes in 2,210 seconds (36.8 minutes), without buying plants or servers. New protocols arrive at 450, 550, 630 and 770 seconds, followed by a 1,440-second mechanical-unlock gap. The first unlock still takes 7.5 minutes after correcting the allocation. A successful recovery therefore does not resolve the player's complaint about waiting by itself. Immediate bottleneck feedback and visible, understandable progress are necessary; reward cadence remains a design concern.

Two added regression tests establish that process-only allocation causes the observed stall, Grow restores discovery and growth, and the reported state can complete the finite pool through legal actions within the unchanged four-hour ceiling. Original pacing assertions remain intact. `bun run balance` includes this reported-run recovery alongside fresh runs. All four pacing-review tests pass with 205 assertions. The exact submitted save and its live browser state were not modified.

## Remaining evidence gap

Observe fresh players through first hire, supply exhaustion, demand backlog, first trait choice and first Network switch. Record what they notice, their intended next action, unexpected waiting, and recovery without explanations. Late-game observation should measure a branch replacement and allocation change, including locating the control and understanding its consequence. Ask what changed their strategy and where attention stopped. These observations diagnose problems; small samples do not support statistical retention or addiction claims.

Until such sessions exist, the defensible claim is that several legal policies complete, capped interaction models stay bounded for the eager policy, and known omissions can recover. Award quality and enjoyment remain unmeasured.

## Final selected pacing, superseding intermediate benchmarks

The preceding original and intermediate benchmark values are historical audit evidence. Current selected Network growth is 0.03 and the final procedure is twentyfold discovery and processing. Regenerated BALANCE.md reports six eager informed finales at 35.1 to 39.1 minutes, and seed 7 decision intervals of 0/30/60 seconds at 39.1/80.1/178.2 minutes. Reported-save legal recovery is now 14.2 minutes, first nonstarting procedure at 220 seconds, and longest mechanical gap at 500 seconds. The original 36.8-minute recovery describes the rejected pacing.

New semantic checks explicitly exclude the two starting procedures, require first nonstarting procedure within 300 seconds and protocol-only gaps including completion within 600 seconds across both paths and three seeds, and reported recovery within 1,200 seconds. Original cadence and completion assertions remain intact. These are regression budgets chosen after an observed human waiting complaint, not scientifically established enjoyable intervals. An approximately eight-minute final tail still requires human validation.

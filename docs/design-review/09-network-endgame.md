# Adversarial decision audit: Network and endgame

Reviewer: independent Network audit agent. Reviewed source, existing semantic tests, retrieved design literature, and ran legal-player allocation sensitivity checks. This is a design review, not a finding that players enjoy the game.

## Research actually retrieved

- Robin Hunicke, Marc LeBlanc, Robert Zubek, [MDA: A Formal Approach to Game Design and Game Research](https://users.cs.northwestern.edu/~hunicke/MDA.pdf), pp. 1 to 4. The paper calls for iterative qualitative and quantitative analysis, distinguishes mechanics from the player experience, and explicitly says there is no universal formula for fun. Its feedback-system discussion supports checking interactions between growth, costs, losses, and the finite objective. It does not validate any constant below.
- Ian Schreiber, [Level 7: Advancement, Progression and Pacing](https://gamebalanceconcepts.wordpress.com/2010/08/18/level-7-advancement-progression-and-pacing/). Retrieved the article text. It discusses differences in player skill, curves of player power and opposition, and using playtesting and metrics to discover setbacks. This supports multiple policy benchmarks rather than one optimal route.
- Ian Schreiber, [Level 3: Transitive Mechanics and Cost Curves](https://gamebalanceconcepts.wordpress.com/2010/07/21/level-3-transitive-mechanics-and-cost-curves/). Retrieved the article text. Increasing costs can make players consider other purchases, but suitable numbers require designer judgment and playtesting. This supports evaluating opportunity cost and marginal time saved, not a claim that a linear cost curve is always better.
- Ian Schreiber, [Level 8: Metrics and Statistics](https://gamebalanceconcepts.wordpress.com/2010/08/25/level-8-metrics-and-statistics/). Retrieved the article text. Its warning against forgetting human players while focusing on numbers applies directly to the automated balance report.
- [Universal Paperclips implementation](https://www.decisionproblem.com/paperclips/main.js), retrieved as a comparative artifact. `spawnProbes`, hazard loss, trust allocation, and finite exploration provide a concrete example of allocating growth, exploration, and loss prevention in a later phase. Its similarity supports the requested genre, not originality or proof of comparable quality.

## Decisions and objections

| Decision and code | Rationale and research connection | Adversarial objection | Disposition |
| --- | --- | --- | --- |
| A terminal pool of 1 billion workflows, conserved as undiscovered, discovered, completed (`network.ts`) | An explicit finish changes the objective from perpetual accumulation to finishing a job. MDA supports a clear objective and a dramatic release. Pool conservation makes the promise true. | One billion is an arbitrary scale. A finite counter alone is not a satisfying climax. | Retain as a tuning hypothesis paired with the authored ownership ending. `progression.test.ts` verifies conservation and exact closure. Human response to the finish is untested. |
| Eight autonomous offices initially (`initialNetwork`) | A small seed makes replication visible and makes early growth transformative. | It can make initial clearance look hopeless. The original 35/0/45/20 allocation estimated 267.9 days. Even buying every affordable protocol immediately without growth took 6.77 days. | Reject the zero-growth default. Root implemented a 10/55/10/25 default without rewriting existing saved allocations. Eight itself is retained as a pacing hypothesis. |
| Four shared allocations, proportional redistribution when editing (`allocate`) | Growth competes with immediate work; stabilization consumes useful labor. This creates opportunity costs using a small number of resources. MDA and the Paperclips artifact support examining these resulting dynamics. | Sliders interact and cannot each be set independently. Players can unintentionally reduce safety while increasing another share. | Retain with explicit redistribution copy, visible stabilization requirement, and presets. Normalization tests are meaningful. Keyboard and touch usability still need human checks. |
| Grow, Survey, Clear presets (`strategy.ts`) | Presets make strategic shifts accessible without repeated precise slider adjustments. The question becomes when to change strategy. | Their names hide exact allocations. Survey is substantially slower than Grow, so it must not be presented as an equally good opening. | Retain as situational plans. Description and current rates must expose the consequence. Survey can prioritize mapping; Clear becomes useful after sufficient scale. Do not describe all plans as equally fast. |
| Grow shares 20/65/15, Survey 60/15/25, Clear 35/0/65, plus safety allocation | These separate reinvestment, exploration, and finishing. Clear directs 100% of remaining productive allocation to processing when discovery is complete. | Exact shares have no published justification. Since discovery per node is faster than processing, fixed Clear may create more backlog than necessary. | Retain as convenient hypotheses, with manual adjustment available. Benchmark different switch points, not just these names. No source proves these percentages. |
| Originally replication 0.01 per allocated office per second, now provisionally 0.03; coordination denominator `1 + nodes / 1500` | Early compounding feels different from the office phase, while late diminishing returns make a finish strategy competitive. The coordination term creates a reason to stop growing. | This can be invisible slowdown. Without explanation, players may interpret it as a bug. The original rate produced long mechanical waits in the actual run. | Retain coordination with growth-rate display and letter. Adopt the faster rate provisionally based on the follow-up sensitivity evidence below. Both constants remain tuning hypotheses. |
| Stability need `(0.12 + pressure / 1000)`, halved by resilience; losses at `nodes * shortfall * 0.025` | Prior company pressure has a later consequence. Allocating more stabilization trades throughput for safety. | Losses can compound while the player is absent. A one-time preset becomes unsafe if pressure rises. | Presets use rounded required stabilization plus 2 percentage points. New default 25% is safe even at pressure 100 before resilience, where need is 22%. Retain losses only with visible warning, Pause, and recoverable minimum one office. Exact loss severity needs playtests. |
| Nodes require 0.4 energy/s, or 0.2 with efficiency; servers consume 3 energy/s and produce 40 or 160 compute/s (`tickNetwork`) | Distinguishes powering existing capacity from supporting replication. Efficiency and distribution change bottlenecks rather than merely increasing cash. | Multiple counters can obscure what actually limits work. Server power is consumed before offices. | Retain because bottleneck feedback identifies power, compute, discovery, and stabilization. The priority is deterministic but not proven intuitive. Constants are tuning hypotheses. |
| Stored energy capped at 1200 per plant, compute at 400 per server; each new office consumes 2 energy and 10 or 5 compute | Storage buffers brief fluctuations while sustained output depends on infrastructure. | Storage can conceal an undersupply temporarily. A player can see a healthy stock and still run out later. | Retain alongside generation, use, supported offices, and growth displays. Stocks alone must not imply sustainable capacity. |
| Plants generate 120 energy/s; asset base prices 1800 and 2400 with cumulative linear installation escalation (`assetCost`) | Costs rise while permitting a finite world to remain reachable. Cumulative pricing makes batch and single purchases economically equivalent. | Linear cost was selected for reachability, not demonstrated challenge. Existing company income frequently makes these costs negligible. | Retain as capacity logistics rather than claim a scarce cash strategy. Exact costs and 1 million caps are implementation/tuning limits. Batch quote and reserve tests establish correctness, not balanced scarcity. |
| Needed builds include 35% power headroom; delegation forecasts one minute and retains operating reserve (`infrastructure.ts`) | Removes repetitive maintenance while leaving allocation under player control. This matches the user's late-game chore constraint. | Forecast ignores losses and can overbuild. Server-first purchasing can consume budget needed for plants. | Retain conservative forecast as a convenience, with reserve edits and manual override. The model removes repeated purchases in reported legal runs. Test distressed budgets separately from wealthy benchmark runs. |
| Two initial protocols cost 500 and 1200; starting knowledge 1700 | Teaches power and compute upgrades, immediately permits delegation. | Both can be bought immediately, so this is tutorial setup, not a meaningful spending tradeoff. | Retain only as explicit onboarding. Do not market these first two clicks as deep strategy. Automatically deploying them would need a separate justified simplification, not fabricated research support. |
| Mapping 2500, compression 5000, resilience 8000, final procedure 25000; prerequisite graph and multipliers 4x, 4x, half stability, originally 10x and now provisionally 20x | Milestones change the power curve and make completion accelerate. Dependencies expose only actionable research. | All procedures are beneficial permanent upgrades, so order is the primary choice. A large final jump can render the preceding optimization irrelevant. The original final clearance tail was also excessively long. | Retain as progression rewards, not a large strategic tree. Faster final procedure is justified provisionally by follow-up tail and strategy evidence below. Costs and multipliers are hypotheses, and six upgrades do not establish equivalent Paperclips depth. |
| Knowledge `(discovered + processed)/60`, plus stabilizers `0.03/s` with resilience | Both mapping and completing work advance procedures. Resilience gives stabilization a productive secondary use. | A workflow yields knowledge twice. This is authored reward accounting, not a real conservation law. Stabilizer knowledge may reward excessive safety. | Retain with the interpretation that discovery and execution teach different things. Only work-pool conservation is required. Verify if players understand why knowledge changes. |
| Workflow pays $0.06; original office continues earning and paying wages (`economy.ts`) | Historical company investments remain valuable and support worldwide infrastructure without more office maintenance. | Cash loses scarcity and accumulates far beyond purchases. A purported final financial sacrifice becomes trivial. | Retain continuity to preserve prior investment, but stop describing late cash or infrastructure buying as the main strategic constraint. Allocation and finite completion time carry the challenge. |
| Letters at 25, 250, 1000, 2500, 3500, 5000 offices, then half and full completion (`story.ts`) | Short correspondence interprets mechanical milestones and supplies coordination/clearance guidance. Narrative, discovery, and pastime are the intended MDA experiences. | Rewards triggered by growth can imply that the player should keep growing after the optimal stopping region. Six-minute gaps may still feel empty. | Retain the explicit 5000-office suggestion to try Clear. Letter cadence is a guardrail, not demonstrated human engagement. Avoid treating letter clicks as proof of meaningful activity. |
| Monopoly or commons ending; patents cost $250,000 to release (`story.ts`, ending action) | Resolves earlier ownership promises and changes the interpretation of the company. A buyout can acknowledge a previous patent choice. | Seed 7 staged route ended with $425.2 million cash. Buyout is 0.0588% of that, so it is not a difficult economic choice. | Retain as an authored acknowledgement only. Do not call it a substantial penalty, sacrifice, or balancing mechanism. Earlier output/research/pressure consequences are the actual mechanical tradeoffs. A scaled final tax is unsupported and could punish the ending arbitrarily. |
| Finishing snaps numerical dust below 0.001; ending requires all work completed | Prevents a final floating-point remnant from denying closure. | A loose threshold could silently skip real work. | Retain the microscopic threshold against the 1 billion pool and test exact final-form completion. This is numerical correctness rather than reward tuning. |

## Strategy and pacing evidence

The published legal player knows formulas, buys procedures immediately when affordable, and enables infrastructure delegation. It is an expert model. Static Survey is less expert in allocation, but still expert in every other subsystem.

Existing seed 7 stewardship report: staged Network 38.0 minutes, static Grow 52.7, static Survey 124.3. These differences support an actual growth-versus-clearance opportunity cost. They do not establish that a newcomer will discover it.

Independent sensitivity run, same legal player and seed, before the new default change:

| Offices when switching to Clear | Network minutes | Total minutes |
| ---: | ---: | ---: |
| 1000 | 70.8 | 97.9 |
| 2500 | 43.0 | 70.1 |
| 3500 | 39.2 | 66.2 |
| 5000 | 38.0 | 65.1 |
| 7500 | 39.7 | 66.7 |
| 10000 | 40.8 | 67.9 |

Reproduce using `playthrough('stewardship', 7, undefined, 'staged', threshold)`. The broad 3500 to 10000 region is within about 3 minutes. This supports a forgiving heuristic near 5000 rather than precise optimization. Clearing at 1000 is materially slower but still completes, so there is no hard strategic softlock.

The report's first Network discovery at 210 seconds and maximum reward gap at 340 seconds pass its authored five-minute and six-minute bounds. Those bounds are selected hypotheses, not literature-derived optimal reward intervals. The test counts procedures and letters as rewards; it does not measure attention, confusion, felt agency, or anticipation. The final procedure is a power spike, while letter-only periods need qualitative playtesting.

## Remaining objections and required validation

1. Validate the corrected initial allocation grows safely at pressure 0 and 100 without requiring an opening preset. Preserve historical saved allocations.
2. Keep the original completion/conservation tests. Add a passive-allocation policy check rather than making novice evidence synonymous with another formula-aware route.
3. Re-run the published balance report after any Network changes. Do not tune only to make the staged oracle pass.
4. Human testing must check whether players notice delegation, understand allocation redistribution, choose to stop growing, and find the Network ending emotionally coherent. Automated results cannot justify an award-quality claim.
5. Do not add hazards, combat, or a new currency merely to resemble Paperclips. Each would require a distinct experiential purpose and would increase the interface burden the user has already challenged.

Reviewer judgment: retain the finite objective, constrained allocations, diminishing growth, delegation, and terminal ownership decision with the limitations above. Reject the original zero-growth default. Retain exact quantities only as inspectable tuning hypotheses. The remaining biggest risk is perceived late-game waiting, not numerical reachability.

## Follow-up: actual player save and waiting complaint

The player supplied a valid version 3 save. This was read and parsed without modifying the attachment or their running game. At approximately 40.7 minutes elapsed it held $1.651 billion, 11.96 autonomous offices, 75,437 power plants, 14,089 server farms, and only efficiency/distribution protocols. Allocation was discovery 0%, replication 0%, process 100%, stabilization 0%. Approximately 99.999% of the world was still undiscovered.

This is a real progression halt. The 3,728 located workflows finish in approximately 27 seconds, after which clearance and ordinary knowledge earnings stop. Knowledge plateaus below 400, short of the next 2,500-cost procedure. Offices continue suffering instability losses. Waiting longer or buying infrastructure cannot resolve this state. The correct immediate action is reallocating offices to discovery, replication, and stabilization.

The original warning priority displayed office losses first, concealing the more consequential fact that no one could locate remaining work. A stronger contextual message should say that clearance will stop because discovery is zero, offer Grow, and also state the stabilization danger. In this save, power and compute are already excessive. It should explain that plants and servers support offices but do not create them.

The save is also human evidence against the previous pacing claim. An independent legal simulation from the actual state, using Grow, purchasing procedures when affordable, and switching to Clear at 5,000 offices, took another 36 minutes 50 seconds. The next new procedure arrived only after 7 minutes 30 seconds. Static Grow took 51 minutes 20 seconds; Survey took 119 minutes. Those are simulation results, but the player's complaint supplies the missing evidence that the waiting can feel empty.

The earlier 210-second first reward statistic counts a letter. A fresh legal player on the current source snapshot waited 540 seconds for its first nonstarting procedure. Letters can provide narrative rewards, but including them in the same statistic does not establish mechanical decision cadence. Keep the existing combined cadence test; add a separate check for meaningful new procedures rather than redefining letters to make the old metric fail or relaxing its bounds.

### Bounded parameter experiment

An isolated temporary source copy, with the same dependencies and no production edits, compared base replication rates 0.01, 0.015, 0.02, 0.03 and final-procedure multipliers 10 or 20. Each candidate used the existing legal player in staged, static Grow, and static Survey variants, plus corresponding recovery simulations from the actual save. Only the Network constants differed. Fresh seed 7 stewardship reached Network at 24.4 minutes on this source snapshot. Therefore these totals must not be merged silently with the earlier report's 27.1-minute entry.

| Replication | Final multiplier | Fresh staged Network, min | Fresh total, min | Fresh next procedure, s | Actual save staged recovery, min | Actual save next procedure, s | Fresh static Grow Network, min | Fresh static Survey Network, min |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 0.01 | 10 | 38.0 | 62.4 | 540 | 36.8 | 450 | 52.7 | 124.3 |
| 0.01 | 20 | 32.3 | 56.7 | 540 | 31.2 | 450 | 42.0 | 103.8 |
| 0.015 | 10 | 29.2 | 53.6 | 410 | 28.3 | 350 | 40.5 | 92.8 |
| 0.015 | 20 | 23.7 | 48.1 | 410 | 22.8 | 350 | 32.0 | 76.8 |
| 0.02 | 10 | 24.7 | 49.1 | 340 | 24.2 | 290 | 33.7 | 75.7 |
| 0.02 | 20 | 19.2 | 43.6 | 340 | 18.5 | 290 | 26.5 | 62.3 |
| 0.03 | 10 | 20.2 | 44.6 | 250 | 19.7 | 220 | 26.2 | 57.0 |
| 0.03 | 20 | 14.7 | 39.1 | 250 | 14.2 | 220 | 20.3 | 46.5 |

The smallest tested improvement is 0.02 replication with the existing final multiplier 10: it brings the actual-save next procedure below five minutes and cuts recovery by about one third, while staging still beats static Grow by approximately 27%. However, the fresh player's next procedure still takes 340 seconds and the recovered player still spends 24 minutes completing the Network. That is a partial response to the actual waiting complaint.

The recommended provisional choice is 0.03 replication and final multiplier 20. It brings the first new procedure to 250 seconds fresh and 220 seconds from the actual save, reduces actual recovery to 14.2 minutes, and preserves a 28% staging advantage over static Grow. Its fresh expert route totals 39.1 minutes, shorter than the aspirational 50-minute lower target. Do not pad other phases to restore that number. A time target is subordinate to meaningful play. This recommendation prioritizes observed human frustration over a previously selected timer goal, without claiming the selected numbers are proven fun.

Faster replication addresses the initial wait; a stronger final procedure addresses the clearance tail. Neither creates additional choices. These are pacing corrections justified by human feedback and sensitivity measurements, not a claim that research prescribes the selected constants. Re-run multiple seeds and both promise paths before adopting a candidate. Do not alter completion tests to conceal a strategy regression.

Additional independent switch-threshold sensitivity with final multiplier 20:

| Clear at offices | Network minutes with replication 0.02 | Network minutes with replication 0.03 |
| ---: | ---: | ---: |
| 1000 | 35.3 | 33.7 |
| 2500 | 21.5 | 18.0 |
| 5000 | 19.2 | 14.7 |
| 7500 | 20.0 | 14.7 |
| 10000 | 20.7 | 15.3 |

The 0.03/20 candidate retains a forgiving 5,000 to 10,000-office region, while clearing very early materially slows completion. Therefore the existing 5,000-office letter remains defensible guidance. This is sensitivity evidence that faster pacing retains the opportunity cost, rather than merely giving a faster result to the existing scripted policy.

### Decisions requiring a purpose, not more clicks

- Keep money as historical continuity, but treat it honestly as plentiful in this save. Normal infrastructure costs are not consequential resource choices here. The player's billions cannot accelerate office reproduction under the existing rules.
- Remove prominent Max affordable infrastructure buying, or move it behind an advanced control with explicit excess-capacity wording. Needed and delegation express useful purchases. Huge spare capacity invites expensive clicks with no corresponding output.
- Present the next meaningful intervention with its reason and an estimate: restore discovery, enable growth, deploy the next procedure, then compare growing longer with clearance. A forecast should expose a consequence, not demand a click simply to keep the player occupied.
- Preserve the shared-allocation decision and the finite goal. Do not add combat, random interruptions, attendance chores, or new currencies to fill the timer.
- A paid manual office-seeding action could connect accumulated cash to Network scale, but it would require separate cost-curve and skip-risk testing. It is not necessary for this surgical correction and should not be slipped in merely because the current cash balance is large.

Revised reviewer judgment: guidance and the safer initial default are necessary but insufficient. The actual save exposes both a hard allocation halt and excessive mechanical waiting after recovery. Correct the contextual information and tune the waiting interval with the bounded evidence above. Human testing still determines whether the remaining Network phase provides enough agency.

## Final implementation audit

The selected 0.03 replication and 20x final procedure are implemented. `networkPlan` centralizes the same allocations used by the action and the new comparison preview. `networkAdvice` supplies a contextual rescue action. The component retains 1 and Needed infrastructure buying, removes prominent Max affordable, and explains that spare capacity cannot create offices. Direct percentage entry supplements the linked sliders. A one-second forecast calls the actual pure simulation function on a copied plan, and labels its limited horizon explicitly. None of these controls adds a currency or recurring attendance chore.

Independent final-source legal runs, six path/seed combinations:

- First nonstarting procedure: 250 seconds for each run.
- Longest protocol-only gap, including final procedure to completion: 510 seconds for each run.
- Total duration: 35.1 to 39.1 minutes.
- Compact reported-save recovery: 850 seconds total, first new procedure 220 seconds, longest protocol gap 500 seconds.

Explicit regression budgets now enforce first new procedure within 300 seconds, protocol-only gap/final tail within 600 seconds across both paths and three seeds, and reported recovery within 1,200 seconds with first procedure within 300 seconds. Existing combined letter/procedure gaps within 360 seconds and the original four-hour completion ceiling remain. These budgets constrain the improvement observed in the selected candidate. They are authored guardrails, not research-proven intervals of human engagement.

Final relevant verification: first `bun test src/game/pacing-review.test.ts src/game/experience.test.ts src/game/design-review.test.tsx`, 39 tests passed, 527 assertions, covering existing pacing, strategy advantage, recovery, safety, and semantic behaviors. After the new protocol-only budgets were added, `bun test src/game/pacing-review.test.ts src/game/design-review.test.tsx` passed 15 tests and 276 assertions. No existing bounds were relaxed to accommodate the faster candidate.

The final implementation objection was resolved: zero-discovery or unsafe allocations now recommend Grow below 5,000 offices and Clear at or above it. Clear already assigns discovery until mapping is finished. Independent direct checks confirmed the rescue recommendations at 12 and 5,000 offices and that both resulting plans validate and retain sufficient stabilization at pressure 100. Advice no longer recommends unnecessary Survey replication after the useful stopping region.

Final disposition: approve the Network correction provisionally. The observed stall has an actionable rescue, mechanical waiting has measurable regression budgets, and staged strategy remains consequential. Human enjoyment and the sufficiency of late-game agency remain unproven; neither the research nor passing tests establishes award quality.

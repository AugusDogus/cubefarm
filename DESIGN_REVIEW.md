# Cube Farm adversarial design review

Fifteen initial independent reviewers retrieved game-design, usability, accessibility, or persistence sources and challenged the implementation. Their ledgers cover the material mechanics, numeric families, authored progression, story, presentation, and interaction decisions. Each records rationale, objections, source limits, and dispositions. Research informs principles; it does not prove a chosen price, multiplier, reveal threshold, or number of gene slots is optimal.

Follow-up adversarial design, correctness, and UX reviews challenged the new Network decisions and verified their corrections. This index records the final implementation. Domain reports preserve the baseline findings, with subsequent dispositions where reviewed again. A baseline defect described there is not evidence that its corrected behavior remains defective.

## Coverage and evidence

| Decisions | Independent researched review |
| --- | --- |
| Manual opening, automatic production, progressive discovery, four eras | [Core loop](docs/design-review/01-core-loop.md) |
| Retail pricing, demand elasticity, marketing, inventory, supplies, wages, purchase growth | [Economy](docs/design-review/02-economy-pricing.md) |
| Cultivar ladder, inherited genes, prerequisites, two-slot profiles, transfer and fire | [Genes and cultivars](docs/design-review/03-genes-cultivars.md) |
| Every incentive, upgrade effect, level cap, price curve, reveal gate, morale, memo timing | [Facilities and upgrades](docs/design-review/04-facilities-upgrades.md) |
| All 19 projects, their costs, dependencies, thresholds, prerequisites, and objective guidance | [Projects and progression](docs/design-review/05-projects-progression.md) |
| Department roles, aptitude, downtime, bulk assignment, payroll, policies, pressure | [Staffing](docs/design-review/06-staffing-departments.md) |
| Procurement, reserves, supplier relief, emergency recovery, memo and order delegation | [Automation and recovery](docs/design-review/07-automation-recovery.md) |
| Contracts, crises, acquisitions, passive market rank, branches, cohorts, era transformations | [Expansion and competition](docs/design-review/08-expansion-competition.md) |
| Finite work, allocation, infrastructure, resource limits, protocol tree, completion | [Network](docs/design-review/09-network-endgame.md) |
| All 16 letters, commitments, character continuity, endings, patent settlement, legacy | [Story and endings](docs/design-review/10-story-endings.md) |
| Minimal hierarchy, workspaces, disabled controls, quotes, bulk actions, keyboard and touch | [UI and interaction](docs/design-review/11-information-interaction.md) |
| Hairline world evolution, pointer response, motion, audio, feedback, contrast | [Feedback and accessibility](docs/design-review/12-feedback-accessibility.md) |
| Timing budgets, strategy comparisons, oracle limitations, slower policies, reported-save recovery | [Pacing evidence](docs/design-review/13-pacing-evidence.md) |
| Cross-domain assumptions, hidden coefficients, evidence standards, human test protocol | [Coverage standards](docs/design-review/14-coverage-standards.md) |
| Save migrations, imports, recovery, offline simulation, tab conflicts, numerical precision | [Persistence and integrity](docs/design-review/15-persistence-integrity.md) |
| Commissioning economics, computing priorities, standing investment, exact stalled-save outcomes | [Network agency](docs/design-review/16-network-agency.md) |
| Commission accounting, resource conservation, imported prerequisites, reserves | [Network agency integrity](docs/design-review/17-network-agency-integrity.md) |
| Complete Paperclips browser-source comparison, reveal feedback, active loops, audio/VFX, automation and remaining depth gaps | [Paperclips source audit](docs/design-review/18-paperclips-source-audit.md) |
| Cleared-work replication, coordination, funded computing sacrifices | [Network constraints](docs/design-review/19-network-constraints.md) |
| Changing priorities, explicit preparation risk, committed outcomes and truthful receipts | [Tender design](docs/design-review/20-tender-design.md) |
| Historical saves, resource accounting, transitions and exact submitted-save preservation | [Swarm invariants](docs/design-review/21-swarm-invariants.md) |
| Tender sensitivity, rejected reserve policy and optional completion paths | [Economy swarm](docs/design-review/23-economy-swarm.md) |
| Keyboard focus, live announcements and reduced motion | [Accessibility swarm](docs/design-review/24-accessibility-attention.md) |
| Canonical domain policy, typed legacy boundaries and feedback lifecycle | [Code quality swarm](docs/design-review/25-swarm-code-quality.md) |
| Browser interactions, opening disclosure and mobile layout | [UX swarm](docs/design-review/26-ux-swarm.md) |

The sources include the actual Universal Paperclips HTML and JavaScript, Hunicke/LeBlanc/Zubek's MDA paper, Pecorella's idle-game mathematics, Schreiber's cost-curve, balance, pacing and playtesting lessons, Sirlin's viable-options discussion, Nielsen Norman Group's progressive-disclosure work, and W3C accessibility guidance. Domain reports include retrieved claims and exact URLs. Access varied across reviewers: a blocked retrieval is recorded as blocked, not silently counted as evidence. Universal Paperclips initially exposes retail controls; Cube Farm's extra-minimal opening is an authored interpretation, not an exact replica.

## Rejected decisions and resulting changes

| Rejected behavior | Final decision, rationale, and independent challenge |
| --- | --- |
| Arbitrary $0.25 to $5 price range | Allowed prices begin at one cent; the initial price remains $1.25. New prices normalize to cents, and have only a safe integer-cent representation bound. Demand already provides the price tradeoff. Economy review accepts this; sublinear revenue still makes fixed-market overhiring risky. |
| Executives outperform research specialists at equal recurring wages | Specialist research multiplier becomes 2.5, preserving a measured research niche while executives retain greater production. This is a provisional adjustment above the crossover, not a source-prescribed optimum. Direct equal-condition tests check the niche. |
| Automated memos buy extra unsellable inventory | Retail-only memos require positive estimated 90-second return and stock or procurement funding. Orders and departments remain explicitly selected noncash purposes. Review caught and corrected insufficient-stock and near-finished-order cases. Automation remains a forecast, not an optimal planner. |
| Throughput alone authorizes automatic orders | Renewal requires the original delivery margin plus supplies, wages, maintenance, and reserve funding before escrow payment. Review reproduced insolvency and an upkeep omission; both are corrected. No speculative future retail receipts finance the guard. |
| Emergency cash disappears into unavoidable acquired payroll | Actual emergency receipts earmark at most one pack's cost against wages and upkeep. Restocking/production releases the protection. Existing saves default to zero protection. One-time free relief remains separate. Nonempty acquired-workforce regression proves repeated insolvency can restock. |
| New Network starts with no replication | New companies receive a viable growth allocation, including stabilization sufficient at maximum pressure. Existing allocations are preserved. Saved stalls receive explicit Grow/Clear guidance and legal recovery tests. |
| Stalled clearance is described only as a loss warning | Zero discovery explicitly warns that clearance will stop. Small networks receive Grow; sufficiently large networks receive Clear. Plan forecasts expose current growth/discovery/clearance tradeoffs. Their one-second horizon is disclosed. |
| Prominent Max affordable infrastructure encourages useless overbuilding | Keep single and Needed purchases plus delegation. Explain that spare plants and servers cannot create offices or discover work. The user's huge excess capacity provides direct evidence for rejecting the cash-sink control. |
| Long growth and final clearance waits | Provisionally increase node growth from 0.01 to 0.03 and final discovery/processing from tenfold to twentyfold. An isolated eight-candidate comparison and five switch thresholds retain a forgiving 5,000 to 10,000-office region and roughly 28% staged advantage over static Grow. No other era is padded to meet an abandoned minimum-duration target. |
| Letters conceal a mechanical reward gap in reports | Report letters and nonstarting protocols separately. New checks exclude the two starting protocols, enforce first new protocol within five minutes, and mechanical gaps including completion within ten minutes. Original combined-cadence and completion tests remain unchanged. |
| Staffing decisions lack economic forecasts | Draft allocation uses the same real assignment action and previews expected production, demand, and retail net with cents. Forecast limits are explicit. Sales reach depends on cultivar/headcount, distinct from traits' influence yield. Research and welfare value are not reduced to cash. |
| Objectives always send players to Development | Route staffing and cash/insight blockers to Office, influence/acquisition/branch blockers to Company, project prerequisites to Development, and leave correspondence instructions beside the actual letter. Tests distinguish prerequisites from later expansion blockers. |
| Contract deadlines punish acceptance without any forecast | Show estimated delivery at the default half allocation and warn about throughput and supply risk. Keep the manual decision available, including plans to change allocation. Estimates do not guarantee future conditions. |
| Incorrect effect descriptions | Equipment shows 30% per level after centralization. Capacity says up to double. Coffee/snacks disclose morale benefits. Logistics describes doubled purchasing power, not doubled physical forms per pack. Branch recruitment discloses production-only roles and reserve-spending bulk affordability. |
| Space silently files on other workspaces | Restrict the filing shortcut to Office and intended filing focus. Normal reading/scanning elsewhere must retain keyboard behavior. |
| Live ETA announces continuously; cues remount live regions | ETA is outside the status region; categorical bottleneck remains live. Action feedback uses a stable live container. Exact allocation has numeric entry as well as sliders. |
| Essential text is too small and meaningful gray text misses contrast | Raise text below 12px to 12px, essential mobile text to 14px, and meaningful #777 text to #666. Preserve Berkeley Mono, square corners, white surfaces and hairlines. Fresh browser reflow and assistive-technology verification remain outstanding. |
| Ending prevents optional letters from being read | Read-only correspondence actions remain legal after ending; finale readiness survives ending. Clarify the finite inherited backlog and retirement of ongoing retail obligations. Robin's absence indicates former headquarters membership, not a guessed reason for departure. Ownership copy matches the actual commitment. |
| Stale tabs overwrite later progress; imports hide save failure | Compare the last observed storage snapshot before writes, block stale/unreadable saves, retain local export, and surface import persistence failures. Explicit reset/import can refresh the snapshot. Comparison is not an atomic cross-tab lock. |
| Invalid generated state can silently serialize as a corrupt save | Validate before writing, reject extreme imported resources, guard counter increments, and preserve the previous record on failure. Safe arithmetic is not proven closed for every artificial near-bound resource addition. |

## Retained decisions and limits

The initial 28-form hire, three pre-Network workspaces, two-gene profiles, immutable employee/cohort traits, named correspondence, fixed project tree, passive stock standing, shared incentives, placement fees, finite billion-workflow target, two endings, and reincorporation remain. Their detailed rationale and objections are in the mapped ledgers. The user explicitly requested the hairline aesthetic, Berkeley Mono, cubicles, immutable hires, genes, incentives, and passive market standing. They are product constraints; citations cannot independently prove an aesthetic preference.

Exact prices, escalation factors, downtime probabilities, reveal thresholds, gene bonuses, reserve horizons, safety margins, and legacy credits are designer hypotheses supported to varying degrees by accounting tests, return calculations, and sensitivity experiments. Permanent choices need not have equal financial returns. Firing is voluntary flavor because transfer dominates it economically. Branch geography is flavor, not territory strategy. Acquisitions are an ascending ladder, not six equally viable builds. The two initial Network protocols are onboarding steps, not deep branching strategy.

The $250,000 patent settlement is legal restitution with little late-game economic weight. Ongoing legacy retail revenue intentionally funds the Network, but can trivialize infrastructure cost. Enterprise and Conglomerate transform the economy less sharply than Universal Paperclips. These decisions are retained with explicit limitations, not certified as equivalent depth.

## Observed waiting incident and validation

The submitted save has about 12 offices, 100% processing, and no discovery, replication, or stabilization. It owns 75,437 plants and 14,089 servers. Waiting empties the located backlog and loses offices; money and excess capacity cannot fix allocation. Reviewers inspected and simulated copies without changing the attachment or the user's browser save. The regression fixture includes mechanical state, not the submitted employee records.

Current pacing and exact-save comparisons are regenerated in [BALANCE.md](BALANCE.md). The earlier fourteen-minute recovery and fixed Survey-then-Parallel recipe are historical measurements. The current adaptive player compares funded forecasts at one-minute intervals and can retain Standard when another route would be worse. Both management paths retain the original four-hour ceiling, ninety-minute eager-player target, fewer than 350 modeled interactions, first additional protocol within 300 seconds, and mechanical gaps within 600 seconds. Tenders are optional and excluded from baseline progression.

The source-informed swarm made these concrete changes:

| Before | After | Adversarial disposition |
| --- | --- | --- |
| Discoveries and outcomes could vanish into other workspaces. | Persistent New markers, individual keyboard inspection, named milestones, contract receipts, and global tender settlement notices. | Filing announcements were separated from discrete results; imported old discoveries baseline without flooding. |
| Randomness chiefly caused downtime. | Changing tender priorities, deliberately selected approach and exposure, eight-second evaluation, exact persistent result. | Client names no longer predict the winning approach. Research is paid upfront; explicit reserves and historical costs remain respected. |
| Inherited wealth weakened Network costs. | Work-funded natural replication, coordination load, and funded routing sacrifices. | Standard, Survey, and Parallel win different tested states. Headquarters income still runs, so this is not a fully retired economy. |
| Initial purchases immediately enabled all delegation. | New delegation requires 10,000 cleared workflows, with existing saved instructions honored. | No recurring purchases are required by measured completion policies. |
| World activity was loosely connected to production. | Current inventory and actual Network work, losses, coordination, pause, and ending determine hairline geometry. | Reduced motion suppresses recurring work motion while preserving meaningful state changes. |
| Applying allocation or reserve values lost input focus. | Stable fields preserve focus and editing drafts. | Browser checks verify the same input node survives Enter. |

Historical tender quotes retain cash-only terms. New quotes disclose both cash and research at risk. Manual bids protect the explicit knowledge reserve and may delay the named next procedure; automatic Research first investment separately protects procedure funding. A rejected hard reserve initially made meaningful early bids inaccessible. The economy review reproduced that failure and the manual-budget rule was corrected. Linear positive expected returns still favor maximum exposure for a risk-neutral player; this remains a limitation rather than a claim of perfect strategy balance.

Original tests were retained, including the observed backlog stall, payroll and supply recovery, immutable inherited traits, resource conservation, save validation, cadence, and action budgets. Formula-informed simulations do not model thinking, scrolling, or whether someone chooses to return voluntarily. Source research and adversarial review do not establish addiction, awards, or Universal Paperclips parity.

Browser checks used isolated QA origins and generated fixtures. They covered fresh disclosure, progressive markers, tender commitment/pause/outcomes/reload, stable keyboard focus, reduced motion, and mobile layout at 320 and 375 pixels. The actual attachment was only read; employee fields, cohorts, and funds remain preserved. DOM status-region checks are not a certification of real screen-reader speech. Sound quality and human engagement remain untested.

Final verification: **184 tests pass, 1,828 assertions; TypeScript and production build pass.** The regenerated balance report covers six fresh runs finishing in 38.2 to 42.2 minutes with 312 to 332 modeled interactions. The first additional procedure arrives within 300 seconds; the largest mechanical gap is 570 seconds, below the unchanged 600-second ceiling. The slower one-decision-per-minute policy finishes in 179.4 minutes, below the original four-hour ceiling.

On the exact submitted save, Manual/Standard finishes in 906 seconds and Research first/Standard in 617 seconds. Adaptive routing also takes 617 seconds because its funded comparisons retain Standard for this run. These need six or seven commands, zero recurring maintenance commands, and preserve the configured cash reserve. The first new procedure arrives after 221 seconds. These are engine simulations of legal actions on an unmodified copy, not predictions of human play time.

The final procedure's productivity increased from 20 to 24 times at its unchanged 25,000-knowledge price. This narrowly addresses the measured closing wait after conservative coordination margins, without reducing costs or weakening cadence tests. A forced Grow refresh after Institutional memory was rejected: slower coordination repair made it worse. The interface instead discloses that staffing tradeoff as an optional comparison. Clear's finite-pool allocation uses current discovery and processing capacity; it does not automatically change staffing.

Remaining limits include inherited headquarters wealth, a simpler tender resolution than Paperclips' matchup tournament, risk-neutral preference for maximum exposure, and no human engagement study. The production build emits a bundle-size advisory for its approximately 517 kB main JavaScript chunk. No deployment was performed.

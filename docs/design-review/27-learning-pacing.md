# Learning pace: independent adversarial review

Reviewed 2026-10-04. Scope: a friend's report that opening and corporate upgrades became available too quickly to understand their interactions. This is qualitative human evidence about introductions, not evidence that every phase needs a longer completion time. No production files or tests were edited by this reviewer.

## Sources and limits

Retrieved again during this review:

- [Nielsen Norman Group, Progressive Disclosure](https://www.nngroup.com/articles/progressive-disclosure/). It recommends showing a few important options initially and disclosing secondary features on request. This supports controlling simultaneous concepts and grouping secondary material. It does not establish a universal one-minute introduction interval or require hiding necessary operating controls.
- [Anthony Pecorella, The Math of Idle Games, Part I](https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i). The article says mathematically optimal purchasing is too micromanagement-heavy for a human and describes bulk purchases that simplify decisions. This argues against extending the game through repeated mandatory supply, staffing, or renewal actions. It does not establish optimal Cube Farm prices.
- [Universal Paperclips main.js](https://www.decisionproblem.com/paperclips/main.js) and [projects.js](https://www.decisionproblem.com/paperclips/projects.js). The first autoclip improvement requires an autoclip, MegaClippers require 75 clippers, WireBuyer requires 15 wire purchases, and AutoTourney follows a working strategy engine and 90 trust. These are gates related to system state. Requiring 15 repeated purchases is an inspected historical mechanic, not a recommendation for Cube Farm. The prior full source audit is [18](18-paperclips-source-audit.md).
- Existing [core-loop review](01-core-loop.md) and [pacing evidence review](13-pacing-evidence.md) distinguish opportunity to learn from actual comprehension, and legal completion from enjoyment. Those distinctions still apply.

The friend's report diagnoses one problem but does not quantify ideal intervals. Source patterns supply design constraints, not certification of fun. A delay gives an opportunity to observe an effect; it cannot prove the player understood it.

## Inspected baseline

`discovery.ts` reveals business at $60 lifetime revenue and Development at $100. Upgrades and facilities reveal independently at revenue thresholds. `visibleProjects` requires dependencies, the current era, and 60% of each revenue target. `projectReason` separately checks affordability and structural requirements. The engine uses those helpers for important purchases, while research profiles and genes have their own direct revenue/dependency guards.

Independent seed-7 stewardship replay used the existing legal `playthrough` actions, initial state and identical RNG, observing state before and after each action and advance. It recorded first visibility rather than purchases. The temporary replay script was removed afterward.

| Time | First-visible baseline burst |
| --- | --- |
| 64 seconds | Business, equipment, Time study card |
| 84 seconds | Development |
| 104 seconds | Coffee and Processor recruitment |
| 194 seconds | Time study purchase immediately reveals Departments, procurement, brand and standards |
| 684 seconds | Charter immediately reveals Company, logistics, analytics, legal and both management-path cards |
| 1,024 seconds | Analytics immediately reveals delegation, cultivation and centralization; Legal at the same timestamp reveals mergers |
| 1,034 seconds | Cultivation immediately reveals inherited-trait controls and all three base genes |
| 1,054 / 1,074 seconds | Cognition, then Synthesis |

The baseline reaches Enterprise at 684 seconds, Conglomerate at 1,234 seconds and Network at 1,464 seconds. Purchase spacing understates the problem: a disabled, newly visible card still introduces a concept. Revenue increases exponentially, so raising thresholds alone will compress again after successful growth.

## Recommended decision and objections

| Candidate | Adversarial objection | Acceptance requirement |
| --- | --- | --- |
| Increase prices or lower revenue globally | Increases waiting and alters payroll, demand and supply viability without controlling introduction bursts. It can recreate the reported stalled-run problem. | Reject as the primary remedy. Existing economic formulas and recovery remain intact unless separately justified by evidence. |
| Require inspection, acknowledgment or tutorial clicks | A click is not comprehension. Can force chores, trap keyboard users and punish experienced players. | Do not make New markers, focus or correspondence acknowledgment an invented proof of understanding. Existing authored narrative commitments may remain. |
| Delay every unlock on wall clock | Arbitrary clocks can hide necessary recovery actions, reward leaving the tab, or make pause behave misleadingly. | If using a short settling window, base it on simulation progress, make the remaining condition explicit, never consume resources to wait, and describe it as observation opportunity. Necessary supplies, demand and hiring recovery must remain accessible. |
| Stagger genuinely new families through meaningful prerequisites | Adds ordering, but a dependency can accidentally make an optional feature compulsory or force a worse economic decision. | Each new prerequisite must have a explained gameplay purpose. Avoid mandatory bad investment, repeated contracts, supply purchases or particular policy/genome. Preserve multiple management paths. |
| Separate secondary upgrades behind ordinary disclosures | Reduces simultaneous visible controls without slowing mechanical progression, but hidden ready controls can remain undiscovered. | Summary must visibly report available choices and remain keyboard/touch accessible. Ready essential actions remain outside collapsed detail. Avoid adding tabs. |
| Reuse historical knowledge to bypass introductions | Properly avoids re-locking existing saves, but broad bypass conditions can make every new control appear instantly in a partially progressed save. | Preserve already owned, already actionable and historically discovered controls. Never infer a fresh game from a missing newly added field. Validate migrations and fresh state separately. |

A defensible narrow change controls first introduction of related families, keeps existing controls available and gives players an explicit next target. It preserves economic decisions during the interval. It must not make all corporate systems queue behind a single tutorial or prevent the user exploring voluntarily.

## Before/after acceptance contract

These are provisional product budgets chosen to address the reported burst. They are not research-derived cognitive limits.

1. Measure first-visible Office and corporate families through a legal fresh run, including disabled cards. Report a timeline independently of successful commands.
2. A purchase should not cascade through unrelated brand-new families in the same simulation timestamp. Treat complementary controls belonging to one mechanism, such as research balance plus Departments, as one introduction; do not rename unrelated controls into a single family to satisfy the budget.
3. Time study must not introduce procurement, demand expansion and quality standards as an unexplained simultaneous purchase list. Necessary procurement and demand recovery remain discoverable, with an explicit next requirement.
4. Charter must not instantly dump logistics, analytics, legal, both paths, tender, policy and contracts into the player's next decision. Keep the initial governing choices concise; give later capabilities a distinct introduction and visible goal.
5. Cultivation must preserve the real two-slot profile decision and historical inheritance. Avoid showing a three-gene shopping list followed by both advanced genes inside 40 seconds solely because previous revenue already exceeds every gate.
6. No mandatory repeated purchase or click-count requirement is added. Routine purchasing remains automatable. Price changes and supply recovery remain usable during settling windows.
7. Save imports, offline catch-up, bankruptcy, pause and replay must not silently hide controls the company already earned. Existing employees, cohorts, genes and paid upgrades remain unchanged.
8. Opening remains reachable with 28 manual forms and first hire within 60 seconds. Original discovery and completion limits remain: at least three milestones and the first project within 300 seconds, Enterprise within 900 seconds, Conglomerate within 2,100 seconds, eager full runs within 90 minutes with fewer than 350 clicks and modeled interactions, and slower informed runs within four hours. Preserve first nonstarting Network procedure within 300 seconds, combined Network event gaps within 360 seconds, protocol-only gaps within 600 seconds and reported recovery within 1,200 seconds. New learning budgets supplement these ceilings rather than replacing or weakening them.
9. Test each actual engine guard as well as rendered availability. A hidden card must not become purchasable via direct dispatch before the shared gate. Previously owned upgrades remain purchasable according to existing economics.
10. Report final measured timelines and remaining human uncertainty. Do not claim a slower timer establishes comprehension, addiction or award quality.

## Review status

Initial recommendation sent to the implementation owner. Re-review and final disposition will be appended after the concrete design and evidence are available. Existing numerical completion/cadence ceilings must remain unchanged.

## Concrete proposal: pre-implementation disposition

The implementation owner proposed fresh-only operating-time anchors at first hire and completed projects. Missing historical learning data bypasses the new delays. No prices, output, economic costs or mandatory acknowledgment counts change.

| Before | Proposed after | Disposition |
| --- | --- | --- |
| Time study reveals Departments and three projects together | Departments immediately; procurement at +45 seconds, brand +90, standards +150, charter +240 | Conditionally retain. Economic recovery stays accessible. These are distinct observing windows, not a comprehension test. |
| Charter reveals every eligible child project | Core contracts, policies and health first; logistics +60, management paths +120, analytics +180, legal +240 | Conditionally retain. Both paths remain alternatives. Hide future cards until introduction, with one explicit next goal rather than the whole disabled queue. |
| Analytics reveals cultivation and centralization together | Cultivation +90, centralization +180 | Retain provisionally. Delegation belongs to Analytics itself and remains immediate. |
| Legal immediately previews all acquisition controls | Merger approval +120; acquisition list mounts only after approval | Retain. Readiness and direct action guards must agree. |
| Cultivation's advanced genes follow immediately from historical revenue | Cognition +120, Synthesis +240 after cultivation | Retain provisionally. The three base genes may remain a single real profile decision. Do not force purchasing a particular gene as a lesson. |
| Opening amenities and improvements arrive near each other | First-hire floors stagger coffee, Processor, training, snacks, quality and memos | Retain if the first successful hire is a stable anchor and capacity, supplies and pricing recovery remain unaffected. Subsequent hires must not restart the delay. |
| Tender occupies the top of Company immediately on Charter | Not covered in the initial proposal | Open objection. Tender introduces client priorities, three approaches, cash and research risk, evaluation and receipts. This undermines the proposed simpler Charter opening. Recommend a fresh Charter +90-second gate or a concise ordinary disclosure with an explicit readiness cue. Active and historical tenders must remain inspectable. No completed-contract prerequisite. |

Two additional constraints were sent to the owner. The Enterprise objective currently selects Analytics before all other projects, so its +180-second delay must not imply that nothing is available while Logistics and management paths arrive earlier. And operating elapsed time includes offline catch-up: it deliberately preserves normal progress and avoids attendance chores, but cannot establish that a returning player observed the intervening systems. The final description must preserve that limitation.

Pre-implementation verdict: conditional approval, with the Tender omission unresolved. Numerical timings are conservative tuning hypotheses. They must earn acceptance through first-visible timeline tests, intact original pacing ceilings and subsequent human feedback, not through this source review alone.

## Implementation re-review

Inspected the production diff and new `learning.ts`. Fresh state uses staged, validated first-hire/project anchors; missing save data defaults to legacy access. Anchor recording is idempotent. Project, facility, upgrade, recruitment, gene and tender gates are used by the corresponding action paths as well as rendered availability. Learned ownership bypasses new introduction windows. Pricing, supply recovery, capacity and economic formulas remain unchanged.

The Tender omission is resolved by a shared +90-second Charter window. The compact pending text explains operating seconds and pause. The acquisition panel is absent until merger approval, preserving existing acquisitions. `nextLearningProject` selects one pending introduction. Objective fallback can point to currently useful projects instead of implying that the player must wait for Analytics.

A further +120-second Regional-to-Franchise window was added after a genuine legal run reached Network before the Extraction profile's Synthesis window. Its independent purpose is to provide room to inspect branch staffing/output before a tripling multiplier. Keeping the original profile assertion rather than deleting it is appropriate. The delay remains a tuning hypothesis, not proof that players need exactly two minutes.

Two UI objections were sent to the owner:

- Tender remains mounted above the board and contract controls in `App.tsx`. Replacing its small countdown with a section after 90 seconds can move controls during use. Place the newly revealed section below core governing controls, preserving result destinations and scroll anchors.
- Objective fallback selects the first ready project in canonical order. When both management paths become available, this can specifically recommend Stewardship. Use a neutral management-path goal describing permanent alternatives rather than implying one is the correct next step.

Independent verification: `bun test src/game/experience.test.ts src/game/pacing-review.test.ts` passed 30 tests with 488 assertions. Original first-project, early-discovery, era-entry, full-run, interaction, reported-recovery and Network cadence ceilings remain intact in the inspected tests. Accounting fixtures marked legacy do not replace fresh legal-run coverage: `playthrough` still starts from genuinely staged `initialState` on both management paths and all three seeds.

Measurement plan accepted with limits: record first-visible rendered controls before and after actual legal actions, distinguish families from individual cards, and retain a separate successful-purchase timeline. Add burst regression tests alongside the original upper limits. Recovery and historic ownership need actual action checks. This can establish that introductions are staggered for tested policies, not that comprehension or enjoyment improved. Operating elapsed includes offline earnings, so returning users can still encounter several ready discoveries together. No attendance requirement should be added to prevent that.

Final disposition remains conditional on the two UI objections and concrete first-visible evidence. No economic or test-threshold weakening was found in this re-review.

## Final disposition

Approved as a scoped introduction-pacing change. Tender now follows the core board/contracts section, so its timed arrival does not move those earlier controls. Objective fallback names both permanent management alternatives neutrally. Memo automation now observes the same introduction guard as the manual action; an explicit 420-to-450-second regression checks the bypass found during review.

Independent final check: `bun test src/game/learning.test.tsx src/game/experience.test.ts src/game/pacing-review.test.ts`, 39 tests passed with 651 assertions after the final Franchise handoff adjustment. The nine new tests include rendered availability, shared dispatch guards, migration, offline progress, pause, recovery and actual base/advanced-profile hiring without rewriting original genes. Rendered tests use explicitly funded snapshots to isolate handoffs; they are not presented as earned playthroughs. The separate six legal fresh runs retain genuine staged state, original completion/cadence budgets and every first-visible record.

| Seed-7 stewardship handoff | Baseline first visibility | Final first visibility |
| --- | --- | --- |
| Departments / procurement / brand / standards | All at 194 seconds | 204 / 254 / 294 / 354 seconds |
| Company health, policy and contracts | Charter at 684 seconds, alongside the eligible corporate project list and tender | Charter at 684 seconds; these governing controls deliberately remain together |
| Logistics / Tender / management alternatives / Analytics / Legal | Eligible Charter children immediately at 684 seconds; Tender immediate | 744 / 774 / 804 / 864 / 924 seconds |
| Cultivation / Cognition / Synthesis | 1,034 / 1,054 / 1,074 seconds | 1,104 / 1,224 / 1,344 seconds |
| Franchise to Coordination / Continental | Both cards at 1,294 seconds when Franchise was purchased | Franchise purchased at 1,364 seconds; Coordination at 1,424 and Continental at 1,484 seconds |

The six independently reproduced legal runs finish in 41.6 to 45.1 minutes, with 326 to 346 modeled interactions. This intentionally addresses introduction bursts rather than adding a global duration target. The targeted advanced-profile test proves that a fresh company can hire future workers with the profile. Extraction seeds 7 and 42 select that profile without making another headquarters hire in the baseline policy; those runs must not be described as demonstrating baseline use of it.

The new purchase-cascade assertion filters records by their action source. This is legitimate causal attribution: at seed 101, Processor is introduced by `advance` and Departments by `project` at the same 224-second timestamp. The raw timeline retains both. Filtering must not support a claim that every reveal is separated or that simultaneous introductions are impossible. Some independent introductions still occur ten seconds apart. The remaining Franchise purchase cascade was subsequently resolved with its own anchor: Coordination at +60 seconds and Continental at +120 seconds, with no project-caused introduction at the purchase itself. The fix provides distinct windows for the identified opening/corporate cascades, not a universal one-family-per-minute guarantee.

No original completion, discovery, interaction or Network-cadence ceiling was weakened. No mandatory repeated purchasing, acknowledgment gate or historical control loss was found in this scoped review. Operating-time windows and clearer ordering are defensible hypotheses addressing the human report. Whether they provide enough room to understand each interaction requires another fresh human playthrough.

The final Company layout uses two columns before merger approval rather than reserving an empty competitor column. This supports the narrower initial governing surface without changing existing acquisitions. Independent rechecking of the unchanged experience and pacing tests confirms all original budgets still pass after the final Franchise adjustment. Extraction seeds 7 and 42 still make no headquarters hire after selecting Synthesis; that limitation remains current, not historical.

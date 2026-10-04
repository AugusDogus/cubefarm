# Core loop and discovery: adversarial design review

Reviewed 2026-10-04. Scope: fresh start, manual production, reveals, reward cadence,
Office/Enterprise/Conglomerate/Network transitions, and the evidence supporting
them. This is a researched design argument, not a certification of enjoyment.
Production files and tests were not changed by this reviewer.

## Sources actually retrieved

All five URLs below returned HTTP 200 during this review. Original downloaded
HTML/JavaScript was inspected, not just search summaries. Temporary copies were
removed after review.

1. Universal Paperclips, actual web game:
   https://www.decisionproblem.com/paperclips/index2.html
   https://www.decisionproblem.com/paperclips/main.js
   https://www.decisionproblem.com/paperclips/globals.js
   `globals.js` starts with zero clips, funds and clippers, 1,000 wire, and a
   $0.25 price. `main.js` shows Autoclippers after funds reach $5; computing and
   projects appear at 2,000 clips, or through a specific insolvency recovery
   condition. It hides Business and Manufacturing when `humanFlag === 0`.
   **Correction:** the actual opening already includes Business price, demand,
   marketing and wire purchasing. It is inaccurate to describe it as literally
   one visible button. The relevant precedent is staged automation and later
   replacement of the old economy, not copying every opening control.
   Limitation: source inspection establishes implemented behavior, not which
   detail caused enjoyment or awards. Historical versions may differ.

2. Anthony Pecorella, *The Math of Idle Games, Part I*, 2016:
   https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i
   Retrieved passage: the model defines optimum as the "best income:cost ratio";
   players "usually buy in bulk to simplify the decision process" because the
   mathematical optimum can be too laborious. The author warns that a newest
   generator that is nearly always dominant removes interesting decisions, then
   demonstrates how changing multipliers shifts useful investment priorities.
   Application: compute marginal returns and remove purchase chores, but judge
   the competing decisions at real company states. Limitation: its simplified
   model is not a human playtest and does not directly model Cube Farm's demand,
   payroll, supply, role or narrative systems.

3. John Hopson, *Behavioral Game Design*, 2001:
   https://www.gamedeveloper.com/design/behavioral-game-design
   Retrieved passages: this is "not a blueprint for perfect games"; players
   compare the "very next thing" with other available activities; an hour before
   anything interesting creates low motivation; "sharp changes in the rate of
   reward" can frustrate. Access to the next stage can itself be a reward.
   Application: make discoveries understandable and avoid long empty gaps or
   unexpected economic collapse. Limitation: an old behavioral framework does
   not establish the attractiveness of any particular letter or unlock. Do not
   apply its avoidance/reinforcement discussion as a justification for punitive
   attendance timers or coercive retention.

## Decision inventory

Disposition meanings: **retain** has a defensible purpose; **provisional** needs
human or additional model evidence; **revisit** identifies a concrete mismatch.
Numeric thresholds are tuning hypotheses unless explicitly tested below.

| Decision and implementation | Rationale and researched grounding | Adversarial objection | Disposition |
| --- | --- | --- | --- |
| Zero cash, zero workers, one empty cubicle; `state.ts:initialState`, `App.tsx:workspaces` | Earn the transition from personal work to automation. Actual Paperclips also starts with zero automatic production. | Extra minimalism is our interpretation, not an exact Paperclips reproduction. Seeing too little may also fail to create anticipation. | Retain; test whether a new player recognizes the hire opportunity without instruction. |
| Filing consumes stock, creates inventory, then sells; `engine.ts:process`, `economy.ts:tickEconomy` | The opening teaches the same production/sales model workers will use. Paperclips' `clipClick` likewise consumes wire and creates unsold clips. | Currency arrives on a timer rather than immediately. A player could think their action failed unless inventory and feedback make causality clear. | Retain; browser observation must distinguish filing feedback from subsequent payment. |
| 0.35-second filing cooldown and Space repeat; `engine.ts:process`, `App.tsx:keydown`, `useGame.ts` | Avoid an unlimited event-rate money engine and make stamping legible. | No retrieved source establishes 0.35 seconds as enjoyable. A disabled button during a 250ms simulation cadence can feel sticky. | Provisional. Keep the 28-form/60-second contract; observe ordinary pointer, keyboard and touch use. |
| Emergency service filing when stock is empty; one-time supplier relief; `engine.ts:process`, `Operations.tsx`, `strategy.ts` | Avoid permanent insolvency. Actual Paperclips has an insolvency-specific reveal, so recovery is part of its progression rather than a destructive reset. | Emergency filing bypasses retail and payroll can consume its proceeds. Supplier relief is a recovery intervention, not the ordinary loop. Repeated high-payroll insolvency may still require reducing staff. | Retain explicit recovery. Test zero-cash/zero-stock with a real workforce and confirm that the UI explains the next sustainable step; do not call free relief an investment reward. |
| First worker costs $35, earned by 28 sold forms; `catalog.ts`, `engine.ts:hire` | A short visible fixed goal creates the first meaningful automation reward. | The number is a tuning choice. Scripted 14/28-second openings exclude hesitation and missed feedback. | Retain as a tested target, not proof of optimal pacing. |
| Hiring notice at $10, business/equipment at $60, Development at $100; `discovery.ts` | Let the next goal appear before affordability; reveal retail control after a small loop has been learned. This uses actual Paperclips' flag-based disclosure principle. | Revenue gates are proxies for learning. A player can reach them through clicking without experiencing supply or demand problems. | Provisional. Explain new controls through observed bottlenecks; preserve learned controls after bankruptcy. |
| Separate facilities, training, QA, capacity and genetics reveals; `discovery.ts`, `Research.tsx`, `Workforce.tsx` | Avoid previewing all future upgrades. Genetics follows Imani's explanation. | A reveal can still dump several choices at once, especially on Development. Hidden irrelevant choices are good; unexplained visible choices are not. | Retain gating. Check each first reveal for a comprehensible next decision. |
| Visible projects require prerequisites and 60% of their revenue gate; `projects.ts:visibleProjects` | Show a near-term aspiration without listing distant eras. | The 60% constant is arbitrary. The objective can name a target before that project's card appears, and several cards can arrive simultaneously. | Provisional. Check objective/card consistency and expose the exact remaining requirement. |
| Lifetime revenue plus cash/insights/influence project gates; `projects.ts:projectReason` | Prevent cash alone from skipping new systems; encourage department allocation. | Multiple resource bars can become a checklist rather than strategic choice. Lifetime revenue gates may only lengthen waiting after the player has already solved the business. | Provisional. Distinguish a genuine new constraint from elapsed-profit grind in human observation. |
| Continuous process reviews after Time study; `economy.ts:research` | Remove the former repeat-click tax. Pecorella explicitly cautions against optimal micromanagement. | Passive review yield can make assigning researchers optional or obscure their value. | Retain automation; require researchers to offer a noticeable situational acceleration. |
| Office to Enterprise: board, contracts, policy and permanent promise; `projects.ts:charter`, `story.ts:promise` | Shift from personally managing output to governing people. Stage access can itself reward progress. | New systems are added while the same cash engine remains. This is less transformative than Paperclips removing the human market. | Provisional. Judge whether choices change the player's plan, not merely increase the number of cards. |
| Enterprise to Conglomerate: acquisitions, three-plus branches and immutable cohorts; `projects.ts:regional`, `Expansion.tsx` | Replace individual hiring effort with institutional scale and bulk profiles. | In benchmarks this era lasts roughly 3.5 to 6.5 minutes, making it potentially a short purchase bridge. Numbers getting larger are not a new verb. | Revisit if playtests find no distinct challenge. Measure one consequential cohort/market decision before Network. |
| Network replaces Office with Archive; `App.tsx`, `projects.ts:sovereign` | Reorient attention to allocation, finite work and power/compute rather than old tasks. Actual Paperclips hides retired business systems. | Cube Farm archives the UI but continues `tickEconomy`; old headquarters can dominate money and fund new infrastructure. The finite world's economic premise therefore differs materially from Paperclips. | Provisional intentional difference. Do not claim equivalent structural transformation. |
| Eight founding offices, a viable growth default and explicit Grow/Survey/Clear plans; `network.ts:initialNetwork`, `strategy.ts:network-plan` | Grow safely without making recognizing an unannounced replication requirement a prerequisite for progress. | The earlier zero-replication default was a tutorial obligation and contributed to a real player's stagnation. Plan superiority must arise from the simulation, not from the helper knowing a magic switch point. | Retain viable default and benchmarked plan differences; test a bounded, visibly informed player rather than only the 5,000-node oracle. |
| Growth coordination scale 1,500, six procedures, knowledge from work /60; `network.ts` | Diminishing returns create a point where clearing beats continued expansion. Faster knowledge removes the earlier 14-minute empty gap. | Constants were fitted against one player family. Protocols remain universally beneficial, so research order mostly follows affordability. | Provisional. Keep staged/static comparisons and measure sensitivity to switch times and procedure order. |
| Six growth letters plus halfway/finished correspondence; `story.ts`, `Correspondence.tsx` | Reward institutional growth through voices and a gradually clearer final question. No response appointment is required. | A paragraph is only a reward if the player values it. Thresholds could merely cover up a long wait; acknowledgment order affects when the next letter appears. | Retain authored progression, but classify narrative versus mechanical discoveries separately in evidence. |
| Finale after a finite billion workflows, two ownership choices; `network.ts`, `strategy.ts:ending` | Gives the efficiency loop an endpoint and ties its purpose back to people. | Continuing headquarters retail while declaring no work remains is a metaphorical rather than literal world model. The patent fee is symbolic at late wealth. | Retain theme, disclose abstraction and fee limitation. Do not call the ending cost a substantial economic consequence. |

## Findings and evidence limits

**P1: the sole automated player is too informed to establish human pacing.**
`testing/playthrough.ts` knows all formulas, searches retail prices for maximum
steady income, buys relevant projects whenever possible, and switches at a known
5,000-office threshold. Different random seeds alter downtime, not knowledge or
decision quality. Both management paths are useful coverage, but remain the same
algorithmic player family. Add an imperfect player using visible warnings and
infrequent decisions, and separately observe fresh human players. Keep existing
legal-run checks; do not relax tests because the imperfect player struggles.

**P1: current reward-gap evidence does not establish that the gaps are rewarding.**
The six legal runs previously inspected finish in 58.4 to 65.1 minutes. Network's
first counted discovery occurs at 210 seconds and longest counted gap is 340
seconds. `experience.test.ts` counts `protocol` and `read-letter` commands as
rewards. This proves availability and cadence under immediate acknowledgment,
not narrative appeal. Mechanical Network discoveries still have a longer first
gap than the first letter. Report both classes and measure delay from actual
reveal, not merely the scripted read command. Do not substitute required clicking
for meaningful events.

**P2: stage labels overstate parity with the reference if presented without
qualification.** Paperclips changes what the world and its resources are, and
removes old markets. Cube Farm's Enterprise and Conglomerate mainly extend the
same economy; Network changes the active controls but retains its financing.
This may be coherent for corporate satire. It does not justify the claim that
four named eras equal Paperclips' depth. Human evidence should address whether
each era causes a changed strategy or understanding.

**P2: aspirational targets are not all contracts.** `DESIGN.md` names 8 to 15-minute
Enterprise, 20 to 35-minute Conglomerate and 45 to 90-minute finales. Tests enforce
upper limits, not the lower bounds, and `BALANCE.md` acknowledges this. That is
reasonable if targets stay honestly labeled. More important than enforcing an
arbitrary lower duration is demonstrating that the player has experienced the
new era's meaningful decision before leaving it.

## What can be claimed

The opening now earns automation, systems reveal progressively, late chores are
delegated, and legal modeled players reach a finite ending with documented
discovery cadence. The researched sources justify evaluating marginal value,
disclosure, reward gaps and changes in player activity. They do not validate the
chosen constants or the appeal of the writing. Universal Paperclips-level fun,
addictiveness and award quality remain unproven until independent playtesting.

## Follow-up: an actual player's stalled Network

The user supplied a save after reporting that Network consisted of waiting. This
is direct qualitative player evidence, stronger than the automated player for
the question of whether its guidance works. The attachment was read and parsed;
the file and browser save were never overwritten. Recovery simulations ran only
on an in-memory copy.

The saved allocation is 100% processing, zero discovery, zero replication and
zero stabilization. There are 11.957 offices, 3,728 located forms, almost one
billion undiscovered forms, 75,437 power plants and 14,089 servers. Thus waiting
cannot fix this run. After 120 unchanged simulated seconds, the located backlog
is empty, processing is zero, and instability has reduced offices to 8.338.
The enormous infrastructure purchase does not increase the number of offices or
their processing capacity. Stored energy and compute are already abundant.

Applying Grow, buying procedures only when legally affordable, and switching to
Clear at 5,000 offices completes the attached state in 2,210 seconds, or 36m50s.
This is still a formula-informed recovery, not a second human playtest. Growth
crosses 25 offices after 140 seconds, the first additional procedure is available
after 450 seconds, and 5,000 offices arrive after 1,680 seconds. Those are long
intervals for a player seeking active decisions: the first letter is not a new
mechanic, and the major stage change remains approximately 28 minutes away.

**P0, corrected direction:** give new Networks a viable safe growth allocation,
and provide contextual Grow guidance for existing zero-growth saves. Explain
zero discovery and insufficient stabilization separately. Merely adding numeric
allocation inputs fixes an interaction problem, not the missing causal model.
Do not overwrite the player's chosen allocation silently.

**P1, remaining:** conspicuous Max affordable infrastructure encourages enormous
purchases that do nothing at the current bottleneck. When power/compute capacity
already exceeds office needs, show that marginal production benefit is zero.
Needed remains the sensible default. A billion dollars spent without changed
throughput should not look like a successful productivity upgrade. Avoid solving
this with resource refunds or new infrastructure mechanics unless separately
authorized and validated.

**P1, remaining:** Grow restores viability, but does not prove that 37 minutes of
growth and clearance is compelling to this player. The sourced Hopson discussion
specifically concerns motivation for the next activity; more passive paragraphs
cannot automatically satisfy that. The honest response is to explain the stalled
state, fix the actionable guidance, and validate the recovered loop with the
player. If the same waiting complaint persists, evaluate shorter growth and
clearance durations while retaining the staged-versus-static strategic advantage.
Do not add recurring collection buttons or timed maintenance to manufacture
activity, and do not preserve a 45-minute total-duration aspiration at the expense
of the demonstrated player experience.

The large user-state infrastructure oversupply also demonstrates why perfect
purchase algorithms were insufficient validation. Keep their accounting and
reachability tests, but add this real stopped allocation as a regression case:
no hidden completion claim, clear bottleneck explanation, an available reversible
recovery plan, and no requirement to spend additional money on already sufficient
infrastructure. Viability and human satisfaction remain separate acceptance
questions.

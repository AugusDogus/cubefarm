# Tender design adversarial review

Reviewed 2026-10-04 against the evolving `src/game/tender.ts`, `src/game/tender-state.ts`, and `src/components/Tender.tsx`. This is a design review, not a claim that human enjoyment is established. Production code belongs to the implementation agents.

## Research and criteria

The original [Universal Paperclips main.js](https://www.decisionproblem.com/paperclips/main.js?v3) was retrieved independently during this review, 209,215 bytes. `newTourney` generates a visible payoff grid after paying operations; `runTourney` resolves matchups; `declareWinner` awards the selected strategy's score multiplied by competitors beaten and optionally placement bonuses. Rankings expose comparative performance. This is a stronger interpretation exercise than a single random acceptance draw. Cube Farm should transfer visible information, chosen exposure, and explanatory results without claiming the tender recreates that tournament.

[Hunicke, LeBlanc, and Zubek, MDA](https://users.cs.northwestern.edu/~hunicke/MDA.pdf) was retrieved and its introduction inspected. Its relevant principle is that mechanics interact to produce player dynamics and experience, and require both qualitative and quantitative iteration. Consequently, three buttons alone do not establish three meaningful strategies, and passing conservation tests does not establish fun.

The review asks whether disclosed priorities alter rational choices, uncertainty remains real, losses are bounded, rewards matter in the current era, optional play remains optional, and receipts support learning without calling an unlucky result a bad decision.

## The first strategic defect and its fix

The initial proposed reward was constant for every accepted approach. Assurance always has the highest acceptance probability, so it maximized expected insight/influence/knowledge in every brief. At Network wealth, where $500,000 exposure may be negligible, this reduces play to maximum exposure plus Assurance.

The implementation now scales strategic reward by the same match-sensitive payout multiplier as cash. This preserves the fixed safety ordering while making expected strategic reward sensitive to the brief. It changes reward magnitude, not acceptance odds; no approach becomes risk-free.

For 80/10/10 priorities and full exposure, using the exact selected formulas:

| Priorities | Approach | Acceptance | Expected net cash per $1 | Expected Network knowledge |
| --- | --- | ---: | ---: | ---: |
| Quality 80 | Assurance | 84.80% | +0.286840 | 450.394 |
| Quality 80 | Responsive | 62.76% | +0.044954 | 365.734 |
| Quality 80 | Ambitious | 47.44% | +0.162992 | 407.047 |
| Speed 80 | Assurance | 81.44% | +0.047726 | 366.704 |
| Speed 80 | Responsive | 67.80% | +0.449225 | 507.229 |
| Speed 80 | Ambitious | 45.76% | +0.020906 | 357.317 |
| Scope 80 | Assurance | 79.76% | -0.066010 | 326.896 |
| Scope 80 | Responsive | 64.44% | +0.174419 | 411.047 |
| Scope 80 | Ambitious | 50.80% | +0.469390 | 514.287 |

Knowledge amounts differ by at most about 0.001 from reward rounding. These are expectations over repeated independent outcomes, not promises for one bid. All three approaches can lose the full committed stake. Cash and strategic-resource expected-value rankings intentionally agree; choosing safety still trades some expected return for a higher chance of any payoff. Near a research threshold, every accepted approach may fund the desired procedure, making the safer choice useful even when another has higher expected return. The UI should therefore disclose the alternatives rather than announce a universally best choice.

## Initial generation was too easy to memorize, now fixed

The initial generator ties each client to a 60–80% predominant priority. Exhaustive enumeration weighted by the generator's actual probability gives:

| Client | Expected-return maximizing approach distribution |
| --- | --- |
| Public Records Bureau | Assurance 90.82%; Ambitious 9.18% |
| Municipal Dispatch | Responsive 100% |
| Interoffice Commission | Ambitious 100% |

The changing numbers matter for one client, but the other two can be solved from their names forever. This fails the intended interpretation novelty, despite the three extreme briefs having three distinct winners. The objection was sent to the lead with the proposal to occasionally reverse a client's priorities explicitly in the brief, so names provide character rather than solving the decision. The final generator now samples the dominant priority independently of the client name. An independent live probe generated all three 80/10/10 priority profiles for each of the three clients using the actual draw action; every client could favor Assurance, Responsive, or Ambitious in cash and net-research expectation. Names no longer solve the choice. Matching becomes familiar through learning, which is appropriate; it is no longer a permanently correct client-name macro.

## Research exposure adds a real competing cost

Newly submitted version-2 bids pay both cash and research on commitment. A full Enterprise bid costs 6 insights; Conglomerate costs 40 insights; Network costs 175 knowledge. Partial exposure scales linearly. Acceptance odds and payouts were not improved to compensate: losing retains both losses. Full Network expected **net** knowledge is the table's expected gross knowledge minus 175, so the best approach yields approximately 275, 332, or 339 for the three extreme priority profiles rather than free gross reward.

The UI discloses paid research and maximum loss before commitment; accepted-resource previews and receipts show the net after that cost. Older submitted version-1 bids retain their original zero research cost through saved quote versioning. Repricing already committed work would be unfair and is explicitly avoided.

Manual Network tenders protect the player's **explicit** knowledge reserve, rather than reserving the next protocol automatically. Automatic Research first investment still protects its next eligible protocol. A deliberate bid can therefore risk research that could have funded an upgrade; its UI names the next eligible procedure and warns that losing research can delay it.

The preceding hard-protocol-reserve iteration was rejected after economic probes found normal protocol-first play placed no useful bids before the final procedure. This was overprotection that removed the intended decision, not evidence that the activity was balanced. The revised contract preserves the user-selected floor while restoring deliberate research exposure. For example, a manual bid under Research first can spend 175 from 500 knowledge when the explicit reserve is zero, leaving 325 on loss without changing the automatic investment policy. Setting the explicit reserve to 500 blocks that same bid.

An independent live probe of the compact reported-run fixture now permits a $500,000 Assurance bid from its 316.87643 knowledge. The actual cost is 175 knowledge; a loss leaves 141.87643, while acceptance on an 80%-quality brief leaves 673.00143. The receipt records net research -175 or +356.125 respectively. This probe settled only the tender clock, so it isolates the wager rather than claiming a whole-playthrough gain. The starting fixture remained unchanged.

## Pacing and optionality

With eight seconds resolution and forty seconds cooldown, a fully funded correctly matched version-2 tender yields roughly 5–7 expected net knowledge/second before decision time. This is significant against initial eight-office Standard production's approximately 0.493 knowledge/second, but full exposure also requires affordable cash and research above the explicit reserve. Quoting the fully funded rate as an unconditional entry bonus would be misleading.

Later, thousands of operating offices dwarf a fixed tender reward. This is an optional research wager, not a perpetually consequential endgame system. Legal comparisons now measure actual affordable bids, resource exposure and procedure timing to distinguish a useful optional activity from an optimal repetitive chore. Neither returning every forty seconds nor submitting a bid is required by any project or procedure unlock. There is no tender-only currency gate, automatic reading, automatic strategy selection or automatic bidding.

The independent economic reviewer ran three seeds (7, 42 and 101) from the legal fresh Network entry with manual and Research first capital policies:

| Policy | No tender finish | Protocol-first tender finish | Bid-first tender finish |
| --- | ---: | ---: | ---: |
| Manual | 1,117s | 1,098–1,106s | 1,074–1,097s |
| Research first | 1,088s | 1,067–1,077s | 1,043–1,067s |

The first additional protocol arrived at 300 seconds without tenders, versus 210–297 seconds with them. Active controllers placed 10–11 bids before the final procedure. Best measured completion improvement was about 4.1%, so useful earlier research does not establish a mandatory completion route. These are actual engine actions with no resource injection and validated final states. Full economic evidence belongs in [the economic audit](23-economy-swarm.md). Human enjoyment and the appeal of repeated bids remain unproven.

## UI findings addressed during review

- All three choices display priority match before submission, alongside acceptance, accepted cash profit, maximum cash and research loss, and net accepted strategic reward.
- No approach is preselected. Exposure can use small, half-available, or maximum presets, but commitment still requires an explicit selected approach.
- The resolving view retains the committed quote, including accepted cash profit, research exposure and net accepted strategic reward. It discloses that odds and submitted approach are fixed, and acknowledges pause.
- The receipt retains the client's frozen priority weights, selected approach, matched percentage, and actual cash/resource result. It explains acceptance as the random decision threshold rather than claiming a losing strategy was necessarily wrong.
- Numerical draw percentages were removed from the UI to avoid visually identical rounded odds/draws suggesting a contradictory result.
- The research formatter was increased from three to five decimal places after an independent finding that a $1 Network bid actually costs 0.00035 knowledge but appeared to cost zero. Tiny positive exposure now remains visible.
- Active-brief reward descriptions use that brief’s frozen era rather than the current era. An Enterprise brief carried into Network still accurately quotes insights and influence.
- The brief persists until submission or decline. Resolution can proceed while the player does other work. There is no repeated automatic draw, automatic strategy choice, or automatic submission.

## Residual limits

A single acceptance draw and staged progress text do not match the original tournament's visible matchups and comparative scores. The tender is a compact optional wager with readable conditions. Its prototype can create a real risk decision, but novelty and emotional engagement still need human play evidence. Future additions must earn their complexity by making conditions and consequences more understandable, rather than adding more exposure buttons or flashing.

## Independent verification

The final implementation probe exercised the actual independent-priority generator, not hand-built brief objects. The new research cost deliberately reduces expected net return without changing the safety ordering or suppressing losses. Independent final targeted verification after the explicit-reserve revision passed 25 tests and 284 assertions across the engine and component suites. It includes generation-based same-client strategy variation, research debits on win and loss, reserve protection, historical zero-cost terms, committed outcomes, truthful net receipts, and the tiny-exposure precision regression. The changed draw-count assertion reflects four independent samples and is backed by a new semantic generation test, rather than weakening an invariant. The economic review’s legal comparisons above provide current pacing evidence without treating completion as proof of enjoyment.

## Final design disposition

The raised blocking design defects are addressed: strategic rewards are match-sensitive; names no longer dictate the high-return strategy; bids sacrifice scarce current research; maximum losses and net outcomes are shown truthfully; and automation never chooses or submits a bid. No mandatory tender grind or new tender currency gate was introduced. This is a bounded optional activity with recoverable losses and player interpretation. Remaining limitations are the compact single-draw resolution, familiar priority profiles after repeated learning, fixed rewards losing relevance at very large Network scale, and the absence of human evidence that the interaction is compelling.

Manual exposure intentionally does not promise protocol protection. The regression preserves the exact explicit reserve, verifies real research sacrifice even when automatic capital policy is Research first, and leaves that standing policy unchanged. The pre-commit warning identifies the current eligible procedure at risk.

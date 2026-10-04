# Network agency: concrete next mechanics

Reviewed 2026-10-04. Recommendations only. No production files or saves changed.

## Problem to solve

The actual attached save had twelve offices, vast surplus infrastructure, and
100% processing with no discovery, growth or stabilization. That was a stopped
system, not simply a slow system. Contextual plans and a viable growth default
correct that failure. Increasing growth to 0.03 and the final procedure to 20x
reduces waiting, but neither creates another strategic decision. Six procedures
remain additive benefits, followed by a mechanical clearance tail.

The intended experience is **understanding a constraint, choosing an investment
or operating policy, seeing the institution change, and revising that choice**.
It is not attending more frequently, buying every newly affordable upgrade, or
collecting paragraphs on a schedule.

## Research grounding

This review retrieved Hunicke, LeBlanc and Zubek's *MDA: A Formal Approach to Game
Design and Game Research* from
https://users.cs.northwestern.edu/~hunicke/MDA.pdf (HTTP 200; PDF text inspected).
Its definitions separate mechanics, runtime dynamics, and desirable player
responses. It states that game content is its behavior, not merely media shown
to the player. Its tuning section explicitly requires playtesting and warns
that complicated calculations can defeat investment by making progress harder
to track. Application: new rules must create observable competing outcomes;
more upgrade cards or narrative checkpoints are insufficient.

Sources already retrieved and inspected in [01-core-loop.md](01-core-loop.md):
Pecorella's *The Math of Idle Games, Part I* warns that permanently dominant
generators remove interesting decisions, and supports modeling marginal return
and bulk purchasing. Hopson's *Behavioral Game Design* distinguishes motivation
for the next activity from overall interest. Actual Universal Paperclips source
shows reallocation across growth and finite processing and retirement of older
economies. These are design principles, not proof that the proposed constants
or mechanics will be enjoyable.

## Recommendation 1: a knowledge-funded intensive operating mode

**Strongest single addition.** Introduce a reversible operating policy after
Distributed computing. Keep ordinary operation as a viable zero-cost baseline.
An intensive policy accelerates clearance while sacrificing discovery and
replication throughput, and spends knowledge on the additional work performed.
The player decides whether to finish sooner, preserve knowledge for procedures,
or keep expanding the institution. This works during both growth and the final
tail, unlike another permanently beneficial protocol.

Suggested first prototype, deliberately unvalidated values:

- Standard: current simulation, no knowledge consumption.
- Intensive: 2x potential processing, 0.65x discovery and replication, charge
  0.10 knowledge per extra processed workflow.
- Only the **extra actual processed forms** incur a charge. Never charge for
  demand beyond the discovered finite backlog or for power-limited capacity.
- The player sets a knowledge reserve. Scale bonus output automatically to
  knowledge above that reserve. The policy remains selected when throttled;
  display the current limiting resource and resume when replenished.
- No reactivation clicks, expiry, cooldown, or punitive zero-resource failure.
- Knowledge costs need a strictly validated finite nonnegative boundary. Compute
  both standard and bonus work before committing, then subtract exactly once.

Why 0.10 is a starting hypothesis: current work earns knowledge at 1/60 per
discovered or completed form. Charging more than the incremental output's own
knowledge reward prevents a cost-free positive feedback loop. Once all work is
discovered, knowledge becomes a finite acceleration budget. Earlier stored
knowledge can be useful at the end instead of becoming an irrelevant counter.
The prototype must quantify total income and spending before selecting a value.

**Adversarial objections:** if every informed player selects Intensive as soon
as it appears and never changes it, the policy is just a hidden upgrade. If its
reserve repeatedly runs dry, it could turn into a misleading stuttering speed
boost. If discovery/growth penalties are immaterial after protocols, its early
choice may be shallow. Keep it only if matched starting states demonstrate both
policies winning in different relevant conditions, including completing the
finite world sooner versus reaching a procedure sooner. Display net knowledge
rate, extra clearance rate and reserve runway, not opaque multipliers alone.

## Recommendation 2: capital commissioning with competing knowledge cost

Add batch commissioning of offices using **cash plus knowledge**, optionally
existing stored compute if the accounting is kept simple. This puts corporate
wealth toward an actual output-producing asset instead of inviting useless
power purchases. Knowledge spent commissioning competes with procedures and
Intensive operation. Cash alone must not purchase the ending.

Concrete design constraints:

- Purchased offices join the existing node count; they do not discover or
  complete work on purchase. They require the same power and stabilization as
  naturally replicated offices.
- Cost rises with the cumulative number commissioned, not just the current
  population. Otherwise intentional losses reset prices and enable exploits.
- Show exact total cash and knowledge cost, extra active-office capacity under
  current power, and resulting depletion of procedure funding before purchase.
- Support a bounded count and affordable quote. No one-office purchasing loop
  and no claim button. A batch is atomic and follows the existing reserve rule.
- Historical saves default cumulative commissioned count to zero through an
  explicit migration. Keep existing nodes, protocols, work and wealth intact.

Start by matching a modest commission batch to the cost of the next procedure,
rather than choosing arbitrary astronomical prices. Compare time gained by
offices with time lost postponing that procedure. Restrict affordable batch size
through real cash/knowledge costs, not an unexplained UI cap.

**Adversarial objections:** the supplied player already has billions, and normal
headquarters generates enormous cash. A purely financial escalating price will
either be irrelevant to that save or unfair to an ordinary company. Knowledge
is the genuine competing resource. An unlimited late purchase could trivialize
clearance or reward ignoring the earlier office economy. Commissioning is only
worth keeping if it offers useful but bounded acceleration under multiple wealth
levels and cannot dominate natural replication in every state.

## Alternative 3: competing research disciplines

If adding commissioning is too much scope, offer one selected research discipline
with permanent investment levels: replication, cartography, or processing.
Knowledge funding grows the selected discipline's effect while spending on it
delays procedures. Selecting a different discipline is reversible, but only
one effect is active at a time. A level purchase is a conscious investment,
not recurring maintenance.

**Weaker option:** allocation already divides office effort, and a second set of
growth/discovery/processing multipliers may duplicate that decision. It adds
state, upgrade UI and more tuning while risking another buy-everything list.
Do not implement this alongside the first two without evidence of a distinct
strategic purpose. Prefer the operating mode because it creates a real ongoing
resource budget and remains relevant after all research is complete.

## Narrow delivery and acceptance

Implement the operating mode first, then commissioning only if it passes these
checks. Put controls in the existing Network workspace. Do not add tabs, random
mandatory events, attendance rewards or repeated acknowledgments.

1. Preserve finite-work conservation and historical runs. Extra processing moves
   work from discovered to completed; it never manufactures or deletes backlog.
2. Compare Standard and Intensive from the same early knowledge-poor, late
   backlog-rich, power-poor and nearly complete states. Include the attached
   twelve-office/oversupplied-infrastructure save as a legal recovery fixture.
3. Demonstrate different preferred choices in at least two common conditions,
   using time to the next procedure and time to completion, not just multiplier
   inequalities. Print knowledge spent, reserve dips and natural/commissioned
   offices. A static default may remain safe.
4. Test resource exhaustion, empty backlog, zero discovery, offline progress,
   pause/resume, malformed input and reserve handling. Do not weaken existing
   deadlines, action ceilings or conservation tests to accommodate a bad tuning.
5. Preserve the ability to finish through the current game without either new
   mechanic. New paths must reward understanding instead of becoming another
   prerequisite checklist.
6. Count player interactions. A chosen mode should operate for minutes without
   renewal, and commissioning should be one quoted batch. Cap no arbitrary
   number of decisions, but identify whether each improves information or
   expresses a tradeoff rather than maintaining the status quo.
7. Recompute Grow/Survey/Clear and commissioning switch-point sensitivity.
   Recommendations that assume 5,000 offices may cease to be valid.
8. Ask the user to assess the actual recovered phase after delivery. Simulations
   can reject dominant strategies and deadlocks. They cannot certify engagement.

The purpose of these additions is a consequential operating and investment
decision, not merely shorter clocks. Their initial constants are hypotheses;
the real player's waiting complaint is evidence that the previous experience
failed, not evidence that any proposed replacement succeeds.

## Implementation checkpoint: selected deviations and probes

The implementation selected Standard, Survey and Parallel compute routing,
rather than the proposed explicit 0.65 growth/discovery penalty. Natural growth
receives its compute allocation first. Survey spends 0.25 spare compute per extra
discovered workflow; Parallel spends 0.5 spare compute and 0.10 knowledge per
extra completed workflow, above a player-set knowledge reserve. Both bonuses
throttle instead of requiring renewal. This is a reasonable reduction of direct
penalties, but it changes the adversarial claim: **Survey can dominate Standard
when compute and money are abundant.** Standard is then a safe default, not an
equally valuable specialist policy. Parallel still has a meaningful knowledge
opportunity cost.

Direct `tickNetwork` probes against the in-progress implementation, with identical
100-office states, 100 plants/servers, 40,000 compute, 2,400 knowledge, 200,000
located forms and 25/0/60/15 allocation:

| Routing | Time to 2,500 knowledge | Completed at measurement | Knowledge |
| --- | ---: | ---: | ---: |
| Standard | 5s | 3,600 | 2,512.08 |
| Survey | 4s | 2,880 | 2,531.33 |
| Parallel | Still unavailable at 60s | 86,400 | 145.00 |

Parallel clears more work while substantially delaying the next procedure.
This is an actual simulated tradeoff, not merely opposing description strings.
In a second 100-office state with ten million located forms and 85% clearance,
after 1,000 seconds Standard clears 1.02 million forms and retains 19,400
knowledge; Parallel clears approximately 1.253 million and retains 20.4 knowledge.
The bonus automatically throttles under scarce knowledge. These synthetic probes
demonstrate resource behavior. They do not establish human enjoyment, optimal
rates, or superiority across full runs.

Commissioning selected a $25,000 cash and 25-knowledge base per office, with a
linear cumulative-installed multiplier `1 + commissioned / 200` summed exactly
over a batch. Batch limit is 1,000, lifetime limit one million. Those are
provisional prices. Lifetime accounting prevents resetting cost by losing offices,
and a standing capital policy addresses the repeated-batch risk: Manual by
default, Research first retaining the cheapest currently eligible procedure's
knowledge, or Expansion first using knowledge for offices. Both retain the
company's operating cash buffer.

Highest remaining checks:

- Research first must protect the intended next procedure while explaining that
  the player still deploys it. Protecting only the cheapest procedure is not a
  promise to reserve every future research cost.
- A manual knowledge reserve should remain meaningful under standing capital
  investment. If commissioning can spend it anyway, the UI must explicitly
  distinguish a Parallel reserve from a global knowledge reserve.
- Expansion first may delay research heavily. It must stay recoverable through
  knowledge produced by real finite work, and switching away must stop spending
  immediately. Do not silently deploy procedures to conceal that tradeoff.
- Include commissioning versus natural-growth/procedure funding on equal-state
  tests and full runs. High-wealth saved states and ordinary wealth both matter.
- Interpret Survey's low downside honestly. If its compute infrastructure cost
  is negligible for existing rich saves, selecting it is a sensible efficiency
  improvement, not a deep sacrifice. The real competing choice is Survey versus
  Parallel, plus the decision where to spend knowledge.

## Integrated policy comparison

Read-only full-run probes used actual `act` and `advance`, one-second steps and
no injected resources. The attached save was parsed into memory only. A second
starting state came from the Network transition of the legal stewardship seed-7
playthrough. The controller deploys procedures when affordable, selects Grow,
changes to Clear at 5,000 offices, and removes discovery after all work is mapped.
Adaptive routing uses Survey during growth and Parallel after selecting Clear.
These are informed scripted players; costs and completion differences are
empirical simulation results, while perceived strategic value remains untested.

| Start | Capital policy | Routing | Finish, seconds | First additional procedure, seconds | Offices commissioned | Cash spent commissioning |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Attached save | Manual | Standard | 852 | 216 | 0 | $0 |
| Attached save | Manual | Adaptive | 746 | 182 | 0 | $0 |
| Attached save | Research first | Standard | 513 | 216 | 10,998 | $7,834,012,875 |
| Attached save | Research first | Adaptive | 460 | 182 | 10,550 | $7,219,496,875 |
| Attached save | Expansion first | Standard | 2,641 | 1,149 | 22,904 | $33,358,244,500 |
| Attached save | Expansion first | Adaptive | 3,581 | 1,837 | 22,354 | $31,788,785,125 |
| Legal entry | Manual | Standard | 877 | 249 | 0 | $0 |
| Legal entry | Manual | Adaptive | 771 | 213 | 0 | $0 |
| Legal entry | Research first | Standard | 802 | 249 | 1,516 | $181,446,250 |
| Legal entry | Research first | Adaptive | 713 | 213 | 1,284 | $135,060,750 |
| Legal entry | Expansion first | Standard | 836 | 499 | 1,538 | $186,194,125 |
| Legal entry | Expansion first | Adaptive | 720 | 387 | 1,391 | $155,618,125 |

Cash commissioning cost is exactly 1,000 times its knowledge cost, so both
resource totals are recoverable from this table. In the attached-save adaptive
run, Research first additionally spends about 14.867 million knowledge on
Parallel clearance; Expansion first spends about 1.649 million. Capital
investment consumes the latter run's knowledge before routing can use it.
The runs require 8 to 13 setup, phase-change and procedure commands, and zero
recurring maintenance commands. Automatic commissioning is doing real work,
not concealing manual purchase actions.

**P1: Expansion first currently functions as a costly trap in these cases.**
Research first finishes sooner and funds procedures sooner in every matched
case tested. In the actual rich save, aggressive investment delays the first
additional procedure by 19 to 31 minutes and extends the run to 44 to 60 minutes.
This recreates the user's waiting complaint through a nominally new strategy.
It is not enough to demonstrate that its office count differs. Retain the
option only after finding a relevant state where it has a disclosed useful
advantage, or bound its research starvation through a tested funding rule.
An explicit warning is necessary but does not by itself make a dominated
option interesting. Do not weaken the actual-save cadence expectation merely
because the trap is optional.

**P2: order matters for competing automatic buyers.** Investment runs before
infrastructure and can spend all surplus cash, leaving only the operating
buffer when newly purchased offices need power. Forecasts must expose active
capacity, not just nominal nodes. Verify that standing investment cannot
continually purchase inactive capacity instead of funding its infrastructure.
Ordinary runs above completed, so this is a targeted risk to test rather than a
claim of an observed permanent deadlock.

## Final disposition and reproducible regression

Expansion first was removed, rather than excused as an optional dominated
strategy. Manual and Research first remain. Minimum knowledge reserve now
protects Parallel and all commissioning, including manual purchases. Explicit
procedure authorization may spend the reserve, which the UI explains. The
earlier full-save comparison above is retained as evidence for the rejection;
it is not a description of the final available policy set.

The final reusable runner is
[`src/game/testing/network-agency.ts`](../../src/game/testing/network-agency.ts).
`bun run balance` regenerates the comparison in [BALANCE.md](../../BALANCE.md).
Its adaptive route changes to Parallel **after the final procedure**, rather
than at the Clear threshold used in the earlier investigative run. This prevents
confounding procedure starvation with a policy meant for the concluding tail.

Final compact reported-state results: Manual/Standard 852 seconds; Research
first/Standard 611 seconds; Research first/Survey then Parallel 564 seconds.
The legal fresh-entry results are 877, 802 and 744 seconds respectively.
Research first retains the same first-procedure timing as Manual/Standard;
Survey advances that procedure from 216 to 182 seconds in the compact state
and from 249 to 213 seconds in the legal state. Final players require 7 to 12
commands including setup, procedures and allocation/routing changes, with zero
manual commissioning or infrastructure maintenance. Parallel spends knowledge;
commissioning spends cash and knowledge. These benefits are funded consequences,
not costless speed multipliers.

The compact reported fixture preserves Network mechanics and treasury starting
value but not the full original workforce's earnings. Its investment forecasts
therefore differ from the earlier exact-save results and must be labeled compact
comparisons. The legal fresh entry is captured from a real action-only Office
playthrough, not constructed with injected resources.

New `network-pacing.test.ts` regressions preserve starting states, validate final
schemas and finite-work completion, require funded improvements, ensure research
funding is not delayed by Research first, and require bounded switches and zero
maintenance. Both tests pass with 80 assertions. Typechecking and report generation
also pass. Original tests and four-hour ceiling remain intact. These deterministic
controllers still know when and how to switch; actual user enjoyment remains an
independent validation question.

## Final verification against the exact submitted save

The original attachment was read again and validated through `parseGame`. Each
final `compareNetworkAgency` policy ran on the same parsed starting state with
the full workforce and corporate economy preserved. The attachment was never
written, and serializing the parsed starting state before and after each run
confirmed it remained unchanged. All three resulting states pass `GameSchema`.

| Final policy | Remaining time | First additional procedure | Commands | Setup | Allocation/routing switches | Maintenance | Commissioned offices | Commission cash | Commission knowledge | Parallel knowledge spent |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Manual, Standard | 852s (14m12s) | 216s | 7 | 0 | 3 | 0 | 0 | $0 | 0 | 0 |
| Research first, Standard | 513s (8m33s) | 216s | 8 | 1 | 3 | 0 | 10,998 | $7,834,012,875 | 7,834,012.875 | 0 |
| Research first, Survey then Parallel | 471s (7m51s) | 182s | 9 | 1 | 4 | 0 | 10,644 | $7,346,355,750 | 7,346,355.750 | 13,123,708.016 |

Setup and switches are included in Commands. These are final implementation
results, distinct from both the compact fixture and earlier experimental
controllers. The funded policies preserve the $10 million operating reserve,
ending with approximately $11.26 million and $10.97 million cash respectively.
Manual retains approximately $12.14 billion. The acceleration therefore has
an observable capital cost and knowledge allocation consequence. Research first
does not delay the next procedure; Survey reaches it earlier, then Parallel
converts knowledge into additional clearance after the final procedure.

The actual save now has a legal, low-maintenance recovery that changes its
economic behavior, rather than merely displaying a shorter countdown. The
controller still chooses allocation and routing at known thresholds. This
verification establishes feasible outcomes and costs, not a promise that a
human will choose the same actions or find the phase compelling.

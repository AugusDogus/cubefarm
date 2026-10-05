# Cube Farm: design contract

The player starts doing paperwork, learns to manage people, discovers that the
company is cultivating people, then builds an institution capable of finishing
the work. The final question is who gets to leave.

## Requirements

- Fresh game: $0, no employees, no navigation, no future-era spoilers. One manual
  action and one empty cubicle. First hire after 28 forms, at most 60 seconds of
  ordinary play. Hiring introduces automatic income and payroll.
- Each control appears after its problem becomes relevant. Research, office
  incentives, cultivars and genes are revealed separately. At most three main
  workspaces; Network replaces Operations and puts prior systems in Archive.
- New companies stagger first introductions with short operating-time windows
  after hiring and key projects. Pause freezes these windows; offline progress
  advances them. Existing saves retain historical access. Supply and demand
  recovery stay available. This creates observation room, not proof of learning.
- Office purchases have measurable marginal output and payback. Early equipment
  competes with hiring; incentives become attractive as the workforce grows.
  Revenue constraints are distinguished from production improvements.
- Genes arrive after the company can explain cultivation. Research is permanent;
  a maximum of two genes can be selected for future hires. Existing genotypes,
  including old saves with more genes, remain immutable. Output, research,
  downtime and payroll tradeoffs must prevent one universally superior genome.
- Story is correspondence from named people, triggered by actual accomplishments.
  Permanent choices disclose their effects, wait indefinitely, and affect both
  economics and the ending. No mandatory appointment or response timer.
- Automation must remove chores, not ask the player to click them faster.
  Passive process reviews, delegated memos/orders, bulk hiring, department
  staffing counts, branch fill, buy-needed infrastructure and allocation presets.
- Network defaults must not solve every stage. Discovery/growth/clearance have
  different resource needs. Bottlenecks, active capacity, stability and completion
  estimates must be visible. Infrastructure purchases must show exact cost and
  quantity without requiring hundreds of clicks.
- Quiet sound is opt-in, user-gesture activated, with a persistent setting.
  Visual feedback stays black hairlines on white and respects reduced motion.
- Existing valid v1/v2 saves preserve progress and immutable people. Invalid
  saves remain recoverable. No user save is replaced for testing.

## Validation, not claims

Existing invariants stay tested with nonempty historical fixtures. Legal players
use bounded manual opening input, then automation, with different management
policies and genomes. Target: first development within 5 minutes, enterprise in
8-15 minutes, conglomerate in 20-35 minutes, finale within 90 minutes (the former 45-minute lower aspiration was rejected after an observed waiting complaint); the existing
four-hour hard completion ceiling stays. Record milestones and actions, and test
multiple seeds. Browser verification covers fresh opening, discoveries, choices,
bulk controls, network and ending on desktop and narrow screens. Independent
adversarial agents review the design, implementation and changed tests.

These checks do not establish award quality or human enjoyment. They establish
an honest quality floor for subsequent human playtesting.

## Research

- Universal Paperclips, actual HTML and main.js:
  https://www.decisionproblem.com/paperclips/
  The reference reveals automation and computational resources after thresholds
  rather than showing its full progression at launch.
- Anthony Pecorella, The Math of Idle Games, Part I:
  https://www.gamedeveloper.com/design/the-math-of-idle-games-part-i
  Adversarial design review consulted the article for marginal return, changing
  purchase priorities, and bulk/max buying. Our main fetch was blocked with 403.
- John Hopson, Behavioral Game Design:
  https://www.gamedeveloper.com/design/behavioral-game-design
  Adversarial review consulted reward spacing and frustration from reward gaps.
  Use for readable pacing, not coercive attendance mechanics.

## Delivered evidence

See [BALANCE.md](BALANCE.md), regenerated with `bun run balance`, for six legal
playthroughs, investment paybacks and genetic specialization. Commands and modeled
UI interactions are counted separately. Prices are reconsidered at most every
two minutes. The original four-hour ceiling remains; the stronger staged-player
checks require a finale within 90 minutes, fewer than 350 interactions, a first
Network letter or protocol within five minutes, and combined reward gaps within six minutes. Separate new mechanical checks exclude starting protocols and require the first new protocol within five minutes and protocol-only gaps, including completion, within ten minutes.
The earliest Conglomerate benchmarks beat the aspirational 20-minute target.

Adversarial reviews caught and verified fixes for early spoilers, unchanged-count
staffing, unreachable UI batches, Network reward gaps, paused Network recovery,
cash reserve access, malformed historical crises and immutable gene specialization.
The earlier invariant review found no unresolved issue in its scope; the comprehensive review later found and fixed additional save, automation, and recovery problems. The design review
retains these evidence limits: formula-informed players are not human playtests,
interaction counts are estimates, and the patent buyout is symbolic at late wealth.

Browser verification used a separate QA origin and retained the original user
save. At 320px, 375px and desktop widths: no page overflow; filing and hiring;
numeric pricing; two-slot gene selection and unchanged older hires; staffing and
rebalance; confirmed bulk headquarters replacement; one-click 800-person branch
fill after bulk expansion; paused Network import, Resume, reserve editing,
allocation plans and delegated construction; and the shared-ownership ending.
The browser loaded Berkeley Mono. Enabling sound started a running AudioContext;
muting prevented additional cues. No application console errors were observed.

The revised cubicle figure was viewed at rest, under the pointer, at 240px, at both
intensity extremes and in both bench themes. All geometry stayed within its
400x320 frame, hit readouts matched the inspected cubicle, and the drawing settled.
Reduced motion was also checked through the unchanged kernel's supported setting.

## Comprehensive review

[DESIGN_REVIEW.md](DESIGN_REVIEW.md) contains the original fifteen research-informed adversarial reviews and the subsequent source-informed swarm dispositions. Original review documents retain baseline findings for auditability. The observed process-only user save stalls; contextual allocation advice, work-funded replication, coordination, research, and optional capital investment address its mechanical causes. Current timings and exact-save recovery appear in BALANCE.md. Original accounting, inheritance, strategy, and pacing tests remain intact.

Earlier browser results above concern the earlier implementation. The latest collaborative preview reports availability, but snapshot and open calls time out, so this review cannot claim fresh browser verification of the revised controls. Automated rendering and build checks are separate evidence.

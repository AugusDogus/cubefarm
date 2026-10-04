# Universal Paperclips source comparison

Inspected 2026-10-04. Read-only research and adversarial review. No gameplay changes were made during this audit.

Implementation follow-up: the subsequent swarm added persistent workspace/project/procedure discoveries, named milestone and contract receipts, an explicitly chosen competitive tender with scarce preparation at risk, coupled Network replication and coordination, funded routing sacrifices, earned delegation, actual-state Hairline feedback, and distinct ending scenes. Reviews 19 through 26 document rejected iterations and final checks. The original comparison below records the pre-implementation state; its earlier pacing figures are historical. Current reproducible pacing belongs to `BALANCE.md`.

The source archive canceled by the server restart was restored: [all original assets](/tmp/universal-paperclips-source.zip) and [URL/hash manifest](/tmp/cube-farm-paperclips-audit/manifest.json). Thirteen assets include all four referenced gameplay scripts, totaling 9,934 JavaScript lines. Analytics is excluded. The originals are research evidence, not shipped Cube Farm assets.

Cube Farm has progressive disclosure, production automation, staffing tradeoffs, inheritance, contracts, narrative choices, and an allocation endgame. The comparison nevertheless finds substantial gaps in discovery feedback and repeatable strategic decisions. The preceding Network acceleration fixes an observed stall; it does not establish Universal Paperclips-level depth or balanced difficulty.

## Download and coverage

Downloaded the current web game from [decisionproblem.com/paperclips](https://www.decisionproblem.com/paperclips/index2.html), including every gameplay script referenced by its HTML:

| File | Bytes | Lines | Main responsibilities |
| --- | ---: | ---: | --- |
| combat.js?v3 | 23,856 | 802 | Combat simulation, canvas rendering, outcomes |
| globals.js?v3 | 3,496 | 182 | Shared state, including audio construction |
| projects.js?v3 | 80,149 | 2,451 | Unlocks, costs, effects, transformations, dismantling |
| main.js?v3 | 209,215 | 6,499 | Economy, UI, tournaments, quantum computing, industrial and space loops, saves |

Total: 316,716 bytes and 9,934 JavaScript lines. The archive also includes the game and landing HTML, both local stylesheets, title artwork, app badges, and the actively referenced test.mp3. SHA-256 hashes, source URLs, and retrieval time are in the manifest. Google Analytics and the landing page's external font stylesheet are excluded because they do not implement gameplay.

[Downloaded source archive](/tmp/universal-paperclips-source.zip). [Manifest](/tmp/cube-farm-paperclips-audit/manifest.json).

The game HTML references those four scripts at lines 941-944. The reviewers found no dynamic imports, script injection, fetch, or XHR loading additional gameplay bundles. Fifteen focused adversarial reviewers covered discovery, project lifecycle, audio, feedback, layout, accessibility, tournaments, randomness, investment, automation, quantum computing, resource choices, combat, story, era changes, and difficulty. Their findings were reconciled against the source and the current Cube Farm implementation.

Source links below refer to the downloaded files, so line numbers describe the inspected snapshot rather than a future website revision.

## What the original actually does

**Reveals:** New project buttons really blink. Trigger evaluation creates the card once; affordability is reevaluated separately. The new card's visibility toggles every 30ms until a shared counter reaches 12. An isolated invocation lasts about 360ms. Panels generally switch display immediately. The one-second CSS opacity transitions belong to hover tooltips, rather than panel entrances. There is also a continuously pulsing console cursor and a longer, rapidly flashing HypnoDrone event.

Evidence: [project creation](/tmp/cube-farm-paperclips-audit/main.js:870), [blink invocation](/tmp/cube-farm-paperclips-audit/main.js:917), [blink implementation](/tmp/cube-farm-paperclips-audit/main.js:987), [tooltips](/tmp/cube-farm-paperclips-audit/interface.css:206), [HypnoDrone event](/tmp/cube-farm-paperclips-audit/main.js:926). A second argument to appendChild does not prepend cards; they append. No reveal-driven automatic scrolling or focus change was found.

**Audio:** There is active late-game music. The Audio object is created in globals.js; loadThrenody sets its source to test.mp3. Space Exploration loads it, Threnody plays it, and the ending also plays it. The commented HTML audio element is not the live implementation. No ordinary filing, purchasing, or hiring SFX were found. Cube Farm already has opt-in synthesized action tones.

Evidence: [Audio construction](/tmp/cube-farm-paperclips-audit/globals.js:168), [load/play functions](/tmp/cube-farm-paperclips-audit/main.js:10), [Space Exploration](/tmp/cube-farm-paperclips-audit/projects.js:1125), [Threnody](/tmp/cube-farm-paperclips-audit/projects.js:1857), [ending playback](/tmp/cube-farm-paperclips-audit/main.js:4527), [Cube Farm tones](../../src/game/feedback.ts:20).

**VFX:** Quantum chips visually oscillate with the values used to calculate their payout. Tournament playback highlights the active payoff cell and reports matchups and rounds. Combat deaths remove actual resources and animate those same losses. Narrative transitions remove or transform working interface sections. These visuals convey simulation state and consequences.

Evidence: [quantum values](/tmp/cube-farm-paperclips-audit/main.js:829), [tournament playback](/tmp/cube-farm-paperclips-audit/main.js:2234), [combat losses and animation](/tmp/cube-farm-paperclips-audit/combat.js:518), [ending dismantling](/tmp/cube-farm-paperclips-audit/main.js:4327).

## Gambling and active play

The investment engine automates trading. Players choose how much money to deposit, can withdraw liquid bankroll, select risk, and buy probability improvements using Yomi. Exposure, volatility, and individual position gains/losses remain visible. It does not require manually selecting stock tickers. Its strongest transferable qualities are committed exposure, visible uncertainty, and decisions about improving the process. Cube Farm's stock standing must remain observational, as requested.

Evidence: [upgrade odds](/tmp/cube-farm-paperclips-audit/main.js:1442), [deposit and withdrawal](/tmp/cube-farm-paperclips-audit/main.js:1454), [exposure sizing](/tmp/cube-farm-paperclips-audit/main.js:1473), [random price movements](/tmp/cube-farm-paperclips-audit/main.js:1581), [risk](/tmp/cube-farm-paperclips-audit/main.js:1619), [automatic trading](/tmp/cube-farm-paperclips-audit/main.js:1666).

Strategic Modeling is a more useful reference for Cube Farm than stocks:

1. Pay operations to generate a new, visible payoff grid.
2. Interpret that grid and choose among algorithms with different behavior.
3. Run a short tournament with visible matchup and round feedback.
4. Inspect rankings, the chosen strategy's score, competitors beaten, and exact Yomi receipt.
5. Use earned Yomi in other systems, including financial and probe upgrades.

The payout is score-based, with additional bonuses available. Last place can still earn Yomi. It is not a winner-take-all bet. AutoTourney arrives later, costs 50,000 creativity, requires 90 trust, and repeats the existing chosen strategy. It does not solve the new grid for the player. Inspecting the payoff grid interrupts automatic restart timing. In the original implementation the strategy remains live during playback, so it is inaccurate to claim the player must irrevocably commit before Run.

Evidence: [grid](/tmp/cube-farm-paperclips-audit/main.js:1943), [entry and setup](/tmp/cube-farm-paperclips-audit/main.js:1982), [receipt and rewards](/tmp/cube-farm-paperclips-audit/main.js:2124), [result presentation](/tmp/cube-farm-paperclips-audit/main.js:2180), [inspection](/tmp/cube-farm-paperclips-audit/main.js:2216), [live selection](/tmp/cube-farm-paperclips-audit/main.js:2316), [AutoTourney unlock](/tmp/cube-farm-paperclips-audit/projects.js:1563).

Quantum computing provides a separate timing interaction after production is automated. Chips oscillate at different frequencies; clicking Compute pays ceil(360 times their summed signed values). Poor timing can subtract operations. Positive overflow can create temporary operations with diminishing returns and decay. The chip upgrades change the visible signal and potential payout, rather than only changing a percentage. This suggests an optional timing or interpretation activity, but does not justify making reflexes compulsory or negatively surprising players.

Evidence: [chips](/tmp/cube-farm-paperclips-audit/main.js:739), [payout](/tmp/cube-farm-paperclips-audit/main.js:837), [temporary operations](/tmp/cube-farm-paperclips-audit/main.js:3413), [unlock and chip purchases](/tmp/cube-farm-paperclips-audit/projects.js:1149).

## Prioritized Cube Farm gaps

P1 and P2 indicate design priority here, not security or correctness severity. Proposed mechanics remain hypotheses until implemented and tested.

| Priority | Before | After | Why and source |
| --- | --- | --- | --- |
| P1 | Workspaces and projects appear without a new/unseen indicator. Optional discoveries can remain hidden in Development. | Persistent, quiet New cues cleared on inspection; one concise capability announcement with a destination. Brief nonflashing emphasis on first viewing. | UP announces unlocks and blinks cards. Cube's [discovery](../../src/game/discovery.ts:8), [tabs](../../src/App.tsx:63), and [Projects](../../src/components/Projects.tsx:12) only reveal them. Retain reduced-motion support and stable focus. |
| P1 | Important outcomes are buried in collapsed Company records. Visible project feedback is generic and expires after 2.4s. | A small persistent latest-milestone/result row; named project effects; a last-contract receipt at the contract desk. | Compare UP's [five-line console](/tmp/cube-farm-paperclips-audit/main.js:976) and [results](/tmp/cube-farm-paperclips-audit/main.js:2180) with [Cube feedback](../../src/App.tsx:33) and [records](../../src/components/Corporate.tsx:38). Keep routine automation chatter in history. |
| P1 | Contracts repeat four fixed offers; crises use fixed response tables. Randomness mostly creates worker downtime. | An optional bounded competitive tender or business experiment with disclosed conditions, selectable approaches, visible resolution, and explanatory outcomes. | UP's paid, changing [grid](/tmp/cube-farm-paperclips-audit/main.js:1943) gives each run information to interpret. Cube's [contracts](../../src/game/corporation.ts:22) and [crises](../../src/game/events.ts:11) largely repeat known decisions. No stock interaction is needed. |
| P1 | Network's initial 1,700 knowledge immediately affords both initial protocols, enabling routing, investment, and delegated infrastructure. | Let players experience the new constraints before earning delegation; retain a changing strategic choice after chores are automated. | [Initial Network](../../src/game/network.ts:61) and [protocol prices](../../src/game/network.ts:16). UP's [WireBuyer](/tmp/cube-farm-paperclips-audit/projects.js:640) follows repeated procurement, while AutoTourney is earned much later. Do not copy forced repetitive purchases. |
| P1 | Archived headquarters continues generating cash for Network; Survey spends spare compute after replication, while infrastructure is delegated. Costs can become weak constraints. | Design an explicit era transition with a coupled resource loop and a liability arising from expansion. Require useful policies to win in different ordinary states. | Cube [retail plus Network](../../src/game/economy.ts:26) versus UP's [retirement](/tmp/cube-farm-paperclips-audit/main.js:1260), [reproduction cost](/tmp/cube-farm-paperclips-audit/main.js:3961), and [drift](/tmp/cube-farm-paperclips-audit/main.js:4071). Extra time or another currency alone does not address this. |
| P2 | Knowledge is separated from procedure purchases; routing benefit is hidden in comparison details. Energy and compute show neither buffer capacities nor all generation/use rates. | Place balances and net rates beside decisions; show current/capacity and generation/use. Keep chosen policy benefit visible with its cost. | UP [computation above Projects](/tmp/cube-farm-paperclips-audit/index2.html:399), [power accounting](/tmp/cube-farm-paperclips-audit/main.js:2963); Cube [Network](../../src/components/Network.tsx:37). |
| P2 | Office shows production and demand but omits actual sales beside price. Price experiments require editing and submitting. | Show actual sold/s and add immediate cent nudges alongside direct entry. | UP [retail controls](/tmp/cube-farm-paperclips-audit/index2.html:267); Cube [Operations](../../src/components/Operations.tsx:27) and existing [soldRate](../../src/game/economy.ts:60). |
| P2 | Automation can wait silently. Renewed orders reset allocation to half. Research first protects the cheapest available procedure rather than a chosen target. | Show the current waiting reason, preserve the standing allocation, and identify or let the player select protected research. | [Automation guards](../../src/game/automation.ts:19), [renewal](../../src/game/automation.ts:28), [research reserve](../../src/game/network-investment.ts:7). UP preserves the chosen tournament strategy. |
| P2 | Capital investment runs before infrastructure purchases, without a combined support forecast. Previously overbought infrastructure cannot be reclaimed. | Show the cost of supported launches and offer a quoted partial redeployment or resale. | [Purchase order](../../src/game/infrastructure.ts:8), [build controls](../../src/components/Network.tsx:39); UP [reclamation](/tmp/cube-farm-paperclips-audit/main.js:2607). Permanent starvation from the current priority was not reproduced. |
| P2 | Network's hairline world receives coarse office count, without allocation, discovery, clearance, or loss signals. Paper piles use saturating lifetime output. | Bind restrained hairline activity to actual work and outcomes; stop it when paused or blocked. Use an identified current queue or transient work cue. | [Network figure](../../src/components/Network.tsx:34), [campus](../../public/hairline/campus.js:30), [office world](../../src/components/World.tsx:17); UP ties [combat animation to resource loss](/tmp/cube-farm-paperclips-audit/combat.js:518). |
| P2 | Ending becomes prose and a replay button. Unread correspondence can lag behind actual growth milestones. | A short, skippable ending-specific world consequence; show current milestones independently of correspondence catch-up. Preserve historical workers and the archive. | [Ending](../../src/components/Network.tsx:52), [letter ordering](../../src/game/story.ts:32); UP [dismantling](/tmp/cube-farm-paperclips-audit/projects.js:2187). |

Additional concrete observations:

- The stable action-feedback div animates only on mount. Changing cue.id/text does not restart its CSS animation. A keyed inner cue could fix this while preserving the stable outer live region. Evidence: [render](../../src/App.tsx:79), [animation](../../src/styles.css:321).
- Reveal insertion can move existing controls, including the business block above Hiring and correspondence above the workspace. Test unlocks during ongoing clicking and reading. Accidental clicks were not reproduced.
- Project cards show the monetary/resource price but only one blocker at a time. Display structural requirements and current/required values together, without spoiling later eras. Evidence: [blocker selection](../../src/game/projects.ts:28).
- A pending board decision freezes subsequent crises while production continues. A direct 7,200-second crisis probe left it pending. Preserve fair offline decisions, but reconsider whether unresolved context should have persistent meaning or a standing-policy resolution. Do not fix this with punitive precision timers. Evidence: [pending branch](../../src/game/events.ts:53).
- Staffing already provides a real opportunity cost. Its forecasts should show the research/influence gained as well as filing income forgone before introducing extra computational currencies. Evidence: [staffing forecast](../../src/components/Departments.tsx:22).

## Difficulty findings

Fresh seed-7 legal play with the new informed controller finishes the whole game in 2,208 seconds, versus 2,344 seconds under the older standard controller. The change is roughly 5.8% of the full run, rather than turning a fresh company into an eight-minute game. Its Network segment takes 744 seconds instead of about 880.

Some allocation sensitivity remains: the fresh Network takes 744 seconds with staged allocation, 978 with static Grow/adaptive routing, 1,536 with Clear at 100 offices, and 4,875 with Clear from entry. But wealth flattens the choice: the rich compact recovery takes 569, 568, and 564 seconds when switching near 1,000, 2,500, or 5,000 offices. These probes use legal actions and engine simulation, not injected resources.

Research first plus Survey then Parallel approaches a prescribed low-risk recipe in the tested late states. Spending billions is not sufficient evidence of a consequential sacrifice: cash does not improve the fixed five-credit reincorporation award, and the Commons settlement is small relative to those funds. The older workforce economy still runs; the problem is limited competing player-facing objectives for its late cash.

Current tests enforce costs, resource conservation, save compatibility, bounded maintenance, and faster tested completion. They do not establish strategic parity, robust difficulty, or engagement. The result is therefore **less waiting, with strategic depth still unfinished**. Retuning prices solely to increase waiting would not resolve the identified gaps.

Evidence: [legal comparison runner](../../src/game/testing/network-agency.ts), [acceleration tests](../../src/game/network-pacing.test.ts:18), [fixed replay award](../../src/game/strategy.ts:260), [source-informed Network assessment](16-network-agency.md).

## Preserve Cube Farm's advantages

The original web interface hides the game below 700px and displays mobile-app promotion. It uses fixed small columns, tiny text, hover-only explanations, no inspected reduced-motion path, rapid flashing, and repetitive single-point probe controls. Do not copy those weaknesses. Cube Farm's playable responsive layout, focus rings, native disclosures, scoped hotkey, exact allocations, bulk controls, reduced-motion Hairline engine, guarded actions, validated saves, immutable employees, and worker-centered story should remain.

## Verification and next delivery order

The downloaded scripts were run in an isolated local browser origin, with only analytics removed from a separate bench HTML. Original downloaded files and hashes were preserved. Browser probes observed twelve visibility changes at 30ms intervals ending at 360ms, a quantum payout of -359 then +360 operations, and a new tournament spending 1,000 operations while generating a visible payoff grid. Those probes set synthetic state to inspect individual behaviors; they were not full playthroughs. Audio load/play paths were inspected and the MP3 downloaded; its sound quality and autoplay behavior were not certified. Neither the user's Cube Farm save nor any original Paperclips-origin save was modified.

Recommended delivery order:

1. Discovery cues, named milestone feedback, result receipts, and resources beside controls. These expose existing decisions before adding systems.
2. A small optional competitive-tender prototype with readable conditions, bounded stake, chosen approach, visible outcome, and consequential rewards. Keep routine contracts delegated. Make its value relevant to the current era, rather than nominal dollar amounts swallowed by late wealth.
3. Rework Network's transition and competing constraints, then compare strategies across ordinary and wealthy states. Automate chores after the player understands them, while retaining new decisions.
4. Bind the hairline world and ending to those actual states. Add narrative audio only where it improves the consequence of a milestone.

The first delivery is an interface fix. The latter deliveries are gameplay design work needing implementation, adversarial review, legal simulations, and human playtests. This audit makes those gaps concrete; it does not claim they are already fixed or that the proposed mechanics are proven fun.

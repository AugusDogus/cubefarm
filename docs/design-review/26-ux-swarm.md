# Source-grounded UX swarm review

Reviewed 2026-10-04. This review owns documentation only. Implementation findings were sent to the component owners and root agent.

The current changes improve discovery, interpretation, and access to late-game decisions without exposing those systems in the opening. They do not establish that the game is fun or comparable in depth to Universal Paperclips. Browser and static checks verify presentation and interaction contracts, not enjoyment.

## Reference and decision rationale

The source evidence is recorded in [the Paperclips source audit](18-paperclips-source-audit.md). Paperclips creates and briefly blinks new project cards, places computing resources beside projects, shows tournament conditions before a run, animates actual tournament resolution, and retains explanatory results. Its tournament automation repeats a chosen strategy rather than choosing for the player. Combat visuals use actual losses. It has milestone music but no inspected routine purchase or filing sound effects.

Cube Farm translates those principles into persistent New markers, restrained 180ms nonflashing movement with reduced-motion support, current resource budgets and forecasts, a manually selected optional tender, a retained receipt, and Hairline scenes driven by simulation. It preserves white backgrounds, black text and hairline rules, squared controls, Berkeley Mono, responsive layouts, native disclosures, bulk purchasing, and a few workspaces. It does not copy Paperclips' narrow fixed desktop layout, rapid blinking, hover-only information, or stock trading.

## Findings and responses

| Priority | Before | After and disposition |
| --- | --- | --- |
| P1 | Navigating Development or Archive acknowledged all available projects, including unseen cards below the fold. | Fixed by discovery owner. Workspace navigation acknowledges only the workspace. Project and procedure cards acknowledge pointer, touch, or keyboard focus. Archive shares corporate project callbacks. |
| P1 | Network procedures appeared after the entire infrastructure/allocation grid. Tenders were an easily missed addition at the bottom. | Fixed by Network UI owner. Procedures follow plans and forecasts. Upper links provide access to procedures and tenders; the tender desk has a return link. Newly available procedures now have persistent markers and an upper announcement. |
| P1 | Adding procedure discovery initially left old records without the required protocol list, causing a blank integrated Network screen. | Root/discovery owner fixed the schema default. Historical records acquire an empty protocol list. Subsequent isolated browser navigation rendered the Network correctly. Existing migration and App tests must remain semantic checks of preserved discovery and workspaces. |
| P2 | Tender receipt rounded the draw and acceptance chance separately, allowing visibly equal values with a stated strict inequality. | Fixed by tender owner. Receipt explains whether the draw crossed the threshold without displaying a misleading rounded draw. Exact cash, research expense, credited reward, and net resource outcome remain visible. |
| P2 | Routing coordination costs were described near the controls, but current load and work efficiency were lower in the institution section. | Fixed by Network UI owner. Selected routing now shows load, efficiency, net load change, repair rule, actual forecast rates, and costs together. All route costs remain visible before selection. |
| P2 | Routing explanation claimed an unconditional fallback to normal work despite an opportunity cost. | Fixed alongside proportional mechanics. Text states the full-boost capacity sacrifice and that the tradeoff shrinks with funded bonus work. Ordinary work continues when the boost is blocked. |
| P2 | The Network is lengthy on small screens, particularly with an open client brief. Manual infrastructure can require repeated scrolling before delegation. | Reported to Network UI owner. Presets already keep common allocation changes near the top. Requested a compact infrastructure destination and return link rather than another workspace. |
| P3 | The upper procedure New marker visually joined the preceding link text. | Reported to Network UI owner for a small spacing correction. |

## Verified interaction contracts

The opening browser at 1280 by 800 showed one filing action, two basic balances, and one empty Hairline cubicle. It exposed no navigation, genes, tenders, delegation, or Network controls. The illustration is deliberately larger than the single action; the screen remains uncluttered.

The integrated Network exposed only Network and Archive workspaces. Procedures moved above capital and computing. Manual commissioning retained an exact cash and knowledge quote and resulting coordination load. The standing investment gate explains the required cleared-work count while keeping manual commissioning available. Infrastructure delegation also has an explicit experience gate. Routine contract and memo statuses describe their actual shared simulation guards, including output allocation, supplies, payroll, maintenance, reserves, cooldown, and paused state.

Tender controls disclose client priorities, match, acceptance chance, maximum cash loss, maximum research loss, cash profit, and net phase-specific resources before submission. No approach is preselected and Submit stays disabled until selection. Whole-dollar direct exposure entry and small/half/maximum shortcuts avoid repeated one-dollar changes. Research and cash are paid on submission; protected research and operating reserves constrain the quote. Unfunded briefs explain the blocker and remain available for later funding or explicit decline. The game never auto-selects an approach or auto-submits a bid.

In the isolated browser, a funded synthetic Network fixture submitted a $50,000 Assurance bid with 17.5 knowledge exposure. The paused evaluation retained its committed odds and clearly requested Resume. Resuming settled the bid through the normal game timer and retained a receipt showing $75,545 returned, $25,545 net cash, 52.882 knowledge credited, and 35.382 net knowledge. These numbers came from this one UI fixture and random brief; they are not pacing or balance evidence. The receipt explained the original priorities and acceptance condition. Both win and loss receipts are covered by static component tests.

At 375 and 320 CSS pixels, the Network and tender controls had no horizontal page overflow. Native tender/return anchors navigated to the intended sections. An open tender and the complete Network produced a page approximately 8,800 pixels tall at 375 pixels, which justifies upper destinations for repeated actions. Responsive single-column cards are readable but remain a substantial vertical comparison. Desktop retains three side-by-side approach cards.

Hairline bindings carry actual office queue, employee activity, discovered and cleared work rates, office growth, coordination load, commissioned and lost-office totals, paused state, and ending identity. Alternative ending descriptions reflect occupied or emptied cubicles. These bindings avoid making visual production continue merely because the pointer moves. Animation engine and accounting verification are owned by the corresponding reviewers.

## Evidence and limits

Browser QA used only `http://127.0.0.4:5174/`, tab `tab_a`, with generated fixtures. The user's real browser save and supplied attachment were untouched. A separate synthetic funded fixture was used to inspect affordable bids. No synthetic fixture was used to assert legal progression or strategic quality.

Focused checks included `src/components/experience.test.tsx`, `network-ui.test.tsx`, `tender-ui.test.tsx`, `src/game/discovery-feedback.test.tsx`, and `contracts-feedback.test.tsx`: **36 tests, 235 assertions passed** after integration fixes. During concurrent integration, the reviewer caught the missing protocol-list runtime failure and later two expectation mismatches: an exact tab HTML assertion did not permit New markup, and a procedure test incorrectly assumed Distributed computing required Low-power cubicles. Owners updated those expectations while preserving the intended contracts. Root owns the final full-suite run.

Remaining UX limitations: facility and gene discoveries do not yet use the new persistent marker system; the Network still contains considerable explanatory text; announcements and result navigation should receive a final settled-build check after hot reload stops. Browser automation briefly failed a snapshot during the missing-record runtime problem and one text-locator anchor interaction; corrected navigation and CSS anchor interaction succeeded. Audio quality, accessibility with a real screen reader, human enjoyment, and sustained late-game play remain unverified by this review.

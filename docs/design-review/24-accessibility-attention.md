# Accessibility and attention adversarial review

Reviewed the integrated swarm implementation on 2026-10-04. This review owns documentation only; implementation fixes belong to the discovery, Network UI, and world workers.

## Evidence and standards

Fetched and read W3C guidance for [status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html), [focus order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html), and [animation from interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html). Their relevant constraints are: important results should be programmatically available without moving focus; ordinary updates should not overwhelm the reader; interaction should preserve a useful focus sequence; unnecessary motion should honor the reader's preference. [MDN live-region guidance](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions) explicitly requires establishing and exposing an empty live region before updating its content.

Browser checks used synthetic fixtures on isolated `http://127.0.0.3:5174/`. The supplied player save was never loaded or modified. T3 preview performed initial keyboard, live-region, and figure checks. After its host explicitly disconnected, temporary headless Chromium finished the remaining checks. DOM mutation evidence establishes what the page emits to live regions; actual screen-reader speech was not tested.

## Findings and dispositions

| Objection | Disposition and verification |
| --- | --- |
| Every manual filing remounted `Filed.` inside a polite status region, potentially repeating speech on every Space press. | Fixed. Filing has a separate `aria-live="off"` visual receipt. Two real filing inputs produced zero polite/status mutations and no filing animation. Discrete purchases retain a stable status container. |
| Unaffordable project cards could not receive keyboard focus or acknowledge their persistent New marker. | Fixed. The named group wrapper is focusable. A real Tab reached disabled Brand book, cleared only its marker, and retained focus. The next card stayed New. |
| Network procedures lacked persistent discovery markers and keyboard inspection. | Fixed. A real Tab reached an unaffordable procedure group, cleared its marker, and retained focus while the neighboring procedure remained New. Opening the workspace does not acknowledge every procedure. |
| Tender settlement silently completed when the player left its workspace. | Fixed. A submitted, paused tender emitted no result. Resume settled it while Office remained active and updated the global polite status row with the client, accepted result, exact net cash gain, and Inspect Company destination. Three child mutations belonged to the same render; another 1.5 seconds produced no further mutations. |
| Allocation fields remounted after applying a value, dropping keyboard focus. | Fixed. Enter applied 20% while preserving both the exact input DOM node and focus. Local draft edits are protected from unrelated upstream redistribution. |
| Cash and knowledge reserve editors retained the same value-keyed remount pattern. | Fixed by the Network and contracts UI owners. Independent runtime checks applied knowledge reserve 123.45 and cash reserve 321 with Enter; both original input nodes remained connected and focused. |
| Empty discovery and tender status rows used `display:none`, preventing assistive technology from registering them before the first message. | Fixed. Empty rows now use visually clipped positioning. Computed runtime styles retain `display:flex`, no hidden attribute, and `role=status` before any message. There is no visible empty-row gap. |
| Reduced motion snapped recurring worker bobbing rather than eliminating it. | Fixed. Direct runtime probes, after initial figure settling, produced identical cubicle and campus geometry at simulation times 4 and 6 with all meaningful inputs unchanged. Inventory and coordination changes still affect static geometry. |

## Tender semantics

The form requires a deliberate radio choice; no approach is preselected. Whole-dollar exposure has native minimum, maximum, and required constraints. Current affordability and operating-reserve blockers remain readable next to the input. Every approach exposes chance, priority match, cash gain, maximum loss, and phase-appropriate rewards before commitment. Evaluation shows actual progress, pauses with simulation, and preserves committed terms. The final receipt remains available after settlement. These controls introduce no additional workspace.

The countdown is not a live region, so evaluation does not announce every simulation tick. Settlement is the discrete announcement. Default sound remains off. New markers persist until inspection; their brief transform is not a flash and is removed under reduced motion.

## Remaining scope

The artwork's pointer response is decorative. Native employee inspection and numeric simulation information remain available without hovering. This review does not claim screen-reader certification, enjoyment, or award readiness.

## Checks

`bun test src/game/discovery-feedback.test.tsx src/components/tender-ui.test.tsx src/components/network-ui.test.tsx src/components/world-feedback.test.tsx`: 29 tests pass, 184 assertions. Completed runtime checks reported no page errors. Integrated build and the full test suite remain root-owned.

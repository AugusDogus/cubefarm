# Cube Farm

Optimize your employees in an ever changing corporate world.

A four-era playable incremental game with a finite worldwide objective, two endings, and reincorporation. White surfaces, black hairlines, and square controls.

## Run

```sh
bun install
bun run dev
```

`bun run build` produces `dist/`. `bun test` verifies the economy, progression, workforce inheritance, and persistence. `bun run typecheck` checks TypeScript.

## Progression

1. **Office.** Hire employees, buy blank forms, set retail prices, and sell into demand. Cultivars and genes apply only to future hires. Equipment and incentives benefit everyone. Research Time study to create departments, then automate procurement.
2. **Enterprise.** Allocate employees among operations, research, sales, and compliance. Choose an operating policy and a permanent management path. Fulfill timed orders using real production, respond to corporate crises, and acquire growing competitors and their unmodified legacy staff. Optional competitive tenders disclose changing priorities and three approaches. Commit cash and research, watch evaluation, and inspect the retained result.
3. **Conglomerate.** Open regional branches and hire workforce cohorts. Each cohort retains its own cultivar and gene snapshot. Scale markets, supply chains, research, and productive capacity to authorize autonomous franchising.
4. **Network.** Allocate autonomous offices among discovery, replication, processing, and stabilization. Cleared work funds natural replication; expansion and intensive computing create coordination pressure. Survey diverts processing, while Parallel diverts discovery and spends knowledge. Discover and process a finite billion workflows, deploy six protocols, then decide who owns the finished corporation.

The two management paths trade output and influence against morale, pressure, and research. Policies remain reversible. Six corporate crises affect different resources, including demand, research, and regulatory pressure. Nineteen corporate projects unlock systems throughout the game.

The opening has $0 and one empty cubicle. File 28 forms, sold into retail demand, to earn your first worker. Hold Space to file continuously. When supplies are exhausted, an explicitly supplied emergency request pays $1.25. Actual emergency earnings are protected from payroll up to one supply pack, including acquired-workforce insolvency. A staffed company with no usable forms and too little cash for supplies can claim one free 250-form supplier pack per company. The used entitlement survives saving and import. Employee production needs supplies and retail demand. Base wages are $0.09 per employee per second, modified by policy and inherited metabolic costs. Researchers, sales staff, and compliance staff do not produce retail forms. Keep some employees in operations to pay for growth.

Contracts put new production into escrow. Failed or canceled orders return their forms to inventory, with a reputation penalty. Receipts retain actual rewards, returned forms, and reputation changes. Standing orders preserve the chosen allocation. Stock-market standing is a scoreboard; there is no stock trading.

Reincorporation awards five legacy credits. Invest them in founding capital, research output, or employee welfare. Existing employees and cohorts never gain genes retroactively.


The UI reveals controls as their problems become relevant. The opening has no tabs; the company grows to three workspaces, then Network and Archive. Genetic research and the two-slot hiring profile are separate. Bulk hires, exact replacement quotes, one-action staffing rebalance, automatic procurement, standing contract and memo instructions, and delegated infrastructure remove repeat maintenance. After Distributed computing, commission offices with exact cash and knowledge quotes, choose Standard, Survey, or Parallel computing, and optionally delegate launches with Research first investment. Delegated building and launches are earned after 10,000 cleared workflows. Cash and knowledge reserves prevent repeated upkeep decisions. Workspace, project, and procedure discoveries remain marked until inspected. Tender settlement appears even while another workspace is open. Quiet office sounds are opt-in. Informational Network letters are collapsed; permanent choices remain visible.

The Office exposes Time study, procurement, and Brand book where they are needed. Marketing adds 60% customer demand per campaign at an unchanged price. Sales staff expand demand immediately; hiring operations staff increases production and payroll. Retail prices can be set to the cent, without a $5 gameplay cap. Higher prices reduce demand.

## Saves and simulation

Saves update every five seconds. Sequential stale-tab writes are blocked and the local session remains exportable; browser storage comparison is not an atomic lock. Offline simulation uses the same rules as live play, capped at two hours. Pause stops all simulation. Board decisions and permanent correspondence choices wait indefinitely. Completed companies stop simulating until reincorporation.

Version-one and version-two saves migrate to the expanded game while preserving funds, research, employees, and historical output. Historical tender submissions retain their original cash-only terms. The original storage key is retained. Malformed saves enter recovery and are not overwritten. Settings provides export, validated import, and confirmed reset. All gameplay runs locally, without an account or backend.

`src/game/testing/playthrough.ts` is a reproducible player that uses only legal actions from a fresh company. Tests run both management paths through all four eras and both endings, then verify reincorporation and offline save recovery. Current formula-informed runs finish in 38.2 to 42.2 minutes across both paths and three seeds; a one-decision-per-minute policy takes 179.4 minutes. Details are reported in BALANCE.md. Human play is expected to vary. See [DESIGN_REVIEW.md](DESIGN_REVIEW.md) for the research-informed adversarial decision ledger and unresolved evidence limits. See [DESIGN.md](DESIGN.md) for the acceptance contract and [BALANCE.md](BALANCE.md) for reproducible pacing, investment returns, gene specialization, and remaining evidence limits. `bun run balance` regenerates the report text.

## Hairline artwork

The figures use the [hairline-create skill](https://hairline.lucasmarkes.com/skill) and unchanged [Hairline](https://hairline.lucasmarkes.com/figures) kernel by Lucas Marques, under the MIT license in `public/hairline/LICENSE`.

- `public/hairline/cubicles.js`: employees sit up under inspection, with growing paperwork piles.
- `public/hairline/tower.js`: headquarters floors slide out for inspection.
- `public/hairline/campus.js`: franchise towers rise under the pointer, with neighbors responding by distance.

Each has a self-contained `public/hairline-<name>.html` bench. The campus emphasizes rules 1, 2, 3, 5, 6, and 9. Its validator passes, and the collaborative browser checks cover rest, hover, 240px, both intensity extremes, both themes, bounds, read-outs, and settling. The engine honors reduced motion and sleeps when figures are offscreen or settled.

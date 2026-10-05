import { playthrough, recoverNetwork, reportedStalledNetwork } from './playthrough';
import { advance, upgradeCost } from '../engine';
import { labFixture, officeFixture, perform } from './fixtures';
import { marginalPurchase } from '../balance';
import { departmentYield, risks } from '../workforce';
import { geneEffects } from '../genome';
import { parseGame, type Employee, type GameState } from '../state';
import type { GeneId } from '../catalog';
import { agencyPolicies, compareNetworkAgency, legalNetworkEntry } from './network-agency';

const minutes = (seconds: number) => (seconds / 60).toFixed(1);
const phaseTime = (run: ReturnType<typeof playthrough>, phase: string) => run.transitions.find(t => t.phase === phase)?.seconds ?? 0;
const longestGap = (times: number[]) => Math.max(...times.slice(1).map((time, index) => time - (times[index] ?? 0)));
console.log('# Cube Farm balance evidence\n\nReproduce with `bun run balance`. These deterministic, legal players know the economic formulas. They establish pacing and recovery checks, not human enjoyment. UI interactions are modeled, including workspace switches and edit/submit controls, rather than measured browser clicks. Scrolling, thinking, and optional inspection are excluded.\n');
console.log('| Path | Seed | Enterprise, min | Conglomerate, min | Network, min | Finale, min | Commands | Modeled interactions | First letter or protocol, s | Longest letter or protocol gap, s | First new protocol, s | Longest protocol gap, s |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
for (const path of ['stewardship', 'extraction'] as const) for (const seed of [7, 42, 101]) {
  const run = playthrough(path, seed), entry = phaseTime(run, 'network');
  const rewards = run.actions.filter(a => a.phase === 'network' && ['protocol', 'read-letter'].includes(a.type) && a.seconds > entry);
  const times = [entry, ...rewards.map(a => a.seconds), run.state.elapsed];
  const protocols = rewards.filter(action => action.action.type === 'protocol' && !['efficient', 'distributed'].includes(action.action.id));
  const protocolTimes = [entry, ...protocols.map(action => action.seconds), run.state.elapsed];
  console.log(`| ${path} | ${seed} | ${minutes(phaseTime(run, 'enterprise'))} | ${minutes(phaseTime(run, 'conglomerate'))} | ${minutes(entry)} | ${minutes(run.state.elapsed)} | ${run.clicks} | ${run.interactions} | ${(rewards[0]?.seconds ?? entry) - entry} | ${longestGap(times)} | ${(protocols[0]?.seconds ?? entry) - entry} | ${longestGap(protocolTimes)} |`);
}
console.log('\nEvery run earns the first worker through 28 manual forms, then uses no more personal filing. Price reviews occur at most every two minutes. Network automation leaves allocation decisions to the player. Tests retain the original four-hour completion ceiling and add a 90-minute target, fewer than 350 modeled interactions, first Network letter or protocol within five minutes, and combined letter or protocol gaps within six minutes. Protocol-only gaps include the interval from the final protocol to completion, and expose waits that correspondence can otherwise mask.\n');
const learningRun = playthrough('stewardship', 7);
console.log('| First-visible primary card, fresh stewardship seed 7 | Operating seconds | Trigger |\n| --- | ---: | --- |');
const learningCards = new Set(['facility:coffee', 'profile:processor', 'departments', 'project:procurement', 'project:brand', 'project:standards', 'contracts', 'project:logistics', 'tenders', 'project:stewardship', 'project:analytics', 'project:legal', 'delegation', 'genetics', 'gene:cognition', 'gene:synthesis', 'branches', 'project:franchise', 'project:coordination', 'project:continental']);
for (const item of learningRun.introductions) if (learningCards.has(item.id)) console.log(`| ${item.id} | ${item.seconds} | ${item.source} |`);
console.log('\nFirst visibility includes disabled primary cards and is sampled after every successful command and each simulation advance, independently of purchases. Contextual supply and demand recovery disclosures remain accessible. New companies use short observation windows; historical saves retain their original access. Pause freezes them, while offline progress can meet multiple windows before a return. Some independent introductions still coincide or arrive ten seconds apart. Source-tagged tests distinguish purchase cascades from timer coincidences. These windows create an opportunity to observe effects, not proof of understanding. The eager extraction policies can select their advanced profile without hiring another headquarters employee before Network; separate action tests verify usable future hires and unchanged historical genes.\n');
console.log('| Network strategy, seed 7 stewardship | Network duration, min | Finale, min |\n| --- | ---: | ---: |');
for (const plan of ['staged', 'growth', 'survey'] as const) {
  const run = playthrough('stewardship', 7, undefined, plan);
  console.log(`| ${plan} | ${minutes(run.state.elapsed - phaseTime(run, 'network'))} | ${minutes(run.state.elapsed)} |`);
}
console.log('\n| Minimum interval between successful post-opening decisions, seed 7 stewardship | Finale, min | Commands | Modeled interactions |\n| --- | ---: | ---: | ---: |');
for (const interval of [0, 30, 60]) {
  const run = playthrough('stewardship', 7, undefined, 'staged', 5000, interval);
  console.log(`| ${interval}s | ${minutes(run.state.elapsed)} | ${run.clicks} | ${run.interactions} |`);
}
console.log('\nDecision intervals are controlled policy perturbations, not models of human behavior. The slower player retains formula knowledge and the same purchase priorities. Tests require the 60-second policy to finish within the original four-hour ceiling; the 90-minute and interaction targets remain enforced for the eager player.\n');
const reported = reportedStalledNetwork(), recovery = recoverNetwork(reported);
const recoveryProtocols = recovery.actions.filter(action => action.action.type === 'protocol');
const waiting = advance(reported, 200, () => 0.99);
console.log('| Reported process-only Network recovery | Remaining finale, min | First new protocol, s | Longest protocol gap, s |\n| --- | ---: | ---: | ---: |');
console.log(`| Grow, then Clear near 5,000 offices | ${minutes(recovery.remainingSeconds)} | ${recoveryProtocols[0]?.seconds ?? 'none'} | ${longestGap([0, ...recoveryProtocols.map(action => action.seconds), recovery.remainingSeconds])} |`);
if (waiting.corporation.phase.id !== 'network') throw new Error('Reported waiting fixture left the Network.');
console.log(`\nThe compact reported-run fixture reproduces the submitted allocation and mechanical resources without storing its workforce records. Waiting 200 seconds at 100% processing empties its discovered backlog, leaves discovery at ${waiting.corporation.phase.network.discoveredRate}/s, and reduces offices to ${waiting.corporation.phase.network.nodes.toFixed(2)}. Recovery buys no additional power plants or servers. At audit time, exact-save verification matched the compact fixture's completion and protocol timings. This is a recovery check for an observed problem, not an estimate of human decision time.\n`);
console.log('| Network agency, one-second legal actions | Capital | Routing | Finish, s | First additional procedure, s | Commands | Modeled interactions | Setup | Allocation/routing switches | Maintenance | Commissioned | Commission cash | Commission knowledge | Parallel knowledge spent |\n| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |');
const agencyEntries: { name: string; initial: GameState }[] = [{ name: 'Compact reported state', initial: reported }];
for (const path of ['stewardship', 'extraction'] as const) for (const seed of [7, 42, 101]) agencyEntries.push({ name: `Legal ${path} entry, seed ${seed}`, initial: legalNetworkEntry(seed, path) });
for (const { name, initial } of agencyEntries) {
  for (const policy of agencyPolicies) {
    const run = compareNetworkAgency(initial, policy);
    console.log(`| ${name} | ${policy.capital} | ${policy.routing} | ${run.seconds} | ${run.firstProcedure ?? 'none'} | ${run.actions.length} | ${run.interactions} | ${run.setup} | ${run.switches} | ${run.maintenance} | ${run.commissioned} | $${run.commissionCash.toFixed(0)} | ${run.commissionKnowledge.toFixed(2)} | ${run.knowledgeSpent.toFixed(2)} |`);
  }
}
console.log('\nReproduce these comparisons with `compareNetworkAgency` in `src/game/testing/network-agency.ts`. No money, procedures or offices are injected by the player. Setup and switches are included in total commands, not extra counts. The adaptive player compares actual sixty-second funded forecasts no more often than once per minute, requires a 20% estimated benefit, and preserves research income until the final procedure. Parallel is considered when the located backlog exceeds twice the undiscovered pool. It selects Clear near 5,000 offices. A policy may correctly retain Standard throughout a fresh run. Both commissioning and infrastructure are delegated, with no manual maintenance. First additional procedure excludes the initial efficient/distributed deployments. Compact-state treasury growth differs from the full submitted workforce, so investment completion times must not be presented as exact-save forecasts. The former prescribed Survey-until-singularity policy and its universal first-protocol advantage are obsolete after routing diversion costs. Regression tests now require funded commissioning to beat manual operation, adaptive routing to preserve or improve completion and research timing, both intensive routes to win actual earned bottleneck regimes, and no repeated maintenance or automatic tender play. These comparisons demonstrate consequences and resource costs, not enjoyment. The rejected Expansion first policy starved procedures in the actual rich save and was removed rather than retained as a dominated trap.\n');
const suppliedSavePath = process.env.CUBE_FARM_REPORTED_SAVE;
if (suppliedSavePath !== undefined) {
  const original = await Bun.file(suppliedSavePath).text();
  const input: unknown = JSON.parse(original);
  const parsed = parseGame(input);
  if (!parsed.success) throw new Error(`Supplied save failed validation: ${parsed.error.message}`);
  console.log('\n| Exact supplied save, copied in memory | Finish, s | First additional procedure, s | Commands | Modeled interactions | Commissioned | Maintenance |\n| --- | ---: | ---: | ---: | ---: | ---: | ---: |');
  for (const policy of agencyPolicies) {
    const run = compareNetworkAgency(structuredClone(parsed.data), policy);
    console.log(`| ${policy.capital}, ${policy.routing} | ${run.seconds} | ${run.firstProcedure ?? 'none'} | ${run.actions.length} | ${run.interactions} | ${run.commissioned} | ${run.maintenance} |`);
  }
  if (await Bun.file(suppliedSavePath).text() !== original) throw new Error('The supplied attachment changed during read-only verification.');
  console.log('\nThese optional rows use the actual submitted workforce and treasury through the normal save parser and legal actions. The attachment remains byte-for-byte unchanged, and no workforce records are copied into this report. Reproduce with `CUBE_FARM_REPORTED_SAVE=/path/to/save.json bun run balance`. No tenders are required or played by these baseline policies.\n');
}
const fixture = officeFixture();
const early: GameState = { ...fixture, cash: 50000, revenue: 10000, corporation: { ...fixture.corporation, marketing: 5 } };
let large = perform(early, { type: 'upgrade', id: 'capacity', count: 2 });
large = perform(large, { type: 'hire', cultivar: 'generalist', count: 33 });
large = { ...large, upgrades: { ...large.upgrades, equipment: 4 } };
console.log('\n| Unconstrained sales, fixed morale | Purchase | Cost, USD | Marginal income/s, USD | Payback, seconds |\n| --- | --- | ---: | ---: | ---: |');
for (const [name, state] of [['3 workers, equipment level 0', early], ['36 workers, equipment level 4', large]] as const) {
  for (const item of ['equipment', 'coffee'] as const) {
    const cost = item === 'coffee' ? 25 : upgradeCost(state, 'equipment');
    const improved: GameState = item === 'coffee' ? { ...state, facilities: [...state.facilities, 'coffee'] } : { ...state, upgrades: { ...state.upgrades, equipment: state.upgrades.equipment + 1 } };
    const gain = marginalPurchase(state, improved, cost);
    console.log(`| ${name} | ${item} | ${cost} | ${gain.income.toFixed(3)} | ${gain.payback?.toFixed(1) ?? 'none'} |`);
  }
}
console.log('\nEstimates assume supplies and sales capacity, exclude morale recovery, and use expected downtime. The UI recalculates return at the current company state and identifies demand bottlenecks.\n');
const lab = labFixture(), original = lab.employees[0];
if (!original) throw new Error('Balance report requires a nonempty lab fixture.');
const state: GameState = { ...lab, upgrades: { ...lab.upgrades, quality: 4, training: 4 }, facilities: ['coffee', 'snacks', 'cafeteria', 'gym', 'benefits'] };
const profiles: { name: string; genes: GeneId[] }[] = [{ name: 'Production', genes: ['cognition', 'synthesis'] }, { name: 'Research', genes: ['focus', 'precision'] }, { name: 'Compliance', genes: ['endurance', 'focus'] }];
console.log('| Specialist, aptitude 1, QA 4 and all incentives | Expected forms/s | Insights/s | Pressure reduction/s | Payroll multiplier |\n| --- | ---: | ---: | ---: | ---: |');
for (const profile of profiles) {
  const yields = (['operations', 'research', 'compliance'] as const).map(role => {
    const worker: Employee = { ...original, cultivar: 'specialist', aptitude: 1, genes: profile.genes, role }, risk = risks(state, worker);
    return (departmentYield(state, worker).value * 7.5 / (7.5 + (risk.bugs + risk.slack + risk.breaks) * 4.5)).toFixed(3);
  });
  console.log(`| ${profile.name} | ${yields.join(' | ')} | ${geneEffects(profile.genes).wages.toFixed(2)} |`);
}
console.log('\nResearch and compliance specialization also pass at QA 0 and QA 8. Researching or selecting genes never rewrites existing workers or cohorts.\n\nThe patent buyout is an authored acknowledgement, not a substantial late-game economic hurdle. Permanent research/output/morale/pressure consequences are the mechanical cost of earlier promises. The fastest benchmarks reach Conglomerate before the 20-minute aspirational target; only upper pacing limits are enforced. Human playtesting remains necessary, especially with imperfect pricing and purchase choices.\n');

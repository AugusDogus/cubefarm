import { expect, test } from 'bun:test';
import { GameSchema } from './state';
import { WORLD_WORKFLOWS } from './network';
import { reportedStalledNetwork } from './testing/playthrough';
import { compareNetworkAgency, legalNetworkEntry } from './testing/network-agency';

test.each(['reported', 'legal'] as const)('%s Network offers funded acceleration without maintenance', source => {
  const initial = source === 'reported' ? reportedStalledNetwork() : legalNetworkEntry();
  const snapshot = structuredClone(initial);
  const manual = compareNetworkAgency(initial, { capital: 'manual', routing: 'standard' });
  const funded = compareNetworkAgency(initial, { capital: 'research-first', routing: 'standard' });
  const adaptive = compareNetworkAgency(initial, { capital: 'research-first', routing: 'adaptive' });
  expect(initial).toEqual(snapshot);
  expect(manual.commissioned).toBe(0);
  expect(funded.commissioned).toBeGreaterThan(0);
  expect(funded.commissionCash).toBeGreaterThan(0);
  expect(funded.commissionKnowledge).toBeGreaterThan(0);
  expect(funded.seconds).toBeLessThan(manual.seconds);
  expect(funded.firstProcedure).toBe(manual.firstProcedure);
  // Routing is conditional, so a funded Standard route can remain the best choice.
  expect(adaptive.seconds).toBeLessThanOrEqual(funded.seconds);
  expect(adaptive.firstProcedure).not.toBeNull();
  expect(funded.firstProcedure).not.toBeNull();
  if (adaptive.firstProcedure === null || funded.firstProcedure === null) throw new Error('Network comparison did not earn a new procedure.');
  // The new Survey processing penalty removes its former unconditional research advantage.
  // Preserve research cadence while testing conditional route advantages separately.
  expect(adaptive.firstProcedure).toBeLessThanOrEqual(funded.firstProcedure);
  expect(adaptive.knowledgeSpent > 0).toBe(adaptive.actions.some(({ action }) => action.type === 'network-routing' && action.routing === 'parallel'));
  expect(manual.knowledgeSpent).toBe(0);
  for (const run of [manual, funded, adaptive]) {
    expect(run.seconds).toBeLessThan(4 * 3600);
    expect(run.actions.length).toBeLessThanOrEqual(13);
    expect(run.switches).toBeLessThanOrEqual(5);
    expect(run.maintenance).toBe(0);
    expect(run.state.cash).toBeGreaterThanOrEqual(run.state.automation.reserve);
    expect(GameSchema.safeParse(run.state).success).toBe(true);
    const phase = run.state.corporation.phase;
    if (phase.id !== 'network') throw new Error('Completed agency player left Network unexpectedly.');
    expect(phase.network.completed).toBe(WORLD_WORKFLOWS);
    expect(phase.network.undiscovered).toBe(0);
    expect(phase.network.discovered).toBe(0);
  }
});

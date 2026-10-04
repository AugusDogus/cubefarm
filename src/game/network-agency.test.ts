import { describe, expect, test } from 'bun:test';
import { initialNetwork, infrastructureNeed, KNOWLEDGE_WORKFLOWS, NetworkSchema, tickNetwork, WORLD_WORKFLOWS, type ComputeRouting, type Network } from './network';
import { commissionNetwork, networkCommissionCost, networkCommissionQuote } from './network-capital';

function productiveNetwork(): Network {
  return {
    ...initialNetwork(), nodes: 100, plants: 100, servers: 100, energy: 10000, compute: 40000, protocols: ['distributed'],
    undiscovered: WORLD_WORKFLOWS - 100000, discovered: 100000,
    allocation: { discover: 30, replicate: 20, process: 30, stabilize: 20 },
  };
}

describe('network commissioning', () => {
  test('spends cash and knowledge together without changing allocations or workflows', () => {
    const n = initialNetwork();
    const cost = networkCommissionCost(n, 10);
    const result = commissionNetwork(n, 10, cost.cash);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.cost).toEqual(cost);
    expect(result.network.nodes).toBe(n.nodes + 10);
    expect(result.network.commissioned).toBe(10);
    expect(result.network.knowledge).toBe(n.knowledge - cost.knowledge);
    expect(result.network.allocation).toEqual(n.allocation);
    expect(result.network.undiscovered).toBe(n.undiscovered);
    expect(result.network.discovered).toBe(n.discovered);
    expect(result.network.completed).toBe(n.completed);
    expect(NetworkSchema.safeParse(result.network).success).toBe(true);
    expect(n).toEqual(initialNetwork());
  });

  test('prices cumulative installations, independent of losses or batch order', () => {
    const n = { ...initialNetwork(), commissioned: 200, knowledge: 1000000 };
    const batch = networkCommissionCost(n, 40);
    const first = networkCommissionCost(n, 17);
    const last = networkCommissionCost({ ...n, commissioned: n.commissioned + 17 }, 23);
    expect(batch.cash).toBe(first.cash + last.cash);
    expect(batch.knowledge).toBe(first.knowledge + last.knowledge);
    expect(networkCommissionCost({ ...n, nodes: 1 }, 40)).toEqual(batch);
    expect(networkCommissionCost(n, 1).knowledge).toBe(50);
    expect(networkCommissionCost({ ...n, commissioned: 0 }, 1).knowledge).toBe(25);
    for (const commissioned of [0, 1, 199, 200, 999000]) {
      const priced = { ...n, commissioned };
      const whole = networkCommissionCost(priced, 1000);
      const splitA = networkCommissionCost(priced, 333);
      const splitB = networkCommissionCost({ ...priced, commissioned: commissioned + 333 }, 667);
      expect(whole.cash).toBe(splitA.cash + splitB.cash);
      expect(whole.knowledge).toBe(splitA.knowledge + splitB.knowledge);
    }
  });

  test('returns the exact affordable boundary using both budgets', () => {
    const n = { ...initialNetwork(), knowledge: 1000000 };
    const cashBoundary = networkCommissionCost(n, 31).cash;
    expect(networkCommissionQuote(n, cashBoundary).count).toBe(31);
    expect(networkCommissionQuote(n, cashBoundary - 0.01).count).toBe(30);
    const knowledgeBoundary = networkCommissionCost(n, 7).knowledge;
    expect(networkCommissionQuote({ ...n, knowledge: knowledgeBoundary }, 1000000000).count).toBe(7);
    expect(networkCommissionQuote({ ...n, knowledge: knowledgeBoundary - 0.001 }, 1000000000).count).toBe(6);
    expect(networkCommissionQuote(n, Number.NaN).count).toBe(0);
    expect(networkCommissionQuote(n, 1000000000, 0).count).toBe(0);
    expect(networkCommissionQuote({ ...n, commissioned: 1000000 }, 1000000000).count).toBe(0);
    expect(networkCommissionQuote({ ...n, nodes: Number.MAX_SAFE_INTEGER }, 1000000000).count).toBe(0);
  });

  test('failed commissioning leaves all resources untouched', () => {
    const n = initialNetwork();
    const before = structuredClone(n);
    expect(commissionNetwork(n, 1, 24999)).toEqual({ ok: false, reason: 'cash' });
    expect(commissionNetwork({ ...n, knowledge: 24.99 }, 1, 25000)).toEqual({ ok: false, reason: 'knowledge' });
    expect(commissionNetwork(n, 0, 1000000000)).toEqual({ ok: false, reason: 'invalid-count' });
    expect(commissionNetwork(n, 1001, 1000000000)).toEqual({ ok: false, reason: 'invalid-count' });
    expect(commissionNetwork({ ...n, commissioned: 1000000 }, 1, 1000000000)).toEqual({ ok: false, reason: 'launch-limit' });
    expect(commissionNetwork({ ...n, nodes: Number.MAX_SAFE_INTEGER }, 1, 1000000000)).toEqual({ ok: false, reason: 'node-limit' });
    expect(n).toEqual(before);
  });

  test('commissioning competes with protocol knowledge rather than cash alone', () => {
    const n = initialNetwork();
    const result = commissionNetwork(n, 30, 1000000000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.network.knowledge).toBeLessThan(1200);
    expect(n.knowledge).toBeGreaterThanOrEqual(500 + 1200);
  });
});

describe('network compute routing', () => {
  test('survey and parallel accelerate different work while paying actual resource costs', () => {
    const n = productiveNetwork();
    const standard = tickNetwork(n, 2, 0);
    const survey = tickNetwork({ ...n, computeRouting: 'survey' }, 2, 0);
    const parallel = tickNetwork({ ...n, computeRouting: 'parallel' }, 2, 0);
    expect(survey.network.discoveredRate).toBe(standard.network.discoveredRate * 2);
    expect(survey.network.processedRate).toBeCloseTo(standard.network.processedRate * 0.65);
    expect(parallel.network.discoveredRate).toBeCloseTo(standard.network.discoveredRate * 0.65);
    expect(parallel.network.processedRate).toBe(standard.network.processedRate * 2);
    expect(survey.network.nodes).toBe(standard.network.nodes);
    expect(parallel.network.nodes).toBe(standard.network.nodes);
    expect(standard.network.compute - survey.network.compute).toBeCloseTo(standard.network.discoveredRate * 2 * 0.25);
    expect(standard.network.compute - parallel.network.compute).toBeCloseTo(standard.network.processedRate * 2 * 0.5);
    expect(parallel.network.knowledgeSpentRate).toBeCloseTo(standard.network.processedRate * 0.1);
    expect(parallel.revenue).toBe(parallel.network.processedRate * 2 * 0.06);
    expect(parallel.network.knowledge).toBeCloseTo(n.knowledge - parallel.network.knowledgeSpentRate * 2 + (parallel.network.discoveredRate + parallel.network.processedRate) * 2 / KNOWLEDGE_WORKFLOWS);
    expect(NetworkSchema.safeParse(parallel.network).success).toBe(true);
  });

  test('scarce compute goes to baseline replication before discovery bonuses', () => {
    const n: Network = {
      ...productiveNetwork(), nodes: 100000, plants: 1000, servers: 1, compute: 0,
      allocation: { discover: 1, replicate: 87, process: 0, stabilize: 12 },
    };
    const standard = tickNetwork(n, 1, 0).network;
    const survey = tickNetwork({ ...n, computeRouting: 'survey' }, 1, 0).network;
    expect(standard.growthRate).toBe(32);
    expect(survey.growthRate).toBe(standard.growthRate);
    expect(survey.discoveredRate).toBe(standard.discoveredRate);
    expect(survey.compute).toBe(0);
  });

  test('parallel throttles against knowledge reserve without reducing baseline work', () => {
    const n = { ...productiveNetwork(), knowledge: 101, knowledgeReserve: 100 };
    const standard = tickNetwork(n, 1, 0).network;
    const parallel = tickNetwork({ ...n, computeRouting: 'parallel' }, 1, 0).network;
    expect(parallel.processedRate - standard.processedRate).toBeCloseTo(10);
    expect(parallel.knowledgeSpentRate).toBeCloseTo(1);
    expect(parallel.knowledge).toBeGreaterThanOrEqual(100);
    expect(parallel.nodes).toBe(standard.nodes);
    const blocked = tickNetwork({ ...n, knowledge: 99, computeRouting: 'parallel' }, 1, 0).network;
    expect(blocked.processedRate).toBe(standard.processedRate);
    expect(blocked.knowledgeSpentRate).toBe(0);
  });

  test('discovery funding reaches the next protocol sooner while parallel clears more backlog', () => {
    const n: Network = {
      ...productiveNetwork(), knowledge: 2350, discovered: 200000, undiscovered: WORLD_WORKFLOWS - 200000,
      allocation: { discover: 25, replicate: 0, process: 60, stabilize: 15 },
    };
    function reachProtocolBudget(routing: ComputeRouting) {
      let network = { ...n, computeRouting: routing };
      let seconds = 0;
      while (network.knowledge < 2500 && seconds < 60) {
        network = tickNetwork(network, 1, 0).network;
        seconds += 1;
      }
      return { network, seconds };
    }
    const standard = reachProtocolBudget('standard');
    const survey = reachProtocolBudget('survey');
    const parallel = reachProtocolBudget('parallel');
    expect(standard.seconds).toBe(5);
    expect(survey.seconds).toBe(4);
    expect(parallel.seconds).toBe(60);
    expect(parallel.network.knowledge).toBeLessThan(2500);
    expect(parallel.network.completed).toBeGreaterThan(standard.network.completed);
    expect(parallel.network.completed).toBeGreaterThan(survey.network.completed);
    expect(survey.network.knowledge).toBeGreaterThan(2500);
  });

  test('routing spends only for real finite workflows', () => {
    const n: Network = {
      ...productiveNetwork(), nodes: 1, undiscovered: 0, discovered: 8, completed: WORLD_WORKFLOWS - 8,
      allocation: { discover: 0, replicate: 0, process: 50, stabilize: 50 }, computeRouting: 'parallel',
    };
    const result = tickNetwork(n, 1, 0);
    expect(result.network.processedRate).toBe(8);
    expect(result.network.knowledgeSpentRate).toBeCloseTo(0.2);
    expect(result.network.computeSpentRate).toBe(1);
    expect(result.revenue).toBe(8 * 0.06);
    expect(result.network.completed).toBe(WORLD_WORKFLOWS);
    expect(result.network.discovered).toBe(0);
    expect(result.network.undiscovered).toBe(0);
    expect(NetworkSchema.safeParse(result.network).success).toBe(true);
    const exhausted = tickNetwork(result.network, 1, 0).network;
    expect(exhausted.knowledgeSpentRate).toBe(0);
    expect(exhausted.computeSpentRate).toBe(0);
  });

  test('delegated capacity accounts for sustained selected compute demand', () => {
    const n = { ...productiveNetwork(), servers: 1, compute: 0 };
    const standard = infrastructureNeed(n);
    const survey = infrastructureNeed({ ...n, computeRouting: 'survey' });
    const parallel = infrastructureNeed({ ...n, computeRouting: 'parallel' });
    expect(survey.servers).toBeGreaterThan(standard.servers);
    expect(parallel.servers).toBeGreaterThan(standard.servers);
    expect(survey.plants).toBeGreaterThanOrEqual(standard.plants);
    expect(parallel.plants).toBeGreaterThanOrEqual(standard.plants);
  });

  test('parallel capacity does not buy servers for bonuses blocked by knowledge reserve', () => {
    const n = { ...productiveNetwork(), servers: 1, compute: 0, knowledge: 100, knowledgeReserve: 100 };
    const standard = infrastructureNeed(n);
    const blocked = infrastructureNeed({ ...n, computeRouting: 'parallel' });
    expect(blocked).toEqual(standard);
    const funded = infrastructureNeed({ ...n, knowledge: 1000, computeRouting: 'parallel' });
    expect(funded.servers).toBeGreaterThan(blocked.servers);
    expect(funded.plants).toBeGreaterThanOrEqual(blocked.plants);
  });

  test('historical network fields default to unchanged standard manual behavior', () => {
    const { commissioned, computeRouting, computeSpentRate, capitalPolicy, knowledgeReserve, knowledgeSpentRate, ...historical } = productiveNetwork();
    const restored = NetworkSchema.parse(historical);
    expect(restored.commissioned).toBe(0);
    expect(restored.computeRouting).toBe('standard');
    expect(restored.capitalPolicy).toBe('manual');
    expect(restored.knowledgeReserve).toBe(0);
    expect(tickNetwork(restored, 1, 0)).toEqual(tickNetwork(productiveNetwork(), 1, 0));
    expect(NetworkSchema.safeParse({ ...restored, computeRouting: 'unknown' }).success).toBe(false);
    expect(NetworkSchema.safeParse({ ...restored, commissioned: -1 }).success).toBe(false);
  });

  test('imported routing and delegated investment require distributed computing', () => {
    const n = initialNetwork();
    expect(NetworkSchema.safeParse(n).success).toBe(true);
    expect(NetworkSchema.safeParse({ ...n, computeRouting: 'survey' }).success).toBe(false);
    expect(NetworkSchema.safeParse({ ...n, computeRouting: 'parallel' }).success).toBe(false);
    expect(NetworkSchema.safeParse({ ...n, capitalPolicy: 'research-first' }).success).toBe(false);
    const unlocked = { ...n, protocols: ['distributed'] };
    expect(NetworkSchema.safeParse({ ...unlocked, computeRouting: 'survey' }).success).toBe(true);
    expect(NetworkSchema.safeParse({ ...unlocked, computeRouting: 'parallel' }).success).toBe(true);
    expect(NetworkSchema.safeParse({ ...unlocked, capitalPolicy: 'research-first' }).success).toBe(true);
    expect(NetworkSchema.safeParse({ ...unlocked, capitalPolicy: 'expansion-first' }).success).toBe(false);
  });
});

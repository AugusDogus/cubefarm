import { z } from 'zod';

// Provisional pacing correction after an observed stalled, wait-heavy human run.
export const NODE_GROWTH = 0.03;
export const FINAL_WORKFLOW_MULTIPLIER = 24;
export const COORDINATION_SCALE = 1500;
// Research cadence compensates for standing plans reserving future coordination capacity.
export const KNOWLEDGE_WORKFLOWS = 40;
export const WORLD_WORKFLOWS = 1_000_000_000;
const resource = z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const allocationKeys = ['discover', 'replicate', 'process', 'stabilize'] as const;
export type AllocationKey = typeof allocationKeys[number];
export const protocolIds = ['efficient', 'distributed', 'mapping', 'compression', 'resilience', 'singularity'] as const;
export type ProtocolId = typeof protocolIds[number];
export const computeRoutingIds = ['standard', 'survey', 'parallel'] as const;
export type ComputeRouting = typeof computeRoutingIds[number];
export const capitalPolicyIds = ['manual', 'research-first'] as const;
export type CapitalPolicy = typeof capitalPolicyIds[number];
export const protocols: Record<ProtocolId, { name: string; description: string; cost: number; requires: readonly ProtocolId[] }> = {
  efficient: { name: 'Low-power cubicles', description: 'Halve power consumed by each franchise.', cost: 500, requires: [] },
  distributed: { name: 'Distributed computing', description: 'Four times server output. Replication uses half as much compute.', cost: 1200, requires: [] },
  mapping: { name: 'Workflow cartography', description: 'Discovery is four times faster.', cost: 2500, requires: ['distributed'] },
  compression: { name: 'Form compression', description: 'Processing is four times faster.', cost: 5000, requires: ['efficient'] },
  resilience: { name: 'Institutional memory', description: 'Halve stability needs. Stabilizers produce knowledge.', cost: 8000, requires: ['distributed'] },
  singularity: { name: 'The final procedure', description: '24 times processing and discovery. One form to end all forms.', cost: 25000, requires: ['mapping', 'compression', 'resilience'] },
};
export const NetworkSchema = z.object({
  nodes: resource.min(1), energy: resource, compute: resource, knowledge: resource,
  undiscovered: resource.max(WORLD_WORKFLOWS), discovered: resource.max(WORLD_WORKFLOWS), completed: resource.max(WORLD_WORKFLOWS),
  plants: z.number().int().min(1).max(1000000), servers: z.number().int().min(1).max(1000000),
  allocation: z.object({ discover: resource.max(100), replicate: resource.max(100), process: resource.max(100), stabilize: resource.max(100) }).refine(a => Math.abs(a.discover + a.replicate + a.process + a.stabilize - 100) < 0.000001, 'Allocation must total 100%.'),
  protocols: z.array(z.enum(protocolIds)).max(protocolIds.length).refine(ids => new Set(ids).size === ids.length),
  infrastructure: z.enum(['manual', 'balanced']),
  commissioned: z.number().int().min(0).max(1000000).default(0),
  coordinationLoad: resource.max(1).default(0),
  replicationCredit: resource.max(1000).default(1000),
  computeRouting: z.enum(computeRoutingIds).default('standard'),
  computeSpentRate: resource.default(0),
  capitalPolicy: z.enum(capitalPolicyIds).default('manual'),
  knowledgeReserve: resource.default(0),
  knowledgeSpentRate: resource.default(0),
  lost: resource, powerUsed: resource, processedRate: resource, discoveredRate: resource, growthRate: z.number().finite(),
}).superRefine((n, ctx) => {
  if (Math.abs(n.undiscovered + n.discovered + n.completed - WORLD_WORKFLOWS) > 0.1) ctx.addIssue({ code: 'custom', message: 'The worldwide workflow balance is inconsistent.' });
  if (n.protocols.some(id => protocols[id].requires.some(p => !n.protocols.includes(p)))) ctx.addIssue({ code: 'custom', message: 'Network protocol prerequisites are missing.' });
  if (n.infrastructure === 'balanced' && !n.protocols.includes('distributed')) ctx.addIssue({ code: 'custom', message: 'Distributed computing is required for delegated infrastructure.' });
  if (n.computeRouting !== 'standard' && !n.protocols.includes('distributed')) ctx.addIssue({ code: 'custom', message: 'Distributed computing is required for compute routing.' });
  if (n.capitalPolicy !== 'manual' && !n.protocols.includes('distributed')) ctx.addIssue({ code: 'custom', message: 'Distributed computing is required for delegated investment.' });
});
export type Network = z.infer<typeof NetworkSchema>;
export type NetworkPlan = 'grow' | 'survey' | 'clear';
export function networkPlan(n: Network, pressure: number, plan: NetworkPlan): Network {
  // Standard Clear with manual investment creates no expansion debt, so load only
  // falls. Growth and intensive plans reserve the full future pressure bound.
  const futureLoad = plan === 'clear' && n.computeRouting === 'standard' && n.capitalPolicy === 'manual' ? n.coordinationLoad : 1;
  const stabilization = Math.ceil(stabilityNeed({ ...n, coordinationLoad: futureLoad }, pressure) * 100) + 2;
  const remaining = 100 - stabilization;
  const discoveryCapacity = 25 * (n.protocols.includes('mapping') ? 4 : 1);
  const processingCapacity = 12 * (n.protocols.includes('compression') ? 4 : 1);
  // Balance the time to locate remaining work against the time to clear the
  // complete queue. Current protocols set capacities; routing remains a choice.
  const clearDiscoveryShare = n.undiscovered > 0 ? n.undiscovered * processingCapacity / (n.undiscovered * processingCapacity + (n.undiscovered + n.discovered) * discoveryCapacity) : 0;
  const shares = plan === 'grow' ? { discover: 0.2, replicate: 0.65, process: 0.15 } : plan === 'survey' ? { discover: 0.6, replicate: 0.15, process: 0.25 } : { discover: clearDiscoveryShare, replicate: 0, process: 1 - clearDiscoveryShare };
  return { ...n, allocation: { discover: remaining * shares.discover, replicate: remaining * shares.replicate, process: remaining * shares.process, stabilize: stabilization } };
}
export type NetworkDiagnosis = {
  id: 'stability' | 'power' | 'replication-credit' | 'compute' | 'growth' | 'discovery' | 'clearance' | 'coordination' | 'coordination-repaired' | 'stability-surplus' | 'working';
  message: string;
  advice: string;
  plan: NetworkPlan | null;
};
/** A single diagnosis feeds the headline and detailed allocation advice. Stock
 * levels alone cannot diagnose a shortage because generators replenish each tick. */
export function networkDiagnosis(n: Network, pressure: number): NetworkDiagnosis {
  const growthPlan = n.undiscovered === 0 ? 'clear' : n.nodes < 5000 ? 'grow' : 'clear';
  const describe = (id: NetworkDiagnosis['id'], message: string, advice: string, plan: NetworkPlan | null = null): NetworkDiagnosis => ({ id, message, advice, plan });
  if (n.allocation.stabilize / 100 < stabilityNeed(n, pressure)) return describe('stability', 'Office losses: raise stabilization.', 'Offices are being lost. Choose a plan with a stabilization margin.', growthPlan);
  const energyAvailable = Math.min(n.plants * 1200, n.energy + powerCapacity(n));
  const serverPower = Math.min(energyAvailable, n.servers * 3);
  const active = Math.min(n.nodes, (energyAvailable - serverPower) / (n.protocols.includes('efficient') ? 0.2 : 0.4));
  if (active < n.nodes * 0.95) return describe('power', 'Power limits active offices.', 'More power lets existing offices work. Inspect infrastructure before expanding the institution.');
  if (n.replicationCredit < 1 && n.allocation.replicate > 0) return describe('replication-credit', 'Clear more work to fund natural replication.', 'Natural expansion needs cleared work: 250 workflows support one new office. Shift offices to clearance to rebuild the expansion budget.', 'clear');
  const expectedGrowth = Math.min(n.replicationCredit, active * n.allocation.replicate / 100 * NODE_GROWTH / (1 + n.nodes / COORDINATION_SCALE));
  const forecast = tickNetwork(n, 1, pressure).network;
  if (expectedGrowth > 0 && forecast.growthRate < expectedGrowth * 0.95 && forecast.compute < 0.000001) return describe('compute', 'Compute limits replication.', 'Server output limits new offices. Inspect infrastructure; existing filing and discovery continue.');

  const futureMargin = Math.ceil(stabilityNeed({ ...n, coordinationLoad: 1 }, pressure) * 100) + 2;
  if (n.protocols.includes('resilience') && n.allocation.replicate > 0 && n.allocation.stabilize >= futureMargin + 3) {
    const plan = n.allocation.discover > n.allocation.replicate ? 'survey' : 'grow';
    const name = plan === 'grow' ? 'Grow' : 'Survey';
    return describe('stability-surplus', 'Institutional memory lowers minimum stabilization.', `Institutional memory lowers minimum stabilization. Compare ${name} to assign more offices to work while retaining a future stability margin. Fewer stabilizers repair coordination more slowly, which can reduce work efficiency.`, plan);
  }
  const repairedMargin = Math.ceil(stabilityNeed(n, pressure) * 100) + 2;
  if (n.computeRouting === 'standard' && n.capitalPolicy === 'manual' && n.allocation.replicate === 0 && n.coordinationLoad <= 0.001 && n.allocation.stabilize > repairedMargin + 3) return describe('coordination-repaired', 'Coordination repaired. Spare stabilization can return to work.', 'Coordination repaired. Refresh Clear to return spare stabilization to locating and processing.', 'clear');
  if (n.undiscovered === 0 && n.allocation.discover > 0) return describe('clearance', 'Everything is mapped. Reassign discovery to clearance.', 'All work is located. Reassign discovery and growth to clearance.', 'clear');
  if (n.undiscovered > 0 && (n.allocation.discover === 0 || n.discovered < forecast.processedRate * 5)) return describe('discovery', 'Discovery limits clearance.', n.allocation.discover === 0 ? 'Clearance will stop when the located backlog runs out. No offices are discovering work.' : 'The located backlog is running low. Compare a plan that discovers enough work to keep clearance supplied.', growthPlan);
  if (n.allocation.replicate === 0 && n.nodes < 1000 && n.undiscovered > 0) return describe('growth', 'The network needs more offices. Choose a growth plan.', 'This small network is not growing. Extra power and servers cannot create offices.', 'grow');
  if (n.coordinationLoad > 0.5) return describe('coordination', 'Coordination load slows work. Stabilization repairs it.', 'Expansion has created coordination pressure. Stabilization repairs it; Standard computing avoids intensive-routing pressure.');
  return describe('working', 'The network is working.', n.nodes >= 5000 && n.allocation.replicate > 0 ? 'Compare Clear now. Growth takes offices away from clearance; check whether it still saves time.' : 'Grow expands the network. Survey locates work. Clear prioritizes finishing it. You can change plans at any time.', n.nodes >= 5000 && n.allocation.replicate > 0 ? 'clear' : null);
}
/** Compatibility for existing guidance consumers. */
export function networkAdvice(n: Network, pressure: number) {
  const diagnosis = networkDiagnosis(n, pressure);
  return { message: diagnosis.advice, plan: diagnosis.plan };
}
export function initialNetwork(): Network {
  // A viable first plan grows while preserving offices even at maximum pressure.
  return { nodes: 8, energy: 1000, compute: 500, knowledge: 1700, undiscovered: WORLD_WORKFLOWS, discovered: 0, completed: 0, plants: 1, servers: 1, allocation: { discover: 10, replicate: 55, process: 10, stabilize: 25 }, protocols: [], infrastructure: 'manual', commissioned: 0, coordinationLoad: 0, replicationCredit: 40, computeRouting: 'standard', computeSpentRate: 0, capitalPolicy: 'manual', knowledgeReserve: 0, knowledgeSpentRate: 0, lost: 0, powerUsed: 0, processedRate: 0, discoveredRate: 0, growthRate: 0 };
}
export function assetCost(n: Network, asset: 'plants' | 'servers', count = 1) {
  // Linear installation costs keep a finite world reachable without infinite price inflation.
  return Math.ceil((asset === 'plants' ? 1800 : 2400) * (count * (1 + n[asset] / 2000) + count * (count - 1) / 4000));
}
export function powerCapacity(n: Network) { return n.plants * 120; }
export function assetQuote(n: Network, asset: 'plants' | 'servers', cash: number, limit = 1000000 - n[asset]) {
  let low = 0, high = Math.min(limit, 1000000 - n[asset]);
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (assetCost(n, asset, middle) <= cash) low = middle; else high = middle - 1;
  }
  return { count: low, cost: assetCost(n, asset, low) };
}
export function coordinationEfficiency(n: Network) { return 1 / (1 + n.coordinationLoad * 0.8); }
export function coordinationRecoveryRate(n: Network) { return n.allocation.stabilize / 100 * 0.018; }
export function replicationSupportRate(n: Network) { return n.processedRate / 250; }
/** Only funded intensive work diverts another department. Parallel's available
 * queue shrinks as discovery is diverted, so solve that bound before charging. */
function routedWork(n: Network, active: number, spareCompute: number, dt: number) {
  const finalMultiplier = n.protocols.includes('singularity') ? FINAL_WORKFLOW_MULTIPLIER : 1;
  const discovery = Math.min(n.undiscovered, active * coordinationEfficiency(n) * n.allocation.discover / 100 * 25 * (n.protocols.includes('mapping') ? 4 : 1) * finalMultiplier * dt);
  const processingCapacity = active * coordinationEfficiency(n) * n.allocation.process / 100 * 12 * (n.protocols.includes('compression') ? 4 : 1) * finalMultiplier * dt;
  const extraDiscovery = n.computeRouting === 'survey' ? Math.min(discovery, n.undiscovered - discovery, spareCompute / 0.25) : 0;
  const surveyFraction = discovery > 0 ? extraDiscovery / discovery : 0;
  const extraProcessing = n.computeRouting === 'parallel' && processingCapacity > 0
    ? Math.min(processingCapacity, Math.max(0, n.discovered + discovery - processingCapacity) / (1 + 0.35 * discovery / processingCapacity), spareCompute / 0.5, Math.max(0, n.knowledge - n.knowledgeReserve) / 0.1)
    : 0;
  const parallelFraction = processingCapacity > 0 ? extraProcessing / processingCapacity : 0;
  const discovered = discovery * (1 - 0.35 * parallelFraction) + extraDiscovery;
  const processed = Math.min(n.discovered + discovered, processingCapacity * (1 - 0.35 * surveyFraction)) + extraProcessing;
  return { discovered, processed, extraDiscovery, extraProcessing, computeSpent: extraDiscovery * 0.25 + extraProcessing * 0.5 };
}
export function infrastructureNeed(n: Network) {
  const nodePower = n.protocols.includes('efficient') ? 0.2 : 0.4;
  const replication = Math.min(n.replicationCredit, n.nodes * n.allocation.replicate / 100 * NODE_GROWTH / (1 + n.nodes / COORDINATION_SCALE));
  // Capacity forecasts the next second using the current knowledge budget.
  // Reserve-limited Parallel work does not require servers for unfunded bonuses.
  const routingCompute = routedWork(n, n.nodes, Infinity, 1).computeSpent;
  const servers = Math.max(0, Math.ceil((replication * (n.protocols.includes('distributed') ? 5 : 10) + routingCompute) / (n.protocols.includes('distributed') ? 160 : 40)) - n.servers);
  const plants = Math.max(0, Math.ceil((n.nodes * nodePower + (n.servers + servers) * 3 + replication * 2) * 1.35 / 120) - n.plants);
  return { plants, servers };
}
export function stabilityNeed(n: Network, pressure: number) { return (0.12 + pressure / 1000 + n.coordinationLoad * 0.12) * (n.protocols.includes('resilience') ? 0.5 : 1); }
export function allocate(n: Network, key: AllocationKey, value: number): Network {
  const target = Math.max(0, Math.min(100, Math.round(value)));
  const others = allocationKeys.filter(k => k !== key);
  const previous = others.reduce((sum, k) => sum + n.allocation[k], 0);
  const allocation = { ...n.allocation, [key]: target };
  for (const k of others) allocation[k] = previous === 0 ? (100 - target) / 3 : n.allocation[k] / previous * (100 - target);
  return { ...n, allocation };
}
export function tickNetwork(n: Network, dt: number, pressure: number): { network: Network; revenue: number } {
  const has = (id: ProtocolId) => n.protocols.includes(id);
  const energyAvailable = Math.min(n.plants * 1200, n.energy + powerCapacity(n) * dt);
  const nodePower = has('efficient') ? 0.2 : 0.4;
  const serverPower = Math.min(energyAvailable, n.servers * 3 * dt);
  const compute = Math.min(n.servers * 400, n.compute + serverPower / 3 * (has('distributed') ? 160 : 40));
  const workPower = Math.min(energyAvailable - serverPower, n.nodes * nodePower * dt);
  const active = workPower / (nodePower * dt);
  const computePerNode = has('distributed') ? 5 : 10;
  const energyLeft = energyAvailable - serverPower - workPower;
  const growth = Math.min(Number.MAX_SAFE_INTEGER - n.nodes, n.replicationCredit, active * n.allocation.replicate / 100 * NODE_GROWTH / (1 + n.nodes / COORDINATION_SCALE) * dt, compute / computePerNode, energyLeft / 2);
  // Cleared work supports natural expansion. Intensive routes trade away another
  // department even when compute is plentiful; reserves protect research.
  // Natural replication keeps its baseline budget. Routing spends only spare compute,
  // and falls back to ordinary work instead of stopping when the buffer runs dry.
  const spareBudget = Math.max(0, compute - growth * computePerNode);
  const { discovered, processed, extraDiscovery, extraProcessing, computeSpent } = routedWork(n, active, spareBudget, dt);
  const spareCompute = Math.max(0, spareBudget - computeSpent);
  const intensiveWork = extraDiscovery / (25 * (has('mapping') ? 4 : 1) * (has('singularity') ? FINAL_WORKFLOW_MULTIPLIER : 1)) + extraProcessing / (12 * (has('compression') ? 4 : 1) * (has('singularity') ? FINAL_WORKFLOW_MULTIPLIER : 1));
  const loadAdded = growth / 1000 * 0.4 + intensiveWork / Math.max(8, n.nodes) * 0.004;
  const coordinationLoad = Math.min(1, Math.max(0, n.coordinationLoad + loadAdded - coordinationRecoveryRate(n) * dt));
  const instability = Math.max(0, stabilityNeed(n, pressure) - n.allocation.stabilize / 100);
  const losses = Math.min(n.nodes - 1, n.nodes * instability * 0.025 * dt);
  const network: Network = {
    ...n, coordinationLoad, replicationCredit: Math.min(1000, Math.max(0, n.replicationCredit - growth + processed / 250)), nodes: n.nodes + growth - losses, energy: Math.max(0, energyLeft - growth * 2), compute: Math.max(0, spareCompute), computeSpentRate: (growth * computePerNode + extraDiscovery * 0.25 + extraProcessing * 0.5) / dt,
    knowledge: Math.min(Number.MAX_SAFE_INTEGER, n.knowledge - extraProcessing * 0.1 + (discovered + processed) / KNOWLEDGE_WORKFLOWS + (has('resilience') ? active * n.allocation.stabilize / 100 * 0.03 * dt : 0)), knowledgeSpentRate: extraProcessing * 0.1 / dt,
    undiscovered: Math.max(0, n.undiscovered - discovered), discovered: Math.max(0, n.discovered + discovered - processed), completed: Math.min(WORLD_WORKFLOWS, n.completed + processed),
    lost: Math.min(Number.MAX_SAFE_INTEGER, n.lost + losses), powerUsed: (serverPower + workPower + growth * 2) / dt, processedRate: processed / dt, discoveredRate: discovered / dt, growthRate: (growth - losses) / dt,
  };
  // Snap numerical dust to zero only when the complete finite pool has been processed.
  if (network.undiscovered + network.discovered < 0.001) { network.undiscovered = 0; network.discovered = 0; network.completed = WORLD_WORKFLOWS; }
  return { network, revenue: processed * 0.06 };
}

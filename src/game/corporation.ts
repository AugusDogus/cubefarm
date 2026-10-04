import { z } from 'zod';
import { projectIds } from './projects';
import { NetworkSchema } from './network';
import { PriceSchema } from './price';
import { TenderSchema, initialTender } from './tender-state';

export const roles = ['operations', 'research', 'sales', 'compliance'] as const;
export type Role = typeof roles[number];
export const policies = ['balanced', 'lean', 'humane'] as const;
export type Policy = typeof policies[number];
export const rivalIds = ['forms', 'desk', 'memo', 'synergy', 'global', 'omni'] as const;
export type RivalId = typeof rivalIds[number];
export const rivals: Record<RivalId, { name: string; revenue: number; growth: number; cost: number; employees: number }> = {
  forms: { name: 'Forms & Sons', revenue: 1200, growth: 0.08, cost: 1200, employees: 12 },
  desk: { name: 'Desk Industries', revenue: 5000, growth: 0.2, cost: 2500, employees: 24 },
  memo: { name: 'Memo Holdings', revenue: 12000, growth: 0.4, cost: 7000, employees: 48 },
  synergy: { name: 'Synergy Group', revenue: 30000, growth: 0.7, cost: 18000, employees: 90 },
  global: { name: 'Global Processing', revenue: 60000, growth: 1, cost: 45000, employees: 150 },
  omni: { name: 'OmniCorp', revenue: 100000, growth: 1.5, cost: 100000, employees: 240 },
};
export const contractIds = ['local', 'municipal', 'regional', 'national'] as const;
export type ContractId = typeof contractIds[number];
export const contracts: Record<ContractId, { name: string; forms: number; seconds: number; reward: number; influence: number; revenue: number }> = {
  local: { name: 'Local filing order', forms: 250, seconds: 90, reward: 900, influence: 5, revenue: 0 },
  municipal: { name: 'Municipal backlog', forms: 1000, seconds: 150, reward: 4000, influence: 12, revenue: 7000 },
  regional: { name: 'Regional records', forms: 5000, seconds: 180, reward: 24000, influence: 35, revenue: 30000 },
  national: { name: 'National census', forms: 30000, seconds: 240, reward: 180000, influence: 100, revenue: 180000 },
};
export const eventIds = ['audit', 'outage', 'petition', 'price-war', 'recruiter', 'innovation'] as const;
export type EventId = typeof eventIds[number];
export const eventNames: Record<EventId, string> = { audit: 'Regulatory audit', outage: 'Systems outage', petition: 'Employee petition', 'price-war': 'Rival price war', recruiter: 'Recruitment raid', innovation: 'Employee invention' };
const resource = z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER);
const unique = <T>(ids: T[]) => new Set(ids).size === ids.length;
const CohortSchema = z.object({ cultivar: z.enum(['generalist', 'processor', 'specialist', 'executive']), genes: z.array(z.enum(['focus', 'endurance', 'precision', 'cognition', 'synthesis'])).max(5).refine(unique), count: z.number().int().min(1).max(1000000), hiredCost: resource });
export type Cohort = z.infer<typeof CohortSchema>;
export const CorporationSchema = z.object({
  tender: TenderSchema.default(initialTender),
  lastContract: z.object({ id: z.enum(contractIds), status: z.enum(['completed', 'expired', 'canceled']), forms: resource, returned: resource, reward: resource, influence: resource, reputation: z.number().finite().min(-100).max(100), retailValue: z.number().finite().nonnegative().max(30000 * (Number.MAX_SAFE_INTEGER / 100)), settledAt: resource }).nullable().default(null),
  // Older saves predate this entitlement and have not claimed it.
  supplierReliefUsed: z.boolean().default(false),
  // Emergency service receipts earmark at most one supply pack against payroll.
  emergencyReserve: z.number().finite().min(0).max(20).default(0),
  blankForms: resource, inventory: resource, price: PriceSchema, marketing: z.number().int().min(0).max(25), autoBuy: z.boolean(),
  insights: resource, influence: resource, reputation: resource.max(100), morale: resource.max(100), pressure: resource.max(100),
  policy: z.enum(policies), projects: z.array(z.enum(projectIds)).max(projectIds.length).refine(unique),
  phase: z.discriminatedUnion('id', [z.object({ id: z.literal('office') }), z.object({ id: z.literal('enterprise') }), z.object({ id: z.literal('conglomerate') }), z.object({ id: z.literal('network'), network: NetworkSchema }), z.object({ id: z.literal('ending'), ending: z.enum(['monopoly', 'commons']), nodes: resource, completedAt: resource })]),
  contract: z.discriminatedUnion('status', [z.object({ status: z.literal('idle'), cooldown: resource.max(120) }), z.object({ status: z.literal('active'), id: z.enum(contractIds), delivered: resource, remaining: resource.max(240), allocation: z.enum(['half', 'all']) })]),
  crisis: z.discriminatedUnion('status', [z.object({ status: z.literal('calm'), remaining: resource.max(360) }), z.object({ status: z.literal('pending'), id: z.enum(eventIds), remaining: resource.max(60) }), z.object({ status: z.literal('effect'), id: z.enum(eventIds), remaining: resource.max(90), output: z.number().min(0.5).max(1.6), demand: z.number().min(0.5).max(2.2).default(1), research: z.number().min(0.5).max(2).default(1) })]),
  acquired: z.array(z.enum(rivalIds)).max(6).refine(unique),
  branches: z.array(z.object({ id: z.number().int().positive(), name: z.string().max(60), level: z.number().int().min(1).max(8), cohorts: z.array(CohortSchema).max(128) })).max(8),
  nextBranchId: z.number().int().positive(), legacyStaff: z.array(CohortSchema).max(6),
  completedContracts: z.number().int().nonnegative(), failedContracts: z.number().int().nonnegative(), reviewCooldown: resource.max(30),
  soldRate: resource, outputRate: resource, payrollRate: resource, supplySpent: resource, maintenanceSpent: resource,
  legacy: z.object({ credits: z.number().int().nonnegative(), runs: z.number().int().nonnegative(), founding: z.number().int().min(0).max(10), research: z.number().int().min(0).max(10), welfare: z.number().int().min(0).max(10), endings: z.array(z.enum(['monopoly', 'commons'])).max(2).refine(unique) }),
}).superRefine((c, ctx) => {
  if (c.projects.includes('stewardship') && c.projects.includes('extraction')) ctx.addIssue({ code: 'custom', message: 'Management paths are mutually exclusive.' });
  if (c.autoBuy && !c.projects.includes('procurement')) ctx.addIssue({ code: 'custom', message: 'Automatic procurement has not been researched.' });
  if (!unique(c.branches.map(b => b.id)) || c.branches.some(b => b.id >= c.nextBranchId || b.cohorts.reduce((n, group) => n + group.count, 0) > 100 * b.level)) ctx.addIssue({ code: 'custom', message: 'Branch capacity or identifiers are inconsistent.' });
  if (c.contract.status === 'active' && c.contract.delivered > contracts[c.contract.id].forms) ctx.addIssue({ code: 'custom', message: 'Contract escrow exceeds the order.' });
  const receipt = c.lastContract;
  if (receipt) {
    const order = contracts[receipt.id];
    const complete = receipt.status === 'completed';
    if (receipt.forms > order.forms || (complete ? Math.abs(receipt.forms - order.forms) > 0.000001 || receipt.returned !== 0 : receipt.returned !== receipt.forms || receipt.reward !== 0 || receipt.influence !== 0)) ctx.addIssue({ code: 'custom', message: 'Contract receipt does not match the order settlement.' });
    if (receipt.reward > order.reward * 1.2 || receipt.influence > order.influence) ctx.addIssue({ code: 'custom', message: 'Contract receipt exceeds the order reward including its reputation bonus.' });
  }
});
export type Corporation = z.infer<typeof CorporationSchema>;
export function initialCorporation(): Corporation {
  return { tender: initialTender(), lastContract: null, supplierReliefUsed: false, emergencyReserve: 0, blankForms: 1000, inventory: 0, price: 1.25, marketing: 0, autoBuy: false, insights: 0, influence: 0, reputation: 50, morale: 60, pressure: 0, policy: 'balanced', projects: [], phase: { id: 'office' }, contract: { status: 'idle', cooldown: 0 }, crisis: { status: 'calm', remaining: 240 }, acquired: [], branches: [], nextBranchId: 1, legacyStaff: [], completedContracts: 0, failedContracts: 0, reviewCooldown: 0, soldRate: 0, outputRate: 0, payrollRate: 0, supplySpent: 0, maintenanceSpent: 0, legacy: { credits: 0, runs: 0, founding: 0, research: 0, welfare: 0, endings: [] } };
}

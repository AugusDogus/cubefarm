import { z } from 'zod';
import { BASE_CAPACITY, genes } from './catalog';
import { CorporationSchema, initialCorporation, roles, rivals } from './corporation';
import { projects, projectIds } from './projects';
import { workspaceIds } from './discovery-feedback';
import { StorySchema, initialStory } from './story';
import { protocolIds } from './network';

const cultivarId = z.enum(['generalist', 'processor', 'specialist', 'executive']);
const geneId = z.enum(['focus', 'endurance', 'precision', 'cognition', 'synthesis']);
const facilityId = z.enum(['coffee', 'snacks', 'cafeteria', 'gym', 'benefits']);
const nonnegative = z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER);
const boundedLevel = (max: number) => z.number().int().min(0).max(max);
const unique = <T>(items: T[]) => new Set(items).size === items.length;

const LegacyEmployeeSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(60),
  cultivar: cultivarId,
  genes: z.array(geneId).max(5).refine(unique),
  aptitude: z.number().min(0.85).max(1.15),
  hiredCost: nonnegative,
  produced: nonnegative,
  activity: z.enum(['working', 'break', 'slacking', 'rework']),
  remaining: z.number().min(0).max(10),
});
export const EmployeeSchema = LegacyEmployeeSchema.extend({ role: z.enum(roles) });
export type Employee = z.infer<typeof EmployeeSchema>;

const BaseSchema = z.object({
  version: z.literal(1),
  cash: nonnegative,
  revenue: nonnegative,
  paperwork: nonnegative,
  manualPapers: z.number().int().nonnegative(),
  wages: nonnegative,
  elapsed: nonnegative,
  nextId: z.number().int().positive(),
  employees: z.array(LegacyEmployeeSchema).max(256),
  unlockedCultivars: z.array(cultivarId).min(1).max(4).refine(unique).refine(ids => ids.includes('generalist')),
  genes: z.array(geneId).max(5).refine(unique),
  facilities: z.array(facilityId).max(5).refine(unique),
  upgrades: z.object({ equipment: boundedLevel(12), training: boundedLevel(8), memo: boundedLevel(6), quality: boundedLevel(8), capacity: boundedLevel(5) }),
  memo: z.discriminatedUnion('status', [
    z.object({ status: z.literal('ready') }),
    z.object({ status: z.literal('active'), remaining: z.number().positive().max(90) }),
    z.object({ status: z.literal('cooldown'), remaining: z.number().positive().max(90) }),
  ]),
  paused: z.boolean(),
  lastSeen: z.number().int().nonnegative(),
  won: z.boolean(),
  log: z.array(z.object({ id: z.number().int().nonnegative(), time: nonnegative, message: z.string().max(200) })).max(30),
});
function validateLegacy(state: z.infer<typeof BaseSchema>, ctx: z.RefinementCtx) {
  if (state.employees.length > Math.min(256, BASE_CAPACITY * 2 ** state.upgrades.capacity)) ctx.addIssue({ code: 'custom', message: 'The workforce exceeds cubicle capacity.' });
  if (!unique(state.employees.map(e => e.id)) || state.employees.some(e => e.id >= state.nextId)) ctx.addIssue({ code: 'custom', message: 'Employee identifiers are inconsistent.' });
  if (state.employees.some(e => !state.unlockedCultivars.includes(e.cultivar) || e.genes.some(g => !state.genes.includes(g)))) ctx.addIssue({ code: 'custom', message: 'Employee traits are not present in the research record.' });
  if (state.genes.some(id => genes[id].requires.some(required => !state.genes.includes(required)))) ctx.addIssue({ code: 'custom', message: 'Gene research prerequisites are missing.' });
  if (state.won && state.revenue < 100000) ctx.addIssue({ code: 'custom', message: 'Market leadership requires $100,000 in revenue.' });
}
export const LegacySchema = BaseSchema.superRefine(validateLegacy);
export const GameSchema = BaseSchema.extend({
  discoveryRecord: z.object({ workspaces: z.array(z.enum(workspaceIds)).max(workspaceIds.length).refine(unique), projects: z.array(z.enum(projectIds)).max(projectIds.length).refine(unique), protocols: z.array(z.enum(protocolIds)).max(protocolIds.length).refine(unique).default([]) }).nullable().default(null),
  version: z.literal(3), employees: z.array(EmployeeSchema).max(256), corporation: CorporationSchema,
  genome: z.array(geneId).max(2).refine(unique),
  story: StorySchema,
  manualCooldown: z.number().finite().min(0).max(0.35),
  automation: z.object({ memos: z.boolean(), contracts: z.enum(['off', 'local', 'municipal', 'regional', 'national']), allocation: z.enum(['half', 'all']).default('half'), reserve: nonnegative }),
}).superRefine((state, ctx) => {
  validateLegacy({ ...state, version: 1 }, ctx);
  const c = state.corporation;
  const tender = c.tender;
  if ((tender.sequence > 0 || tender.stage.status !== 'idle' || tender.lastReceipt !== null) && !c.projects.includes('charter')) ctx.addIssue({ code: 'custom', message: 'Competitive tenders require the Enterprise charter.' });
  const tenderTier = tender.stage.status === 'brief' || tender.stage.status === 'resolving' ? tender.stage.brief.tier : null;
  if (tenderTier === 'network' && !['network', 'ending'].includes(c.phase.id) || tenderTier === 'conglomerate' && ['office', 'enterprise'].includes(c.phase.id)) ctx.addIssue({ code: 'custom', message: 'The tender belongs to an era the company has not reached.' });
  if (c.phase.id === 'ending' && tender.stage.status === 'resolving') ctx.addIssue({ code: 'custom', message: 'Submitted tenders must settle before the company closes.' });
  if (c.phase.id === 'network' && c.crisis.status !== 'calm') ctx.addIssue({ code: 'custom', message: 'Office crises must be retired before entering the network.' });
  if (state.genome.some(id => !state.genes.includes(id))) ctx.addIssue({ code: 'custom', message: 'The hiring genome contains unresearched genes.' });
  if ((state.automation.memos || state.automation.contracts !== 'off') && !c.projects.includes('analytics')) ctx.addIssue({ code: 'custom', message: 'Delegation has not been researched.' });
  if (c.projects.some(id => projects[id].requires.some(required => !c.projects.includes(required)))) ctx.addIssue({ code: 'custom', message: 'Corporate project prerequisites are missing.' });
  const required = { office: null, enterprise: 'charter', conglomerate: 'regional', network: 'sovereign', ending: 'sovereign' } as const;
  const gate = required[c.phase.id];
  if (gate && !c.projects.includes(gate)) ctx.addIssue({ code: 'custom', message: 'The corporate era has not been unlocked.' });
  if ((c.projects.includes('charter') && c.phase.id === 'office') || (c.projects.includes('regional') && ['office', 'enterprise'].includes(c.phase.id)) || (c.projects.includes('sovereign') && !['network', 'ending'].includes(c.phase.id))) ctx.addIssue({ code: 'custom', message: 'Corporate projects and the current era are inconsistent.' });
  if ((c.policy !== 'balanced' || c.contract.status === 'active' || c.crisis.status !== 'calm') && !c.projects.includes('charter')) ctx.addIssue({ code: 'custom', message: 'Enterprise management systems have not been unlocked.' });
  if ((c.acquired.length > 0 && !c.projects.includes('mergers')) || (c.branches.length > 0 && !c.projects.includes('regional'))) ctx.addIssue({ code: 'custom', message: 'Expansion permissions are missing.' });
  if (c.legacyStaff.length !== c.acquired.length || c.legacyStaff.some((group, i) => { const id = c.acquired[i]; return !id || group.cultivar !== 'generalist' || group.genes.length > 0 || group.count !== rivals[id].employees; })) ctx.addIssue({ code: 'custom', message: 'Acquired workforce records are inconsistent.' });
  if (c.projects.includes('regional') && (!c.projects.includes('stewardship') && !c.projects.includes('extraction') || c.acquired.length < 2)) ctx.addIssue({ code: 'custom', message: 'Regional network requirements are missing.' });
  if (c.projects.includes('sovereign') && (c.acquired.length < 4 || c.branches.length < 3)) ctx.addIssue({ code: 'custom', message: 'Worldwide franchise requirements are missing.' });
  if (c.phase.id === 'ending' && c.phase.completedAt > state.elapsed) ctx.addIssue({ code: 'custom', message: 'Completion time exceeds operating time.' });
  if (c.lastContract && c.lastContract.settledAt > state.elapsed) ctx.addIssue({ code: 'custom', message: 'Contract settlement time exceeds operating time.' });
  if (state.employees.some(e => e.role !== 'operations') && !c.projects.includes('time-study')) ctx.addIssue({ code: 'custom', message: 'Departments have not been researched.' });
  if (c.branches.some(b => b.cohorts.some(group => !state.unlockedCultivars.includes(group.cultivar) || group.genes.some(g => !state.genes.includes(g))))) ctx.addIssue({ code: 'custom', message: 'Branch traits are missing from the research record.' });
});
export type GameState = z.infer<typeof GameSchema>;

export function initialState(now = Date.now()): GameState {
  return {
    version: 3, discoveryRecord: { workspaces: ['Office'], projects: [], protocols: [] }, corporation: initialCorporation(), cash: 0, revenue: 0, paperwork: 0, manualPapers: 0, wages: 0, elapsed: 0, nextId: 1,
    employees: [], genome: [], story: initialStory(), manualCooldown: 0,
    automation: { memos: false, contracts: 'off', allocation: 'half', reserve: 100 },
    unlockedCultivars: ['generalist'], genes: [], facilities: [],
    upgrades: { equipment: 0, training: 0, memo: 0, quality: 0, capacity: 0 },
    memo: { status: 'ready' }, paused: false, lastSeen: now, won: false,
    log: [{ id: 0, time: 0, message: 'One desk. One stamp. There is work to do.' }],
  };
}

/** Keep the v1 storage key and migrate only after validating the original record. */
export function parseGame(value: unknown) {
  const current = GameSchema.safeParse(value);
  if (current.success) return current;
  const defaults = { genome: [], story: initialStory(), manualCooldown: 0, automation: { memos: false, contracts: 'off', allocation: 'half', reserve: 100 } };
  const v2 = z.object({ version: z.literal(2), corporation: z.object({ crisis: CorporationSchema.shape.crisis, phase: z.object({ id: z.string() }).passthrough() }).passthrough() }).passthrough().safeParse(value);
  if (v2.success) {
    const c = v2.data.corporation;
    const network = z.object({ network: z.record(z.string(), z.unknown()) }).safeParse(c.phase);
    const corporation = c.phase.id === 'network' && network.success ? { ...c, crisis: { status: 'calm', remaining: 240 }, phase: { ...c.phase, network: { ...network.data.network, infrastructure: 'manual' } } } : c;
    return GameSchema.safeParse({ ...v2.data, ...defaults, version: 3, corporation });
  }
  const legacy = LegacySchema.safeParse(value);
  if (!legacy.success) return current;
  return GameSchema.safeParse({ ...legacy.data, ...defaults, version: 3, employees: legacy.data.employees.map(e => ({ ...e, role: 'operations' })), corporation: initialCorporation() });
}

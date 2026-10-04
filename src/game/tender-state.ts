import { z } from 'zod';

export const TENDER_RESOLUTION_SECONDS = 8;
export const TENDER_COOLDOWN_SECONDS = 40;
export const approachIds = ['assurance', 'responsive', 'ambitious'] as const;
export type ApproachId = typeof approachIds[number];
export const clientIds = ['records', 'dispatch', 'expansion'] as const;
export type ClientId = typeof clientIds[number];
export const clients: Record<ClientId, { name: string; description: string }> = {
  records: { name: 'Public Records Bureau', description: 'An archive with unusually strong opinions about misplaced commas.' },
  dispatch: { name: 'Municipal Dispatch', description: 'The request arrived yesterday. Its deadline is described as "yesterday."' },
  expansion: { name: 'Interoffice Commission', description: 'A committee seeking one institution large enough to absorb its committees.' },
};
export const approaches: Record<ApproachId, { name: string; description: string; specialty: { quality: number; speed: number; scope: number } }> = {
  assurance: { name: 'Assurance', description: 'A carefully audited proposal. Highest win chance, lowest payout.', specialty: { quality: 1, speed: 0.4, scope: 0.1 } },
  responsive: { name: 'Responsive', description: 'Promise faster turnaround. A middle ground in chance and payout.', specialty: { quality: 0.1, speed: 1, scope: 0.4 } },
  ambitious: { name: 'Ambitious', description: 'Propose a larger mandate. Lowest win chance, highest payout.', specialty: { quality: 0.4, speed: 0.1, scope: 1 } },
};
const resource = z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER);
const signedResource = z.number().finite().min(-Number.MAX_SAFE_INTEGER).max(Number.MAX_SAFE_INTEGER);
const WeightsSchema = z.object({ quality: z.number().int().min(10).max(80), speed: z.number().int().min(10).max(80), scope: z.number().int().min(10).max(80) }).refine(w => w.quality + w.speed + w.scope === 100, 'Client priorities must total 100.');
const BriefSchema = z.object({ sequence: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), client: z.enum(clientIds), tier: z.enum(['enterprise', 'conglomerate', 'network']), weights: WeightsSchema });
export type TenderBrief = z.infer<typeof BriefSchema>;
const RewardSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('enterprise'), insights: resource, influence: resource }),
  z.object({ kind: z.literal('network'), knowledge: resource }),
]);
export type TenderReward = z.infer<typeof RewardSchema>;
const ResearchCostSchema = z.discriminatedUnion('kind', [z.object({ kind: z.literal('none') }), z.object({ kind: z.literal('insights'), amount: resource }), z.object({ kind: z.literal('knowledge'), amount: resource })]);
export type TenderResearchCost = z.infer<typeof ResearchCostSchema>;
const QuoteSchema = z.object({ termsVersion: z.union([z.literal(1), z.literal(2)]).default(1), researchCost: ResearchCostSchema.default({ kind: 'none' }), chance: z.number().finite().min(0).max(1), match: z.number().finite().min(0).max(1), gross: resource, netIfWon: signedResource, maxLoss: resource, reward: RewardSchema });
export type TenderQuote = z.infer<typeof QuoteSchema>;
const ReceiptSchema = z.object({ brief: BriefSchema, approach: z.enum(approachIds), stake: z.number().int().min(1).max(500000), quote: QuoteSchema, roll: z.number().finite().min(0).lt(1), won: z.boolean(), gross: resource, net: signedResource, reward: RewardSchema, limited: z.boolean(), researchCost: ResearchCostSchema.optional(), netResearch: signedResource.optional() }).transform(r => ({ ...r, researchCost: r.researchCost ?? r.quote.researchCost, netResearch: r.netResearch ?? researchReward(r.reward) - researchCost(r.quote.researchCost) }));
export type TenderReceipt = z.infer<typeof ReceiptSchema>;
const StageSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('idle'), cooldown: resource.max(TENDER_COOLDOWN_SECONDS) }),
  z.object({ status: z.literal('brief'), brief: BriefSchema }),
  z.object({ status: z.literal('resolving'), brief: BriefSchema, approach: z.enum(approachIds), stake: z.number().int().min(1).max(500000), quote: QuoteSchema, remaining: z.number().finite().positive().max(TENDER_RESOLUTION_SECONDS), roll: z.number().finite().min(0).lt(1) }),
  z.object({ status: z.literal('settled'), cooldown: resource.max(TENDER_COOLDOWN_SECONDS) }),
]);
export const TenderSchema = z.object({ sequence: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER), stage: StageSchema, lastReceipt: ReceiptSchema.nullable() }).superRefine((t, ctx) => {
  const s = t.stage;
  if ((s.status === 'brief' || s.status === 'resolving') && s.brief.sequence !== t.sequence) ctx.addIssue({ code: 'custom', message: 'Tender brief does not match its cycle.' });
  if (s.status === 'resolving' && (s.stake > tenderStakeCap(s.brief) || !equalQuote(s.quote, quoteFor(s.brief, s.approach, s.stake, s.quote.termsVersion)))) ctx.addIssue({ code: 'custom', message: 'Submitted tender terms do not match the client brief.' });
  const r = t.lastReceipt;
  if (r) {
    const promisedGross = r.won ? r.quote.gross : 0, promisedReward = r.won ? r.quote.reward : zeroReward(r.quote.reward);
    if (r.brief.sequence > t.sequence || r.stake > tenderStakeCap(r.brief) || !equalQuote(r.quote, quoteFor(r.brief, r.approach, r.stake, r.quote.termsVersion)) || !equalCost(r.researchCost, r.quote.researchCost) || r.netResearch !== researchReward(r.reward) - researchCost(r.researchCost) || r.won !== (r.roll < r.quote.chance) || r.gross > promisedGross || r.net !== r.gross - r.stake || !rewardWithin(r.reward, promisedReward) || r.limited !== (r.gross < promisedGross || !equalReward(r.reward, promisedReward))) ctx.addIssue({ code: 'custom', message: 'Tender receipt does not match its committed terms and outcome.' });
  }
  if (r && (s.status === 'brief' || s.status === 'resolving') && r.brief.sequence >= t.sequence) ctx.addIssue({ code: 'custom', message: 'A resolved tender cannot be submitted again.' });
});
export type Tender = z.infer<typeof TenderSchema>;
export function initialTender(): Tender { return { sequence: 0, stage: { status: 'idle', cooldown: 0 }, lastReceipt: null }; }
export type TenderAction = { type: 'tender-draw' } | { type: 'tender-decline' } | { type: 'tender-bid'; approach: ApproachId; stake: number };

export function tenderStakeCap(brief: TenderBrief): number {
  return brief.tier === 'enterprise' ? 2000 : brief.tier === 'conglomerate' ? 20000 : 500000;
}
const roundPrize = (value: number) => Math.round(value * 1000) / 1000;
export function quoteFor(brief: TenderBrief, approach: ApproachId, stake: number, termsVersion: 1 | 2 = 2): TenderQuote {
  const specialty = approaches[approach].specialty, weights = brief.weights;
  const match = (weights.quality * specialty.quality + weights.speed * specialty.speed + weights.scope * specialty.scope) / 100;
  const base = approach === 'assurance' ? { chance: 0.78, gross: 1.05, fit: 0.55 } : approach === 'responsive' ? { chance: 0.61, gross: 1.5, fit: 0.75 } : { chance: 0.44, gross: 2, fit: 1.05 };
  const multiplier = base.gross + base.fit * match;
  const gross = Math.round(stake * multiplier * 100) / 100;
  const share = stake / tenderStakeCap(brief) * multiplier;
  const reward: TenderReward = brief.tier === 'network' ? { kind: 'network', knowledge: roundPrize(350 * share) } : { kind: 'enterprise', insights: roundPrize((brief.tier === 'enterprise' ? 12 : 80) * share), influence: roundPrize((brief.tier === 'enterprise' ? 6 : 20) * share) };
  return { termsVersion, researchCost: tenderResearchCost(brief, stake, termsVersion), chance: base.chance + 0.08 * match, match, gross, netIfWon: gross - stake, maxLoss: stake, reward };
}
export function tenderResearchCost(brief: TenderBrief, stake: number, termsVersion: 1 | 2 = 2): TenderResearchCost {
  if (termsVersion === 1) return { kind: 'none' };
  const amount = (brief.tier === 'network' ? 175 : brief.tier === 'conglomerate' ? 40 : 6) * stake / tenderStakeCap(brief);
  return { kind: brief.tier === 'network' ? 'knowledge' : 'insights', amount };
}
export function researchCost(cost: TenderResearchCost): number { return cost.kind === 'none' ? 0 : cost.amount; }
export function researchReward(reward: TenderReward): number { return reward.kind === 'network' ? reward.knowledge : reward.insights; }
function equalCost(a: TenderResearchCost, b: TenderResearchCost): boolean { return a.kind === 'none' ? b.kind === 'none' : b.kind === a.kind && a.amount === b.amount; }
export function equalReward(a: TenderReward, b: TenderReward): boolean {
  return a.kind === 'network' ? b.kind === 'network' && a.knowledge === b.knowledge : b.kind === 'enterprise' && a.insights === b.insights && a.influence === b.influence;
}
function rewardWithin(a: TenderReward, b: TenderReward): boolean {
  return a.kind === 'network' ? b.kind === 'network' && a.knowledge <= b.knowledge : b.kind === 'enterprise' && a.insights <= b.insights && a.influence <= b.influence;
}
function equalQuote(a: TenderQuote, b: TenderQuote): boolean {
  return a.termsVersion === b.termsVersion && equalCost(a.researchCost, b.researchCost) && a.chance === b.chance && a.match === b.match && a.gross === b.gross && a.netIfWon === b.netIfWon && a.maxLoss === b.maxLoss && equalReward(a.reward, b.reward);
}
export function zeroReward(reward: TenderReward): TenderReward {
  return reward.kind === 'network' ? { kind: 'network', knowledge: 0 } : { kind: 'enterprise', insights: 0, influence: 0 };
}

import type { GameState } from './state';
import { projects, projectReason, type ProjectId } from './projects';
import { expectedOutput } from './balance';
import { demand } from './economy';

export const phaseNames = { office: '01 / Office', enterprise: '02 / Enterprise', conglomerate: '03 / Conglomerate', network: '04 / Network', ending: '05 / After work' } as const;
export type ObjectiveWorkspace = 'Office' | 'Development' | 'Company';
export function objectiveWorkspace(state: GameState, target: ProjectId): ObjectiveWorkspace | null {
  const reason = projectReason(state, target);
  if (reason?.startsWith('Reply to')) return null;
  if (reason === 'Requires six headquarters employees') return 'Office';
  if (reason === 'Requires two acquisitions and a management path') return state.corporation.acquired.length < 2 ? 'Company' : 'Development';
  if (reason === 'Requires four acquired markets and three branches') return 'Company';
  if (reason?.includes('influence')) return 'Company';
  if (reason?.includes('insights') || reason?.includes('lifetime revenue') || reason?.startsWith('Requires $')) return 'Office';
  return 'Development';
}
export function objective(state: GameState): { title: string; detail: string; target: ProjectId | null } {
  const c = state.corporation;
  if (c.phase.id === 'network') return { title: 'A finite amount of work', detail: 'Grow the network, survey the remaining work, then shift to clearance. Power and compute limit active offices.', target: null };
  if (c.phase.id === 'ending') return { title: 'The work is finished', detail: 'Your ending is recorded. Reincorporate to carry five legacy credits into a new company.', target: null };
  const demandLimited = expectedOutput(state) > demand(state) || c.inventory > demand(state) * 20;
  const steps: readonly ProjectId[] = c.phase.id === 'office' ? ['time-study', 'procurement', ...(demandLimited ? ['brand' as const] : []), 'standards', 'charter'] : c.phase.id === 'enterprise' ? ['analytics', 'legal', 'centralization', 'mergers', 'regional'] : ['franchise', 'continental', 'coordination', 'infrastructure', 'sovereign'];
  const target = steps.find(id => !c.projects.includes(id)) ?? null;
  if (!target) return { title: 'Prepare the next era', detail: 'Review the remaining corporate projects in Research.', target: null };
  const reason = projectReason(state, target);
  return { title: projects[target].name, detail: reason ?? 'Ready to authorize at the development desk.', target };
}

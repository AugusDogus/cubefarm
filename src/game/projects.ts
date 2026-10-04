import type { GameState } from './state';

export const projectIds = ['time-study', 'procurement', 'brand', 'standards', 'charter', 'logistics', 'analytics', 'cultivation', 'legal', 'stewardship', 'extraction', 'centralization', 'mergers', 'regional', 'franchise', 'continental', 'coordination', 'infrastructure', 'sovereign'] as const;
export type ProjectId = typeof projectIds[number];
export type PhaseId = 'office' | 'enterprise' | 'conglomerate' | 'network' | 'ending';
type Project = { name: string; description: string; cash: number; insights: number; influence: number; revenue: number; phase: PhaseId; requires: readonly ProjectId[] };
export const projects: Record<ProjectId, Project> = {
  'time-study': { name: 'Time study', description: 'Study the work. Unlock departments and continuous process reviews. Researchers produce additional insights.', cash: 80, insights: 0, influence: 0, revenue: 100, phase: 'office', requires: [] },
  procurement: { name: 'Automatic procurement', description: 'The office orders its own forms. Buys supplies as needed while retaining a payroll buffer.', cash: 90, insights: 10, influence: 0, revenue: 200, phase: 'office', requires: ['time-study'] },
  brand: { name: 'Brand book', description: 'Unlock marketing campaigns that increase retail demand.', cash: 250, insights: 15, influence: 0, revenue: 300, phase: 'office', requires: ['time-study'] },
  standards: { name: 'Quality standards', description: '20% fewer bugs throughout the company. Improves reputation over time.', cash: 300, insights: 25, influence: 0, revenue: 500, phase: 'office', requires: ['time-study'] },
  charter: { name: 'Corporate charter', description: 'Put the name on the building. Establish a board and a contract desk. Requires six headquarters employees.', cash: 650, insights: 50, influence: 0, revenue: 2000, phase: 'office', requires: ['procurement', 'standards'] },
  logistics: { name: 'Supply chain integration', description: 'Blank forms cost 50% less. The same supply budget buys twice as many forms for every office.', cash: 1200, insights: 80, influence: 0, revenue: 3000, phase: 'enterprise', requires: ['charter'] },
  analytics: { name: 'Workforce analytics', description: 'Double insight production. Delegate recurring memos and contract renewals to the office.', cash: 1800, insights: 100, influence: 5, revenue: 5000, phase: 'enterprise', requires: ['charter'] },
  cultivation: { name: 'Workforce cultivation', description: 'Open Imani’s lab. Research inherited traits and select a two-gene profile for future hires. Existing people remain themselves.', cash: 1600, insights: 80, influence: 5, revenue: 6000, phase: 'enterprise', requires: ['analytics'] },
  legal: { name: 'Legal framework', description: 'Double compliance effectiveness. Unlock rival acquisitions after merger approval.', cash: 2000, insights: 100, influence: 10, revenue: 7000, phase: 'enterprise', requires: ['charter'] },
  stewardship: { name: 'Stewardship charter', description: 'Permanent management path. Higher morale, 50% more research, lower pressure. Slightly slower production. Mutually exclusive with extraction.', cash: 1200, insights: 60, influence: 5, revenue: 3000, phase: 'enterprise', requires: ['charter'] },
  extraction: { name: 'Performance doctrine', description: 'Permanent management path. 40% more output and influence. Morale and regulatory pressure need active care. Mutually exclusive with stewardship.', cash: 1200, insights: 60, influence: 5, revenue: 3000, phase: 'enterprise', requires: ['charter'] },
  centralization: { name: 'Centralized systems', description: 'Double retail reach. Equipment improvements become 50% more effective.', cash: 3000, insights: 150, influence: 10, revenue: 10000, phase: 'enterprise', requires: ['analytics'] },
  mergers: { name: 'Merger approval', description: 'Buy rivals to gain their markets and unmodified legacy workforce. Acquisition prices grow with rival revenue.', cash: 2500, insights: 120, influence: 20, revenue: 12000, phase: 'enterprise', requires: ['legal'] },
  regional: { name: 'Regional network', description: 'Enter the Conglomerate era. Open branches and hire immutable workforce cohorts. Requires two acquired rivals and a management path.', cash: 8000, insights: 250, influence: 30, revenue: 50000, phase: 'enterprise', requires: ['centralization', 'mergers'] },
  franchise: { name: 'Franchise license', description: 'Triple branch output. Unlock the path toward autonomous offices.', cash: 18000, insights: 500, influence: 40, revenue: 80000, phase: 'conglomerate', requires: ['regional'] },
  continental: { name: 'Continental charter', description: 'Four times retail reach, 50% more influence. Your paperwork goes international.', cash: 40000, insights: 800, influence: 60, revenue: 180000, phase: 'conglomerate', requires: ['franchise'] },
  coordination: { name: 'Corporate culture', description: 'Branches contribute research. Morale recovers faster, and compliance protects every office.', cash: 30000, insights: 650, influence: 50, revenue: 150000, phase: 'conglomerate', requires: ['franchise'] },
  infrastructure: { name: 'Autonomous infrastructure', description: 'Prepare power and computing for self-replicating franchises. Double branch output.', cash: 100000, insights: 1500, influence: 100, revenue: 500000, phase: 'conglomerate', requires: ['continental', 'coordination'] },
  sovereign: { name: 'Sovereign workflow', description: 'Enter the Network era. Discover and clear one billion worldwide workflows. Requires four acquired markets and three branches.', cash: 250000, insights: 2500, influence: 200, revenue: 2000000, phase: 'conglomerate', requires: ['infrastructure'] },
};
export const phaseOrder: Record<PhaseId, number> = { office: 0, enterprise: 1, conglomerate: 2, network: 3, ending: 4 };
export function projectReason(state: GameState, id: ProjectId): string | null {
  const c = state.corporation, p = projects[id];
  if (c.projects.includes(id)) return 'Completed';
  if ((id === 'stewardship' && c.projects.includes('extraction')) || (id === 'extraction' && c.projects.includes('stewardship'))) return 'Another management path was chosen';
  if (phaseOrder[c.phase.id] < phaseOrder[p.phase]) return `Requires the ${p.phase} era`;
  const missing = p.requires.find(required => !c.projects.includes(required));
  if (missing) return `Requires ${projects[missing].name}`;
  if (id === 'charter' && state.story.promise === 'undecided') return 'Reply to Robin’s letter before signing';
  if (id === 'cultivation' && state.story.cultivation === 'undecided') return 'Reply to Imani before opening the lab';
  if (id === 'charter' && state.employees.length < 6) return 'Requires six headquarters employees';
  if (id === 'regional' && (c.acquired.length < 2 || (!c.projects.includes('stewardship') && !c.projects.includes('extraction')))) return 'Requires two acquisitions and a management path';
  if (id === 'sovereign' && (c.acquired.length < 4 || c.branches.length < 3)) return 'Requires four acquired markets and three branches';
  if (state.revenue < p.revenue) return `Requires $${p.revenue.toLocaleString()} lifetime revenue`;
  if (state.cash < p.cash) return `Requires $${p.cash.toLocaleString()}`;
  if (c.insights < p.insights) return `Requires ${p.insights} insights`;
  if (c.influence < p.influence) return `Requires ${p.influence} influence`;
  return null;
}

/** Show relevant projects, never a preview of all future eras. */
export function visibleProjects(state: GameState) {
  return projectIds.filter(id => !state.corporation.projects.includes(id)
    && phaseOrder[projects[id].phase] <= phaseOrder[state.corporation.phase.id]
    && projects[id].requires.every(p => state.corporation.projects.includes(p))
    && state.revenue >= projects[id].revenue * 0.6
    && !(id === 'stewardship' && state.corporation.projects.includes('extraction'))
    && !(id === 'extraction' && state.corporation.projects.includes('stewardship')));
}

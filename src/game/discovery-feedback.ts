import { discovery } from './discovery';
import { projects, visibleProjects, type ProjectId } from './projects';
import { protocolIds, protocols, type ProtocolId } from './network';
import { clients, type TenderReceipt } from './tender-state';
import type { GameState } from './state';

export const workspaceIds = ['Office', 'Development', 'Company', 'Network', 'Archive'] as const;
export type WorkspaceId = typeof workspaceIds[number];
export type DiscoveryRecord = { workspaces: WorkspaceId[]; projects: ProjectId[]; protocols: ProtocolId[] };
export type DiscoveryAnnouncement = { text: string; destination: WorkspaceId };

export function revealedWorkspaces(state: GameState): WorkspaceId[] {
  const phase = state.corporation.phase.id;
  if (phase === 'network' || phase === 'ending') return ['Network', 'Archive'];
  const seen = discovery(state);
  return ['Office', ...(seen.development ? ['Development' as const] : []), ...(seen.company ? ['Company' as const] : [])];
}

export function visibleProcedures(state: GameState): ProtocolId[] {
  const phase = state.corporation.phase;
  return phase.id === 'network' ? protocolIds.filter(id => !phase.network.protocols.includes(id) && protocols[id].requires.every(required => phase.network.protocols.includes(required))) : [];
}

/** A missing record means an older save, whose existing discoveries are baselined. */
export function unseenDiscoveries(state: GameState, record: DiscoveryRecord | null) {
  const available = discovery(state).development ? visibleProjects(state) : [];
  return {
    workspaces: record ? revealedWorkspaces(state).filter(id => !record.workspaces.includes(id)) : [],
    projects: record ? available.filter(id => !record.projects.includes(id)) : [],
    protocols: record ? visibleProcedures(state).filter(id => !record.protocols.includes(id)) : [],
  };
}

/** Inspection can acknowledge only controls that the player can currently see. */
export function inspectDiscoveries(state: GameState, record: DiscoveryRecord | null, inspected: { workspaces: WorkspaceId[]; projects: ProjectId[]; protocols?: ProtocolId[] }): DiscoveryRecord {
  const workspaces = revealedWorkspaces(state), available = discovery(state).development ? visibleProjects(state) : [];
  const procedures = visibleProcedures(state), deployed = state.corporation.phase.id === 'network' ? state.corporation.phase.network.protocols : [];
  if (!record) return { workspaces, projects: [...available, ...state.corporation.projects], protocols: [...procedures, ...deployed] };
  return {
    workspaces: [...new Set([...record.workspaces, ...inspected.workspaces.filter(id => workspaces.includes(id))])],
    projects: [...new Set([...record.projects, ...inspected.projects.filter(id => available.includes(id) || state.corporation.projects.includes(id))])],
    protocols: [...new Set([...record.protocols, ...(inspected.protocols ?? []).filter(id => procedures.includes(id) || deployed.includes(id))])],
  };
}

export function discoveryAnnouncement(state: GameState, record: DiscoveryRecord | null): DiscoveryAnnouncement | null {
  const pending = unseenDiscoveries(state, record);
  const workspace = pending.workspaces.find(id => id !== 'Archive');
  if (workspace) return { text: `${workspace} is now open.`, destination: workspace };
  const project = pending.projects[0];
  if (project) return { text: pending.projects.length === 1 ? `${projects[project].name} is ready to inspect.` : `${pending.projects.length} new projects, including ${projects[project].name}.`, destination: ['network', 'ending'].includes(state.corporation.phase.id) ? 'Archive' : 'Development' };
  const procedure = pending.protocols[0];
  if (procedure) return { text: pending.protocols.length === 1 ? `${protocols[procedure].name} is ready to inspect.` : `${pending.protocols.length} new procedures, including ${protocols[procedure].name}.`, destination: 'Network' };
  return null;
}

export function tenderAnnouncement(receipt: TenderReceipt): DiscoveryAnnouncement {
  const movement = receipt.net < 0 ? `lost $${Math.abs(receipt.net).toFixed(2)}` : `gained $${receipt.net.toFixed(2)}`;
  return { text: `${clients[receipt.brief.client].name}: bid ${receipt.won ? 'accepted' : 'declined'}. Net cash ${movement}.`, destination: receipt.reward.kind === 'network' ? 'Network' : 'Company' };
}

export const projectEffects: Record<ProjectId, DiscoveryAnnouncement> = {
  'time-study': { text: 'Time study complete. Departments and process reviews are open.', destination: 'Office' },
  procurement: { text: 'Automatic procurement installed. The office can order its own blank forms.', destination: 'Office' },
  brand: { text: 'Brand book complete. Marketing campaigns can expand customer demand.', destination: 'Office' },
  standards: { text: 'Quality standards installed. Company-wide paperwork bugs reduced by 20%.', destination: 'Office' },
  charter: { text: 'Corporate charter signed. The board and contract desk are open.', destination: 'Company' },
  logistics: { text: 'Supply chain integrated. Blank forms now cost 50% less.', destination: 'Office' },
  analytics: { text: 'Workforce analytics installed. Insight production doubled; delegation is open.', destination: 'Company' },
  cultivation: { text: 'Workforce cultivation opened. Research traits for future hires.', destination: 'Development' },
  legal: { text: 'Legal framework installed. Compliance is twice as effective.', destination: 'Office' },
  stewardship: { text: 'Stewardship chosen. Research and morale improve; production is slower.', destination: 'Office' },
  extraction: { text: 'Performance doctrine chosen. Output and influence rise; morale and pressure need care.', destination: 'Office' },
  centralization: { text: 'Systems centralized. Retail reach doubled; equipment is 50% more effective.', destination: 'Office' },
  mergers: { text: 'Merger approval granted. Rival acquisitions are open.', destination: 'Company' },
  regional: { text: 'Regional network opened. Establish branches and hire workforce cohorts.', destination: 'Company' },
  franchise: { text: 'Franchise license issued. Branch output tripled.', destination: 'Company' },
  continental: { text: 'Continental charter signed. Retail reach multiplied by four; influence gains rise 50%.', destination: 'Company' },
  coordination: { text: 'Corporate culture established. Branches contribute research; morale recovers faster.', destination: 'Company' },
  infrastructure: { text: 'Autonomous infrastructure prepared. Branch output doubled.', destination: 'Company' },
  sovereign: { text: 'Sovereign workflow opened. Discover and clear worldwide workflows.', destination: 'Network' },
};

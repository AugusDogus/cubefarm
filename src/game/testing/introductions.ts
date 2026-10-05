import { discovery, cultivarVisible, facilityVisible, geneVisible, memoVisible, upgradeVisible } from '../discovery';
import { visibleProjects } from '../projects';
import { tenderAvailable } from '../tender';
import type { GameState } from '../state';
import type { Action } from '../engine';

/** Primary cards, including disabled ones. Contextual recovery disclosures remain available. */
export function visibleIntroductions(state: GameState): string[] {
  const seen = discovery(state), c = state.corporation;
  if (c.phase.id === 'network' || c.phase.id === 'ending') return [];
  return [
    ...(seen.business ? ['retail'] : []),
    ...(seen.development ? ['development', ...visibleProjects(state).map(id => `project:${id}`)] : []),
    ...(seen.departments ? ['departments'] : []),
    ...(seen.workforce ? [
      ...(['equipment', 'training', 'quality', 'capacity'] as const).filter(id => upgradeVisible(state, id)).map(id => `upgrade:${id}`),
      ...(['coffee', 'snacks', 'cafeteria', 'gym', 'benefits'] as const).filter(id => facilityVisible(state, id)).map(id => `facility:${id}`),
      ...(memoVisible(state) ? ['memos'] : []),
    ] : []),
    ...(seen.development ? (['processor', 'specialist', 'executive'] as const).filter(id => cultivarVisible(state, id)).map(id => `profile:${id}`) : []),
    ...(seen.genetics ? ['genetics', ...(['cognition', 'synthesis'] as const).filter(id => geneVisible(state, id)).map(id => `gene:${id}`)] : []),
    ...(seen.company ? ['health', 'policy', 'contracts', ...(c.crisis.status === 'pending' ? ['board-response'] : []), ...(tenderAvailable(state) ? ['tenders'] : []), ...(seen.delegation ? ['delegation'] : []), ...(c.projects.includes('mergers') ? ['acquisitions'] : [])] : []),
    ...(c.projects.includes('regional') ? ['branches'] : []),
  ];
}

export type Introduction = { id: string; seconds: number; source: Action['type'] | 'advance' };
export function recordIntroductions(state: GameState, timeline: Introduction[], seen: Set<string>, source: Introduction['source']) {
  for (const id of visibleIntroductions(state)) if (!seen.has(id)) {
    seen.add(id);
    timeline.push({ id, seconds: state.elapsed, source });
  }
}

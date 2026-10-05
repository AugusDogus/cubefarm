import { z } from 'zod';
import type { GameState } from './state';
import type { ProjectId } from './projects';

export const learningAnchors = ['first-hire', 'time-study', 'charter', 'analytics', 'legal', 'cultivation', 'regional', 'franchise'] as const;
export type LearningAnchor = typeof learningAnchors[number];
export const LearningSchema = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('legacy') }),
  z.object({ mode: z.literal('staged'), anchors: z.array(z.object({ id: z.enum(learningAnchors), at: z.number().finite().nonnegative().max(Number.MAX_SAFE_INTEGER) })).max(learningAnchors.length).refine(items => new Set(items.map(item => item.id)).size === items.length) }),
]);

/** Only new companies use observation windows. Missing save fields preserve historical access. */
export function recordLearning(state: GameState, id: LearningAnchor): GameState {
  const learning = state.learning;
  if (learning.mode === 'legacy' || learning.anchors.some(anchor => anchor.id === id)) return state;
  return { ...state, learning: { ...learning, anchors: [...learning.anchors, { id, at: state.elapsed }] } };
}

/** Null means the prerequisite has not happened; paused and offline time follow the simulation. */
export function learningRemaining(state: GameState, id: LearningAnchor, seconds: number): number | null {
  if (state.learning.mode === 'legacy') return 0;
  const anchor = state.learning.anchors.find(anchor => anchor.id === id);
  return anchor ? Math.max(0, Math.ceil(anchor.at + seconds - state.elapsed)) : null;
}

const projectWindows: Partial<Record<ProjectId, { anchor: LearningAnchor; seconds: number }>> = {
  procurement: { anchor: 'time-study', seconds: 45 },
  brand: { anchor: 'time-study', seconds: 90 },
  standards: { anchor: 'time-study', seconds: 150 },
  charter: { anchor: 'time-study', seconds: 240 },
  logistics: { anchor: 'charter', seconds: 60 },
  stewardship: { anchor: 'charter', seconds: 120 },
  extraction: { anchor: 'charter', seconds: 120 },
  analytics: { anchor: 'charter', seconds: 180 },
  legal: { anchor: 'charter', seconds: 240 },
  cultivation: { anchor: 'analytics', seconds: 90 },
  centralization: { anchor: 'analytics', seconds: 180 },
  mergers: { anchor: 'legal', seconds: 120 },
  franchise: { anchor: 'regional', seconds: 120 },
  coordination: { anchor: 'franchise', seconds: 60 },
  continental: { anchor: 'franchise', seconds: 120 },
};
export function projectLearningRemaining(state: GameState, id: ProjectId): number | null {
  if (state.corporation.projects.includes(id)) return 0;
  const window = projectWindows[id];
  return window ? learningRemaining(state, window.anchor, window.seconds) : 0;
}

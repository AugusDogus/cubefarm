import type { GeneId } from './catalog';

export const GENOME_SLOTS = 2;
/** Tradeoffs belong to inherited profiles, including historical profiles. */
export function geneEffects(profile: readonly GeneId[]) {
  return {
    output: (profile.includes('cognition') ? 1.35 : 1) * (profile.includes('synthesis') ? 1.6 : 1),
    research: (profile.includes('precision') ? 1.5 : 1) * (profile.includes('focus') ? 1.2 : 1) * (profile.includes('synthesis') ? 0.65 : 1),
    compliance: profile.includes('endurance') ? 1.8 : 1,
    wages: (profile.includes('endurance') ? 1.15 : 1) * (profile.includes('synthesis') ? 1.5 : 1),
    bugs: (profile.includes('precision') ? 0.5 : 1) * (profile.includes('cognition') ? 1.75 : 1),
    breaks: profile.includes('endurance') ? 0.35 : 1,
    slack: profile.includes('focus') ? 0.3 : 1,
  };
}

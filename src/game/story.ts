import { z } from 'zod';
import type { GameState } from './state';

export const letterIds = ['first-hire', 'first-team', 'promise', 'charter', 'cultivation', 'first-crop', 'regional', 'sovereign', 'fifty-offices', 'local-names', 'coordination', 'exit-interviews', 'board-seats', 'enough-offices', 'halfway', 'finished'] as const;
export type LetterId = typeof letterIds[number];
export const StorySchema = z.object({
  read: z.array(z.enum(letterIds)).max(letterIds.length).refine(ids => new Set(ids).size === ids.length),
  promise: z.enum(['undecided', 'voice', 'quota']),
  cultivation: z.enum(['undecided', 'consent', 'patent']),
});
export function initialStory(): z.infer<typeof StorySchema> { return { read: [], promise: 'undecided', cultivation: 'undecided' }; }
export type StoryReply = { letter: 'promise'; choice: 'voice' | 'quota' } | { letter: 'cultivation'; choice: 'consent' | 'patent' };
type Letter = { from: string; subject: string; body: string; ready: (state: GameState) => boolean };
export const letters: Record<LetterId, Letter> = {
  'first-hire': { from: 'Robin Park, employee 001', subject: 'The other chair', body: 'I found the office. The chair is fine. I will take the incoming forms. You can put the stamp down for a minute.', ready: s => s.nextId > 1 },
  'first-team': { from: 'Robin Park', subject: 'A small request', body: 'When the first three of us arrived, we invented different ways to do the same work. Before you buy more desks, could someone study what we actually do?', ready: s => s.nextId >= 4 },
  promise: { from: 'Robin Park, on behalf of the office', subject: 'Before the name goes on the building', body: 'The incorporation paperwork asks who this company is for. We know what the board wants. We would like to know what you promised us. Please put it in writing.', ready: s => s.corporation.projects.includes('standards') },
  charter: { from: 'M. Voss, board secretary', subject: 'Congratulations on your incorporation', body: 'The board has approved the charter. Your staff are now a workforce. Your desks are now productive capacity. The wording is standard. Robin asked us to keep a copy of your earlier letter.', ready: s => s.corporation.projects.includes('charter') },
  cultivation: { from: 'Dr. Imani Vale, workforce research', subject: 'This is not a training program', body: 'We can cultivate workers with specific cognitive traits. They are people, not software updates. Existing staff cannot be rewritten. Before I open the lab, decide whether the people we grow will own their own designs.', ready: s => s.corporation.projects.includes('analytics') },
  'first-crop': { from: 'Robin Park', subject: 'Orientation', body: 'The new colleague asked what their first day would be like. I said we usually show people the breakroom. They asked whether their design made breaks optional. I said breaks were for people, not for designs. I showed them anyway.', ready: s => s.employees.some(e => e.genes.length > 0) || s.corporation.branches.some(b => b.cohorts.some(g => g.genes.length > 0)) },
  regional: { from: 'M. Voss', subject: 'The map', body: 'The regional map is attached. The board sees empty markets. Robin has marked the places where people will live. Both versions describe the same expansion.', ready: s => s.corporation.projects.includes('regional') },
  sovereign: { from: 'Dr. Imani Vale', subject: 'A finite amount of work', body: 'The network can locate and clear a billion outstanding workflows. Headquarters still funds the network, but this backlog has an end. When it is cleared, we can retire the company instead of inventing another target.', ready: s => s.corporation.projects.includes('sovereign') },
  'fifty-offices': { from: 'Dr. Imani Vale', subject: 'The first twenty-five', body: 'Twenty-five offices, all descended from the same procedure. Their reports disagree about where to put the kettle. That was not in the design. I have left it out of the bug report. Growth is working; keep power ahead of it.', ready: s => networkNodes(s) >= 25 },
  'local-names': { from: 'Robin Park', subject: 'Please stop numbering the kitchens', body: 'The branches are giving themselves names. A manager asked whether we could use those instead of the installation numbers. I said I would ask. The map is becoming a place where people live, even if the board still calls it capacity.', ready: s => networkNodes(s) >= 250 },
  coordination: { from: 'M. Voss', subject: 'A thousand copies', body: 'Replication now spends more time coordinating existing offices. The growth figure is honest: another thousand offices will take longer than the last thousand. The board proposes more of everything. Imani proposes comparing the time saved by more offices with the time spent building them.', ready: s => networkNodes(s) >= 1000 },
  'exit-interviews': { from: 'Robin Park', subject: 'A form we do not need', body: 'We have started asking what people want to do afterwards. Someone wants to keep the gym open. Someone wants to never see another form. There is no answer box on the questionnaire for both. We stopped using the questionnaire.', ready: s => networkNodes(s) >= 2500 },
  'board-seats': { from: 'M. Voss', subject: 'Who sits here?', body: 'The boardroom has twelve chairs. The network has thousands of offices. Robin sent a list of people who would like to attend the final meeting. I asked how many. Robin sent back the same list. We may need a different room.', ready: s => networkNodes(s) >= 3500 },
  'enough-offices': { from: 'Dr. Imani Vale', subject: 'Enough is a number', body: 'Five thousand offices can clear the remaining work. We can keep growing, but the additional offices must earn back their construction time. Try the Clear plan and watch the completion estimate. Once everything is located, discovery has nothing left to contribute.', ready: s => networkNodes(s) >= 5000 },
  halfway: { from: 'Robin Park', subject: 'What happens afterwards?', body: 'Half the work is finished. A branch manager asked what we will do when there are no forms left. I could not find a procedure for that. Please do not write one before asking us.', ready: s => s.corporation.phase.id === 'network' && s.corporation.phase.network.completed >= 500_000_000 },
  finished: { from: 'M. Voss, final board meeting', subject: 'No further business', body: 'The inherited backlog is cleared. The board has requested that you create new demand. Robin has requested that you retire the remaining retail obligations and open the doors. Both motions are on the table.', ready: s => s.corporation.phase.id === 'ending' || s.corporation.phase.id === 'network' && s.corporation.phase.network.completed >= 1_000_000_000 },
};
export function pendingLetter(state: GameState): LetterId | null {
  return letterIds.find(id => !state.story.read.includes(id) && letters[id].ready(state)) ?? null;
}
export function commonsSettlement(state: GameState) {
  return state.story.cultivation === 'patent' ? 250_000 : 0;
}
function networkNodes(state: GameState) {
  return state.corporation.phase.id === 'network' ? state.corporation.phase.network.nodes : state.corporation.phase.id === 'ending' ? state.corporation.phase.nodes : 0;
}
export function correspondent(state: GameState, id: LetterId) {
  return letters[id].from.startsWith('Robin') && !state.employees.some(e => e.id === 1) ? 'Robin Park, former headquarters employee 001' : letters[id].from;
}
export function endingEcho(state: GameState) {
  const commons = state.corporation.phase.id === 'ending' && state.corporation.phase.ending === 'commons';
  if (commons) return state.story.cultivation === 'patent' ? 'The patents were bought out and destroyed. Imani watched the last copy leave the registry. Robin took down the attendance sheet.' : state.story.promise === 'voice' ? 'Robin kept your first promise on the noticeboard. Today, the office voted to go home.' : 'You promised higher targets. In the end, you gave them something better: the right to refuse.';
  return state.story.promise === 'voice' ? 'Robin’s letter is still on file. Employee participation is now a mandatory agenda item. There is no agenda item for leaving.' : state.story.cultivation === 'consent' ? 'The people own their designs. The corporation owns every place those designs can work. Imani has stopped writing.' : `The employee designs remain company property. The final memo calls this continuity. ${state.employees.some(e => e.id === 1) ? 'Robin’s chair is still occupied.' : 'Robin’s old chair has a new occupant. The letters remain on file.'}`;
}

import { objective, objectiveWorkspace, type ObjectiveWorkspace } from '../game/objectives';
import type { GameState } from '../game/state';
export function Objectives({ state, navigate }: { state: GameState; navigate: (workspace: ObjectiveWorkspace) => void }) {
  const goal = objective(state), crisis = state.corporation.crisis;
  const workspace = goal.target ? objectiveWorkspace(state, goal.target) : null;
  return <div className="objective-strip"><div><strong>{goal.title}</strong><p>{goal.detail}</p>{crisis.status === 'pending' && state.corporation.phase.id !== 'network' && <p className="board-alert">A decision is waiting at the company desk. It will wait for you.</p>}</div>{workspace && <button className="text-button" onClick={() => navigate(workspace)}>{workspace}</button>}</div>;
}

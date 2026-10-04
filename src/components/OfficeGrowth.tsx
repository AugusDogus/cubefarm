import type { Action } from '../game/engine';
import type { GameState } from '../game/state';
import { expectedOutput } from '../game/balance';
import { demand, marketingCost } from '../game/economy';
import { projects, projectReason, type ProjectId } from '../game/projects';
import { dollars } from './ui';

type Props = { state: GameState; dispatch: (action: Action) => void };
function OfficeProject({ state, dispatch, id }: Props & { id: ProjectId }) {
  const project = projects[id], reason = projectReason(state, id);
  return <div className="office-project"><p>{project.name}: {dollars(project.cash)}{project.insights > 0 && ` + ${project.insights} insights`}.</p>{id === 'time-study' && <p className="hint">Time study earns insights continuously and unlocks sales staffing in Departments.</p>}<button disabled={reason !== null} onClick={() => dispatch({ type: 'project', id })}>{reason ?? `Authorize ${project.name}`}</button></div>;
}

export function SupplyAutomation({ state, dispatch }: Props) {
  const c = state.corporation;
  if (c.projects.includes('procurement')) return null;
  return <details className="operating-help" open={c.blankForms < Math.max(250, expectedOutput(state) * 30)}><summary>Automate blank-form purchases</summary><p>Automatic procurement orders forms as needed and keeps a payroll buffer. Unlock it through Time study.</p>{!c.projects.includes('time-study') && <OfficeProject state={state} dispatch={dispatch} id="time-study" />}<OfficeProject state={state} dispatch={dispatch} id="procurement" /></details>;
}

export function DemandGrowth({ state, dispatch }: Props) {
  const c = state.corporation;
  const constrained = expectedOutput(state) > demand(state) || c.inventory > demand(state) * 20;
  return <div className="demand-growth">
    {c.projects.includes('brand') ? <><button className="full split" disabled={c.marketing >= 25 || state.cash < marketingCost(state)} onClick={() => dispatch({ type: 'marketing' })}><span>{c.marketing >= 25 ? 'Marketing complete' : `Marketing, level ${c.marketing + 1}`}</span><span>{dollars(marketingCost(state))}</span></button><p className="hint">Each campaign increases demand by 60% at the same price.</p></> : <details className="operating-help" open={constrained}><summary>Grow customer demand</summary><p>Hiring increases production and payroll. Marketing and sales staff bring more customers.</p>{!c.projects.includes('time-study') && <OfficeProject state={state} dispatch={dispatch} id="time-study" />}<p>Brand book unlocks marketing campaigns, each adding 60% demand at the same price.</p><OfficeProject state={state} dispatch={dispatch} id="brand" /></details>}
    {c.projects.includes('time-study') && <p className="hint">Assign employees to sales in Departments below. Sales staff immediately expand demand instead of filing forms. You can then reconsider your price.</p>}
    <p className="hint">{constrained ? 'Sales are the bottleneck. Expand demand before buying more production. Lowering prices is optional, and reduces earnings per form.' : 'Higher prices earn more per form but reduce demand. Marketing and sales expand the market without a price cut.'}</p>
  </div>;
}

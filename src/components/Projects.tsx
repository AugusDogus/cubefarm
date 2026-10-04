import { projects, projectReason, visibleProjects, type ProjectId } from '../game/projects';
import type { Action } from '../game/engine';
import type { GameState } from '../game/state';
import { dollars, number, Pair, Purchase, Section } from './ui';

type Props = { state: GameState; dispatch: (action: Action) => void; unseen?: readonly ProjectId[]; emphasized?: readonly ProjectId[]; inspect?: (id: ProjectId) => void; finishEmphasis?: (id: ProjectId) => void };
export function Projects({ state, dispatch, unseen = [], emphasized = [], inspect, finishEmphasis }: Props) {
  const c = state.corporation;
  const available = visibleProjects(state);
  return <Section title="Corporate projects" aside={<span className="muted">{c.projects.length} completed</span>}>
    {c.projects.includes('time-study') && <><div className="resource-row"><Pair label="Insights">{number(c.insights)}</Pair>{c.projects.includes('charter') && <Pair label="Influence">{number(c.influence)}</Pair>}</div><p className="section-intro">Process reviews run continuously. Assign researchers in the office to earn insights faster.{c.projects.includes('charter') ? ' Sales and contracts earn influence.' : ''}</p></>}
    <div className="project-grid">{available.map(id => {
      const p = projects[id], reason = projectReason(state, id);
      const isNew = unseen.includes(id);
      return <div key={id} tabIndex={0} role="group" aria-label={`${p.name}${isNew ? ', new project' : ''}`} className={emphasized.includes(id) ? 'discovery-emphasis' : undefined} onAnimationEnd={() => finishEmphasis?.(id)} onPointerEnter={() => isNew && inspect?.(id)} onPointerDown={() => isNew && inspect?.(id)} onFocus={() => isNew && inspect?.(id)}>
        {isNew && <span className="new-marker">New</span>}
        <Purchase name={p.name} description={p.description} detail={`${dollars(p.cash)} / ${p.insights} insights${p.influence ? ` / ${p.influence} influence` : ''}`} label={reason ?? 'Authorize project'} disabled={reason !== null} onClick={() => dispatch({ type: 'project', id })} />
      </div>;
    })}</div>
    {!available.length && <p className="hint">The research desk is studying the current workflow. More opportunities appear as the company grows.</p>}
    {c.projects.length > 0 && <details className="completed-projects"><summary>Completed projects</summary>{c.projects.map(id => <div key={id} className="completed-project"><h3>{projects[id].name}</h3><p>{projects[id].description}</p></div>)}</details>}
  </Section>;
}

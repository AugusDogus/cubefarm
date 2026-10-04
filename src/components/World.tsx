import { useState } from 'react';
import { capacity, climate } from '../game/engine';
import { totalEmployees } from '../game/expansion';
import type { GameState } from '../game/state';
import { Hairline } from './Hairline';
import { number, Section } from './ui';

export function World({ state }: { state: GameState }) {
  const [floor, setFloor] = useState(0);
  const [inspect, setInspect] = useState(false);
  const c = state.corporation, floors = Math.ceil(capacity(state) / 9);
  const current = Math.min(floor, floors - 1);
  const world = inspect ? 'cubicles' : c.projects.includes('regional') ? 'campus' : state.upgrades.capacity > 0 || c.projects.includes('charter') ? 'tower' : 'cubicles';
  const occupants = Math.max(0, Math.min(9, state.employees.length - current * 9));
  const running = !state.paused && c.phase.id !== 'network' && c.phase.id !== 'ending';
  const value = world === 'cubicles' ? occupants : world === 'tower' ? Math.min(6, floors) : c.phase.id === 'network' ? Math.min(9, Math.max(3, Math.floor(Math.log10(c.phase.network.nodes + 1)) + 3)) : Math.min(9, c.branches.length + c.acquired.length + 1);
  return <Section title={state.nextId === 1 ? 'An empty cubicle' : 'The cube farm'} className="world">
    <Hairline name={world} value={value} simulation={{ kind: 'office', running, time: state.elapsed, queue: c.inventory }} workers={state.employees.slice(current * 9, current * 9 + 9).map(e => e.activity)} label={world === 'cubicles' ? `${occupants} employees in an isometric cubicle field. Paper piles show the current unsold forms; empty chairs show breaks.` : world === 'tower' ? 'Your growing office tower. Hover to inspect its floors.' : 'Your corporate campus. Hover to inspect its offices.'} />
    <p className="world-line">{state.nextId === 1 ? 'One desk. One stamp. There is work to do.' : state.employees.length === 0 ? 'The chairs are empty. You still have the stamp.' : world === 'cubicles' ? `${occupants} ${occupants === 1 ? 'person' : 'people'} on this floor. The forms keep coming.` : `${number(totalEmployees(state))} people inside the institution.`}</p>
    {(state.upgrades.capacity > 0 || c.projects.includes('charter')) && <div className="world-toolbar"><button className="text-button" onClick={() => setInspect(!inspect)}>{inspect ? 'View the institution' : 'Visit the cubicles'}</button>{inspect && floors > 1 && <div className="button-row"><button disabled={current === 0} aria-label="Previous floor" onClick={() => setFloor(current - 1)}>−</button><span>Floor {current + 1}/{floors}</span><button disabled={current === floors - 1} aria-label="Next floor" onClick={() => setFloor(current + 1)}>+</button></div>}</div>}
    {state.revenue >= 400 && <details className="climate-disclosure"><summary>{climate(state).name}</summary><p>{climate(state).description} Changes every three minutes.</p></details>}
  </Section>;
}

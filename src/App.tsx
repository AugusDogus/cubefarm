import { useEffect, useRef, useState } from 'react';
import { useGame } from './game/useGame';
import { netIncome, rank, type Action } from './game/engine';
import { discovery } from './game/discovery';
import { discoveryAnnouncement, projectEffects, revealedWorkspaces, tenderAnnouncement, unseenDiscoveries, type DiscoveryAnnouncement, type WorkspaceId } from './game/discovery-feedback';
import type { ProjectId } from './game/projects';
import { useFeedback } from './game/feedback';
import { totalEmployees } from './game/expansion';
import { Operations, Memo, UpgradeList } from './components/Operations';
import { Workforce } from './components/Workforce';
import { Facilities, Research } from './components/Research';
import { Ledger } from './components/Corporate';
import { Settings } from './components/Settings';
import { Projects } from './components/Projects';
import { Strategy } from './components/Strategy';
import { Tender } from './components/Tender';
import { Expansion } from './components/Expansion';
import { Network, Ending, Legacy } from './components/Network';
import { Objectives } from './components/Objectives';
import { Correspondence, CorrespondenceArchive } from './components/Correspondence';
import { Departments } from './components/Departments';
import { Delegation } from './components/Delegation';
import { World } from './components/World';
import { clock, compactDollars, number } from './components/ui';

export function App() {
  const game = useGame(), { state } = game, feedback = useFeedback();
  const [workspace, setWorkspace] = useState<WorkspaceId>('Office');
  const [settings, setSettings] = useState(false);
  const [cue, setCue] = useState<{ id: number; text: string; animate: boolean } | null>(null);
  const [filingCue, setFilingCue] = useState<number | null>(null);
  const [settledTender, setSettledTender] = useState<DiscoveryAnnouncement | null>(null);
  const [resultDestination, setResultDestination] = useState<WorkspaceId | null>(null);
  const cueSequence = useRef(0), highlighted = useRef(new Set<string>());
  const [emphasis, setEmphasis] = useState<string[]>([]);
  const uiRevision = useRef(game.uiRevision), tenderSequence = useRef(state.corporation.tender.lastReceipt?.brief.sequence ?? 0);
  const seen = discovery(state), phase = state.corporation.phase.id;
  const late = phase === 'network' || phase === 'ending';
  const workspaces = revealedWorkspaces(state);
  const active = workspaces.includes(workspace) ? workspace : workspaces[0] ?? 'Office';
  const pending = unseenDiscoveries(state, state.discoveryRecord);
  const announcement = discoveryAnnouncement(state, state.discoveryRecord);
  const lastProject = state.corporation.projects.at(-1);
  const latestProject = lastProject ? projectEffects[lastProject] : null;
  const inspect = (workspaces: WorkspaceId[], projects: ProjectId[] = []) => game.dispatch({ type: 'inspect-discoveries', workspaces, projects });
  const navigate = (destination: WorkspaceId) => {
    setWorkspace(destination);
    inspect([destination]);
  };
  const inspectTenderResult = () => {
    if (!settledTender) return;
    const destination = late ? 'Network' : settledTender.destination;
    navigate(destination);
    setResultDestination(destination);
  };
  useEffect(() => {
    if (resultDestination && active === resultDestination) {
      document.getElementById(`${resultDestination.toLowerCase()}-tenders`)?.scrollIntoView({ block: 'start' });
      setResultDestination(null);
    }
  }, [resultDestination, active]);
  const finishEmphasis = (id: string) => setEmphasis(previous => previous.filter(item => item !== id));
  useEffect(() => {
    const receipt = state.corporation.tender.lastReceipt;
    if (uiRevision.current !== game.uiRevision) {
      uiRevision.current = game.uiRevision;
      tenderSequence.current = receipt?.brief.sequence ?? 0;
      highlighted.current.clear(); setEmphasis([]); setWorkspace('Office');
      setCue(null); setFilingCue(null); setSettledTender(null); setResultDestination(null);
      return;
    }
    if (receipt && receipt.brief.sequence !== tenderSequence.current) {
      tenderSequence.current = receipt.brief.sequence;
      setSettledTender(tenderAnnouncement(receipt));
    }
  }, [game.uiRevision, state.corporation.tender.lastReceipt]);
  useEffect(() => {
    if (state.discoveryRecord === null) inspect([active]);
    const fresh = [...pending.workspaces.map(id => `workspace:${id}`), ...pending.projects.map(id => `project:${id}`), ...pending.protocols.map(id => `protocol:${id}`)].filter(id => !highlighted.current.has(id));
    if (fresh.length) {
      for (const id of fresh) highlighted.current.add(id);
      setEmphasis(previous => [...previous, ...fresh]);
    }
  });
  useEffect(() => {
    if (!cue) return;
    const timeout = window.setTimeout(() => setCue(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [cue]);
  useEffect(() => {
    if (filingCue === null) return;
    const timeout = window.setTimeout(() => setFilingCue(null), 2400);
    return () => window.clearTimeout(timeout);
  }, [filingCue]);
  const dispatch = (action: Action) => {
    if (!game.dispatch(action)) return;
    const kind = action.type === 'process' ? 'file' : action.type === 'hire' || action.type === 'cohort' ? 'hire' : action.type === 'reply' || action.type === 'read-letter' ? 'letter' : 'purchase';
    if (!['pause', 'price', 'allocate', 'network-plan', 'network-routing', 'network-investment', 'network-knowledge-reserve', 'staff', 'assign', 'auto-buy', 'automation', 'genome', 'inspect-discoveries'].includes(action.type)) feedback.play(kind);
    if (action.type === 'process') { cueSequence.current++; setFilingCue(cueSequence.current); return; }
    const text = action.type === 'supplier-relief' ? '250 free forms received. Supplier relief has been used.' : action.type === 'hire' ? `${action.count ?? 1} hired.` : action.type === 'project' ? projectEffects[action.id].text : action.type === 'research-gene' ? 'Trait researched. Select it for future hires.' : action.type === 'genome' ? 'Hiring profile updated.' : action.type === 'reply' ? 'Your commitment is on file.' : action.type === 'staff' ? 'Staffing updated.' : action.type === 'network-commission' ? `${number(action.count)} offices commissioned.` : action.type === 'network-asset' ? `${number(action.count)} installations built.` : action.type === 'upgrade' ? 'Office improved.' : action.type === 'facility' ? 'Incentive installed.' : action.type === 'cohort' ? `${action.count} hired.` : null;
    if (text) { cueSequence.current++; setCue({ id: cueSequence.current, text, animate: true }); }
  };
  const corporateProjects = <Projects state={state} dispatch={dispatch} unseen={pending.projects} emphasized={pending.projects.filter(id => emphasis.includes(`project:${id}`))} inspect={id => inspect([], [id])} finishEmphasis={id => finishEmphasis(`project:${id}`)} />;
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      const filingTarget = event.target === document.body || event.target instanceof HTMLButtonElement && event.target.dataset.testid === 'file';
      if (event.code === 'Space' && filingTarget && !settings && active === 'Office') {
        event.preventDefault();
        if (!state.paused && state.manualCooldown === 0) dispatch({ type: 'process' });
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  const office = <><div className={`office-layout ${seen.workforce ? '' : 'small-beginning'}`}><div className="operations-column"><Operations state={state} dispatch={dispatch} />{seen.departments && <Departments state={state} dispatch={dispatch} />}</div><World state={state} /></div>
    {seen.workforce && <div className="office-support"><UpgradeList state={state} dispatch={dispatch} ids={['equipment', 'training', 'quality', 'capacity']} /><Facilities state={state} dispatch={dispatch} /><Memo state={state} dispatch={dispatch} /></div>}
    {seen.workforce && <details className="archive-section"><summary>Inspect employees ({state.employees.length})</summary><Workforce state={state} dispatch={dispatch} /></details>}
  </>;
  return <div className="app-shell game-shell">
    <header className="header"><div className="brand"><img src="/favicon.svg" alt="" width="27" height="27" /><h1>Cube Farm.</h1></div><div className="header-tools">{seen.workforce && phase !== 'ending' && <button className="text-button" onClick={() => dispatch({ type: 'pause' })}>{state.paused ? 'Resume' : 'Pause'}</button>}<button className="text-button" onClick={() => setSettings(true)}>Settings</button></div></header>
    <div className="tagline-row"><p>Optimize your employees in an ever changing corporate world.</p></div>
    {workspaces.length > 1 && <nav className="tabs" aria-label="Workspaces">{workspaces.map(name => <button key={name} aria-current={active === name ? 'page' : undefined} onClick={() => navigate(name)}>{phase === 'ending' && name === 'Network' ? 'After work' : name}{(pending.workspaces.includes(name) || name === 'Development' && pending.projects.length > 0 || name === 'Network' && pending.protocols.length > 0) && <span className={`new-marker ${emphasis.includes(`workspace:${name}`) ? 'discovery-emphasis' : ''}`} onAnimationEnd={() => finishEmphasis(`workspace:${name}`)}>New</span>}</button>)}</nav>}
    <div className={`stats-bar lean-stats ${seen.workforce ? late ? 'network-stats' : '' : 'opening-stats'}`}><div><span>Available funds</span><strong data-testid="cash" className="numeric" title={String(state.cash)}>{compactDollars(state.cash)}</strong></div>
      {seen.workforce ? <><div><span>Net income / second</span><strong className="numeric">{compactDollars(netIncome(state))}</strong></div><div><span>{phase === 'network' ? 'Autonomous offices' : 'Employees'}</span><strong className="numeric" data-testid="employees">{number(state.corporation.phase.id === 'network' ? state.corporation.phase.network.nodes : totalEmployees(state))}</strong></div>{seen.company && !late && <div><span>Market standing</span><strong className="numeric">#{rank(state)}</strong></div>}</> : <div><span>Forms filed</span><strong className="numeric">{number(state.paperwork)}</strong></div>}
    </div>
    {game.notice && <div className="notice" role="status"><span>{game.notice}</span><button className="text-button" onClick={game.dismissNotice}>Dismiss</button></div>}
    <div className="discovery-announcement" role="status" aria-live="polite">{announcement && <><span>{announcement.text}</span><button className="text-button" onClick={() => navigate(announcement.destination)}>View {announcement.destination}</button></>}</div>
    <div className="tender-announcement" role="status" aria-live="polite">{settledTender && <><span>{settledTender.text}</span><button className="text-button" onClick={inspectTenderResult}>Inspect {late ? 'Network' : settledTender.destination} result</button><button className="text-button" onClick={() => setSettledTender(null)}>Dismiss</button></>}</div>
    {latestProject && <div className="milestone-receipt"><span>{latestProject.text}</span><button className="text-button" onClick={() => navigate(late && latestProject.destination !== 'Network' ? 'Archive' : latestProject.destination)}>Inspect {late && latestProject.destination !== 'Network' ? 'Archive' : latestProject.destination}</button></div>}
    {state.paused && phase !== 'ending' && <div className="pause-note">Operations paused. Payroll and timers will resume together.</div>}
    {seen.development && !late && <Objectives state={state} navigate={navigate} />}
    <Correspondence state={state} dispatch={dispatch} />
    <main>
      {active === 'Office' && office}
      {active === 'Development' && <>{corporateProjects}<Research state={state} dispatch={dispatch} /><Legacy state={state} dispatch={dispatch} /></>}
      {active === 'Company' && <><div id="company-tenders"><Tender state={state} dispatch={dispatch} /></div>{seen.delegation && <Delegation state={state} dispatch={dispatch} />}{state.corporation.projects.includes('regional') && <Expansion state={state} dispatch={dispatch} />}<details className="archive-section" open={!state.corporation.projects.includes('regional')}><summary>The board, contracts, and competitors</summary><Strategy state={state} dispatch={dispatch} /></details></>}
      {active === 'Network' && (phase === 'ending' ? <Ending state={state} dispatch={dispatch} /> : <Network state={state} dispatch={dispatch} emphasizedProtocols={pending.protocols.filter(id => emphasis.includes(`protocol:${id}`))} finishProtocolEmphasis={id => finishEmphasis(`protocol:${id}`)} />)}
      {active === 'Archive' && <><World state={state} /><details className="archive-section"><summary>Headquarters and shared incentives</summary>{office}</details><details className="archive-section"><summary>Research and corporate projects</summary>{corporateProjects}<Research state={state} dispatch={dispatch} /></details><details className="archive-section"><summary>Regional branches</summary><Expansion state={state} dispatch={dispatch} /></details></>}
      {(seen.workforce || late) && <div className="records"><CorrespondenceArchive state={state} /><details className="archive-section"><summary>Company records</summary><Ledger state={state} /></details></div>}
    </main>
    <div className="action-feedback"><span className="filing-feedback" aria-live="off">{filingCue === null ? '' : 'Filed.'}</span><div className="discrete-feedback" role="status" aria-live="polite">{cue ? <span key={cue.id} className={cue.animate ? 'action-cue' : undefined}>{cue.text}</span> : '\u00a0'}</div></div>
    <footer className="footer"><span>{number(state.paperwork)} forms filed{seen.workforce && ` / ${clock(state.elapsed)}`}</span><div><span>{game.saveStatus}</span><button className="text-button" onClick={game.save}>Save</button></div></footer>
    {settings && <Settings close={() => setSettings(false)} save={game.save} saveStatus={game.saveStatus} reset={game.reset} exportSave={game.exportSave} importSave={game.importSave} sound={feedback.enabled} setSound={feedback.toggle} soundNotice={feedback.notice} />}
  </div>;
}

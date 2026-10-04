import { rivalIds, rivals } from '../game/corporation';
import { rivalRevenue, totalEmployees, maintenance, payroll } from '../game/expansion';
import { wageMultiplier } from '../game/conditions';
import { demand } from '../game/economy';
import { netIncome, production, rank, risks } from '../game/engine';
import type { GameState } from '../game/state';
import { clock, dollars, number, Pair, percent, Section } from './ui';

export function Productivity({ state }: { state: GameState }) {
  const working = state.employees.filter(e => e.activity === 'working').length;
  const average = (key: 'slack' | 'breaks' | 'bugs') => state.employees.length ? state.employees.reduce((sum, e) => sum + risks(state, e)[key], 0) / state.employees.length : 0;
  return <Section title="Productivity" aside={<span className="muted">Live</span>}>
    <Pair label="Production capacity / s">{production(state).toFixed(2)}</Pair>
    <Pair label="Gross income / second">{dollars(state.paused ? 0 : state.corporation.soldRate * state.corporation.price, true)}</Pair>
    <Pair label="Payroll / second">{dollars(state.paused ? 0 : payroll(state) * wageMultiplier(state), true)}</Pair>
    <Pair label="Net income / second">{dollars(netIncome(state), true)}</Pair>
<Pair label="Retail demand / second">{demand(state).toFixed(2)}</Pair><Pair label="Branch upkeep / second">{dollars(maintenance(state), true)}</Pair>
    <div className="subsection"><Pair label="Currently working">{working} / {state.employees.length}</Pair>
      <div className="worker-strip" aria-label={`${working} of ${state.employees.length} employees working`}>{state.employees.slice(0, 32).map(e => <span className={e.activity === 'working' ? 'working' : ''} key={e.id} title={`${e.name}: ${e.activity}`} />)}</div>
      <Pair label="Slacking chance">{percent(average('slack'))}</Pair>
      <Pair label="Break chance">{percent(average('breaks'))}</Pair>
      <Pair label="Paperwork bugs">{percent(average('bugs'))}</Pair>
      <p className="hint">Average chance at each work-cycle check.</p>
    </div>
  </Section>;
}

export function Market({ state, compact = false }: { state: GameState; compact?: boolean }) {
  const companies = [...rivalIds.filter(id => !state.corporation.acquired.includes(id)).map(id => ({ name: rivals[id].name, revenue: rivalRevenue(state, id), player: false })), { name: 'Cube Farm', revenue: state.revenue, player: true }].sort((a, b) => b.revenue - a.revenue || Number(b.player) - Number(a.player));
  const next = [...companies].reverse().find(c => c.revenue > state.revenue);
  return <Section title="Market standing" aside={<span className="numeric">#{rank(state)} / {7 - state.corporation.acquired.length}</span>}>
    {!compact && <p className="section-intro">Ranked by lifetime gross revenue. Rivals keep growing. Acquired companies are consolidated into Cube Farm. No stocks to buy or sell.</p>}
    <ol className="market-list">{companies.map((company, i) => <li key={company.name} className={company.player ? 'your-company' : ''}><span className="market-rank numeric">{i + 1}</span><span>{company.name}{company.player && <span className="muted"> (you)</span>}</span><span className="numeric">{dollars(company.revenue)}</span></li>)}</ol>
    <p className="hint">{next ? `${dollars(next.revenue - state.revenue)} to overtake ${next.name}.` : 'The highest-grossing corporation. Keep growing.'}</p>
  </Section>;
}

export function CompanyLog({ state, compact = false }: { state: GameState; compact?: boolean }) {
  return <Section title="Company log" aside={<span className="muted">{compact ? 'Recent activity' : 'Corporate record'}</span>}><ol className="company-log">{state.log.slice(0, compact ? 5 : 30).map(entry => <li key={entry.id}><time className="numeric">{clock(entry.time)}</time><span>{entry.message}</span></li>)}</ol></Section>;
}

export function Ledger({ state }: { state: GameState }) {
  return <div className="ledger-layout"><div><Section title="Corporate ledger"><Pair label="Available funds">{dollars(state.cash, true)}</Pair><Pair label="Lifetime gross revenue">{dollars(state.revenue, true)}</Pair><Pair label="Total payroll paid">{dollars(state.wages, true)}</Pair><Pair label="Forms processed">{number(state.paperwork)}</Pair><Pair label="Supply purchases">{dollars(state.corporation.supplySpent)}</Pair><Pair label="Branch maintenance">{dollars(state.corporation.maintenanceSpent)}</Pair><Pair label="Fulfilled contracts">{state.corporation.completedContracts}</Pair><Pair label="Failed or canceled contracts">{state.corporation.failedContracts}</Pair><Pair label="Total workforce">{number(totalEmployees(state))}</Pair><Pair label="Forms processed by you">{number(state.manualPapers)}</Pair><Pair label="Operating time">{clock(state.elapsed)}</Pair><p className="hint">Forms sell at your retail price, constrained by demand. Contracts and franchises settle separately. Base payroll is $0.09 per employee per second, modified by policy and inherited metabolic support.</p></Section>{state.corporation.projects.includes('charter') && <Market state={state} />}</div><CompanyLog state={state} /></div>;
}

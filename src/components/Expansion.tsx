import { useState } from 'react';
import { cultivars, genes, type CultivarId } from '../game/catalog';
import type { Action } from '../game/engine';
import { branchCost, branchStaff, branchUpgradeCost, branchExpansionQuote, cohortCost, cohortQuote, cohortRate, cohortReplacementQuote, type Branch } from '../game/expansion';
import type { GameState } from '../game/state';
import { dollars, number, Pair, Section } from './ui';

type Props = { state: GameState; dispatch: (action: Action) => void };
function BranchOffice({ state, dispatch, branch }: Props & { branch: Branch }) {
  const [selected, setCultivar] = useState<CultivarId>(state.unlockedCultivars.at(-1) ?? 'generalist');
  const [batch, setBatch] = useState<'ten' | 'hundred' | 'fill'>('fill');
  const [confirm, setConfirm] = useState<{ index: number; action: 'transfer' | 'replace' } | null>(null);
  const cultivar = state.unlockedCultivars.includes(selected) ? selected : 'generalist';
  const staff = branchStaff(branch), quote = cohortQuote(branch, cultivar, state.cash);
  const count = batch === 'fill' ? quote.count : Math.min(batch === 'ten' ? 10 : 100, branch.level * 100 - staff);
  const cost = cohortCost(branch, cultivar, count), expansion = branchExpansionQuote(branch, state.cash);
  return <Section title={branch.name}><Pair label="Occupied cubicles">{staff} / {branch.level * 100}</Pair><Pair label="Base forms / s">{number(branch.cohorts.reduce((n, group) => n + cohortRate(state, group), 0))}</Pair>
    <label className="field-label">Recruitment profile<select value={cultivar} onChange={e => { const id = state.unlockedCultivars.find(id => id === e.target.value); if (id) setCultivar(id); }}>{state.unlockedCultivars.map(id => <option key={id} value={id}>{cultivars[id].name}</option>)}</select></label>
    <p className="hint">New hires: {state.genome.length ? state.genome.map(id => genes[id].name).join(' + ') : 'unmodified'}. Branch staff produce forms; departments are at headquarters. Existing cohorts keep their traits. Fill affordable can spend your cash reserve.</p>
    <div className="button-row batch-options">{(['ten', 'hundred', 'fill'] as const).map(value => <button key={value} aria-pressed={batch === value} onClick={() => setBatch(value)}>{value === 'ten' ? '10' : value === 'hundred' ? '100' : 'Fill affordable'}</button>)}</div>
    <button className="full split" disabled={count === 0 || state.cash < cost} onClick={() => dispatch({ type: 'cohort', branch: branch.id, cultivar, count })}><span>{count ? `Hire ${count}` : 'No affordable vacancies'}</span><span>{dollars(cost)}</span></button>
    {branch.level < 8 && <div className="button-row"><button disabled={state.cash < branchUpgradeCost(branch)} onClick={() => dispatch({ type: 'branch-upgrade', id: branch.id })}>+100 cubicles, {dollars(branchUpgradeCost(branch))}</button>{expansion.count > 1 && <button onClick={() => dispatch({ type: 'branch-upgrade', id: branch.id, count: expansion.count })}>+{expansion.count * 100}, {dollars(expansion.cost)}</button>}</div>}
    <details className="cohort-details"><summary>Inspect cohorts ({branch.cohorts.length})</summary>{branch.cohorts.map((group, index) => {
      const replacement = cohortReplacementQuote(branch, index, cultivar);
      const matches = group.cultivar === cultivar && group.genes.length === state.genome.length && group.genes.every(id => state.genome.includes(id));
      return <div className="cohort-record" key={index}><Pair label={`${group.count} ${cultivars[group.cultivar].name.toLowerCase()}s`}>{number(cohortRate(state, group))} forms/s</Pair><p className="hint">{group.genes.length ? group.genes.map(id => genes[id].name).join(', ') : 'Unmodified'}</p>
        {confirm?.index === index ? <><p className="hint">{confirm.action === 'replace' ? `Transfer this cohort and hire ${group.count} ${cultivars[cultivar].name.toLowerCase()}s with the current profile. Net cost ${dollars(replacement?.net ?? 0)}. Their previous traits leave with them.` : `Transfer the entire cohort for ${dollars(Math.floor(group.hiredCost * 0.4))}. These cubicles become vacant.`}</p><div className="button-row"><button disabled={confirm.action === 'replace' && (replacement === null || state.cash < replacement.net)} onClick={() => { dispatch(confirm.action === 'replace' ? { type: 'cohort-replace', branch: branch.id, index, cultivar } : { type: 'cohort-release', branch: branch.id, index }); setConfirm(null); }}>Confirm {confirm.action === 'replace' ? 'replacement' : 'transfer'}</button><button onClick={() => setConfirm(null)}>Keep cohort</button></div></> : <div className="button-row"><button className="text-button" onClick={() => setConfirm({ index, action: 'transfer' })}>Transfer cohort</button>{!matches && <button className="text-button" onClick={() => setConfirm({ index, action: 'replace' })}>Replace with current profile</button>}</div>}
      </div>;
    })}</details>
  </Section>;
}
export function Expansion({ state, dispatch }: Props) {
  const c = state.corporation;
  return <><div className="expansion-intro"><Section title="Branches"><p className="section-intro">Every branch shares supplies, equipment, and incentives. Hire in bulk. Cohorts keep their inherited profiles; replacement transfers the old people and hires new ones.</p><button disabled={c.branches.length >= 8 || state.cash < branchCost(state)} onClick={() => dispatch({ type: 'branch' })}>{c.branches.length >= 8 ? 'All branches established' : `Open a branch, ${dollars(branchCost(state))}`}</button></Section></div><div className="branch-grid">{c.branches.map(branch => <BranchOffice key={branch.id} branch={branch} state={state} dispatch={dispatch} />)}</div>{!c.branches.length && <p className="empty">Your first branch has room for 100 people.</p>}</>;
}

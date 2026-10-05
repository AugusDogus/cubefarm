import { useState } from 'react';
import { cultivars, genes, upgrades, type CultivarId, type UpgradeId } from '../game/catalog';
import { capacity, hireCost, hireQuote, memoBoost, MEMO_COST, upgradeCost, upgradeQuote, type Action } from '../game/engine';
import { demand, supplyCost } from '../game/economy';
import { totalEmployees } from '../game/expansion';
import { SupplyAutomation, DemandGrowth } from './OfficeGrowth';
import { discovery, memoVisible, upgradeVisible } from '../game/discovery';
import { expectedOutput, purchaseHint, memoRetailReturn } from '../game/balance';
import { normalizePrice } from '../game/price';
import type { GameState } from '../game/state';
import { dollars, number, Pair, Purchase, Section } from './ui';

type Props = { state: GameState; dispatch: (action: Action) => void };
export function Operations({ state, dispatch }: Props) {
  const [selected, setSelected] = useState<CultivarId>('generalist');
  const [batch, setBatch] = useState<'one' | 'five' | 'fill'>('one');
  const c = state.corporation, seen = discovery(state);
  const cultivar = state.unlockedCultivars.includes(selected) ? selected : 'generalist';
  const cost = hireCost(state, cultivar), full = state.employees.length >= capacity(state);
  const quote = hireQuote(state, cultivar, batch === 'one' ? 1 : batch === 'five' ? 5 : undefined);
  const personal = <><button data-testid="file" className="full primary-action" disabled={state.paused || state.manualCooldown > 0} onClick={() => dispatch({ type: 'process' })}><span>{c.blankForms < 1 ? 'File an emergency request' : 'File a form'}</span><span>{c.blankForms < 1 ? '+$1.25' : '1 form'}</span></button><p className="hint">{c.blankForms < 1 ? 'A supplied service form pays $1.25. These earnings are protected from payroll up to the cost of one supply pack, so you can always restock.' : 'Forms sell automatically. Hold Space to keep filing.'}</p></>;
  return <div className="operations">
    <Section title="Paperwork">
      {state.corporation.phase.id === 'office' ? personal : <details open={c.blankForms < 1}><summary>Personal filing</summary>{personal}</details>}
      {!c.supplierReliefUsed && totalEmployees(state) > 0 && c.blankForms < 1 && state.cash < supplyCost(state) && !['network', 'ending'].includes(c.phase.id) && <div className="supplier-relief"><button className="full" onClick={() => dispatch({ type: 'supplier-relief' })}>Claim 250 free blank forms</button><p className="hint">Supplier relief, once per company. Production can resume. Automate procurement to handle future orders.</p></div>}
      {!seen.business && <Pair label="Forms awaiting payment">{number(c.inventory)}</Pair>}
      {seen.business && <><Pair label="Blank forms">{number(c.blankForms)}</Pair><Pair label="Unsold forms">{number(c.inventory)}</Pair><Pair label="Production / s">{c.outputRate.toFixed(1)}</Pair><Pair label="Customer demand / s">{demand(state).toFixed(1)}</Pair>
        <RetailPrice key={c.price} state={state} dispatch={dispatch} />
        {!c.autoBuy && <button className="full split" disabled={state.cash < supplyCost(state)} onClick={() => dispatch({ type: 'supplies', packs: 1 })}><span>Buy 250 blank forms</span><span>{dollars(supplyCost(state))}</span></button>}
        {c.projects.includes('procurement') && <label className="routine-toggle"><input type="checkbox" checked={c.autoBuy} onChange={() => dispatch({ type: 'auto-buy' })} /> Order supplies automatically</label>}
        {c.blankForms < Math.max(20, expectedOutput(state) * 20) && !c.autoBuy && <p className="hint">Supplies are running low. Payroll continues when production stops.</p>}
        {!['network', 'ending'].includes(c.phase.id) && <><SupplyAutomation state={state} dispatch={dispatch} /><DemandGrowth state={state} dispatch={dispatch} /></>}
      </>}
    </Section>
    {seen.hiring && <Section title={state.nextId === 1 ? 'Your first employee' : 'Hiring'}>
      {seen.workforce && <Pair label="Headquarters cubicles">{state.employees.length} / {capacity(state)}</Pair>}
      {state.unlockedCultivars.length > 1 && <label className="field-label">Recruitment profile<select value={cultivar} onChange={event => { const id = state.unlockedCultivars.find(id => id === event.target.value); if (id) setSelected(id); }}>{state.unlockedCultivars.map(id => <option value={id} key={id}>{cultivars[id].name}</option>)}</select></label>}
      {c.projects.includes('charter') && <div className="button-row batch-options">{(['one', 'five', 'fill'] as const).map(value => <button key={value} aria-pressed={batch === value} onClick={() => setBatch(value)}>{value === 'one' ? '1' : value === 'five' ? '5' : 'Fill affordable'}</button>)}</div>}
      <button className="full split" disabled={full || quote.count === 0} onClick={() => dispatch({ type: 'hire', cultivar, count: quote.count })}><span>{full ? 'No vacant cubicles' : quote.count > 1 ? `Hire ${quote.count} employees` : 'Hire employee'}</span><span>{dollars(quote.count ? quote.cost : cost)}</span></button>
      <p className="hint">{state.nextId === 1 ? 'They file while you plan. $0.09/s payroll.' : seen.genetics ? `Future hires: ${state.genome.length ? state.genome.map(id => genes[id].name).join(' + ') : 'unmodified'}. Set the profile in Development.` : 'Each employee files automatically and receives $0.09/s payroll.'}</p>
      {seen.business && expectedOutput(state) >= demand(state) && <p className="hint">More hires add payroll without increasing customer demand. Expand demand through marketing or sales first.</p>}
    </Section>}
  </div>;
}

function RetailPrice({ state, dispatch }: Props) {
  const [price, setPrice] = useState(state.corporation.price);
  return <form className="price-control" onSubmit={event => { event.preventDefault(); dispatch({ type: 'price', value: price }); }}><label htmlFor="retail-price">Price / form, USD</label><div><input id="retail-price" type="number" min={0.01} step={0.01} required value={Number.isFinite(price) ? price : ''} onChange={event => setPrice(event.target.value === '' ? NaN : Number(event.target.value))} /><button disabled={normalizePrice(price) === null || normalizePrice(price) === state.corporation.price}>Set</button></div></form>;
}

export function UpgradeList({ state, dispatch, ids }: Props & { ids: readonly UpgradeId[] }) {
  const visible = ids.filter(id => upgradeVisible(state, id));
  if (!visible.length) return null;
  return <Section title="Office improvements">{visible.map(id => {
    const complete = state.upgrades[id] >= upgrades[id].max, quote = upgradeQuote(state, id);
    const cost = upgradeCost(state, id);
    const improved = { ...state, upgrades: { ...state.upgrades, [id]: state.upgrades[id] + 1 } };
    const description = id === 'equipment' && state.corporation.projects.includes('centralization') ? '+30% paperwork productivity per level with centralized systems.' : upgrades[id].description;
    return <div key={id}><Purchase name={upgrades[id].name} description={description} detail={`Level ${state.upgrades[id]}`} label={complete ? 'Complete' : `Improve, ${dollars(cost)}`} disabled={complete || state.cash < cost} onClick={() => dispatch({ type: 'upgrade', id })} />
      {!complete && id !== 'capacity' && id !== 'memo' && <p className="purchase-estimate">{purchaseHint(state, improved, cost)}</p>}
      {!complete && state.corporation.projects.includes('charter') && quote.count > 1 && <button className="text-button bulk-upgrade" onClick={() => dispatch({ type: 'upgrade', id, count: quote.count })}>Buy {quote.count} levels, {dollars(quote.cost)}</button>}
    </div>;
  })}</Section>;
}
export function Memo({ state, dispatch }: Props) {
  if (!memoVisible(state)) return null;
  const memo = state.memo;
  return <Section title="Internal memo"><p className="section-intro">Consolidate redundant workflows. +{Math.round(memoBoost(state) * 100)}% output for 90 seconds, followed by 90 seconds of quiet.</p>
    {memo.status === 'ready' && memoRetailReturn(state) <= 0 && <p className="hint">Retail sales cannot cover this memo at current demand. It may support an order, research, influence, or pressure relief.</p>}
    <button className="full split" disabled={memo.status !== 'ready' || state.cash < MEMO_COST} onClick={() => dispatch({ type: 'memo' })}><span>{memo.status === 'active' ? 'Memo in effect' : memo.status === 'cooldown' ? 'Next memo in' : 'Circulate memo'}</span><span>{memo.status === 'ready' ? dollars(MEMO_COST) : `${Math.ceil(memo.remaining)}s`}</span></button>
    {memo.status !== 'ready' && <progress aria-label={memo.status === 'active' ? 'Memo time remaining' : 'Memo cooldown remaining'} max={90} value={memo.remaining} />}
    <UpgradeList state={state} dispatch={dispatch} ids={['memo']} />
  </Section>;
}

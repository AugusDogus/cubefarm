import { cultivars, genes, facilities, type GeneId, type FacilityId } from '../game/catalog';
import type { Action } from '../game/engine';
import { discovery, cultivarVisible, geneVisible, facilityVisible } from '../game/discovery';
import { geneEffects } from '../game/genome';
import { purchaseHint } from '../game/balance';
import type { GameState } from '../game/state';
import { dollars, Pair, Purchase, Section } from './ui';

type Props = { state: GameState; dispatch: (action: Action) => void };
const cultivarIds = ['processor', 'specialist', 'executive'] as const;
const geneIds: readonly GeneId[] = ['focus', 'endurance', 'precision', 'cognition', 'synthesis'];
const facilityIds: readonly FacilityId[] = ['coffee', 'snacks', 'cafeteria', 'gym', 'benefits'];

export function Research({ state, dispatch }: Props) {
  const seen = discovery(state), effect = geneEffects(state.genome);
  const profiles = cultivarIds.filter(id => cultivarVisible(state, id));
  return <div className="research-layout">
    {profiles.length > 0 && <Section title={seen.genetics ? 'Employee cultivars' : 'Recruitment profiles'}><p className="section-intro">More capable applicants cost more to hire. Existing employees keep their original traits.</p>{profiles.map(id => {
      const cultivar = cultivars[id], unlocked = state.unlockedCultivars.includes(id);
      return <Purchase key={id} name={cultivar.name} description={`${seen.genetics ? cultivar.description : ({ processor: 'Efficient at repetitive work.', specialist: 'Careful and particularly effective in research.', executive: 'Experienced and particularly effective in sales.' })[id]} ${cultivar.rate.toFixed(2)} forms/s before aptitude and upgrades.`} detail={`Hire from ${dollars(cultivar.price)}`} label={unlocked ? 'Available' : `Recruit, ${dollars(cultivar.research)}`} disabled={unlocked || state.cash < cultivar.research} onClick={() => dispatch({ type: 'research-cultivar', id })} />;
    })}</Section>}
    {seen.genetics && <Section title="Inherited traits" aside={<span className="muted">Future hires only</span>}><p className="section-intro">Research as many traits as you like. Select at most two for new hires. Neither research nor selection changes existing people.</p>
      <div className="genome-preview"><h3>Next-hire profile, {state.genome.length}/2 slots</h3><p>{state.genome.length ? state.genome.map(id => genes[id].name).join(' + ') : 'Unmodified'}</p><Pair label="Output">{effect.output.toFixed(2)}×</Pair><Pair label="Research yield">{effect.research.toFixed(2)}×</Pair><Pair label="Payroll">{effect.wages.toFixed(2)}×</Pair></div>
      {geneIds.filter(id => geneVisible(state, id)).map(id => {
        const gene = genes[id], researched = state.genes.includes(id), selected = state.genome.includes(id);
        return <div className="gene-option" key={id}><Purchase name={gene.name} description={gene.description} detail={gene.requires.length ? `Research needs ${gene.requires.map(g => genes[g].name).join(' + ')}` : undefined} label={researched ? 'Researched' : `Research, ${dollars(gene.cost)}`} disabled={researched || state.cash < gene.cost} onClick={() => dispatch({ type: 'research-gene', id })} />
          {researched && <button aria-pressed={selected} disabled={!selected && state.genome.length >= 2} onClick={() => dispatch({ type: 'genome', genes: selected ? state.genome.filter(g => g !== id) : [...state.genome, id] })}>{selected ? 'Remove from hiring profile' : 'Select for future hires'}</button>}
        </div>;
      })}
    </Section>}
  </div>;
}
export function Facilities({ state, dispatch }: Props) {
  const visible = facilityIds.filter(id => facilityVisible(state, id));
  if (!visible.length) return null;
  return <Section title="Shared incentives">{visible.map(id => {
    const facility = facilities[id], owned = state.facilities.includes(id);
    return <div key={id}><Purchase name={facility.name} description={facility.description} label={owned ? 'Installed' : `Install, ${dollars(facility.cost)}`} disabled={owned || state.cash < facility.cost} onClick={() => dispatch({ type: 'facility', id })} />
      {!owned && <p className="purchase-estimate">{purchaseHint(state, { ...state, facilities: [...state.facilities, id] }, facility.cost)}</p>}
    </div>;
  })}</Section>;
}

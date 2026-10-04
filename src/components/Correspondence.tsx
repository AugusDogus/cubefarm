import { letters, pendingLetter, letterIds, correspondent } from '../game/story';
import type { GameState } from '../game/state';
import type { Action } from '../game/engine';

export function Correspondence({ state, dispatch }: { state: GameState; dispatch: (action: Action) => void }) {
  const id = pendingLetter(state);
  if (!id) return null;
  const letter = letters[id];
  const choice = id === 'promise' && state.story.promise === 'undecided' || id === 'cultivation' && state.story.cultivation === 'undecided';
  if (!choice && ['network', 'ending'].includes(state.corporation.phase.id)) return <details key={id} className="incoming-letter"><summary>New correspondence: {letter.subject}<span>{correspondent(state, id)}</span></summary><p>{letter.body}</p>{letter.from.startsWith('Robin') && !state.employees.some(e => e.id === 1) && <p className="hint">Robin continues the correspondence after leaving headquarters.</p>}<button className="text-button" onClick={() => dispatch({ type: 'read-letter', id })}>File this letter</button></details>;
  return <section className="correspondence" aria-labelledby="letter-subject">
    <div className="letter-heading"><h2 id="letter-subject">{letter.subject}</h2><span>{correspondent(state, id)}</span></div>
    <p>{letter.body}</p>
    {letter.from.startsWith('Robin') && !state.employees.some(e => e.id === 1) && <p className="hint">Robin left headquarters and continues to write on behalf of the workforce. The correspondence remains part of the company record.</p>}
    {choice ? <><p className="hint">This commitment is permanent for this company. Take your time.</p><div className="letter-choices">
      {id === 'promise' ? <><div><p><strong>A voice in the company</strong><br />+20% research. +8 target morale.</p><button onClick={() => dispatch({ type: 'reply', letter: 'promise', choice: 'voice' })}>Promise a voice</button></div><div><p><strong>A promise of performance</strong><br />+12% output. Pressure rises by 0.012/s.</p><button onClick={() => dispatch({ type: 'reply', letter: 'promise', choice: 'quota' })}>Promise higher targets</button></div></> : <><div><p><strong>People own their designs</strong><br />+20% research. No patent buyout if ownership is later shared.</p><button onClick={() => dispatch({ type: 'reply', letter: 'cultivation', choice: 'consent' })}>Protect employee ownership</button></div><div><p><strong>Retain company patents</strong><br />+10% output. Pressure rises by 0.015/s. Sharing ownership later requires a $250,000 buyout.</p><button onClick={() => dispatch({ type: 'reply', letter: 'cultivation', choice: 'patent' })}>Retain the patents</button></div></>}
    </div></> : <button className="text-button" onClick={() => dispatch({ type: 'read-letter', id })}>File this letter</button>}
  </section>;
}
export function CorrespondenceArchive({ state }: { state: GameState }) {
  const read = letterIds.filter(id => state.story.read.includes(id));
  return <details className="archive-section"><summary>Correspondence ({read.length})</summary>
    {state.story.promise !== 'undecided' && <p className="hint">First promise: {state.story.promise === 'voice' ? 'a voice in the company' : 'higher targets'}.{state.story.cultivation !== 'undecided' && ` Cultivation: ${state.story.cultivation}.`}</p>}
    {read.map(id => <details key={id} className="archived-letter"><summary>{letters[id].subject}</summary><p className="hint">{correspondent(state, id)}</p><p>{letters[id].body}</p></details>)}
  </details>;
}

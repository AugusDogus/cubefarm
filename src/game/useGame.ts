import { useCallback, useEffect, useRef, useState } from 'react';
import { act, advance, type Action } from './engine';
import { parseGame, initialState, type GameState } from './state';
import { loadGame, readSaveSnapshot, saveGameIfUnchanged } from './storage';

const browserStorage = {
  getItem: (key: string) => window.localStorage.getItem(key),
  setItem: (key: string, value: string) => window.localStorage.setItem(key, value),
};

export function useGame() {
  const [loaded] = useState(() => loadGame(browserStorage));
  const [state, setState] = useState(loaded.state);
  const current = useRef(state);
  const recovery = useRef(loaded.status === 'recovery');
  const snapshot = useRef(loaded.snapshot);
  const [notice, setNotice] = useState(loaded.notice);
  const [saveStatus, setSaveStatus] = useState('Not yet saved');
  const [uiRevision, setUiRevision] = useState(0);
  const replace = useCallback((next: GameState) => { current.current = next; setState(next); }, []);

  const save = useCallback(() => {
    if (recovery.current) { setSaveStatus('Original save preserved'); return { ok: false, message: 'Original save preserved' } as const; }
    const result = saveGameIfUnchanged(browserStorage, current.current, snapshot.current);
    if (result.ok) snapshot.current = { status: 'known', raw: result.raw };
    setSaveStatus(result.ok ? 'Saved locally' : 'Save unavailable');
    if (!result.ok) setNotice(result.message);
    return result;
  }, []);
  const dispatch = useCallback((action: Action) => {
    const result = act(current.current, action);
    if (result.ok) { replace(result.state); if (action.type === 'reincorporate') setUiRevision(value => value + 1); return true; }
    setNotice(result.message); return false;
  }, [replace]);

  useEffect(() => {
    let previous = Date.now();
    const tick = window.setInterval(() => {
      const now = Date.now();
      const seconds = Math.max(0, (now - previous) / 1000);
      previous = now;
      replace({ ...advance(current.current, seconds), lastSeen: now });
    }, 250);
    const autosave = window.setInterval(save, 5000);
    const onHide = () => { if (document.hidden) save(); };
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', onHide);
    return () => { clearInterval(tick); clearInterval(autosave); window.removeEventListener('pagehide', save); document.removeEventListener('visibilitychange', onHide); };
  }, [replace, save]);

  const reset = () => { recovery.current = false; snapshot.current = readSaveSnapshot(browserStorage); replace(initialState()); setUiRevision(value => value + 1); setNotice('A new company has been incorporated.'); save(); };
  const exportSave = () => {
    let content = JSON.stringify({ ...current.current, lastSeen: Date.now() }, null, 2);
    if (recovery.current) {
      if (snapshot.current.status === 'known' && snapshot.current.raw !== null) content = snapshot.current.raw;
      else { setNotice('The original save could not be accessed. Browser storage may be disabled.'); return; }
    }
    const url = URL.createObjectURL(new Blob([content], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = 'cube-farm-save.json'; link.click();
    URL.revokeObjectURL(url);
  };
  const importSave = async (file: File) => {
    if (file.size > 1_000_000) { setNotice('This save is too large. Choose a Cube Farm JSON save smaller than 1 MB. Your current game is unchanged.'); return; }
    let value: unknown;
    try { value = JSON.parse(await file.text()); }
    catch { setNotice('This file is not readable JSON. Choose an exported Cube Farm save. Your current game is unchanged.'); return; }
    const parsed = parseGame(value);
    if (!parsed.success) { setNotice('This file is not a valid Cube Farm save. Your current game is unchanged.'); return; }
    recovery.current = false;
    snapshot.current = readSaveSnapshot(browserStorage);
    replace({ ...parsed.data, lastSeen: Date.now() });
    setUiRevision(value => value + 1);
    const result = save();
    setNotice(result.ok ? 'Save imported. Welcome back to the office.' : `The imported company is running in this tab but could not be saved. ${result.message}`);
  };
  return { state, uiRevision, dispatch, notice, dismissNotice: () => setNotice(null), save, saveStatus, reset, exportSave, importSave };
}

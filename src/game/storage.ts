import { advance } from './engine';
import { GameSchema, parseGame, initialState, type GameState } from './state';
import { z } from 'zod';

export const SAVE_KEY = 'cube-farm:save:v1';
export type SaveSnapshot = { status: 'known'; raw: string | null } | { status: 'unavailable' };
export type LoadedGame = ({ status: 'ready'; state: GameState; notice: string | null } | { status: 'recovery'; state: GameState; notice: string }) & { snapshot: SaveSnapshot };
export type SaveResult = { ok: true; raw: string } | { ok: false; message: string };

export function readSaveSnapshot(storage: Pick<Storage, 'getItem'>): SaveSnapshot {
  try { return { status: 'known', raw: storage.getItem(SAVE_KEY) }; }
  catch { return { status: 'unavailable' }; }
}

export function loadGame(storage: Pick<Storage, 'getItem'>, now = Date.now()): LoadedGame {
  const snapshot = readSaveSnapshot(storage);
  if (snapshot.status === 'unavailable') return { status: 'ready', state: initialState(now), snapshot, notice: 'Browser storage is unavailable. Keep this tab open and export a save before leaving.' };
  const raw = snapshot.raw;
  if (raw === null) return { status: 'ready', state: initialState(now), snapshot, notice: null };
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch { return { status: 'recovery', state: initialState(now), snapshot, notice: 'Your saved game could not be read. The original save is preserved. Export it or start a new company in Settings.' }; }
  const parsed = parseGame(value);
  if (!parsed.success) return { status: 'recovery', state: initialState(now), snapshot, notice: 'Your saved game has invalid data. The original save is preserved. Export it or start a new company in Settings.' };
  const migrated = z.object({ version: z.union([z.literal(1), z.literal(2)]) }).safeParse(value).success;
  const seconds = Math.min(7200, Math.max(0, (now - parsed.data.lastSeen) / 1000));
  const state = { ...advance(parsed.data, seconds), lastSeen: now };
  const earned = state.cash - parsed.data.cash;
  const offlineNotice = seconds > 30 && !state.paused ? `Welcome back. Your cash balance changed by $${earned.toFixed(2)} while you were away (up to 2 hours).` : null;
  return { status: 'ready', state, snapshot, notice: migrated ? `Your company has been updated. Funds and employee traits are preserved. Existing workers keep their profiles; select traits for future hires in Development.${offlineNotice ? ` ${offlineNotice}` : ''}` : offlineNotice };
}

export function saveGame(storage: Pick<Storage, 'setItem'>, state: GameState, now = Date.now()): SaveResult {
  if (!GameSchema.safeParse({ ...state, lastSeen: now }).success) return { ok: false, message: 'This game contains invalid data and could not be saved. The previous save is preserved. Export this session from Settings before closing it.' };
  try { const raw = JSON.stringify({ ...state, lastSeen: now }); storage.setItem(SAVE_KEY, raw); return { ok: true, raw }; }
  catch { return { ok: false, message: 'Your game could not be saved in this browser. Progress is still in this tab. Export a save from Settings before closing it.' }; }
}

/** Detect sequential stale writes. localStorage read/write is not an atomic lock. */
export function saveGameIfUnchanged(storage: Pick<Storage, 'getItem' | 'setItem'>, state: GameState, expected: SaveSnapshot, now = Date.now()): SaveResult {
  const current = readSaveSnapshot(storage);
  if (expected.status === 'unavailable' || current.status === 'unavailable') return { ok: false, message: 'The existing browser save could not be checked. It will not be overwritten. Your company is still running in this tab. Export a save from Settings before closing it.' };
  if (current.raw !== expected.raw) return { ok: false, message: 'Another tab changed this browser’s save. This tab will not overwrite it. Your company is still running here. Export it from Settings before reloading.' };
  return saveGame(storage, state, now);
}

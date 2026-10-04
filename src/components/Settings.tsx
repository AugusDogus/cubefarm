import { useEffect, useRef, useState } from 'react';

export function Settings({ close, save, saveStatus, reset, exportSave, importSave, sound, setSound, soundNotice }: { close: () => void; save: () => void; saveStatus: string; reset: () => void; exportSave: () => void; importSave: (file: File) => Promise<void>; sound: boolean; setSound: (value: boolean) => void; soundNotice: string | null }) {
  const dialog = useRef<HTMLDialogElement>(null), input = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  useEffect(() => { dialog.current?.showModal(); }, []);
  return <dialog ref={dialog} onClose={close} onClick={event => { if (event.target === dialog.current) close(); }} aria-labelledby="settings-title"><div className="dialog-inner"><div className="section-heading"><h2 id="settings-title">Company settings</h2><button className="text-button" onClick={close}>Close</button></div>
    <p>Your company saves to this browser every five seconds. It keeps working while you are away, for up to two hours.</p>
    <div className="button-row"><button onClick={save}>Save now</button><span className="muted">{saveStatus}</span></div>
    <section className="dialog-section"><h3>Quiet office sounds</h3><p>Soft stamps, hires, and purchase tones. Off by default.</p><label><input type="checkbox" checked={sound} onChange={e => setSound(e.target.checked)} /> Enable sound</label>{soundNotice && <p role="status">{soundNotice}</p>}</section>
    <section className="dialog-section"><h3>Save files</h3><p>Export a backup to move your company to another browser.</p><div className="button-row"><button onClick={exportSave}>Export save</button><button onClick={() => input.current?.click()}>Import save</button><input ref={input} hidden type="file" accept=".json,application/json" onChange={event => { const file = event.target.files?.[0]; if (file) setImportFile(file); event.target.value = ''; }} /></div>
      {importFile && <div className="confirm-release"><p>Replace this company with {importFile.name}? Export your current save first to keep a backup.</p><div className="button-row"><button onClick={() => { void importSave(importFile); setImportFile(null); close(); }}>Confirm import</button><button onClick={() => setImportFile(null)}>Cancel</button></div></div>}
    </section>
    <section className="dialog-section"><h3>Start over</h3><p>Start with an empty cubicle and $0.</p>{confirmReset ? <div><p>This deletes this browser’s saved progress. Export a backup to keep it.</p><div className="button-row"><button onClick={() => { reset(); close(); }}>Delete progress & start over</button><button onClick={() => setConfirmReset(false)}>Cancel</button></div></div> : <button onClick={() => setConfirmReset(true)}>Start a new company</button>}</section>
    <p className="hint">Hairline artwork powered by <a href="https://hairline.lucasmarkes.com/figures" target="_blank" rel="noreferrer">Lucas Marques’s Hairline</a>. New office figures made for Cube Farm.</p>
  </div></dialog>;
}

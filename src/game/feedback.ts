import { useCallback, useRef, useState } from 'react';

type Cue = 'file' | 'hire' | 'purchase' | 'letter';
function preference() {
  try { return { enabled: localStorage.getItem('cube-farm:sound') === 'on', notice: null }; }
  catch { return { enabled: false, notice: 'Sound preferences cannot be saved in this browser.' }; }
}
export function useFeedback() {
  const [initial] = useState(preference);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [notice, setNotice] = useState<string | null>(initial.notice);
  const context = useRef<AudioContext | null>(null);
  const play = useCallback((cue: Cue, force = false) => {
    if (!enabled && !force) return;
    try {
      const audio = context.current ?? new AudioContext();
      context.current = audio;
      if (audio.state === 'suspended') void audio.resume().catch(() => setNotice('Audio could not start. Try enabling sound again.'));
      const now = audio.currentTime;
      const frequencies = cue === 'file' ? [150] : cue === 'hire' ? [330, 440] : cue === 'letter' ? [440, 660] : [240, 360];
      frequencies.forEach((frequency, i) => {
        const oscillator = audio.createOscillator(), gain = audio.createGain();
        oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(frequency, now);
        const start = now + i * 0.045;
        gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(0.025, start + 0.004); gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.075);
        oscillator.connect(gain); gain.connect(audio.destination); oscillator.start(start); oscillator.stop(start + 0.08);
        oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
      });
    } catch { setNotice('Sound is unavailable in this browser. The game will continue silently.'); setEnabled(false); }
  }, [enabled]);
  const toggle = (value: boolean) => {
    setEnabled(value); setNotice(null);
    try { localStorage.setItem('cube-farm:sound', value ? 'on' : 'off'); }
    catch { setNotice('Sound works for this session, but the preference could not be saved.'); }
    if (value) play('file', true);
  };
  return { enabled, toggle, play, notice };
}

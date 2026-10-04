import { useEffect, useRef } from 'react';

export type HairlineSimulation =
  | { kind: 'office'; running: boolean; time: number; queue: number }
  | { kind: 'network'; running: boolean; time: number; nodes: number; discovery: number; clearance: number; replication: number; coordination: number; lost: number; commissioned: number }
  | { kind: 'ending'; ending: 'commons' | 'monopoly' };
type FigureHandle = { set: (value: number) => void; setPaperwork?: (forms: number) => void; setWorkers?: (workers: readonly string[]) => void; setSimulation?: (simulation: HairlineSimulation) => void; destroy: () => void };
type Figure = { mount: (context: { stage: HTMLElement; svg: SVGSVGElement; read: HTMLElement }, value: number) => FigureHandle };
declare global {
  interface Window { cubeFarmFigures: Record<string, Figure | undefined> }
}

export function Hairline({ name, value, label, paperwork = 0, workers, simulation }: { name: 'cubicles' | 'tower' | 'campus'; value: number; label: string; paperwork?: number; workers?: readonly string[]; simulation?: HairlineSimulation }) {
  const stage = useRef<HTMLDivElement>(null), svg = useRef<SVGSVGElement>(null), read = useRef<HTMLSpanElement>(null);
  const handle = useRef<FigureHandle | null>(null), initialValue = useRef(value);
  useEffect(() => {
    const figure = window.cubeFarmFigures[name];
    if (!figure || !stage.current || !svg.current || !read.current) return;
    const mounted = figure.mount({ stage: stage.current, svg: svg.current, read: read.current }, initialValue.current);
    handle.current = mounted;
    return () => { mounted.destroy(); handle.current = null; };
  }, [name]);
  useEffect(() => { initialValue.current = value; handle.current?.set(value); }, [value, name]);
  useEffect(() => { handle.current?.setPaperwork?.(paperwork); }, [paperwork, name]);
  useEffect(() => { if (workers) handle.current?.setWorkers?.(workers); }, [workers, name]);
  useEffect(() => { if (simulation) handle.current?.setSimulation?.(simulation); }, [simulation, name]);
  return <div className="hairline-stage" ref={stage} role="img" aria-label={label} data-world={name} data-simulation={simulation?.kind} data-running={simulation && simulation.kind !== 'ending' ? simulation.running : false} data-queue={simulation?.kind === 'office' ? simulation.queue : undefined} data-ending={simulation?.kind === 'ending' ? simulation.ending : undefined}><svg ref={svg} viewBox="0 0 400 320" aria-hidden="true" /><span className="figure-read" ref={read}>rest</span></div>;
}

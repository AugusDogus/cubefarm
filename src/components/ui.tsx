import type { ReactNode } from 'react';

export const dollars = (value: number, cents = false) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: cents ? 2 : 0, minimumFractionDigits: cents ? 2 : 0 }).format(value);
export const compactDollars = (value: number) => Math.abs(value) >= 100000 ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 2 }).format(value) : dollars(value, true);
export const number = (value: number) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);
export const percent = (value: number) => `${(value * 100).toFixed(1)}%`;
export const clock = (seconds: number) => `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(Math.floor(seconds) % 60).padStart(2, '0')}`;

export function Section({ title, aside, children, className = '' }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`section ${className}`}><div className="section-heading"><h2>{title}</h2>{aside}</div>{children}</section>;
}
export function Pair({ label, children }: { label: string; children: ReactNode }) { return <div className="pair"><span>{label}</span><span className="numeric">{children}</span></div>; }
export function Purchase({ name, description, label, disabled, onClick, detail }: { name: string; description: string; label: string; disabled: boolean; onClick: () => void; detail?: string }) {
  return <div className="purchase"><div className="purchase-top"><h3>{name}</h3>{detail && <span className="muted numeric">{detail}</span>}</div><p>{description}</p><button disabled={disabled} onClick={onClick}>{label}</button></div>;
}

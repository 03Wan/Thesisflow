import type { ReactNode } from "react";
import { ChevronRight, RotateCw } from "lucide-react";

export function ViewShell({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`view-shell ${className}`.trim()}>{children}</section>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return <header className="view-page-header"><div><p>{eyebrow}</p><h1>{title}</h1><span>{description}</span></div>{actions ? <div className="view-header-actions">{actions}</div> : null}</header>;
}

export function SectionCard({ title, description, actions, children }: { title: string; description?: string; actions?: ReactNode; children: ReactNode }) {
  return <section className="view-section-card"><header><div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>{actions ? <div>{actions}</div> : null}</header>{children}</section>;
}

export function DetailTabs({ items, active, onChange }: { items: readonly string[]; active: string; onChange: (item: string) => void }) {
  return <nav className="detail-tabs" aria-label="页面内容标签">{items.map((item) => <button className={item === active ? "active" : ""} key={item} onClick={() => onChange(item)}>{item}</button>)}</nav>;
}

export function RetryAction({ onRetry, label = "重试" }: { onRetry: () => void; label?: string }) {
  return <button className="view-secondary-action" onClick={onRetry}><RotateCw size={14} />{label}</button>;
}

export function NavigateAction({ label, onClick, primary = false }: { label: string; onClick: () => void; primary?: boolean }) {
  return <button className={primary ? "view-primary-action" : "view-secondary-action"} onClick={onClick}>{label}<ChevronRight size={14} /></button>;
}

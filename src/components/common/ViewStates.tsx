import { AlertTriangle, DatabaseZap, LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { RetryAction } from "@/components/common/ViewShell";

export function LoadingSkeleton({ label = "正在加载真实项目数据…" }: { label?: string }) {
  return <section className="view-state view-loading" role="status" aria-label={label}><LoaderCircle size={20} /><div><b>{label}</b><span>正在读取本地项目记录，页面结构会在数据可用后保留。</span></div><i /><i /><i /></section>;
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <section className="view-state view-empty" aria-label={title}><DatabaseZap size={22} /><div><h2>{title}</h2><p>{description}</p></div>{action}</section>;
}

export function ErrorState({ title = "无法加载页面数据", message, onRetry }: { title?: string; message: string; onRetry: () => void }) {
  return <section className="view-state view-error" role="alert" aria-label={title}><AlertTriangle size={22} /><div><h2>{title}</h2><p>{message}</p></div><RetryAction onRetry={onRetry} /></section>;
}

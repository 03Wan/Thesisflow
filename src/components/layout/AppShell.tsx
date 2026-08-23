import { PanelRightOpen } from "lucide-react";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { AIContextPanel } from "./AIContextPanel";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function AppShell({ children, showAiPanel = true }: { children: ReactNode; showAiPanel?: boolean }) {
  const isAiPanelOpen = useWorkspaceStore((state) => state.isAiPanelOpen);
  const setOpen = useWorkspaceStore((state) => state.setAiPanelOpen);
  return <div className="app-shell"><Sidebar /><div className="app-frame"><Topbar /><div className="workspace-row"><main className="workspace-main">{children}</main>{showAiPanel && (isAiPanelOpen ? <AIContextPanel /> : <button className="ai-rail" onClick={() => setOpen(true)} aria-label="展开 AI 上下文"><PanelRightOpen size={17} /></button>)}</div></div></div>;
}

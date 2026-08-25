import { PanelRightOpen } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { AIContextPanel } from "./AIContextPanel";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useProjectStore } from "@/stores/project-store";
import { ProjectRequiredState } from "@/components/common/ProjectRequiredState";
import { DataEmptyState } from "@/components/common/DataEmptyState";

const projectOptionalRoutes = new Set(["/overview", "/projects", "/settings"]);
const awaitingRealDataRoutes = new Set([
  "/translation", "/midterm", "/calendar", "/implementation", "/outline", "/writing",
  "/compliance", "/advisor-review", "/reviewer-review", "/version-history", "/finalization", "/plagiarism",
  "/teacher-review", "/sampling", "/defense-prep", "/mock-defense", "/defense",
  "/post-defense-revision", "/final-manuscript", "/archive",
]);

export function AppShell({ children, showAiPanel = true }: { children: ReactNode; showAiPanel?: boolean }) {
  const location = useLocation();
  const isAiPanelOpen = useWorkspaceStore((state) => state.isAiPanelOpen);
  const setOpen = useWorkspaceStore((state) => state.setAiPanelOpen);
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];
  useEffect(() => {
    document.documentElement.dataset.theme = window.localStorage.getItem("thesisflow/theme") ?? "light";
  }, []);
  const needsProject = !projectOptionalRoutes.has(location.pathname) && !activeProject;
  const awaitingRealData = awaitingRealDataRoutes.has(location.pathname);
  const content = needsProject
    ? <ProjectRequiredState title="请先打开论文项目" description="工作台不再使用演示数据填充页面；创建或打开项目后才能读取真实记录。" />
    : awaitingRealData
      ? <DataEmptyState title="暂无真实项目数据" description="此功能原有的示例记录已移除；待接入真实文件或业务记录后显示。" />
      : children;
  const showContextPanel = showAiPanel && !needsProject && !awaitingRealData;
  return <div className="app-shell"><Sidebar /><div className="app-frame"><Topbar /><div className="workspace-row"><main className="workspace-main">{content}</main>{showContextPanel && (isAiPanelOpen ? <AIContextPanel /> : <button className="ai-rail" onClick={() => setOpen(true)} aria-label="展开 AI 上下文"><PanelRightOpen size={17} /></button>)}</div></div></div>;
}

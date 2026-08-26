import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { CommandPalette } from "@/components/overlays/CommandPalette";
import { OverviewPage } from "@/features/overview/OverviewPage";
import { LiteraturePage } from "@/features/literature/LiteraturePage";
import { ProposalDesignPage } from "@/features/research/ProposalDesignPage";
import { TaskManagerPage } from "@/features/revision/TaskManagerPage";
import { AdvisorSessionsPage } from "@/features/revision/AdvisorSessionsPage";
import { RequirementsPage } from "@/features/foundation/RequirementsPage";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { FilesPage } from "@/features/files/FilesPage";
import { WorkspacePage } from "@/features/workspace/WorkspacePage";
import { SettingsPage } from "@/features/settings/SettingsPage";
import { defaultWorkspaceRoute } from "@/lib/workspace-preferences";

export const appRoutes = [
  ["/overview", "项目总览"],
  ["/projects", "项目"],
  ["/requirements", "论文要求"],
  ["/topic", "选题"],
  ["/task-book", "任务书"],
  ["/literature", "文献研究"],
  ["/proposal", "开题报告"],
  ["/research-design", "研究设计"],
  ["/implementation", "研究实施"],
  ["/outline", "论文大纲"],
  ["/writing", "正文写作"],
  ["/translation", "外文翻译"],
  ["/midterm", "中期检查"],
  ["/revisions", "修改任务"],
  ["/guidance", "导师指导"],
  ["/finalization", "论文定稿"],
  ["/compliance", "全文检测"],
  ["/advisor-review", "引用核验"],
  ["/reviewer-review", "格式检查"],
  ["/version-history", "版本历史"],
  ["/sampling", "论文抽检"],
  ["/teacher-review", "教师评阅"],
  ["/plagiarism", "查重记录"],
  ["/defense-prep", "答辩准备"],
  ["/mock-defense", "模拟答辩"],
  ["/defense", "答辩记录"],
  ["/post-defense-revision", "答辩后修改"],
  ["/final-manuscript", "最终稿"],
  ["/archive", "材料归档"],
  ["/files", "文件中心"],
  ["/calendar", "节点日历"],
  ["/settings", "设置"],
] as const;

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to={defaultWorkspaceRoute()} replace />} />
        <Route
          path="/overview"
          element={
            <AppShell>
              <OverviewPage />
            </AppShell>
          }
        />
        <Route
          path="/projects"
          element={
            <AppShell showAiPanel={false}>
              <ProjectsPage />
            </AppShell>
          }
        />
        <Route
          path="/requirements"
          element={
            <AppShell>
              <RequirementsPage />
            </AppShell>
          }
        />
        <Route
          path="/topic"
          element={
            <AppShell>
              <WorkspacePage kind="topic" />
            </AppShell>
          }
        />
        <Route
          path="/task-book"
          element={
            <AppShell>
              <WorkspacePage kind="task-book" />
            </AppShell>
          }
        />
        <Route
          path="/translation"
          element={
            <AppShell>
              <WorkspacePage kind="translation" />
            </AppShell>
          }
        />
        <Route
          path="/midterm"
          element={
            <AppShell>
              <WorkspacePage kind="midterm" />
            </AppShell>
          }
        />
        <Route
          path="/reviewer-review"
          element={
            <AppShell>
              <WorkspacePage kind="format" />
            </AppShell>
          }
        />
        <Route
          path="/files"
          element={
            <AppShell showAiPanel={false}>
              <FilesPage />
            </AppShell>
          }
        />
        <Route
          path="/calendar"
          element={
            <AppShell>
              <WorkspacePage kind="calendar" />
            </AppShell>
          }
        />
        <Route
          path="/settings"
          element={
            <AppShell showAiPanel={false}>
              <SettingsPage />
            </AppShell>
          }
        />
        <Route
          path="/literature"
          element={
            <AppShell showAiPanel={false}>
              <LiteraturePage />
            </AppShell>
          }
        />
        <Route
          path="/proposal"
          element={
            <AppShell>
              <ProposalDesignPage mode="proposal" />
            </AppShell>
          }
        />
        <Route
          path="/research-design"
          element={
            <AppShell>
              <ProposalDesignPage mode="design" />
            </AppShell>
          }
        />
        <Route
          path="/implementation"
          element={
            <AppShell>
              <WorkspacePage kind="implementation" />
            </AppShell>
          }
        />
        <Route
          path="/outline"
          element={
            <AppShell>
              <WorkspacePage kind="outline" />
            </AppShell>
          }
        />
        <Route
          path="/writing"
          element={
            <AppShell showAiPanel={false}>
              <WorkspacePage kind="writing" />
            </AppShell>
          }
        />
        <Route
          path="/guidance"
          element={
            <AppShell showAiPanel={false}>
              <AdvisorSessionsPage />
            </AppShell>
          }
        />
        <Route
          path="/revisions"
          element={
            <AppShell>
              <TaskManagerPage />
            </AppShell>
          }
        />
        <Route
          path="/compliance"
          element={
            <AppShell>
              <WorkspacePage kind="compliance" />
            </AppShell>
          }
        />
        <Route
          path="/advisor-review"
          element={
            <AppShell>
              <WorkspacePage kind="citation" />
            </AppShell>
          }
        />
        <Route
          path="/version-history"
          element={
            <AppShell>
              <WorkspacePage kind="versions" />
            </AppShell>
          }
        />
        <Route
          path="/finalization"
          element={
            <AppShell>
              <WorkspacePage kind="finalization" />
            </AppShell>
          }
        />
        <Route
          path="/plagiarism"
          element={
            <AppShell>
              <WorkspacePage kind="plagiarism" />
            </AppShell>
          }
        />
        <Route
          path="/teacher-review"
          element={
            <AppShell showAiPanel={false}>
              <WorkspacePage kind="teacher-review" />
            </AppShell>
          }
        />
        <Route
          path="/sampling"
          element={
            <AppShell>
              <WorkspacePage kind="sampling" />
            </AppShell>
          }
        />
        <Route
          path="/defense-prep"
          element={
            <AppShell>
              <WorkspacePage kind="defense-prep" />
            </AppShell>
          }
        />
        <Route
          path="/mock-defense"
          element={
            <AppShell>
              <WorkspacePage kind="mock-defense" />
            </AppShell>
          }
        />
        <Route
          path="/defense"
          element={
            <AppShell>
              <WorkspacePage kind="defense" />
            </AppShell>
          }
        />
        <Route
          path="/post-defense-revision"
          element={
            <AppShell>
              <WorkspacePage kind="post-defense" />
            </AppShell>
          }
        />
        <Route
          path="/final-manuscript"
          element={
            <AppShell>
              <WorkspacePage kind="final-manuscript" />
            </AppShell>
          }
        />
        <Route
          path="/archive"
          element={
            <AppShell>
              <WorkspacePage kind="archive" />
            </AppShell>
          }
        />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
      <CommandPalette />
    </>
  );
}

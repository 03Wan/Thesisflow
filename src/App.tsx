import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { CommandPalette } from "@/components/overlays/CommandPalette";
import { OverviewPage } from "@/features/overview/OverviewPage";
import { LiteraturePage } from "@/features/literature/LiteraturePage";
import { ProposalDesignPage } from "@/features/research/ProposalDesignPage";
import {
  DataResearchPage,
  OutlinePage,
} from "@/features/work/DataOutlinePages";
import { WritingPage } from "@/features/writing/WritingPage";
import {
  CitationVerificationPage,
  FormatCheckPage,
  IntelligenceReviewPage,
  VersionPage,
} from "@/features/revision/RevisionPages";
import { TaskManagerPage } from "@/features/revision/TaskManagerPage";
import { AdvisorSessionsPage } from "@/features/revision/AdvisorSessionsPage";
import {
  FinalizationPage,
  PlagiarismPage,
  SamplingPage,
  TeacherReviewPage,
} from "@/features/final/FinalPages";
import {
  ArchivePage,
  DefensePreparationPage,
  DefenseRecordPage,
  FinalManuscriptPage,
  MockDefensePage,
  PostDefenseRevisionPage,
} from "@/features/defense/DefensePages";
import { FoundationPage } from "@/features/foundation/FoundationPages";
import { ProjectsPage } from "@/features/projects/ProjectsPage";
import { FilesPage } from "@/features/files/FilesPage";

export const appRoutes = [
  ["/overview", "项目总览"],
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
  ["/sampling", "论文抽检"],
  ["/teacher-review", "教师评阅"],
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

function RoutePlaceholder({ title }: { title: string }) {
  const location = useLocation();
  const showAiPanel = !["/settings", "/archive", "/files"].includes(
    location.pathname,
  );
  return (
    <AppShell showAiPanel={showAiPanel}>
      <section className="page-header">
        <div>
          <p className="eyebrow">ThesisFlow / 工作台</p>
          <h1>{title}</h1>
          <p>当前处于工作上下文。业务内容将在后续阶段接入。</p>
        </div>
      </section>
    </AppShell>
  );
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
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
              <FoundationPage kind="requirements" />
            </AppShell>
          }
        />
        <Route
          path="/topic"
          element={
            <AppShell>
              <FoundationPage kind="topic" />
            </AppShell>
          }
        />
        <Route
          path="/task-book"
          element={
            <AppShell>
              <FoundationPage kind="task" />
            </AppShell>
          }
        />
        <Route
          path="/translation"
          element={
            <AppShell>
              <FoundationPage kind="translation" />
            </AppShell>
          }
        />
        <Route
          path="/midterm"
          element={
            <AppShell>
              <FoundationPage kind="midterm" />
            </AppShell>
          }
        />
        <Route
          path="/reviewer-review"
          element={
            <AppShell>
              <FormatCheckPage />
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
              <FoundationPage kind="calendar" />
            </AppShell>
          }
        />
        <Route
          path="/settings"
          element={
            <AppShell showAiPanel={false}>
              <FoundationPage kind="settings" />
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
              <DataResearchPage />
            </AppShell>
          }
        />
        <Route
          path="/outline"
          element={
            <AppShell>
              <OutlinePage />
            </AppShell>
          }
        />
        <Route
          path="/writing"
          element={
            <AppShell showAiPanel={false}>
              <WritingPage />
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
              <IntelligenceReviewPage />
            </AppShell>
          }
        />
        <Route
          path="/advisor-review"
          element={
            <AppShell>
              <CitationVerificationPage />
            </AppShell>
          }
        />
        <Route
          path="/version-history"
          element={
            <AppShell>
              <VersionPage />
            </AppShell>
          }
        />
        <Route
          path="/finalization"
          element={
            <AppShell>
              <FinalizationPage />
            </AppShell>
          }
        />
        <Route
          path="/plagiarism"
          element={
            <AppShell>
              <PlagiarismPage />
            </AppShell>
          }
        />
        <Route
          path="/teacher-review"
          element={
            <AppShell showAiPanel={false}>
              <TeacherReviewPage />
            </AppShell>
          }
        />
        <Route
          path="/sampling"
          element={
            <AppShell>
              <SamplingPage />
            </AppShell>
          }
        />
        <Route
          path="/defense-prep"
          element={
            <AppShell>
              <DefensePreparationPage />
            </AppShell>
          }
        />
        <Route
          path="/mock-defense"
          element={
            <AppShell>
              <MockDefensePage />
            </AppShell>
          }
        />
        <Route
          path="/defense"
          element={
            <AppShell>
              <DefenseRecordPage />
            </AppShell>
          }
        />
        <Route
          path="/post-defense-revision"
          element={
            <AppShell>
              <PostDefenseRevisionPage />
            </AppShell>
          }
        />
        <Route
          path="/final-manuscript"
          element={
            <AppShell>
              <FinalManuscriptPage />
            </AppShell>
          }
        />
        <Route
          path="/archive"
          element={
            <AppShell>
              <ArchivePage />
            </AppShell>
          }
        />
        <Route path="*" element={<Navigate to="/overview" replace />} />
      </Routes>
      <CommandPalette />
    </>
  );
}

import { useEffect, useState } from "react";
import { FilePlus2, ListPlus, Settings2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/ViewStates";
import { DetailTabs, NavigateAction, PageHeader, SectionCard, ViewShell } from "@/components/common/ViewShell";
import { ProjectRequiredState } from "@/components/common/ProjectRequiredState";
import { useFileStore } from "@/stores/file-store";
import { useProjectStore } from "@/stores/project-store";
import { useRequirementStore } from "@/stores/requirement-store";
import { useTaskStore } from "@/stores/task-store";
import { useWorkflowStore } from "@/stores/workflow-store";
import { parseResearchMethods, type ResearchMethod } from "@/lib/research-methods";
import { CATEGORY_LABELS } from "@/lib/file-category";
import type { ProjectFile, ProjectFileCategory } from "@/types/domain";
import "./workspace-page.css";

export type WorkspaceKind = "topic" | "task-book" | "translation" | "midterm" | "calendar" | "implementation" | "outline" | "writing" | "compliance" | "citation" | "format" | "versions" | "finalization" | "plagiarism" | "teacher-review" | "sampling" | "defense-prep" | "mock-defense" | "defense" | "post-defense" | "final-manuscript" | "archive";

export type WorkspaceTemplate = { eyebrow: string; title: string; description: string; tabs: readonly string[]; primary: { label: string; to: string }; secondary: { label: string; to: string }; source: "template" | "recommendation" };

export const workspaceTemplates: Record<WorkspaceKind, WorkspaceTemplate> = {
  topic: { eyebrow: "准备阶段 / 学生选题", title: "选题", description: "从当前项目、已确认要求和真实材料开始记录选题，不预填研究结论。", tabs: ["项目信息", "材料槽位", "关联任务"], primary: { label: "导入选题材料", to: "/files" }, secondary: { label: "创建选题任务", to: "/revisions" }, source: "template" },
  "task-book": { eyebrow: "准备阶段 / 任务书", title: "任务书", description: "学生归档和核对任务书来源文件；不在系统内模拟导师下达或审核。", tabs: ["来源文件", "核对槽位", "关联任务"], primary: { label: "导入任务书", to: "/files" }, secondary: { label: "创建核对任务", to: "/revisions" }, source: "template" },
  translation: { eyebrow: "写作阶段 / 外文翻译", title: "外文翻译", description: "关联已导入的原文与译文文件，记录学生的完成情况。", tabs: ["文件", "内容槽位", "自检"], primary: { label: "导入翻译文件", to: "/files" }, secondary: { label: "创建修改任务", to: "/revisions" }, source: "template" },
  midterm: { eyebrow: "写作阶段 / 中期检查", title: "中期检查", description: "以当前项目、文件、任务与已确认要求为基础整理学生自检材料。", tabs: ["材料", "进度", "自检"], primary: { label: "导入检查材料", to: "/files" }, secondary: { label: "管理修改任务", to: "/revisions" }, source: "template" },
  calendar: { eyebrow: "项目管理 / 时间线", title: "节点日历", description: "仅显示当前项目工作流与经学生核对的规则 deadline。", tabs: ["时间线", "关联任务", "规则来源"], primary: { label: "核对论文要求", to: "/requirements" }, secondary: { label: "管理任务", to: "/revisions" }, source: "template" },
  implementation: { eyebrow: "开题与研究 / 数据调研", title: "数据与调研", description: "从真实导入文件开始建立数据、调研和分析记录。", tabs: ["数据文件", "字段槽位", "分析记录"], primary: { label: "导入数据文件", to: "/files" }, secondary: { label: "创建数据任务", to: "/revisions" }, source: "template" },
  outline: { eyebrow: "写作与过程 / 论文大纲", title: "论文大纲", description: "大纲结构等待学生从真实文稿或任务中建立；不会生成示例章节。", tabs: ["章节", "证据槽位", "关联任务"], primary: { label: "导入文稿", to: "/files" }, secondary: { label: "创建大纲任务", to: "/revisions" }, source: "template" },
  writing: { eyebrow: "写作与过程 / 正文写作", title: "正文写作", description: "编辑器只在存在真实文稿来源后加载，不预填论文正文或统计。", tabs: ["文稿", "问题", "版本"], primary: { label: "导入文稿", to: "/files" }, secondary: { label: "管理修改任务", to: "/revisions" }, source: "template" },
  compliance: { eyebrow: "质量与评阅 / 学生自检", title: "全文智评", description: "对学生主动选择的真实文稿执行本地检查或已配置 AI 建议。", tabs: ["检查范围", "问题", "任务"], primary: { label: "选择文稿", to: "/files" }, secondary: { label: "查看修改任务", to: "/revisions" }, source: "recommendation" },
  citation: { eyebrow: "质量与评阅 / 引用核验", title: "引用核验", description: "只展示基于真实文稿和文献记录生成的核验结果。", tabs: ["来源", "核验结果", "修复任务"], primary: { label: "导入文稿", to: "/files" }, secondary: { label: "打开文献库", to: "/literature" }, source: "template" },
  format: { eyebrow: "质量与评阅 / 格式检查", title: "格式检查", description: "选择真实文稿后生成格式检查结果；未生成时不显示结论。", tabs: ["检查范围", "结果", "修改任务"], primary: { label: "选择文稿", to: "/files" }, secondary: { label: "创建修改任务", to: "/revisions" }, source: "template" },
  versions: { eyebrow: "质量与评阅 / 版本历史", title: "版本历史", description: "版本列表只来源于已保存的真实文件或后续版本仓储。", tabs: ["版本", "差异", "恢复"], primary: { label: "打开文件中心", to: "/files" }, secondary: { label: "管理项目", to: "/projects" }, source: "template" },
  finalization: { eyebrow: "定稿阶段 / 学生自检", title: "论文定稿", description: "定稿资格只依据真实文件、已确认要求和未完成任务计算。", tabs: ["就绪条件", "文件", "待办"], primary: { label: "查看项目文件", to: "/files" }, secondary: { label: "处理修改任务", to: "/revisions" }, source: "template" },
  plagiarism: { eyebrow: "定稿阶段 / 查重记录", title: "查重记录", description: "导入真实查重报告后才显示数值和历史记录。", tabs: ["报告文件", "结果", "修复任务"], primary: { label: "导入查重报告", to: "/files" }, secondary: { label: "创建修改任务", to: "/revisions" }, source: "template" },
  "teacher-review": { eyebrow: "定稿阶段 / 外部评阅归档", title: "教师评阅记录", description: "学生归档外部教师评分、意见和答辩结论；本系统不生成或批准这些结论。", tabs: ["来源文件", "评阅记录", "答辩结论"], primary: { label: "导入评阅材料", to: "/files" }, secondary: { label: "记录指导沟通", to: "/guidance" }, source: "template" },
  sampling: { eyebrow: "定稿阶段 / 学生抽检自检", title: "论文抽检", description: "抽检自检结论只由已导入材料和真实任务派生。", tabs: ["材料", "自检项", "待办"], primary: { label: "导入材料", to: "/files" }, secondary: { label: "管理任务", to: "/revisions" }, source: "template" },
  "defense-prep": { eyebrow: "答辩 / 准备", title: "答辩准备", description: "从真实文稿、材料和任务建立学生答辩准备清单。", tabs: ["材料", "讲稿槽位", "准备清单"], primary: { label: "导入答辩材料", to: "/files" }, secondary: { label: "创建准备任务", to: "/revisions" }, source: "template" },
  "mock-defense": { eyebrow: "答辩 / 学生练习", title: "模拟答辩", description: "练习记录由学生主动创建；未产生录音、讲稿或问题时不展示示例内容。", tabs: ["练习记录", "讲稿槽位", "反馈"], primary: { label: "打开答辩准备", to: "/defense-prep" }, secondary: { label: "创建练习任务", to: "/revisions" }, source: "template" },
  defense: { eyebrow: "答辩 / 外部记录归档", title: "答辩记录", description: "学生归档线下答辩的真实材料、问题和结论，不预置问答或评分。", tabs: ["来源材料", "记录", "后续任务"], primary: { label: "导入答辩材料", to: "/files" }, secondary: { label: "创建后续任务", to: "/revisions" }, source: "template" },
  "post-defense": { eyebrow: "答辩 / 后续修改", title: "答辩后修改", description: "基于真实答辩记录和学生任务跟踪后续修改。", tabs: ["修改任务", "来源", "完成记录"], primary: { label: "查看修改任务", to: "/revisions" }, secondary: { label: "导入答辩记录", to: "/files" }, source: "template" },
  "final-manuscript": { eyebrow: "完成 / 最终稿", title: "最终稿与诚信承诺", description: "最终稿只从真实项目文件选择，未生成时保持空状态。", tabs: ["最终稿", "关联材料", "导出"], primary: { label: "选择最终稿", to: "/files" }, secondary: { label: "处理定稿待办", to: "/revisions" }, source: "template" },
  archive: { eyebrow: "完成 / 材料归档", title: "材料归档", description: "归档清单只列出当前项目真实文件，不预置材料完成状态。", tabs: ["项目文件", "归档槽位", "导出"], primary: { label: "管理项目文件", to: "/files" }, secondary: { label: "查看最终稿", to: "/final-manuscript" }, source: "template" },
};

const workspaceFileCategories: Partial<Record<WorkspaceKind, readonly ProjectFileCategory[]>> = {
  topic: ["school_rule", "template", "other"], "task-book": ["school_rule", "template"], translation: ["translation"], midterm: ["proposal", "thesis"], calendar: ["school_rule"], implementation: ["data"], outline: ["proposal", "thesis"], writing: ["thesis"], compliance: ["thesis"], citation: ["thesis", "literature"], format: ["thesis"], versions: undefined, finalization: ["thesis"], plagiarism: ["plagiarism"], "teacher-review": ["review"], sampling: ["thesis"], "defense-prep": ["defense", "thesis"], "mock-defense": ["defense"], defense: ["defense"], "post-defense": ["defense", "review"], "final-manuscript": ["thesis"], archive: ["archive"],
};

export function WorkspacePage({ kind }: { kind: WorkspaceKind }) {
  const navigate = useNavigate(); const template = workspaceTemplates[kind]; const projects = useProjectStore(); const files = useFileStore(); const tasks = useTaskStore(); const workflow = useWorkflowStore(); const requirements = useRequirementStore();
  const [loadedProjectId, setLoadedProjectId] = useState<string | null>(null);
  const activeProject = projects.activeProjectId ? projects.projects.find((item) => item.id === projects.activeProjectId) : projects.projects[0];
  const reload = () => { setLoadedProjectId(null); void projects.loadProjects(); };
  useEffect(() => { void projects.loadProjects(); }, [projects.loadProjects]);
  useEffect(() => { if (!activeProject || loadedProjectId === activeProject.id) return; let cancelled = false; void Promise.all([files.loadFiles(activeProject.id), tasks.load(activeProject.id), workflow.loadStages(activeProject.id), requirements.load(activeProject.id)]).finally(() => { if (!cancelled) setLoadedProjectId(activeProject.id); }); return () => { cancelled = true; }; }, [activeProject?.id, files.loadFiles, tasks.load, workflow.loadStages, requirements.load, loadedProjectId]);
  if (projects.error) return <WorkspaceContent template={template} phase="error" error={projects.error.message} onRetry={reload} />;
  if (projects.isLoading || (activeProject && (loadedProjectId !== activeProject.id || files.projectId !== activeProject.id || tasks.projectId !== activeProject.id || workflow.projectId !== activeProject.id || requirements.projectId !== activeProject.id))) return <WorkspaceContent template={template} phase="loading" onRetry={reload} />;
  if (!activeProject) return <ProjectRequiredState title={`打开项目后使用${template.title}`} description="此页面不使用示例记录。创建或打开项目后，可从真实文件、任务和已确认要求开始。" />;
  const error = files.error?.message ?? tasks.error?.message ?? workflow.error?.message ?? requirements.error?.message;
  if (error) return <WorkspaceContent template={template} phase="error" error={error} onRetry={reload} />;
  const acceptedCategories = workspaceFileCategories[kind];
  const relatedFiles = acceptedCategories ? files.files.filter((file) => acceptedCategories.includes(file.fileCategory)) : files.files;
  const metrics = [{ label: "关联文件", value: relatedFiles.length, detail: "来自文件中心" }, { label: "待办任务", value: tasks.tasks.filter((item) => item.status !== "done").length, detail: "来自修改任务" }, { label: "已确认要求", value: requirements.requirements.length, detail: "来自论文要求" }, { label: "工作流阶段", value: workflow.stages.length, detail: "来自项目时间线" }];
  const hasRecords = kind === "calendar" ? workflow.stages.length > 0 : relatedFiles.length > 0 || tasks.tasks.length > 0 || requirements.requirements.length > 0;
  return <WorkspaceContent template={template} phase={hasRecords ? "ready" : "empty"} metrics={metrics} onRetry={reload} onNavigate={navigate} researchMethods={kind === "implementation" ? parseResearchMethods(activeProject.researchType) : undefined} relatedFiles={relatedFiles} />;
}

type Metric = { label: string; value: number; detail: string };
export function WorkspaceContent({ template, phase, metrics = [], error = "", onRetry, onNavigate, researchMethods, relatedFiles = [] }: { template: WorkspaceTemplate; phase: "loading" | "empty" | "ready" | "error"; metrics?: Metric[]; error?: string; onRetry: () => void; onNavigate?: (to: string) => void; researchMethods?: ResearchMethod[]; relatedFiles?: ProjectFile[] }) {
  const [tab, setTab] = useState(template.tabs[0]); const go = (to: string) => onNavigate?.(to);
  const actions = onNavigate ? <><NavigateAction label={template.primary.label} primary onClick={() => go(template.primary.to)} /><NavigateAction label={template.secondary.label} onClick={() => go(template.secondary.to)} /></> : null;
  const researchMethodSummary = researchMethods !== undefined ? <section className="research-method-summary" aria-label="已选数据与调研方式"><span>本项目研究方式</span>{researchMethods.length ? researchMethods.map((method) => <b key={method}>{method}</b>) : <em>尚未选择，请在项目资料中补充。</em>}</section> : null;
  const sourceList = relatedFiles.length ? <div className="workspace-source-list">{relatedFiles.map((file) => <article key={file.id}><FilePlus2 size={15} /><div><b>{file.originalName}</b><span>{CATEGORY_LABELS[file.fileCategory]} · 已从文件中心导入</span></div></article>)}</div> : <div className="workspace-slot"><FilePlus2 size={18} /><div><b>尚未导入与此板块匹配的文件</b><span>可从文件中心导入材料，并选择正确分类后自动显示在这里。</span></div>{onNavigate ? <NavigateAction label={template.primary.label} onClick={() => go(template.primary.to)} /> : null}</div>;
  return <ViewShell><PageHeader eyebrow={template.eyebrow} title={template.title} description={template.description} actions={actions} /><DetailTabs items={template.tabs} active={tab} onChange={setTab} />{researchMethodSummary}<section className="view-template-note"><Settings2 size={14} />系统{template.source === "recommendation" ? "推荐" : "页面"}模板：字段槽位与工具栏不代表任何已生成的学生数据或学校硬性要求。</section>{phase === "loading" ? <LoadingSkeleton /> : null}{phase === "error" ? <ErrorState message={error} onRetry={onRetry} /> : null}{phase === "empty" ? <EmptyState title={`尚无${template.title}相关真实记录`} description="完整页面结构已保留。请从真实项目文件、任务、要求或外部材料开始，不会自动填充示例数据。" action={onNavigate ? <NavigateAction label={template.primary.label} primary onClick={() => go(template.primary.to)} /> : undefined} /> : null}{phase === "ready" ? <><section className="workspace-metrics">{metrics.map((item) => <article key={item.label}><small>{item.label}</small><strong>{item.value}</strong><span>{item.detail}</span></article>)}</section><section className="workspace-grid"><SectionCard title={relatedFiles.length ? "已导入的相关文件" : tab} description={relatedFiles.length ? "这些文件已按导入分类自动关联到当前板块。" : "此区域只展示或操作当前项目可追溯的数据。"}>{sourceList}</SectionCard><SectionCard title="下一步" description="入口具有真实导航副作用，不会创建或修改虚构记录。"><div className="workspace-actions"><button onClick={() => go(template.primary.to)}><FilePlus2 size={16} />{template.primary.label}</button><button onClick={() => go(template.secondary.to)}><ListPlus size={16} />{template.secondary.label}</button></div></SectionCard></section></> : null}</ViewShell>;
}

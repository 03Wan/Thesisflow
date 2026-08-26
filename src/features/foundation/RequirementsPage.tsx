import { useEffect, useState } from "react";
import { FileSearch, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/ViewStates";
import { NavigateAction, PageHeader, RetryAction, SectionCard, ViewShell } from "@/components/common/ViewShell";
import { ProjectRequiredState } from "@/components/common/ProjectRequiredState";
import { RuleCandidateRepository } from "@/repositories/ruleCandidateRepository";
import { ruleReviewService } from "@/services/ruleReviewService";
import { useProjectStore } from "@/stores/project-store";
import { useRequirementStore } from "@/stores/requirement-store";
import type { RuleCandidate } from "@/types/document";
import "@/features/workspace/workspace-page.css";

export function RequirementsPage() {
  const navigate = useNavigate(); const projects = useProjectStore(); const requirements = useRequirementStore();
  const activeProject = projects.activeProjectId ? projects.projects.find((item) => item.id === projects.activeProjectId) : projects.projects[0];
  const [candidates, setCandidates] = useState<RuleCandidate[]>([]); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null);
  const load = () => { if (!activeProject) { void projects.loadProjects(); return; } setLoading(true); setError(null); void requirements.load(activeProject.id).then(async () => { if (typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window)) return []; return new RuleCandidateRepository().listByProject(activeProject.id); }).then(setCandidates).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "无法读取论文要求。")).finally(() => setLoading(false)); };
  useEffect(() => { void projects.loadProjects(); }, [projects.loadProjects]);
  useEffect(() => { if (!activeProject) return; let cancelled = false; setLoading(true); setError(null); void requirements.load(activeProject.id).then(async () => { if (typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window)) return []; return new RuleCandidateRepository().listByProject(activeProject.id); }).then((rows) => { if (!cancelled) setCandidates(rows); }).catch((cause: unknown) => { if (!cancelled) setError(cause instanceof Error ? cause.message : "无法读取论文要求。"); }).finally(() => { if (!cancelled) setLoading(false); }); return () => { cancelled = true; }; }, [activeProject?.id, requirements.load]);
  const review = async (candidate: RuleCandidate, action: "confirm" | "reject") => { try { if (action === "confirm") await ruleReviewService.confirm(candidate.id); else await ruleReviewService.reject(candidate.id); if (activeProject) { await requirements.load(activeProject.id); setCandidates(await new RuleCandidateRepository().listByProject(activeProject.id)); } } catch (cause) { setError(cause instanceof Error ? cause.message : "规则操作失败。"); } };
  if (projects.isLoading || loading) return <LoadingSkeleton label="正在加载当前项目的论文要求…" />;
  if (projects.error || error) return <ErrorState message={projects.error?.message ?? error ?? "无法读取论文要求。"} onRetry={load} />;
  if (!activeProject) return <ProjectRequiredState title="打开项目后管理论文要求" description="论文要求、抽取候选和来源只属于当前学生项目。" />;
  const pending = candidates.filter((item) => item.status === "pending");
  return <ViewShell><PageHeader eyebrow="准备阶段 / 论文要求" title="论文要求" description="显示当前项目已确认的规则及其机器抽取候选；确认操作由学生执行并保留来源。" actions={<NavigateAction label="导入学校文件" primary onClick={() => navigate("/files")} />} />
    <section className="view-template-note"><ShieldCheck size={14} />规则来自学生确认的来源文件。系统字段模板不代表学校硬性要求。</section>
    {requirements.requirements.length === 0 ? <EmptyState title="尚未确认论文要求" description="导入学校通知、任务书或其他来源文件并完成本地解析后，待确认候选会显示在这里。" action={<NavigateAction label="前往文件中心" primary onClick={() => navigate("/files")} />} /> : <SectionCard title="已确认要求" description="数值和状态来自当前项目 requirement repository。"><div className="requirements-grid">{requirements.requirements.map((item) => <article key={item.id}><b>{item.label}</b><strong>{item.targetValue === null ? "未配置目标" : `${item.currentValue} / ${item.targetValue}${item.unit}`}</strong><span>{item.description || "无补充说明"}</span></article>)}</div></SectionCard>}
    <SectionCard title="待确认规则候选" description="候选来自真实解析结果；确认后才会进入项目规则和相关投影。" actions={<RetryAction label="刷新" onRetry={load} />}>{pending.length === 0 ? <div className="workspace-slot"><FileSearch size={18} /><div><b>暂无待确认候选</b><span>导入并解析来源文件后，可在此核对提取结果。</span></div></div> : <div className="candidate-list">{pending.map((candidate) => <article key={candidate.id}><div><b>{candidate.ruleKey}</b><span>{candidate.rawText}</span><small>来源：{candidate.projectFileId} · 置信度 {candidate.confidence}</small></div><button onClick={() => void review(candidate, "confirm")}>确认</button><button onClick={() => void review(candidate, "reject")}>拒绝</button></article>)}</div>}</SectionCard>
  </ViewShell>;
}

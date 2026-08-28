import { useCallback, useEffect, useState } from "react";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/ViewStates";
import { PageHeader, SectionCard, ViewShell } from "@/components/common/ViewShell";
import { analysisPersistenceService } from "@/services/analysisPersistenceService";
import { useProjectStore } from "@/stores/project-store";
import type { VariableDefinition } from "@/services/analysisService";
import "./data-workspace.css";

export function VariableDictionaryPage() {
  const projects = useProjectStore(); const [variables, setVariables] = useState<VariableDefinition[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState<string | null>(null);
  const project = projects.projects.find((item) => item.id === projects.activeProjectId) ?? projects.projects[0];
  const reload = useCallback(async () => { if (!project) { setLoading(false); return; } setLoading(true); setError(null); try { setVariables(await analysisPersistenceService.listVariables(project.id)); } catch (reason) { setError(reason instanceof Error ? reason.message : "无法加载变量字典。"); } finally { setLoading(false); } }, [project]);
  useEffect(() => { void projects.loadProjects(); }, [projects.loadProjects]); useEffect(() => { void reload(); }, [reload]);
  if (projects.isLoading || loading) return <ViewShell><LoadingSkeleton label="正在读取变量字典…" /></ViewShell>;
  if (!project) return <ViewShell><EmptyState title="打开项目后管理变量" description="变量定义必须绑定当前项目的数据集版本。" /></ViewShell>;
  if (error) return <ViewShell><ErrorState title="变量字典不可用" message={error} onRetry={() => void reload()} /></ViewShell>;
  return <ViewShell><PageHeader eyebrow="ThesisFlow / Phase 7" title="变量字典" description="每个变量都绑定数据集版本与列；版本变化会标记 stale 或 broken。" /><SectionCard title="项目变量" description="AI 建议只能作为 suggested，不能静默改变正式映射。">{variables.length === 0 ? <EmptyState title="尚未保存变量定义" description="先登记数据集，再为因变量、自变量和控制变量建立可追溯映射。" /> : <ul className="data-source-list">{variables.map((variable) => <li key={variable.id}><div><b>{variable.displayName}（{variable.code}）</b><span>{variable.role} · {variable.column} · version {variable.datasetVersionId} · {variable.status}</span></div></li>)}</ul>}</SectionCard></ViewShell>;
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { BarChart3, Play, WandSparkles } from "lucide-react";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/ViewStates";
import { PageHeader, SectionCard, ViewShell } from "@/components/common/ViewShell";
import { datasetService } from "@/services/datasetService";
import { analysisPersistenceService } from "@/services/analysisPersistenceService";
import { runDescriptiveAnalysis } from "@/services/analysisService";
import { transformPersistenceService } from "@/services/transformPersistenceService";
import { useProjectStore } from "@/stores/project-store";
import type { DatasetVersion } from "@/types/dataset";
import "./data-workspace.css";

const materialized = (version: DatasetVersion) => {
  if (!version.materializedJson) throw new Error("当前版本没有可执行的完整数据快照。");
  const payload = JSON.parse(version.materializedJson) as { rows: string[][] };
  return { columns: version.schema, rows: payload.rows };
};

export function AnalysisWorkspacePage() {
  const projects = useProjectStore();
  const [versions, setVersions] = useState<DatasetVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const project = useMemo(() => projects.projects.find((item) => item.id === projects.activeProjectId) ?? projects.projects[0] ?? null, [projects.activeProjectId, projects.projects]);
  const reload = useCallback(async () => {
    if (!project) { setVersions([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try { setVersions((await datasetService.list(project.id)).versions); } catch (reason) { setError(reason instanceof Error ? reason.message : "无法加载分析数据集。"); } finally { setLoading(false); }
  }, [project]);
  useEffect(() => { void projects.loadProjects(); }, [projects.loadProjects]);
  useEffect(() => { void reload(); }, [reload]);
  const transform = async (version: DatasetVersion) => {
    if (!project) return; setRunning(version.id); setMessage(null); setError(null);
    try { const result = await transformPersistenceService.execute(project.id, version, materialized(version), [{ operation: "select", parameters: { columns: version.schema.map((column) => column.name) } }], `保留全部字段 · v${version.versionNumber}`); setMessage(`已创建派生版本 v${result.version.versionNumber}；清洗运行 ${result.runId} 已完成。`); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "清洗运行失败。"); } finally { setRunning(null); }
  };
  const analyze = async (version: DatasetVersion) => {
    if (!project) return; setRunning(version.id); setMessage(null); setError(null);
    try { const input = materialized(version); const dependent = version.schema[0]?.name; if (!dependent) throw new Error("数据集没有可分析字段。"); const independent = version.schema.slice(1).map((column) => column.name); const spec = await analysisPersistenceService.createAnalysisSpec(project.id, `描述统计 · v${version.versionNumber}`, version, "descriptive", { dependent, independent }); const run = runDescriptiveAnalysis(project.id, version, input.rows, { dependent, independent }); await analysisPersistenceService.createRun(run, spec.id); const artifact = await analysisPersistenceService.createArtifact(project.id, run.id, version.id, "table", { method: "descriptive", metrics: run.metrics }, spec.id); const evidenceMetrics = Object.entries(run.metrics).flatMap(([key, value]) => { const metric = value as { mean?: number | null; n?: number; missing?: number }; return [{ key: `${key}.n`, value: metric.n ?? 0 }, { key: `${key}.missing`, value: metric.missing ?? 0 }, ...(metric.mean === null || metric.mean === undefined ? [] : [{ key: `${key}.mean`, value: metric.mean }])]; }); await analysisPersistenceService.saveEvidence({ id: crypto.randomUUID(), projectId: project.id, title: `描述统计证据 · v${version.versionNumber}`, runId: run.id, metrics: evidenceMetrics, stale: false }, [artifact.id]); setMessage(`分析运行 ${run.id} 已完成，并已生成 artifact 与 evidence。`); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "分析运行失败。"); } finally { setRunning(null); }
  };
  if (projects.isLoading || loading) return <ViewShell><LoadingSkeleton label="正在读取分析工作台…" /></ViewShell>;
  if (!project) return <ViewShell><EmptyState title="打开项目后运行分析" description="分析规格、运行记录和结果会严格绑定项目与数据集版本。" /></ViewShell>;
  if (error) return <ViewShell><ErrorState title="分析工作台不可用" message={error} onRetry={() => void reload()} /></ViewShell>;
  return <ViewShell><PageHeader eyebrow="ThesisFlow / Phase 7" title="分析运行" description="从不可变数据版本执行可复现清洗与描述统计，并持久化运行、artifact 和 evidence。" />{message ? <p className="workspace-success" role="status">{message}</p> : null}<SectionCard title="数据版本执行器" description="操作只会创建新版本或新运行，不会覆盖原始数据。">{versions.length === 0 ? <EmptyState title="尚未登记数据集" description="先在数据与实证分析页面登记 CSV 或 XLSX。" /> : <ul className="data-source-list">{versions.map((version) => <li key={version.id}><BarChart3 size={16} /><div><b>v{version.versionNumber} · {version.rowCount} 行 × {version.columnCount} 列</b><span>{version.kind} · {version.sha256.slice(0, 16)}… · {version.parserId}</span></div><button className="view-secondary-action" disabled={running !== null} onClick={() => void transform(version)}><WandSparkles size={14} />{running === version.id ? "执行中…" : "运行清洗"}</button><button className="view-primary-action" disabled={running !== null} onClick={() => void analyze(version)}><Play size={14} />{running === version.id ? "执行中…" : "描述统计"}</button></li>)}</ul>}</SectionCard></ViewShell>;
}

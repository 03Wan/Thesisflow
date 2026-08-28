import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, RefreshCw } from "lucide-react";
import { EmptyState, ErrorState, LoadingSkeleton } from "@/components/common/ViewStates";
import { PageHeader, SectionCard, ViewShell } from "@/components/common/ViewShell";
import { datasetService } from "@/services/datasetService";
import { useFileStore } from "@/stores/file-store";
import { useProjectStore } from "@/stores/project-store";
import type { Dataset, DatasetColumnType, DatasetVersion } from "@/types/dataset";
import "./data-workspace.css";

export function DataWorkspacePage() {
  const projects = useProjectStore();
  const files = useFileStore();
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [versions, setVersions] = useState<DatasetVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [typeDrafts, setTypeDrafts] = useState<Record<string, Record<string, DatasetColumnType>>>({});
  const project = useMemo(() => projects.projects.find((item) => item.id === projects.activeProjectId) ?? projects.projects[0] ?? null, [projects.activeProjectId, projects.projects]);
  const reload = useCallback(async () => {
    if (!project) { setDatasets([]); setVersions([]); setLoading(false); return; }
    setLoading(true); setError(null);
    try { const [result] = await Promise.all([datasetService.list(project.id), files.loadFiles(project.id)]); setDatasets(result.datasets); setVersions(result.versions); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "无法加载数据集。"); }
    finally { setLoading(false); }
  }, [files.loadFiles, project]);
  useEffect(() => { void projects.loadProjects(); }, [projects.loadProjects]);
  useEffect(() => { void reload(); }, [reload]);
  const dataFiles = files.files.filter((file) => file.projectId === project?.id && file.fileCategory === "data" && ["csv", "xlsx"].includes(file.extension));
  const register = async (fileId: string) => {
    if (!project) return;
    setImporting(fileId); setError(null);
    try { await datasetService.importProjectFile(project.id, fileId); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "数据集导入失败。"); }
    finally { setImporting(null); }
  };
  const confirmTypes = async (version: DatasetVersion) => {
    setImporting(version.id); setError(null);
    try { await datasetService.confirmColumnTypes(project.id, version.datasetId, version.id, typeDrafts[version.id] ?? {}); await reload(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "字段类型确认失败。"); }
    finally { setImporting(null); }
  };
  if (projects.isLoading || loading) return <ViewShell><LoadingSkeleton label="正在读取真实数据集记录…" /></ViewShell>;
  if (!project) return <ViewShell><EmptyState title="打开项目后管理数据集" description="数据集、版本和统计结果均严格隔离在当前论文项目内。" /></ViewShell>;
  if (error) return <ViewShell><ErrorState title="数据工作台不可用" message={error} onRetry={() => void reload()} /></ViewShell>;
  return <ViewShell>
    <PageHeader eyebrow="ThesisFlow / Phase 7" title="数据与实证分析" description="原始文件保持不可变；数据集版本只来自成功解析的真实文件。" actions={<button className="view-secondary-action" onClick={() => void reload()}><RefreshCw size={14} />刷新</button>} />
    <SectionCard title="可登记的数据文件" description="请先在文件中心以“数据”分类导入 CSV 或 XLSX，再登记为不可变原始数据集。">
      {dataFiles.length === 0 ? <EmptyState title="没有可用的数据文件" description="前往文件中心导入 CSV 或 XLSX。浏览器预览不会创建持久化数据集。" /> : <ul className="data-source-list">{dataFiles.map((file) => <li key={file.id}><Database size={16} /><div><b>{file.originalName}</b><span>{file.checksum ? `SHA-256: ${file.checksum}` : "等待桌面端重新导入以生成 SHA-256"}</span></div><button className="view-primary-action" disabled={importing !== null} onClick={() => void register(file.id)}>{importing === file.id ? "解析并登记中…" : "登记数据集"}</button></li>)}</ul>}
    </SectionCard>
    <SectionCard title="真实数据集" description="行列数与预览行数均取自成功解析结果；预览不代表全量统计。">
      {datasets.length === 0 ? <EmptyState title="尚未登记数据集" description="登记成功后，这里会显示版本、哈希、行列数与解析器信息。" /> : <ul className="data-source-list">{datasets.map((dataset) => { const version = versions.find((item) => item.id === dataset.currentVersionId); return <li key={dataset.id}><Database size={16} /><div><b>{dataset.name}</b><span>{version ? `v${version.versionNumber} · SHA-256: ${version.sha256} · ${version.rowCount} 行 × ${version.columnCount} 列 · 预览 ${version.previewRowCount} 行${version.sourceMetadata.sheetName ? ` · 工作表 ${version.sourceMetadata.sheetName}` : ""} · ${version.parserId}` : "当前版本不可用"}</span>{version ? <details><summary>确认字段类型</summary><div className="dataset-schema">{version.schema.map((column) => <label key={column.name}>{column.name}<select value={typeDrafts[version.id]?.[column.name] ?? column.type} onChange={(event) => setTypeDrafts((drafts) => ({ ...drafts, [version.id]: { ...drafts[version.id], [column.name]: event.target.value as DatasetColumnType } }))}>{(["string", "number", "boolean", "date", "unknown"] as const).map((type) => <option key={type} value={type}>{type}</option>)}</select></label>)}<button className="view-secondary-action" disabled={importing !== null} onClick={() => void confirmTypes(version)}>{importing === version.id ? "正在创建新版本…" : "确认并创建新版本"}</button></div></details> : null}</div></li>; })}</ul>}
    </SectionCard>
  </ViewShell>;
}

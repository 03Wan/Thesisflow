import { useEffect, useMemo, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { FileText, FolderOpen, Play, Sparkles, Trash2, Upload } from "lucide-react";
import { parsingService } from "@/services/parsingService";
import { aiDocumentParsingService } from "@/services/aiDocumentParsingService";
import {
  CATEGORY_LABELS,
  PROJECT_FILE_CATEGORIES,
  SUPPORTED_FILE_EXTENSIONS,
  inferProjectFileCategory,
} from "@/lib/file-category";
import { useFileStore } from "@/stores/file-store";
import { useProjectStore } from "@/stores/project-store";
import { getFileUsage } from "@/lib/file-usage";
import { useNavigate } from "react-router-dom";
import { ProjectRequiredState } from "@/components/common/ProjectRequiredState";
import type { ProjectFile, ProjectFileCategory } from "@/types/domain";
import "./files.css";

export function FilesPage() {
  const navigate = useNavigate();
  const projects = useProjectStore();
  const store = useFileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isTauriRuntime = "__TAURI_INTERNALS__" in window;
  const [previewFiles, setPreviewFiles] = useState<ProjectFile[]>([]);
  const [category, setCategory] = useState<ProjectFileCategory | "auto">(
    "auto",
  );
  const [parsing, setParsing] = useState<string | null>(null);
  const [aiParsing, setAiParsing] = useState<string | null>(null);
  const [parseProgress, setParseProgress] = useState<number | null>(null);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  useEffect(() => {
    void projects.loadProjects();
  }, [projects.loadProjects]);
  const project = useMemo(
    () =>
      projects.projects.find((item) => item.id === projects.activeProjectId) ??
      projects.projects[0],
    [projects.projects, projects.activeProjectId],
  );
  const previewMode = !isTauriRuntime;
  const projectTitle = project?.title ?? "未打开项目";
  const visibleFiles = previewMode ? previewFiles : store.files;
  const importPaths = async (paths: string[]) => {
    if (!project || !paths.length || store.isLoading) return;
    try { await store.importFiles(project.id, paths, (path) => category === "auto" ? inferProjectFileCategory(path) : category); }
    catch { /* store.error is rendered as the user-facing alert */ }
  };
  useEffect(() => {
    if (project && isTauriRuntime) void store.loadFiles(project.id);
  }, [project?.id, store.loadFiles]);
  useEffect(() => {
    if (!("__TAURI_INTERNALS__" in window)) return;
    const pending = getCurrentWindow().onDragDropEvent((event) => {
      if (event.payload.type === "drop") void importPaths(event.payload.paths);
    });
    return () => {
      void pending.then((dispose) => dispose());
    };
  }, [project?.id, category]);
  const chooseFiles = async () => {
    if (store.isLoading) return;
    if (previewMode) { fileInputRef.current?.click(); return; }
    try { const paths = await open({
      multiple: true,
      directory: false,
      filters: [
        { name: "支持的论文文件", extensions: [...SUPPORTED_FILE_EXTENSIONS] },
      ],
    });
      if (Array.isArray(paths)) await importPaths(paths); else if (paths) await importPaths([paths]);
    } catch (error) { window.alert(error instanceof Error ? error.message : "无法打开文件选择器。"); }
  };
  const addPreviewFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const now = new Date().toISOString();
    const created = Array.from(files).map<ProjectFile>((file, index) => ({
      id: `preview-${Date.now()}-${index}`, projectId: "preview-project", workflowStageId: null,
      originalName: file.name, storedName: file.name, relativePath: file.name, mimeType: file.type || null,
      extension: file.name.split(".").pop()?.toLowerCase() ?? "", sizeBytes: file.size, checksum: null,
      fileCategory: category === "auto" ? inferProjectFileCategory(file.name) : category,
      versionLabel: null, source: "imported", createdAt: now, updatedAt: now,
    }));
    setPreviewFiles((current) => [...created, ...current]);
    setParseMessage(`已在本次浏览器会话中加入 ${created.length} 个文件；桌面版会复制到项目目录。`);
  };
  const parseFile = async (fileId: string) => { setParsing(fileId); setParseProgress(5); setParseMessage("正在本地读取文件…"); try { if (previewMode) { setParseProgress(100); const file = previewFiles.find((item) => item.id === fileId); setParseMessage(file ? `${file.originalName}：浏览器会话无法持久读取本地文件字节，请在桌面版中解析。` : "未找到要解析的文件。"); return; } const result = await parsingService.parseProjectFile(fileId); setParseProgress(100); setParseMessage(result.status === "parsed" ? `本地解析完成 · ${result.blockCount} 个内容块。` : `本地解析未完成 · ${result.errorMessage || result.status}`); } catch (error) { setParseMessage(error instanceof Error ? error.message : "本地解析失败，可重试。"); } finally { setParsing(null); window.setTimeout(() => setParseProgress(null), 1200); } };
  const parseFileWithAi = async (file: ProjectFile) => {
    if (previewMode) { setParseMessage("AI 转 MD 仅在桌面版中可用。"); return; }
    if (!window.confirm(`AI 转 MD 会把“${file.originalName}”的本地抽取文本发送给已启用的 AI Provider。是否继续？`)) return;
    setAiParsing(file.id); setParseProgress(5); setParseMessage("正在本地预解析，随后将请求 AI…");
    try {
      const created = await aiDocumentParsingService.convertToMarkdown(file);
      setParseProgress(100); setParseMessage(`AI 转 MD 完成 · 已生成 ${created.originalName}`);
      if (project) await store.loadFiles(project.id);
    } catch (error) { setParseMessage(error instanceof Error ? error.message : "AI 转 MD 失败，可重试。"); }
    finally { setAiParsing(null); window.setTimeout(() => setParseProgress(null), 1200); }
  };
  if (projects.isLoading)
    return <section className="files-page"><p className="files-empty">正在读取本地项目…</p></section>;
  if (!project)
    return (
      <section className="files-page">
        <div className="files-header">
          <div>
            <p className="eyebrow">ThesisFlow / 本地文件</p>
            <h1>文件中心</h1>
            <p>论文文件只保存在当前项目的本地目录中。</p>
          </div>
        </div>
        {projects.error && <p className="files-error" role="alert">{projects.error.message}</p>}
        <ProjectRequiredState
          title="打开项目后管理本地文件"
          description="创建或打开论文项目，即可导入文档、表格、PDF 和参考文献文件。"
        />
      </section>
    );
  return (
    <section className="files-page">
      <header className="files-header">
        <div>
          <p className="eyebrow">ThesisFlow / 本地文件</p>
          <h1>文件中心</h1>
          <p>
            {projectTitle} · 文件只复制到该项目的本地目录，不解析正文内容。
          </p>
        </div>
        <button
          className="files-import-button"
          onClick={() => void chooseFiles()}
          disabled={store.isLoading}
        >
          <Upload size={16} /> 选择文件
        </button>
        {previewMode && <input ref={fileInputRef} className="files-native-input" type="file" multiple accept={SUPPORTED_FILE_EXTENSIONS.map((item) => `.${item}`).join(",")} onChange={(event) => addPreviewFiles(event.target.files)} />}
      </header>
      <div className="files-dropzone">
        <Upload size={22} />
        <strong>将文件拖入此窗口即可导入</strong>
        <span>
          支持 {SUPPORTED_FILE_EXTENSIONS.map((item) => `.${item}`).join("、")}
        </span>
        <label>
          导入分类{" "}
          <select
            value={category}
            disabled={store.isLoading}
            onChange={(event) =>
              setCategory(event.target.value as ProjectFileCategory | "auto")
            }
          >
            <option value="auto">自动判断</option>
            {PROJECT_FILE_CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {CATEGORY_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!previewMode && store.error && <p className="files-error">{store.error.message}</p>}
      {parseMessage && <p className="files-empty">解析状态：{parseProgress !== null ? `${parseProgress}% · ` : ""}{parseMessage}</p>}
      {store.isLoading && <p className="files-empty">正在处理本地文件…</p>}
      <section className="files-list">
        <header>
          <h2>{previewMode ? "本次会话文件" : "真实项目文件"}</h2>
          <span>{visibleFiles.length} 个文件</span>
        </header>
        {visibleFiles.length === 0 ? (
          <p className="files-empty">
            尚未导入文件。选择文件或拖入文件开始建立本地资料库。
          </p>
        ) : (
          visibleFiles.map((file) => (
            <article key={file.id}>
              <FileText size={18} />
              <div>
                <strong>{file.originalName}</strong>
                <small>
                  {CATEGORY_LABELS[file.fileCategory]} ·{" "}
                  {(file.sizeBytes / 1024).toFixed(1)} KB ·{" "}
                  {new Date(file.updatedAt).toLocaleString()}
                </small>
                <small className="file-usage">下一步：{getFileUsage(file.fileCategory).nextStep}</small>
              </div>
              {getFileUsage(file.fileCategory).destination !== "/files" && <button className="file-next-step" disabled={store.isLoading} onClick={() => navigate(getFileUsage(file.fileCategory).destination)}>
                前往{getFileUsage(file.fileCategory).destinationLabel}
              </button>}
              <button disabled={store.isLoading} onClick={() => previewMode ? setParseMessage("浏览器预览无法打开本地位置；请在 ThesisFlow 桌面版中使用此操作。") : void store.openLocation(file.id).catch(() => undefined)}>
                <FolderOpen size={16} /> 位置
              </button>
              <button disabled={store.isLoading || parsing === file.id || aiParsing === file.id} onClick={() => void parseFile(file.id)}><Play size={16} />{parsing === file.id ? "解析中" : "本地解析"}</button>
              <button className="file-ai-parse" disabled={store.isLoading || parsing === file.id || aiParsing === file.id} onClick={() => void parseFileWithAi(file)}><Sparkles size={16} />{aiParsing === file.id ? "AI 处理中" : "AI 转 MD"}</button>
              {(parsing === file.id || aiParsing === file.id) && <span className="file-parse-progress" role="progressbar" aria-label={`${file.originalName} 解析进度`} aria-valuenow={parseProgress ?? 0}><i><em style={{ width: `${parseProgress ?? 0}%` }} /></i>{parseProgress}%</span>}
              <button
                className="file-remove"
                disabled={store.isLoading}
                onClick={() => {
                  if (
                    window.confirm(`确定从项目移除“${file.originalName}”吗？`)
                  )
                    previewMode ? setPreviewFiles((current) => current.filter((item) => item.id !== file.id)) : void store.removeFile(file.id).catch(() => undefined);
                }}
              >
                <Trash2 size={16} /> 移除
              </button>
            </article>
          ))
        )}
      </section>
    </section>
  );
}

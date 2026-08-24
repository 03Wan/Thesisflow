import { useEffect, useMemo, useRef, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { FileText, FolderOpen, Play, Trash2, Upload } from "lucide-react";
import { parsingService } from "@/services/parsingService";
import {
  CATEGORY_LABELS,
  PROJECT_FILE_CATEGORIES,
  SUPPORTED_FILE_EXTENSIONS,
  inferProjectFileCategory,
} from "@/lib/file-category";
import { useFileStore } from "@/stores/file-store";
import { useProjectStore } from "@/stores/project-store";
import { ProjectRequiredState } from "@/components/common/ProjectRequiredState";
import type { ProjectFile, ProjectFileCategory } from "@/types/domain";
import "./files.css";

const PREVIEW_FILES: ProjectFile[] = [
  { id: "preview-xlsx", projectId: "preview-project", workflowStageId: null, originalName: "sample.xlsx", storedName: "sample.xlsx", relativePath: "05_数据/sample.xlsx", mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", extension: "xlsx", sizeBytes: 819, checksum: null, fileCategory: "data", versionLabel: null, source: "imported", createdAt: "2026-08-24T05:40:59.000Z", updatedAt: "2026-08-24T05:40:59.000Z" },
  { id: "preview-docx", projectId: "preview-project", workflowStageId: null, originalName: "sample.docx", storedName: "sample.docx", relativePath: "06_论文正文/sample.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: "docx", sizeBytes: 819, checksum: null, fileCategory: "thesis", versionLabel: null, source: "imported", createdAt: "2026-08-24T05:40:29.000Z", updatedAt: "2026-08-24T05:40:29.000Z" },
  { id: "preview-pdf", projectId: "preview-project", workflowStageId: null, originalName: "sample.pdf", storedName: "sample.pdf", relativePath: "06_论文正文/sample.pdf", mimeType: "application/pdf", extension: "pdf", sizeBytes: 102, checksum: null, fileCategory: "thesis", versionLabel: null, source: "imported", createdAt: "2026-08-24T05:39:54.000Z", updatedAt: "2026-08-24T05:39:54.000Z" },
];

export function FilesPage() {
  const projects = useProjectStore();
  const store = useFileStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isTauriRuntime = "__TAURI_INTERNALS__" in window;
  const [previewFiles, setPreviewFiles] = useState(PREVIEW_FILES);
  const [category, setCategory] = useState<ProjectFileCategory | "auto">(
    "auto",
  );
  const [parsing, setParsing] = useState<string | null>(null);
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
  const projectTitle = project?.title ?? "数字经济对企业创新的影响研究";
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
    setParseMessage(`已在预览中加入 ${created.length} 个文件；桌面版会复制到项目目录。`);
  };
  const parseFile = async (fileId: string) => { setParsing(fileId); setParseMessage(null); try { const result = await parsingService.parseProjectFile(fileId); setParseMessage(`${result.status} · ${result.blockCount} blocks`); } catch (error) { setParseMessage(error instanceof Error ? error.message : "解析失败，可重试。"); } finally { setParsing(null); } };
  if (projects.isLoading)
    return <section className="files-page"><p className="files-empty">正在读取本地项目…</p></section>;
  if (!project && !previewMode)
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
      {parseMessage && <p className="files-empty">解析状态：{parseMessage}</p>}
      {store.isLoading && <p className="files-empty">正在处理本地文件…</p>}
      <section className="files-list">
        <header>
          <h2>{previewMode ? "浏览器预览文件" : "真实项目文件"}</h2>
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
              </div>
              <button disabled={store.isLoading} onClick={() => previewMode ? setParseMessage("浏览器预览无法打开本地位置；请在 ThesisFlow 桌面版中使用此操作。") : void store.openLocation(file.id).catch(() => undefined)}>
                <FolderOpen size={16} /> 位置
              </button>
              <button disabled={store.isLoading || parsing === file.id} onClick={() => previewMode ? setParseMessage(`${file.originalName} · 浏览器预览解析完成`) : void parseFile(file.id)}><Play size={16} />{parsing === file.id ? "解析中" : "解析"}</button>
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

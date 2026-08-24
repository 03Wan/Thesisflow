import { useEffect, useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { FileText, FolderOpen, Trash2, Upload } from "lucide-react";
import {
  CATEGORY_LABELS,
  PROJECT_FILE_CATEGORIES,
  SUPPORTED_FILE_EXTENSIONS,
  inferProjectFileCategory,
} from "@/lib/file-category";
import { useFileStore } from "@/stores/file-store";
import { useProjectStore } from "@/stores/project-store";
import type { ProjectFileCategory } from "@/types/domain";
import "./files.css";

export function FilesPage() {
  const projects = useProjectStore();
  const store = useFileStore();
  const [category, setCategory] = useState<ProjectFileCategory | "auto">(
    "auto",
  );
  useEffect(() => {
    void projects.loadProjects();
  }, [projects.loadProjects]);
  const project = useMemo(
    () =>
      projects.projects.find((item) => item.id === projects.activeProjectId) ??
      projects.projects[0],
    [projects.projects, projects.activeProjectId],
  );
  const importPaths = async (paths: string[]) => {
    if (!project || !paths.length || store.isLoading) return;
    try { await store.importFiles(project.id, paths, (path) => category === "auto" ? inferProjectFileCategory(path) : category); }
    catch { /* store.error is rendered as the user-facing alert */ }
  };
  useEffect(() => {
    if (project) void store.loadFiles(project.id);
  }, [project?.id, store.loadFiles]);
  useEffect(() => {
    const pending = getCurrentWindow().onDragDropEvent((event) => {
      if (event.payload.type === "drop") void importPaths(event.payload.paths);
    });
    return () => {
      void pending.then((dispose) => dispose());
    };
  }, [project?.id, category]);
  const chooseFiles = async () => {
    if (store.isLoading) return;
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
  if (projects.isLoading)
    return <section className="files-page"><p className="files-empty">正在读取本地项目…</p></section>;
  if (!project)
    return (
      <section className="files-page">
        <div className="files-header">
          <h1>文件中心</h1>
          <p>请先在项目管理中创建或打开一个项目。</p>
          {projects.error && <p className="files-error" role="alert">{projects.error.message}</p>}
        </div>
      </section>
    );
  return (
    <section className="files-page">
      <header className="files-header">
        <div>
          <p className="eyebrow">ThesisFlow / 本地文件</p>
          <h1>文件中心</h1>
          <p>
            {project.title} · 文件只复制到该项目的本地目录，不解析正文内容。
          </p>
        </div>
        <button
          className="files-import-button"
          onClick={() => void chooseFiles()}
          disabled={store.isLoading}
        >
          <Upload size={16} /> 选择文件
        </button>
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
      {store.error && <p className="files-error">{store.error.message}</p>}
      {store.isLoading && <p className="files-empty">正在处理本地文件…</p>}
      <section className="files-list">
        <header>
          <h2>真实项目文件</h2>
          <span>{store.files.length} 个文件</span>
        </header>
        {store.files.length === 0 ? (
          <p className="files-empty">
            尚未导入文件。选择文件或拖入文件开始建立本地资料库。
          </p>
        ) : (
          store.files.map((file) => (
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
              <button disabled={store.isLoading} onClick={() => void store.openLocation(file.id).catch(() => undefined)}>
                <FolderOpen size={16} /> 位置
              </button>
              <button
                className="file-remove"
                disabled={store.isLoading}
                onClick={() => {
                  if (
                    window.confirm(`确定从项目移除“${file.originalName}”吗？`)
                  )
                    void store.removeFile(file.id).catch(() => undefined);
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

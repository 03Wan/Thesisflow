import { useEffect, useState } from "react";
import { Check, Pencil, Plus, Trash2 } from "lucide-react";
import { useProjectStore } from "@/stores/project-store";
import { useTaskStore } from "@/stores/task-store";
import { useWorkflowStore } from "@/stores/workflow-store";
import type {
  Task,
  TaskPriority,
  TaskSourceType,
  TaskStatus,
} from "@/types/domain";
import "./revision.css";
const priorities: TaskPriority[] = ["critical", "high", "medium", "low"];
const statuses: TaskStatus[] = ["todo", "in_progress", "waiting", "done"];
const sources: TaskSourceType[] = [
  "manual",
  "advisor",
  "ai",
  "plagiarism",
  "review",
  "defense",
  "format",
];
const labels: Record<string, string> = {
  critical: "紧急",
  high: "高",
  medium: "中",
  low: "低",
  todo: "待办",
  in_progress: "进行中",
  waiting: "等待",
  done: "已完成",
  manual: "手动",
  advisor: "导师",
  ai: "AI",
  plagiarism: "查重",
  review: "评阅",
  defense: "答辩",
  format: "格式",
};
const blank = {
  title: "",
  priority: "medium" as TaskPriority,
  status: "todo" as TaskStatus,
  sourceType: "manual" as TaskSourceType,
  dueAt: "",
  stageKey: "",
};
export function TaskManagerPage() {
  const projects = useProjectStore(),
    store = useTaskStore(),
    workflow = useWorkflowStore();
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<Task | null>(null);
  const project =
    projects.projects.find((p) => p.id === projects.activeProjectId) ??
    projects.projects[0];
  useEffect(() => {
    void projects.loadProjects();
  }, [projects.loadProjects]);
  useEffect(() => {
    if (project) {
      void store.load(project.id);
      void workflow.loadStages(project.id);
    }
  }, [project?.id, store.load, workflow.loadStages]);
  const save = async () => {
    if (!project) return;
    const stage = workflow.stages.find((s) => s.stageKey === form.stageKey);
    const now = new Date().toISOString();
    if (editing) {
      await store.update(editing.id, {
        title: form.title,
        priority: form.priority,
        status: form.status,
        sourceType: form.sourceType,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
        workflowStageId: stage?.id ?? null,
      });
      setEditing(null);
    } else {
      await store.create({
        id: crypto.randomUUID(),
        projectId: project.id,
        workflowStageId: stage?.id ?? null,
        stageKey: stage?.stageKey ?? null,
        title: form.title,
        description: null,
        sourceType: form.sourceType,
        sourceReferenceId: null,
        priority: form.priority,
        status: form.status,
        dueAt: form.dueAt ? new Date(form.dueAt).toISOString() : null,
        completedAt: form.status === "done" ? now : null,
        sortOrder: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
    setForm(blank);
  };
  return (
    <section className="revision-page">
      <header className="rev-page-title">
        <div>
          <p>修改阶段</p>
          <h1>修改任务</h1>
        </div>
      </header>
      {project ? (
        <>
          <section className="rev-card">
            <h2>{editing ? "修改任务" : "新建任务"}</h2>
            <div className="task-form">
              <input
                placeholder="任务标题"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as TaskPriority })
                }
              >
                {priorities.map((x) => (
                  <option key={x} value={x}>
                    {labels[x]}
                  </option>
                ))}
              </select>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as TaskStatus })
                }
              >
                {statuses.map((x) => (
                  <option key={x} value={x}>
                    {labels[x]}
                  </option>
                ))}
              </select>
              <select
                value={form.sourceType}
                onChange={(e) =>
                  setForm({
                    ...form,
                    sourceType: e.target.value as TaskSourceType,
                  })
                }
              >
                {sources.map((x) => (
                  <option key={x} value={x}>
                    {labels[x]}
                  </option>
                ))}
              </select>
              <select
                value={form.stageKey}
                onChange={(e) => setForm({ ...form, stageKey: e.target.value })}
              >
                <option value="">不绑定阶段</option>
                {workflow.stages.map((s) => (
                  <option key={s.id} value={s.stageKey}>
                    {s.title}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={form.dueAt}
                onChange={(e) => setForm({ ...form, dueAt: e.target.value })}
              />
              <button className="primary-button" disabled={store.isLoading} onClick={() => void save().catch(() => undefined)}>
                <Plus size={15} />
                {editing ? "保存修改" : "新增任务"}
              </button>
            </div>
            {store.error && (
              <p className="workflow-error">{store.error.message}</p>
            )}
            {store.isLoading && <p className="workflow-error">正在保存任务…</p>}
          </section>
          <section className="rev-card table-card">
            <table className="rev-table">
              <thead>
                <tr>
                  <th>任务</th>
                  <th>来源</th>
                  <th>优先级</th>
                  <th>状态</th>
                  <th>阶段</th>
                  <th>截止</th>
                  <th>操作</th>
                </tr>
              </thead>
            <tbody>
              {!store.isLoading && store.tasks.length === 0 && <tr><td colSpan={7}>暂无任务</td></tr>}
                {store.tasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <b>{task.title}</b>
                    </td>
                    <td>{labels[task.sourceType]}</td>
                    <td>{labels[task.priority]}</td>
                    <td>{labels[task.status]}</td>
                    <td>{task.stageKey ?? "—"}</td>
                    <td>
                      {task.dueAt
                        ? new Date(task.dueAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <button
                        disabled={store.isLoading}
                        onClick={() =>
                          void store.update(task.id, { status: "done" })
                        }
                      >
                        <Check size={14} />
                      </button>
                      <button
                        disabled={store.isLoading}
                        onClick={() => {
                          setEditing(task);
                          setForm({
                            title: task.title,
                            priority: task.priority,
                            status: task.status,
                            sourceType: task.sourceType,
                            dueAt: task.dueAt?.slice(0, 10) ?? "",
                            stageKey: task.stageKey ?? "",
                          });
                        }}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        disabled={store.isLoading}
                        onClick={() => {
                          if (window.confirm(`删除任务“${task.title}”？`))
                            void store.remove(task.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </>
      ) : (
        <p>请先打开项目。</p>
      )}
    </section>
  );
}

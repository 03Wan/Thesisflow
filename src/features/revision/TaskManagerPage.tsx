import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, Check, CircleCheck, ClipboardList, Clock3, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { ProjectRequiredState } from "@/components/common/ProjectRequiredState";
import { useProjectStore } from "@/stores/project-store";
import { useTaskStore } from "@/stores/task-store";
import { useWorkflowStore } from "@/stores/workflow-store";
import type { Task, TaskPriority, TaskSourceType, TaskStatus } from "@/types/domain";
import { useSearchParams } from "react-router-dom";
import "./revision.css";
import "./task-manager.css";

const priorities: TaskPriority[] = ["critical", "high", "medium", "low"];
const statuses: TaskStatus[] = ["todo", "in_progress", "waiting", "done"];
const sources: TaskSourceType[] = ["manual", "advisor", "ai", "plagiarism", "review", "defense", "format"];
const labels: Record<string, string> = {
  critical: "紧急", high: "高", medium: "中", low: "低",
  todo: "待办", in_progress: "进行中", waiting: "等待", done: "已完成",
  manual: "手动", advisor: "导师意见", ai: "AI", plagiarism: "查重", review: "评阅", defense: "答辩", format: "格式",
};
const blank = { title: "", description: "", priority: "medium" as TaskPriority, status: "todo" as TaskStatus, sourceType: "manual" as TaskSourceType, dueAt: "", stageKey: "" };
type Filter = "all" | TaskStatus;
const dateLabel = (value: string | null) => value ? value.slice(0, 10).replace(/-/g, "/") : "未设置";

export function TaskManagerPage() {
  const projects = useProjectStore();
  const store = useTaskStore();
  const workflow = useWorkflowStore();
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<Task | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [searchParams, setSearchParams] = useSearchParams();
  const project = projects.projects.find((item) => item.id === projects.activeProjectId) ?? projects.projects[0];

  useEffect(() => { void projects.loadProjects(); }, [projects.loadProjects]);
  useEffect(() => { if (project) { void store.load(project.id); void workflow.loadStages(project.id); } }, [project?.id, store.load, workflow.loadStages]);
  useEffect(() => {
    const requestedFilter = searchParams.get("filter");
    const requestedSource = searchParams.get("source");
    if (requestedFilter && ["todo", "in_progress", "waiting", "done"].includes(requestedFilter)) setFilter(requestedFilter as TaskStatus);
    else setFilter("all");
    setQuery(requestedSource === "ai" ? "AI" : "");
  }, [searchParams]);

  const counts = useMemo(() => ({
    all: store.tasks.length,
    todo: store.tasks.filter((task) => task.status === "todo").length,
    in_progress: store.tasks.filter((task) => task.status === "in_progress").length,
    waiting: store.tasks.filter((task) => task.status === "waiting").length,
    done: store.tasks.filter((task) => task.status === "done").length,
  }), [store.tasks]);
  const visibleTasks = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    return store.tasks.filter((task) => (filter === "all" || task.status === filter) && (!normalized || `${task.title} ${task.description ?? ""} ${labels[task.sourceType]}`.toLocaleLowerCase().includes(normalized)));
  }, [filter, query, store.tasks]);
  const stageName = (task: Task) => workflow.stages.find((stage) => stage.stageKey === task.stageKey)?.title ?? task.stageKey ?? "未绑定";
  const resetForm = () => { setEditing(null); setForm(blank); };

  const save = async () => {
    if (!project || !form.title.trim()) return;
    const stage = workflow.stages.find((item) => item.stageKey === form.stageKey);
    const now = new Date().toISOString();
    const common = {
      title: form.title.trim(), description: form.description.trim() || null, priority: form.priority,
      status: form.status, sourceType: form.sourceType, dueAt: form.dueAt ? `${form.dueAt}T23:59:59.000Z` : null,
      workflowStageId: stage?.id ?? null, stageKey: stage?.stageKey ?? null,
    };
    if (editing) await store.update(editing.id, { ...common, completedAt: form.status === "done" ? editing.completedAt ?? now : null });
    else await store.create({ id: crypto.randomUUID(), projectId: project.id, ...common, sourceReferenceId: null, completedAt: form.status === "done" ? now : null, sortOrder: 0, createdAt: now, updatedAt: now });
    resetForm();
  };

  const beginEdit = (task: Task) => {
    setEditing(task);
    setForm({ title: task.title, description: task.description ?? "", priority: task.priority, status: task.status, sourceType: task.sourceType, dueAt: task.dueAt?.slice(0, 10) ?? "", stageKey: task.stageKey ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return <section className="revision-page task-manager-page">
    <header className="rev-page-title task-page-title">
      <div><p>修改阶段 / 任务管理</p><h1>修改任务</h1><span>集中管理个人批注、AI 检查和评阅意见，逐项推进论文修改。</span></div>
      <em className="rev-badge rev-badge-blue">学生修改清单</em>
    </header>
    {project ? <>
      <section className="task-overview" aria-label="修改任务概览">
        <article><ClipboardList size={18} /><div><span>全部任务</span><b>{counts.all} 项</b></div></article>
        <article><Clock3 size={18} /><div><span>进行中</span><b>{counts.in_progress} 项</b></div></article>
        <article><AlertTriangle size={18} /><div><span>待处理</span><b>{counts.todo + counts.waiting} 项</b></div></article>
        <article><CircleCheck size={18} /><div><span>已完成</span><b>{counts.done} 项</b></div></article>
      </section>

      <section className={`rev-card task-composer ${editing ? "is-editing" : ""}`}>
        <header><div><h2>{editing ? "编辑修改任务" : "新建修改任务"}</h2><p>{editing ? `正在修改“${editing.title}”` : "补充任务内容与归属，创建后即可在下方跟踪进度。"}</p></div>{editing && <button className="task-icon-button" onClick={resetForm} aria-label="取消编辑"><X size={16} /></button>}</header>
        <div className="task-editor-grid">
          <label className="task-field task-title-field"><span>任务标题</span><input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="例如：补充稳健性检验并更新结论" /></label>
          <label className="task-field task-description-field"><span>任务说明 <i>选填</i></span><textarea rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="记录需要修改的位置、目标或验收标准" /></label>
          <label className="task-field"><span>优先级</span><select value={form.priority} onChange={(event) => setForm({ ...form, priority: event.target.value as TaskPriority })}>{priorities.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label>
          <label className="task-field"><span>任务状态</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TaskStatus })}>{statuses.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label>
          <label className="task-field"><span>任务来源</span><select value={form.sourceType} onChange={(event) => setForm({ ...form, sourceType: event.target.value as TaskSourceType })}>{sources.map((item) => <option key={item} value={item}>{labels[item]}</option>)}</select></label>
          <label className="task-field"><span>关联阶段</span><select value={form.stageKey} onChange={(event) => setForm({ ...form, stageKey: event.target.value })}><option value="">不绑定阶段</option>{workflow.stages.map((stage) => <option key={stage.id} value={stage.stageKey}>{stage.title}</option>)}</select></label>
          <label className="task-field"><span>截止日期</span><div className="task-date-input"><CalendarDays size={15} /><input type="date" value={form.dueAt} onChange={(event) => setForm({ ...form, dueAt: event.target.value })} /></div></label>
        </div>
        <footer><p>{form.title.trim() ? "任务信息可随时在列表中继续修改。" : "填写任务标题后即可保存。"}</p><div>{editing && <button className="secondary-button" onClick={resetForm}>取消</button>}<button className="primary-button" disabled={store.isLoading || !form.title.trim()} onClick={() => void save().catch(() => undefined)}><Plus size={15} />{editing ? "保存修改" : "新增任务"}</button></div></footer>
        {store.error && <p className="workflow-error">{store.error.message}</p>}
      </section>

      <section className="rev-card task-list-card">
        <header className="task-list-toolbar"><div><h2>任务清单</h2><p>共 {store.tasks.length} 项，当前显示 {visibleTasks.length} 项</p></div><div className="task-list-controls"><label className="task-search"><Search size={15} /><input value={query} onChange={(event) => { setQuery(event.target.value); if (searchParams.toString()) setSearchParams({}); }} placeholder="搜索任务" aria-label="搜索修改任务" /></label><nav aria-label="任务状态筛选">{(["all", "todo", "in_progress", "waiting", "done"] as Filter[]).map((item) => <button key={item} className={filter === item ? "active" : ""} onClick={() => { setFilter(item); setSearchParams(item === "all" ? {} : { filter: item }); }}>{item === "all" ? "全部" : labels[item]}<span>{counts[item]}</span></button>)}</nav></div></header>
        <div className="task-list">
          {!store.isLoading && visibleTasks.length === 0 && <div className="task-empty"><ClipboardList size={24} /><b>{query ? "没有匹配的任务" : "当前筛选下暂无任务"}</b><span>调整搜索词或状态筛选后再试。</span></div>}
          {visibleTasks.map((task) => <article className={`task-row priority-${task.priority}`} key={task.id}>
            <button className={`task-check ${task.status === "done" ? "checked" : ""}`} aria-label={`${task.status === "done" ? "恢复" : "完成"}任务：${task.title}`} disabled={store.isLoading} onClick={() => void store.update(task.id, { status: task.status === "done" ? "todo" : "done", completedAt: task.status === "done" ? null : new Date().toISOString() })}><Check size={15} /></button>
            <div className="task-row-main"><div><b>{task.title}</b><span className={`rev-badge task-status status-${task.status}`}>{labels[task.status]}</span><span className={`rev-badge priority-badge priority-${task.priority}`}>{labels[task.priority]}</span></div><p>{task.description || "暂无任务说明"}</p></div>
            <dl className="task-meta"><div><dt>来源</dt><dd>{labels[task.sourceType]}</dd></div><div><dt>阶段</dt><dd>{stageName(task)}</dd></div><div><dt>截止</dt><dd className={task.dueAt ? "" : "muted"}>{dateLabel(task.dueAt)}</dd></div></dl>
            <div className="task-row-actions"><button aria-label={`编辑任务：${task.title}`} onClick={() => beginEdit(task)}><Pencil size={15} /></button><button className="danger" aria-label={`删除任务：${task.title}`} onClick={() => { if (window.confirm(`删除任务“${task.title}”？`)) void store.remove(task.id); }}><Trash2 size={15} /></button></div>
          </article>)}
        </div>
      </section>
    </> : <ProjectRequiredState title="打开项目后管理修改任务" description="将个人批注、AI 检查和评阅问题转成可追踪的修改任务。" />}
  </section>;
}

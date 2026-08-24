import { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, MessageSquareText, Pencil, Plus, Trash2, X } from "lucide-react";
import { useAdvisorStore } from "@/stores/advisor-store";
import { useProjectStore } from "@/stores/project-store";
import type { AdvisorSession, AdvisorSessionMethod, AdvisorSessionStatus } from "@/types/domain";
import { ProjectRequiredState } from "@/components/common/ProjectRequiredState";
import "./revision.css";
import "./guidance-page.css";

const methods: AdvisorSessionMethod[] = ["in_person", "online", "phone", "email", "other"];
const statuses: AdvisorSessionStatus[] = ["planned", "completed", "cancelled"];
const label: Record<string, string> = {
  in_person: "线下面谈", online: "线上会议", phone: "电话", email: "邮件", other: "其他",
  planned: "计划中", completed: "已完成", cancelled: "已取消",
};
const blank = {
  date: new Date().toISOString().slice(0, 10), method: "in_person" as AdvisorSessionMethod,
  content: "", advisorComment: "", nextAction: "", status: "completed" as AdvisorSessionStatus,
};

export function AdvisorSessionsPage() {
  const projects = useProjectStore();
  const store = useAdvisorStore();
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<AdvisorSession | null>(null);
  const project = projects.projects.find((item) => item.id === projects.activeProjectId) ?? projects.projects[0];
  const completedCount = useMemo(() => store.sessions.filter((item) => item.status === "completed").length, [store.sessions]);

  useEffect(() => { void projects.loadProjects(); }, [projects.loadProjects]);
  useEffect(() => { if (project) void store.load(project.id); }, [project?.id, store.load]);

  const reset = () => { setEditing(null); setForm(blank); };
  const save = async () => {
    if (!project) return;
    const now = new Date().toISOString();
    const values = {
      sessionAt: new Date(`${form.date}T12:00:00`).toISOString(), method: form.method,
      summary: form.content.trim(), feedback: form.advisorComment.trim(), nextSteps: form.nextAction.trim(), status: form.status,
    };
    if (editing) await store.update(editing.id, values);
    else await store.create({
      id: crypto.randomUUID(), projectId: project.id, workflowStageId: null,
      sessionNumber: Math.max(0, ...store.sessions.map((item) => item.sessionNumber)) + 1,
      advisorName: project.advisorName || "指导教师", createdAt: now, updatedAt: now, ...values,
    });
    reset();
  };

  return (
    <section className="revision-page guidance-page">
      <header className="rev-page-title guidance-title">
        <div>
          <p>修改阶段 / 沟通记录</p>
          <h1>导师指导</h1>
          <span>记录每次沟通结论、导师意见与下一步行动，形成可追溯的指导档案。</span>
        </div>
        <em className="rev-badge rev-badge-blue">学生工作台记录</em>
      </header>

      {project ? <>
        <div className="guidance-overview" aria-label="指导概览">
          <article className="rev-card"><MessageSquareText size={18} /><div><span>指导记录</span><b>{store.sessions.length} 次</b></div></article>
          <article className="rev-card"><CheckCircle2 size={18} /><div><span>已完成</span><b>{completedCount} 次</b></div></article>
          <article className="rev-card"><Clock3 size={18} /><div><span>最近沟通</span><b>{store.sessions[0] ? new Date(store.sessions[0].sessionAt).toLocaleDateString("zh-CN") : "尚未记录"}</b></div></article>
        </div>

        <section className="rev-card guidance-composer">
          <header>
            <div><h2>{editing ? `修改第 ${editing.sessionNumber} 次指导` : "新增指导记录"}</h2><p>先填写沟通基本信息，再归纳本次指导的三项核心内容。</p></div>
            {editing && <button className="text-button" onClick={reset}><X size={14} />取消修改</button>}
          </header>
          <div className="guidance-form">
            <label><span>指导日期</span><div className="guidance-input-icon"><CalendarDays size={15} /><input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div></label>
            <label><span>沟通方式</span><select value={form.method} onChange={(event) => setForm({ ...form, method: event.target.value as AdvisorSessionMethod })}>{methods.map((item) => <option key={item} value={item}>{label[item]}</option>)}</select></label>
            <label><span>记录状态</span><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as AdvisorSessionStatus })}>{statuses.map((item) => <option key={item} value={item}>{label[item]}</option>)}</select></label>
            <label className="guidance-field-wide"><span>指导内容</span><textarea rows={3} placeholder="例如：讨论研究问题、变量口径和章节推进顺序" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} /></label>
            <label><span>导师意见</span><textarea rows={3} placeholder="记录需要调整、补充或重点关注的内容" value={form.advisorComment} onChange={(event) => setForm({ ...form, advisorComment: event.target.value })} /></label>
            <label><span>学生下一步行动</span><textarea rows={3} placeholder="拆解为可以执行和检查的下一步任务" value={form.nextAction} onChange={(event) => setForm({ ...form, nextAction: event.target.value })} /></label>
          </div>
          <footer>
            <span>{store.error?.message ?? "记录仅归档到当前论文项目。"}</span>
            <button className="primary-button" disabled={store.isLoading || !form.content.trim()} onClick={() => void save().catch(() => undefined)}><Plus size={15} />{editing ? "保存修改" : "新增记录"}</button>
          </footer>
        </section>

        <section className="guidance-history">
          <header><div><h2>指导记录</h2><p>按时间倒序展示，共 {store.sessions.length} 条</p></div></header>
          <div className="shared-timeline">
            {!store.isLoading && store.sessions.length === 0 && <div className="guidance-empty">暂无指导记录，请先填写上方表单。</div>}
            {store.sessions.map((session) => <article className="timeline-item" key={session.id}>
              <div className="timeline-marker">{session.sessionNumber}</div>
              <section className="rev-card">
                <div className="timeline-meta"><b>第 {session.sessionNumber} 次指导</b><span>{new Date(session.sessionAt).toLocaleDateString("zh-CN")} · {label[session.method]}</span><em className={`rev-badge ${session.status === "completed" ? "rev-badge-green" : session.status === "planned" ? "rev-badge-blue" : "rev-badge-gray"}`}>{label[session.status]}</em></div>
                <dl className="guidance-grid">
                  <div><dt>指导内容</dt><dd>{session.summary || "—"}</dd></div>
                  <div><dt>导师意见</dt><dd>{session.feedback || "—"}</dd></div>
                  <div><dt>学生下一步行动</dt><dd>{session.nextSteps || "—"}</dd></div>
                </dl>
                <div className="guidance-actions">
                  <button onClick={() => { setEditing(session); setForm({ date: session.sessionAt.slice(0, 10), method: session.method, content: session.summary, advisorComment: session.feedback, nextAction: session.nextSteps, status: session.status }); window.scrollTo({ top: 0, behavior: "smooth" }); }}><Pencil size={14} />修改</button>
                  <button className="danger" onClick={() => { if (window.confirm(`删除第 ${session.sessionNumber} 次指导记录？`)) void store.remove(session.id); }}><Trash2 size={14} />删除</button>
                </div>
              </section>
            </article>)}
          </div>
        </section>
      </> : <ProjectRequiredState title="打开项目后记录导师指导" description="指导时间、导师意见和下一步行动都会归档到当前论文项目。" />}
    </section>
  );
}

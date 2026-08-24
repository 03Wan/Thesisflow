import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useAdvisorStore } from "@/stores/advisor-store";
import { useProjectStore } from "@/stores/project-store";
import type {
  AdvisorSession,
  AdvisorSessionMethod,
  AdvisorSessionStatus,
} from "@/types/domain";
import "./revision.css";
const methods: AdvisorSessionMethod[] = [
  "in_person",
  "online",
  "phone",
  "email",
  "other",
];
const statuses: AdvisorSessionStatus[] = ["planned", "completed", "cancelled"];
const label: Record<string, string> = {
  in_person: "线下面谈",
  online: "线上会议",
  phone: "电话",
  email: "邮件",
  other: "其他",
  planned: "计划",
  completed: "已完成",
  cancelled: "已取消",
};
const blank = {
  date: new Date().toISOString().slice(0, 10),
  method: "in_person" as AdvisorSessionMethod,
  content: "",
  advisorComment: "",
  nextAction: "",
  status: "completed" as AdvisorSessionStatus,
};
export function AdvisorSessionsPage() {
  const projects = useProjectStore(),
    store = useAdvisorStore();
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<AdvisorSession | null>(null);
  const project =
    projects.projects.find((p) => p.id === projects.activeProjectId) ??
    projects.projects[0];
  useEffect(() => {
    void projects.loadProjects();
  }, [projects.loadProjects]);
  useEffect(() => {
    if (project) void store.load(project.id);
  }, [project?.id, store.load]);
  const save = async () => {
    if (!project) return;
    const now = new Date().toISOString();
    const values = {
      sessionAt: new Date(form.date).toISOString(),
      method: form.method,
      summary: form.content,
      feedback: form.advisorComment,
      nextSteps: form.nextAction,
      status: form.status,
    };
    if (editing) {
      await store.update(editing.id, values);
      setEditing(null);
    } else
      await store.create({
        id: crypto.randomUUID(),
        projectId: project.id,
        workflowStageId: null,
        sessionNumber:
          Math.max(0, ...store.sessions.map((s) => s.sessionNumber)) + 1,
        advisorName: project.advisorName,
        createdAt: now,
        updatedAt: now,
        ...values,
      });
    setForm(blank);
  };
  return (
    <section className="revision-page">
      <header className="rev-page-title">
        <div>
          <p>修改阶段</p>
          <h1>导师指导</h1>
        </div>
      </header>
      {project ? (
        <>
          <section className="rev-card">
            <h2>{editing ? "修改指导记录" : "新增指导记录"}</h2>
            <div className="task-form">
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
              />
              <select
                value={form.method}
                onChange={(e) =>
                  setForm({
                    ...form,
                    method: e.target.value as AdvisorSessionMethod,
                  })
                }
              >
                {methods.map((x) => (
                  <option key={x} value={x}>
                    {label[x]}
                  </option>
                ))}
              </select>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm({
                    ...form,
                    status: e.target.value as AdvisorSessionStatus,
                  })
                }
              >
                {statuses.map((x) => (
                  <option key={x} value={x}>
                    {label[x]}
                  </option>
                ))}
              </select>
              <input
                placeholder="指导内容"
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
              <input
                placeholder="导师意见"
                value={form.advisorComment}
                onChange={(e) =>
                  setForm({ ...form, advisorComment: e.target.value })
                }
              />
              <input
                placeholder="学生下一步行动"
                value={form.nextAction}
                onChange={(e) =>
                  setForm({ ...form, nextAction: e.target.value })
                }
              />
              <button className="primary-button" disabled={store.isLoading} onClick={() => void save().catch(() => undefined)}>
                <Plus size={15} />
                {editing ? "保存修改" : "新增记录"}
              </button>
            </div>
            {store.error && (
              <p className="workflow-error">{store.error.message}</p>
            )}
            {store.isLoading && <p className="workflow-error">正在保存指导记录…</p>}
          </section>
          <div className="shared-timeline">
            {!store.isLoading && store.sessions.length === 0 && <p>暂无指导记录</p>}
            {store.sessions.map((session) => (
              <article className="timeline-item" key={session.id}>
                <div className="timeline-marker">{session.sessionNumber}</div>
                <section className="rev-card">
                  <div className="timeline-meta">
                    <b>第 {session.sessionNumber} 次指导</b>
                    <span>
                      {new Date(session.sessionAt).toLocaleDateString()} ·{" "}
                      {label[session.method]}
                    </span>
                    <span>{label[session.status]}</span>
                  </div>
                  <dl className="guidance-grid">
                    <div>
                      <dt>指导内容</dt>
                      <dd>{session.summary || "—"}</dd>
                    </div>
                    <div>
                      <dt>导师意见</dt>
                      <dd>{session.feedback || "—"}</dd>
                    </div>
                    <div>
                      <dt>学生下一步行动</dt>
                      <dd>{session.nextSteps || "—"}</dd>
                    </div>
                  </dl>
                  <button
                    disabled={store.isLoading}
                    onClick={() => {
                      setEditing(session);
                      setForm({
                        date: session.sessionAt.slice(0, 10),
                        method: session.method,
                        content: session.summary,
                        advisorComment: session.feedback,
                        nextAction: session.nextSteps,
                        status: session.status,
                      });
                    }}
                  >
                    <Pencil size={14} /> 修改
                  </button>
                  <button
                    disabled={store.isLoading}
                    onClick={() => {
                      if (
                        window.confirm(
                          `删除第 ${session.sessionNumber} 次指导记录？`,
                        )
                      )
                        void store.remove(session.id);
                    }}
                  >
                    <Trash2 size={14} /> 删除
                  </button>
                </section>
              </article>
            ))}
          </div>
        </>
      ) : (
        <p>请先打开项目。</p>
      )}
    </section>
  );
}

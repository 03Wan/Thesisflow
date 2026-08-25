import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  GraduationCap,
} from "lucide-react";
import { useProjectStore } from "@/stores/project-store";
import { useWorkflowStore } from "@/stores/workflow-store";
import { useFileStore } from "@/stores/file-store";
import { useTaskStore } from "@/stores/task-store";
import { useRequirementStore } from "@/stores/requirement-store";
import type { WorkflowStageStatus } from "@/types/domain";
import "./workflow.css";

const ratio = (value: number, target: number) =>
  Math.min(100, Math.round((value / target) * 100));
const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
const stageRoutes: Record<string, string> = {
  requirements: "/requirements",
  topic: "/topic",
  taskbook: "/task-book",
  literature: "/literature",
  proposal: "/proposal",
  research: "/implementation",
  first_draft: "/writing",
  midterm: "/midterm",
  revision: "/guidance",
  final_draft: "/finalization",
  plagiarism: "/plagiarism",
  advisor_review: "/teacher-review",
  reviewer_review: "/teacher-review",
  inspection: "/sampling",
  defense_preparation: "/defense-prep",
  defense: "/defense",
  post_defense_revision: "/post-defense-revision",
  final_submission: "/final-manuscript",
  archive: "/archive",
};
const statusLabels: Record<WorkflowStageStatus, string> = {
  not_started: "未开始",
  in_progress: "进行中",
  completed: "已完成",
  overdue: "已逾期",
  blocked: "已阻塞",
};
const priorityLabels = { critical: "紧急", high: "高", medium: "中", low: "低" } as const;

function MonthCalendar() {
  const [month, setMonth] = useState(() => new Date());
  const first = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const total = new Date(
    month.getFullYear(),
    month.getMonth() + 1,
    0,
  ).getDate();
  const today = new Date();
  return (
    <section className="overview-card calendar">
      <header>
        <h2>日程日历</h2>
        <span>
          <button
            onClick={() =>
              setMonth(
                (value) =>
                  new Date(value.getFullYear(), value.getMonth() - 1, 1),
              )
            }
            aria-label="上个月"
          >
            <ChevronLeft size={14} />
          </button>
          <strong>
            {month.getFullYear()}年{month.getMonth() + 1}月
          </strong>
          <button
            onClick={() =>
              setMonth(
                (value) =>
                  new Date(value.getFullYear(), value.getMonth() + 1, 1),
              )
            }
            aria-label="下个月"
          >
            <ChevronRight size={14} />
          </button>
        </span>
      </header>
      <div className="weekdays">
        {weekdays.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="calendar-days">
        {Array.from({ length: first }, (_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {Array.from({ length: total }, (_, i) => {
          const day = i + 1;
          const selected =
            day === today.getDate() &&
            month.getFullYear() === today.getFullYear() &&
            month.getMonth() === today.getMonth();
          return (
            <button
              className={selected ? "selected" : ""}
              key={day}
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth(), day))
              }
            >
              {day}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function OverviewPage() {
  const navigate = useNavigate();
  const projectStore = useProjectStore();
  const workflow = useWorkflowStore();
  const files = useFileStore();
  const tasks = useTaskStore();
  const requirements = useRequirementStore();
  useEffect(() => {
    void projectStore.loadProjects();
  }, [projectStore.loadProjects]);
  const activeProject =
    projectStore.projects.find(
      (item) => item.id === projectStore.activeProjectId,
    ) ?? projectStore.projects[0];
  useEffect(() => {
    if (activeProject) void workflow.loadStages(activeProject.id);
  }, [activeProject?.id, workflow.loadStages]);
  useEffect(() => {
    if (activeProject) void files.loadFiles(activeProject.id);
  }, [activeProject?.id, files.loadFiles]);
  useEffect(() => {
    if (activeProject) { void tasks.load(activeProject.id); void requirements.load(activeProject.id); }
  }, [activeProject?.id, tasks.load, requirements.load]);
  const openTasks = tasks.tasks.filter((item) => item.status !== "done");
  const upcomingTasks = openTasks
    .filter((item) => item.dueAt)
    .sort((left, right) => String(left.dueAt).localeCompare(String(right.dueAt)))
    .slice(0, 3);
  const currentStage = workflow.stages.find(
    (stage) => stage.stageKey === workflow.currentStageKey,
  );
  const progress =
    activeProject && workflow.projectId === activeProject.id
      ? workflow.progress
      : (activeProject?.progress ?? 0);
  return (
    <div className="overview-page">
      <section className="overview-hero">
        <div className="hero-icon">
          <GraduationCap size={52} />
        </div>
        <div className="hero-meta">
          <h1>项目总览</h1>
          <h2>
            {activeProject?.title ?? "未打开项目"}
            <span>本科毕业论文</span>
          </h2>
          <div className="hero-details" aria-label="项目基础信息">
            {[
              ["学校", activeProject?.school],
              ["学院", activeProject?.college],
              ["专业", activeProject?.major],
              ["年级", activeProject?.grade],
            ].map(([label, value]) => (
              <div className="hero-detail" key={label}>
                <span>{label}</span>
                <strong className={value ? "" : "is-empty"}>{value || "待完善"}</strong>
              </div>
            ))}
          </div>
          <div className="hero-supporting-meta">
            <span>学生 <strong>{activeProject?.studentName || "待完善"}</strong></span>
            <i />
            <span>学号 <strong>{activeProject?.studentNumber || "待完善"}</strong></span>
            <i />
            <span>
              创建于 <strong>{activeProject ? new Date(activeProject.createdAt).toLocaleDateString() : "—"}</strong>
            </span>
          </div>
        </div>
        <div className="hero-progress">
          <small>当前阶段</small>
          <strong>{currentStage?.title ?? "未选择"}</strong>
          <div className="thin-progress">
            <i style={{ width: `${progress}%` }} />
          </div>
          <p>
            总体进度 <b>{progress}%</b>
          </p>
        </div>
      </section>
      <section className="overview-card requirements">
        <header>
          <h2>论文规范达成情况</h2>
          <button onClick={() => navigate("/requirements")}>编辑规范</button>
        </header>
        <div className="requirement-grid">{requirements.requirements.length === 0 ? <p className="list-row">未配置学校要求</p> : requirements.requirements.map((item) => <article className="requirement blue" key={item.id}><div><small>{item.label}</small>{item.targetValue !== null && item.currentValue >= item.targetValue && <CheckCircle2 size={14}/>}</div><strong>{item.currentValue}<em> / {item.targetValue ?? "—"}{item.unit}</em></strong>{item.targetValue !== null && <><div className="thin-progress"><i style={{width:`${ratio(item.currentValue,item.targetValue)}%`}}/></div><p>{ratio(item.currentValue,item.targetValue)}%</p></>}</article>)}</div>
      </section>
      <div className="overview-columns">
        <div className="overview-main">
          <section
            className="overview-card workflow"
            aria-label="19 阶段工作流"
          >
            <header>
              <h2>工作流程</h2>
              <div className="workflow-legend">
                <span className="completed">已完成</span>
                <span className="in_progress">进行中</span>
                <span>待开始</span>
                <span className="overdue">已逾期</span>
              </div>
            </header>
            {workflow.error && "__TAURI_INTERNALS__" in window && (
              <p className="workflow-error">{workflow.error.message}</p>
            )}
            <div className="workflow-grid">
              {workflow.stages.map((stage) => (
                <article
                  className={`workflow-stage ${stage.status}`}
                  key={stage.id}
                >
                  <button
                    className="workflow-stage-link"
                    onClick={() =>
                      navigate(stageRoutes[stage.stageKey] ?? "/overview")
                    }
                  >
                    <div className="workflow-dot">
                      {String(stage.stageNumber).padStart(2, "0")}
                    </div>
                    <strong>
                      {String(stage.stageNumber).padStart(2, "0")} {stage.title}
                    </strong>
                    <small>{statusLabels[stage.status]}</small>
                  </button>
                  <select
                    aria-label={`${stage.title} 状态`}
                    value={stage.status}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      void workflow.setStageStatus(
                        stage.id,
                        event.target.value as WorkflowStageStatus,
                      )
                    }
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option value={value} key={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            </div>
          </section>
          <div className="bottom-grid">
            <section className="overview-card compact">
              <header>
                <h2>阶段进展</h2>
                <b>{workflow.stages.filter((stage) => stage.status === "completed").length} / {workflow.stages.length || 0} 项</b>
              </header>
              {workflow.stages.filter((stage) => stage.status !== "not_started").slice(0, 4).map((stage) => (
                <p className="list-row" key={stage.id}>
                  <span>{String(stage.stageNumber).padStart(2, "0")}　{stage.title}</span>
                  <small>{statusLabels[stage.status]}</small>
                </p>
              ))}
              {workflow.stages.every((stage) => stage.status === "not_started") && <p className="list-row"><small>尚未开始论文阶段任务</small></p>}
              <button
                className="outline-button"
                onClick={() => navigate("/outline")}
              >
                查看论文大纲
              </button>
            </section>
            <section className="overview-card compact">
              <header>
                <h2>待办任务</h2>
                <b>{openTasks.length} 项</b>
              </header>
              {openTasks.slice(0, 4).map((todo) => (
                <p className="list-row todo" key={todo.id}>
                  <span>
                    <i />
                    <b>{todo.title}</b>
                    <em className={todo.priority}>{priorityLabels[todo.priority]}</em>
                  </span>
                  <small>截止：{todo.dueAt ? new Date(todo.dueAt).toLocaleDateString() : "—"}</small>
                </p>
              ))}
              {openTasks.length === 0 && <p className="list-row"><small>暂无待办任务</small></p>}
              <button
                className="outline-button"
                onClick={() => navigate("/revisions")}
              >
                查看全部任务
              </button>
            </section>
            <section className="overview-card evaluation">
              <header>
                <h2>AI论文智评</h2>
              </header>
              <p className="list-row"><small>暂无真实评估记录</small></p>
              <button
                className="outline-button"
                onClick={() => navigate("/compliance")}
              >
                进入评估
              </button>
            </section>
          </div>
        </div>
        <aside className="overview-rail">
          <section className="overview-card milestones" aria-label="近期节点">
            <h2>近期节点</h2>
            {upcomingTasks.map((task) => (
              <p key={task.id}>
                <time>{new Date(task.dueAt!).toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}</time>
                <span>{task.title}</span>
                <b>{task.priority === "high" ? "重要" : "计划"}</b>
              </p>
            ))}
            {upcomingTasks.length === 0 && <p className="list-row"><small>暂无节点数据</small></p>}
          </section>
          <MonthCalendar />
          <section className="overview-card compact files">
            <h2>文件动态</h2>
            {files.files.slice(0, 5).map((file) => (
              <p className="list-row" key={file.id}>
                <span>
                  {["xls", "xlsx", "csv"].includes(file.extension) ? (
                    <FileSpreadsheet size={15} />
                  ) : (
                    <FileText size={15} />
                  )}{" "}
                  {file.originalName}
                </span>
                <small>{new Date(file.updatedAt).toLocaleDateString()}</small>
              </p>
            ))}
            {files.files.length === 0 && <p className="list-row"><small>暂无真实项目文件</small></p>}
            <button
              className="outline-button"
              onClick={() => navigate("/files")}
            >
              查看全部文件
            </button>
          </section>
          <section className="overview-card rail-focus" aria-label="当前推进">
            <header><h2>当前推进</h2><b>{activeProject?.progress ?? 0}%</b></header>
            <div className="rail-focus-progress"><i style={{ width: `${activeProject?.progress ?? 0}%` }} /></div>
            <dl>
              <div><dt>当前阶段</dt><dd>{currentStage?.title ?? "尚未选择"}</dd></div>
              <div><dt>待处理任务</dt><dd>{openTasks.length} 项</dd></div>
              <div><dt>下一节点</dt><dd>{upcomingTasks[0]?.dueAt ? upcomingTasks[0].dueAt.slice(5, 10).replace("-", "/") : "暂无"}</dd></div>
            </dl>
            <button className="outline-button" onClick={() => navigate("/revisions")}>进入修改清单</button>
          </section>
        </aside>
      </div>
    </div>
  );
}

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
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { useProjectStore } from "@/stores/project-store";
import { useWorkflowStore } from "@/stores/workflow-store";
import { useFileStore } from "@/stores/file-store";
import { useTaskStore } from "@/stores/task-store";
import { useAdvisorStore } from "@/stores/advisor-store";
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
  revision: "/revisions",
  final_draft: "/finalization",
  plagiarism: "/plagiarism",
  advisor_review: "/advisor-review",
  reviewer_review: "/reviewer-review",
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
  const advisors = useAdvisorStore();
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
    if (activeProject) { void tasks.load(activeProject.id); void advisors.load(activeProject.id); void requirements.load(activeProject.id); }
  }, [activeProject?.id, tasks.load, advisors.load, requirements.load]);
  const advisorMinimum = requirements.requirements.find((item) => item.requirementKey === "advisor_session_min");
  const completedSessions = advisors.sessions.filter((item) => item.status === "completed");
  const openTasks = tasks.tasks.filter((item) => item.status !== "done");
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
          <p>
            {activeProject?.school || "未填写学校"}　
            {activeProject?.college || "未填写学院"}　
            {activeProject?.major || "未填写专业"}　
            {activeProject?.grade || "未填写年级"}
          </p>
          <p>
            指导教师：{activeProject?.advisorName || "未填写"}　　创建时间：
            {activeProject
              ? new Date(activeProject.createdAt).toLocaleDateString()
              : "—"}
          </p>
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
            {workflow.error && (
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
                    <small>
                      {stage.completedAt
                        ? new Date(stage.completedAt).toLocaleDateString()
                        : statusLabels[stage.status]}
                    </small>
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
                <h2>导师指导记录</h2>
                <b>
                  {completedSessions.length} / {advisorMinimum?.targetValue ?? "未配置"} 次
                </b>
              </header>
              {advisors.sessions.slice(0, 4).map((row) => (
                <p className="list-row" key={row.id}>
                  <span>
                    #{row.sessionNumber}　{row.summary || "导师指导记录"}
                  </span>
                  <small>{new Date(row.sessionAt).toLocaleDateString()}</small>
                </p>
              ))}
              {advisors.sessions.length === 0 && <p className="list-row"><small>暂无指导记录</small></p>}
              <button
                className="outline-button"
                onClick={() => navigate("/guidance")}
              >
                查看全部记录
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
                    <i /> {todo.title}
                    <em className={todo.priority}>{todo.priority}</em>
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
                <h2>
                  AI论文智评 <small>（最新）</small>
                </h2>
              </header>
              <div className="score">
                <strong>0</strong>
                <span>
                  良好
                  <br />
                  <b>★★★★★</b>
                </span>
              </div>
              <div className="radar">
                <ResponsiveContainer>
                  <RadarChart data={[]}>
                    <PolarGrid />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fontSize: 10, fill: "#667085" }}
                    />
                    <Radar
                      dataKey="score"
                      stroke="#315efb"
                      fill="#315efb"
                      fillOpacity={0.16}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <button
                className="outline-button"
                onClick={() => navigate("/compliance")}
              >
                查看详细报告
              </button>
            </section>
          </div>
        </div>
        <aside className="overview-rail">
          <section className="overview-card milestones" aria-label="近期节点">
            <h2>近期节点</h2>
            <p className="list-row"><small>暂无节点数据</small></p>
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
        </aside>
      </div>
    </div>
  );
}

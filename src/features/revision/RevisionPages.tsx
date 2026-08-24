import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  FolderOpen,
  LayoutList,
  LocateFixed,
  Plus,
  RotateCcw,
  Rows3,
  Sparkles,
} from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import "./revision.css";

type Tone = "blue" | "green" | "amber" | "red" | "gray" | "purple";
type TaskStatus = "待处理" | "处理中" | "待导师确认" | "已完成";
type Task = {
  id: string;
  title: string;
  source: string;
  priority: "严重" | "重要" | "一般";
  status: TaskStatus;
  location: string;
  due: string;
};

// One shared mock source makes IDs traceable across the six revision pages.
export const revisionMock = {
  guidance: [
    {
      id: "#23",
      date: "2026-04-10 14:00",
      method: "线上会议",
      content: "汇报实证部分的修改进度，并讨论变量定义的可比性。",
      advice:
        "核心解释变量的口径需要在第三章统一说明，补充稳健性检验的理论依据。",
      task: "统一变量定义与样本口径",
      attachment: "第 4 次指导记录.pdf",
      done: true,
    },
    {
      id: "#18",
      date: "2026-03-21 10:30",
      method: "线下面谈",
      content: "讨论文献综述与研究假设之间的衔接。",
      advice: "补充数字基础设施影响机制的国内外研究，并加强研究假设的推导。",
      task: "补充机制文献并重写假设",
      attachment: "文献补充清单.docx",
      done: true,
    },
    {
      id: "#12",
      date: "2026-03-02 15:00",
      method: "线上会议",
      content: "确认研究样本和数据来源。",
      advice: "表 4-2 必须标注数据来源与处理过程，避免口径不一致。",
      task: "核验表 4-2 数据来源",
      attachment: "数据核验模板.xlsx",
      done: true,
    },
    {
      id: "#07",
      date: "2026-02-14 09:30",
      method: "邮件指导",
      content: "审阅开题后的初稿结构。",
      advice: "摘要应凝练研究问题、方法和结论，英文表达避免逐句直译。",
      task: "精简中英文摘要",
      attachment: "初稿批注.pdf",
      done: true,
    },
  ],
  tasks: [
    {
      id: "T-023",
      title: "统一变量定义与样本口径",
      source: "导师意见#23",
      priority: "严重",
      status: "处理中",
      location: "第 3.2 节",
      due: "4 月 18 日",
    },
    {
      id: "T-024",
      title: "补充稳健性检验的理论说明",
      source: "导师意见#23",
      priority: "重要",
      status: "待导师确认",
      location: "第 4.4 节",
      due: "4 月 18 日",
    },
    {
      id: "T-031",
      title: "补充数字基础设施机制文献",
      source: "AI智评",
      priority: "重要",
      status: "待处理",
      location: "第 2.3 节",
      due: "4 月 20 日",
    },
    {
      id: "T-036",
      title: "核验表 4-2 的数据来源",
      source: "查重",
      priority: "严重",
      status: "待处理",
      location: "表 4-2",
      due: "4 月 16 日",
    },
    {
      id: "T-041",
      title: "精简英文摘要的长句表达",
      source: "格式",
      priority: "一般",
      status: "已完成",
      location: "英文摘要",
      due: "已完成",
    },
    {
      id: "T-044",
      title: "补充答辩问题的回应说明",
      source: "答辩",
      priority: "一般",
      status: "处理中",
      location: "第 5 章",
      due: "4 月 22 日",
    },
  ] as Task[],
  audits: [
    {
      location: "第 2.3 节",
      title: "机制分析与研究假设的衔接不足",
      detail: "已有文献罗列较多，但尚未形成清晰的作用路径。",
      severity: "严重" as const,
      task: "T-031",
    },
    {
      location: "第 3.2 节",
      title: "核心变量定义前后不一致",
      detail: "样本筛选口径与回归模型中的表述存在差异。",
      severity: "严重" as const,
      task: "T-023",
    },
    {
      location: "第 4.4 节",
      title: "稳健性检验说明不充分",
      detail: "需说明替代变量与样本缩尾处理的选择依据。",
      severity: "重要" as const,
      task: "T-024",
    },
    {
      location: "摘要",
      title: "结论贡献表述偏笼统",
      detail: "建议用一至两项可核验的发现替代泛化陈述。",
      severity: "一般" as const,
      task: "T-041",
    },
  ],
  citations: [
    [
      "第 12 页，第 2 段",
      "数字基础设施促进资源配置效率…",
      "张明等（2023）",
      "10.1234/jfe.2023.06.012",
      "CNKI",
      "已验证",
    ],
    [
      "第 18 页，表 4-2",
      "城市统计年鉴（2024）",
      "中国城市统计年鉴",
      "—",
      "国家统计局",
      "待验证",
    ],
    [
      "第 23 页，第 1 段",
      "Acemoglu & Restrepo (2019)",
      "Automation and New Tasks",
      "10.1257/jep.33.2.3",
      "JSTOR",
      "疑似错误",
    ],
    [
      "第 28 页，第 3 段",
      "王强（2021）认为…",
      "未在参考文献中找到",
      "—",
      "—",
      "正文参考文献不一致",
    ],
    [
      "第 31 页，注释 2",
      "Autor (2015)",
      "Why Are There Still So Many Jobs?",
      "—",
      "Web of Science",
      "无法找到",
    ],
  ],
};
const statusTone: Record<string, Tone> = {
  待处理: "gray",
  处理中: "blue",
  待导师确认: "purple",
  已完成: "green",
  严重: "red",
  重要: "amber",
  一般: "gray",
  已验证: "green",
  待验证: "amber",
  疑似错误: "red",
  无法找到: "gray",
  正文参考文献不一致: "red",
};
function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <section className={`rev-card ${className}`}>{children}</section>;
}
function Badge({ children, tone }: { children: React.ReactNode; tone?: Tone }) {
  return (
    <span
      className={`rev-badge rev-badge-${tone ?? statusTone[String(children)] ?? "gray"}`}
    >
      {children}
    </span>
  );
}
function PageTitle({
  eyebrow = "修改阶段",
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="rev-page-title">
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <div className="title-actions">{children}</div>
    </header>
  );
}

export function IntelligenceReviewInteractive() {
  const [done, setDone] = useState(false);
  return (
    <section className="revision-page">
      <PageTitle eyebrow="AI 智评" title="全文智评">
        <button className="secondary-button" onClick={() => setDone(true)}>
          <Sparkles size={15} />
          {done ? "评估已更新" : "重新评估"}
        </button>
      </PageTitle>
      {done && (
        <Card className="guidance-summary">
          <CheckCircle2 size={15} />
          <b>Mock 重新评估已完成</b>
          <p>评分与问题清单已刷新；不会调用真实 AI 服务。</p>
        </Card>
      )}
      <Card className="score-card">
        <p>论文综合评分</p>
        <strong>{done ? 82 : 81}</strong>
        <span>/ 100</span>
      </Card>
      <Card className="audit-list">
        {revisionMock.audits.map((issue) => (
          <article className="audit-item" key={issue.title}>
            <div className="audit-location">{issue.location}</div>
            <div className="audit-content">
              <b>{issue.title}</b>
              <p>{issue.detail}</p>
              <Badge>{issue.severity}</Badge>
            </div>
            <button className="secondary-button" onClick={() => setDone(true)}>
              创建任务
            </button>
          </article>
        ))}
      </Card>
    </section>
  );
}
export function CitationVerificationInteractive() {
  const [done, setDone] = useState(false);
  return (
    <section className="revision-page">
      <PageTitle title="引用核验">
        <Badge tone="amber">5 条待处理</Badge>
        <button className="secondary-button" onClick={() => setDone(true)}>
          导出审计报告
        </button>
      </PageTitle>
      {done && (
        <Card className="guidance-summary">
          <FileText size={15} />
          <b>引用审计报告已准备</b>
          <p>当前为 Mock 导出预演，不会生成真实文件。</p>
        </Card>
      )}
      <Card className="table-card">
        <table className="rev-table">
          <tbody>
            {revisionMock.citations.map((row) => (
              <tr key={row[0]}>
                {row.map((cell) => (
                  <td key={cell}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
export function FormatCheckInteractive() {
  const [fixed, setFixed] = useState(false);
  return (
    <section className="revision-page">
      <PageTitle title="格式检查">
        <Badge tone={fixed ? "green" : "amber"}>
          合规率 {fixed ? "100" : "86"}%
        </Badge>
        <button className="primary-button" onClick={() => setFixed(true)}>
          {fixed ? "已修复" : "一键修复可修复项"}
        </button>
      </PageTitle>
      <Card className="format-results">
        <h2>标题</h2>
        <article>
          <div>
            <b>二级标题字号不统一</b>
            <p>
              {fixed
                ? "已应用学院模板。"
                : "第 3.2 节使用小三号，规范要求为四号黑体。"}
            </p>
          </div>
          <Badge tone={fixed ? "green" : "amber"}>
            {fixed ? "通过" : "需修复"}
          </Badge>
        </article>
      </Card>
      <Card className="fix-card">
        <header>
          <div>
            <p>修复建议</p>
            <h2>统一二级标题样式</h2>
          </div>
          <button className="primary-button" onClick={() => setFixed(true)}>
            {fixed ? "已应用" : "应用修复"}
          </button>
        </header>
      </Card>
    </section>
  );
}
export function VersionInteractive() {
  const [saved, setSaved] = useState(false);
  const [restored, setRestored] = useState(false);
  return (
    <section className="revision-page">
      <PageTitle title="版本历史">
        <button className="secondary-button" onClick={() => setSaved(true)}>
          <FolderOpen size={15} />
          {saved ? "V3.1 已保存" : "保存新版本"}
        </button>
      </PageTitle>
      {saved && (
        <Card className="guidance-summary">
          <CheckCircle2 size={15} />
          <b>V3.1 当前保存已加入版本历史</b>
        </Card>
      )}
      <Card className="version-info">
        <h2>版本信息</h2>
        <p>版本来源：导师意见#23</p>
        <button className="restore-button" onClick={() => setRestored(true)}>
          <RotateCcw size={15} />
          {restored ? "已恢复到编辑上下文" : "恢复此版本"}
        </button>
        {restored && <p>当前为本地预演，不会覆盖真实文稿。</p>}
      </Card>
    </section>
  );
}

export function GuidanceInteractive() {
  const [records, setRecords] = useState(revisionMock.guidance);
  const [adding, setAdding] = useState(false);
  return (
    <section className="revision-page">
      <PageTitle title="导师指导">
        <Badge tone="blue">已完成 {records.length} / 6 次</Badge>
        <button className="primary-button" onClick={() => setAdding(true)}>
          <Plus size={15} />
          添加指导记录
        </button>
      </PageTitle>
      {adding && (
        <Card className="guidance-summary">
          <b>新增导师指导记录</b>
          <p>
            第 {records.length + 1} 次 · 线上会议 ·
            2026-04-24。确认后将关联“待补充导师意见”的修改任务。
          </p>
          <button
            className="primary-button"
            onClick={() => {
              setRecords((items) => [
                {
                  id: "#27",
                  date: "2026-04-24 14:30",
                  method: "线上会议",
                  content: "针对修改任务进行阶段性复核。",
                  advice: "请补充方法章节的变量测量说明。",
                  task: "补充变量测量说明",
                  attachment: "第 5 次指导记录.pdf",
                  done: false,
                },
                ...items,
              ]);
              setAdding(false);
            }}
          >
            保存记录
          </button>
          <button className="secondary-button" onClick={() => setAdding(false)}>
            取消
          </button>
        </Card>
      )}
      <div className="shared-timeline">
        {records.map((item, index) => (
          <article className="timeline-item" key={item.id}>
            <div className="timeline-marker">{index + 1}</div>
            <Card>
              <div className="timeline-meta">
                <b>第 {index + 1} 次指导</b>
                <span>
                  {item.date} · {item.method}
                </span>
                <Badge tone={item.done ? "green" : "amber"}>
                  {item.done ? "已完成" : "待完成"}
                </Badge>
              </div>
              <dl className="guidance-grid">
                <div>
                  <dt>指导内容</dt>
                  <dd>{item.content}</dd>
                </div>
                <div>
                  <dt>导师意见</dt>
                  <dd>{item.advice}</dd>
                </div>
                <div>
                  <dt>学生任务</dt>
                  <dd>{item.task}</dd>
                </div>
                <div>
                  <dt>附件</dt>
                  <dd className="file-link">
                    <FileText size={14} />
                    {item.attachment}
                  </dd>
                </div>
              </dl>
            </Card>
          </article>
        ))}
      </div>
    </section>
  );
}

export function RevisionInteractive() {
  const [tasks, setTasks] = useState(revisionMock.tasks);
  const [view, setView] = useState<"list" | "kanban">("list");
  const [creating, setCreating] = useState(false);
  const statuses: TaskStatus[] = ["待处理", "处理中", "待导师确认", "已完成"];
  return (
    <section className="revision-page">
      <PageTitle title="修改任务">
        <div className="view-switch">
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            <LayoutList size={15} />
            列表
          </button>
          <button
            className={view === "kanban" ? "active" : ""}
            onClick={() => setView("kanban")}
          >
            <Rows3 size={15} />
            看板
          </button>
        </div>
        <button className="primary-button" onClick={() => setCreating(true)}>
          <Plus size={15} />
          新建任务
        </button>
      </PageTitle>
      {creating && (
        <Card className="guidance-summary">
          <b>新建修改任务</b>
          <p>来源：手动创建 · 优先级：一般 · 状态：待处理</p>
          <button
            className="primary-button"
            onClick={() => {
              setTasks((items) => [
                ...items,
                {
                  id: `T-${String(items.length + 45).padStart(3, "0")}`,
                  title: "补充本节修改说明",
                  source: "手动创建",
                  priority: "一般",
                  status: "待处理",
                  location: "第 2.3 节",
                  due: "4 月 25 日",
                },
              ]);
              setCreating(false);
            }}
          >
            创建任务
          </button>
          <button
            className="secondary-button"
            onClick={() => setCreating(false)}
          >
            取消
          </button>
        </Card>
      )}
      {view === "list" ? (
        <Card className="table-card">
          <table className="rev-table">
            <thead>
              <tr>
                <th>任务</th>
                <th>来源</th>
                <th>优先级</th>
                <th>状态</th>
                <th>位置</th>
                <th>截止时间</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <b>{task.title}</b>
                    <small>{task.id}</small>
                  </td>
                  <td>{task.source}</td>
                  <td>
                    <Badge>{task.priority}</Badge>
                  </td>
                  <td>
                    <Badge>{task.status}</Badge>
                  </td>
                  <td>{task.location}</td>
                  <td>{task.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="kanban-board">
          {statuses.map((status) => (
            <Card className="kanban-column" key={status}>
              <header>
                <b>{status}</b>
                <Badge tone="gray">
                  {tasks.filter((task) => task.status === status).length}
                </Badge>
              </header>
              {tasks
                .filter((task) => task.status === status)
                .map((task) => (
                  <TaskCard task={task} key={task.id} />
                ))}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

export function GuidancePage() {
  return (
    <section className="revision-page">
      <PageTitle title="导师指导">
        <Badge tone="blue">已完成 4 / 6 次</Badge>
      </PageTitle>
      <Card className="guidance-summary">
        <div>
          <strong>下一次指导</strong>
          <span>第 5 次 · 2026-04-24</span>
        </div>
        <p>
          建议先完成 <b>导师意见#23</b> 关联的 2 项任务，再提交给导师确认。
        </p>
      </Card>
      <div className="shared-timeline">
        {revisionMock.guidance.map((item, index) => (
          <article className="timeline-item" key={item.id}>
            <div className="timeline-marker">{index + 1}</div>
            <Card>
              <div className="timeline-meta">
                <b>第 {index + 1} 次指导</b>
                <span>
                  {item.date} · {item.method}
                </span>
                <Badge tone={item.done ? "green" : "amber"}>
                  {item.done ? "已完成" : "待完成"}
                </Badge>
              </div>
              <dl className="guidance-grid">
                <div>
                  <dt>指导内容</dt>
                  <dd>{item.content}</dd>
                </div>
                <div>
                  <dt>导师意见</dt>
                  <dd>{item.advice}</dd>
                </div>
                <div>
                  <dt>学生任务</dt>
                  <dd>{item.task}</dd>
                </div>
                <div>
                  <dt>附件</dt>
                  <dd className="file-link">
                    <FileText size={14} />
                    {item.attachment}
                  </dd>
                </div>
              </dl>
            </Card>
          </article>
        ))}
      </div>
    </section>
  );
}
function TaskCard({ task }: { task: Task }) {
  return (
    <article className="task-card">
      <div className="task-top">
        <Badge>{task.priority}</Badge>
        <span>{task.id}</span>
      </div>
      <strong>{task.title}</strong>
      <p>
        {task.source} · {task.location}
      </p>
      <footer>
        <Badge>{task.status}</Badge>
        <small>{task.due}</small>
      </footer>
    </article>
  );
}
export function RevisionPage() {
  const [view, setView] = useState<"list" | "kanban">("list");
  const statuses: TaskStatus[] = ["待处理", "处理中", "待导师确认", "已完成"];
  return (
    <section className="revision-page">
      <PageTitle title="修改任务">
        <div className="view-switch">
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            <LayoutList size={15} />
            列表
          </button>
          <button
            className={view === "kanban" ? "active" : ""}
            onClick={() => setView("kanban")}
          >
            <Rows3 size={15} />
            看板
          </button>
        </div>
        <button className="primary-button">
          <Plus size={15} />
          新建任务
        </button>
      </PageTitle>
      <div className="task-summary">
        {["严重", "重要", "一般"].map((priority) => (
          <div key={priority}>
            <Badge>{priority}</Badge>
            <b>
              {
                revisionMock.tasks.filter(
                  (task) =>
                    task.priority === priority && task.status !== "已完成",
                ).length
              }
            </b>
            <span>项待跟进</span>
          </div>
        ))}
      </div>
      {view === "list" ? (
        <Card className="table-card">
          <table className="rev-table">
            <thead>
              <tr>
                <th>任务</th>
                <th>来源</th>
                <th>优先级</th>
                <th>状态</th>
                <th>位置</th>
                <th>截止时间</th>
              </tr>
            </thead>
            <tbody>
              {revisionMock.tasks.map((task) => (
                <tr key={task.id}>
                  <td>
                    <b>{task.title}</b>
                    <small>{task.id}</small>
                  </td>
                  <td>{task.source}</td>
                  <td>
                    <Badge>{task.priority}</Badge>
                  </td>
                  <td>
                    <Badge>{task.status}</Badge>
                  </td>
                  <td>{task.location}</td>
                  <td>{task.due}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <div className="kanban-board">
          {statuses.map((status) => (
            <Card className="kanban-column" key={status}>
              <header>
                <b>{status}</b>
                <Badge tone="gray">
                  {
                    revisionMock.tasks.filter((task) => task.status === status)
                      .length
                  }
                </Badge>
              </header>
              {revisionMock.tasks
                .filter((task) => task.status === status)
                .map((task) => (
                  <TaskCard task={task} key={task.id} />
                ))}
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
const radarData = [
  { key: "结构逻辑", score: 82 },
  { key: "内容深度", score: 76 },
  { key: "研究方法", score: 84 },
  { key: "数据可靠性", score: 88 },
  { key: "创新性", score: 71 },
  { key: "学术规范", score: 79 },
  { key: "表达质量", score: 85 },
];
export function IntelligenceReviewPage() {
  const [created, setCreated] = useState<string[]>([]);
  return (
    <section className="revision-page">
      <PageTitle eyebrow="AI 智评" title="全文智评">
        <button className="secondary-button">
          <Sparkles size={15} />
          重新评估
        </button>
      </PageTitle>
      <div className="review-layout">
        <div>
          <Card className="score-card">
            <div>
              <p>论文综合评分</p>
              <strong>81</strong>
              <span>/ 100</span>
              <small>较上次评估 +3 分</small>
            </div>
            <div className="radar-wrap">
              <ResponsiveContainer width="100%" height={236}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#dfe5ee" />
                  <PolarAngleAxis
                    dataKey="key"
                    tick={{ fill: "#667085", fontSize: 11 }}
                  />
                  <Radar
                    dataKey="score"
                    stroke="#315efb"
                    fill="#315efb"
                    fillOpacity={0.2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="audit-list">
            <header>
              <div>
                <h2>问题清单</h2>
                <span>共 4 项可改进问题</span>
              </div>
              <button className="secondary-button">
                筛选 <ChevronDown size={14} />
              </button>
            </header>
            {revisionMock.audits.map((issue) => (
              <article className="audit-item" key={issue.title}>
                <div className="audit-location">
                  <LocateFixed size={15} />
                  {issue.location}
                </div>
                <div className="audit-content">
                  <b>{issue.title}</b>
                  <p>{issue.detail}</p>
                  <Badge>{issue.severity}</Badge>
                </div>
                <div className="audit-actions">
                  <button className="text-button">
                    定位 <ArrowRight size={14} />
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => setCreated((ids) => [...ids, issue.task])}
                  >
                    {created.includes(issue.task) ? (
                      <>
                        <CheckCircle2 size={14} />
                        已创建
                      </>
                    ) : (
                      <>
                        <Plus size={14} />
                        创建任务
                      </>
                    )}
                  </button>
                </div>
              </article>
            ))}
          </Card>
        </div>
        <aside>
          <Card className="severity-card">
            <h2>问题严重度</h2>
            <div className="severity-row">
              <Badge tone="red">严重</Badge>
              <b>2</b>
              <i style={{ width: "72%" }} />
            </div>
            <div className="severity-row">
              <Badge tone="amber">重要</Badge>
              <b>1</b>
              <i style={{ width: "42%" }} />
            </div>
            <div className="severity-row">
              <Badge tone="gray">一般</Badge>
              <b>1</b>
              <i style={{ width: "28%" }} />
            </div>
            <p>
              <AlertTriangle size={14} />
              请优先处理变量定义和机制分析问题。
            </p>
          </Card>
        </aside>
      </div>
    </section>
  );
}
export function CitationVerificationPage() {
  return (
    <section className="revision-page">
      <PageTitle title="引用核验">
        <Badge tone="amber">5 条待处理</Badge>
        <button className="secondary-button">导出审计报告</button>
      </PageTitle>
      <Card className="citation-summary">
        <div>
          <b>127</b>
          <span>已扫描引用</span>
        </div>
        <div>
          <b>112</b>
          <span>已验证</span>
        </div>
        <div>
          <b>8</b>
          <span>待验证</span>
        </div>
        <div>
          <b className="danger">7</b>
          <span>需人工处理</span>
        </div>
      </Card>
      <Card className="table-card">
        <table className="rev-table citation-table">
          <thead>
            <tr>
              <th>正文位置</th>
              <th>引用内容</th>
              <th>文献来源</th>
              <th>DOI</th>
              <th>数据库</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            {revisionMock.citations.map((row) => (
              <tr key={row[0]}>
                {row.map((cell, index) => (
                  <td key={index}>
                    {index === 5 ? <Badge>{cell}</Badge> : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </section>
  );
}
const formatItems = [
  "标题",
  "字体",
  "字号",
  "行距",
  "页边距",
  "页码",
  "目录",
  "图表",
  "公式",
  "参考文献",
  "摘要",
  "附录",
];
export function FormatCheckPage() {
  const [selected, setSelected] = useState("标题");
  const findings = [
    {
      title: "二级标题字号不统一",
      detail: "第 3.2 节使用小三号，规范要求为四号黑体。",
      state: "需修复",
    },
    {
      title: "标题编号层级正确",
      detail: "一级、二级、三级标题均符合学院模板。",
      state: "通过",
    },
  ];
  return (
    <section className="revision-page">
      <PageTitle title="格式检查">
        <Badge tone="green">合规率 86%</Badge>
        <button className="primary-button">一键修复可修复项</button>
      </PageTitle>
      <div className="format-layout">
        <Card className="format-tree">
          <h2>规范树</h2>
          {formatItems.map((item) => (
            <button
              className={selected === item ? "selected" : ""}
              key={item}
              onClick={() => setSelected(item)}
            >
              <ChevronRight size={14} />
              <span>{item}</span>
              {["标题", "字体", "图表"].includes(item) && (
                <Badge tone="amber">1</Badge>
              )}
            </button>
          ))}
        </Card>
        <div>
          <Card className="format-results">
            <header>
              <div>
                <p>当前检查项</p>
                <h2>{selected}</h2>
              </div>
              <Badge tone="amber">1 项需修复</Badge>
            </header>
            {findings.map((finding) => (
              <article key={finding.title}>
                <span
                  className={
                    finding.state === "通过" ? "pass-icon" : "warning-icon"
                  }
                >
                  {finding.state === "通过" ? (
                    <CheckCircle2 size={17} />
                  ) : (
                    <AlertTriangle size={17} />
                  )}
                </span>
                <div>
                  <b>{finding.title}</b>
                  <p>{finding.detail}</p>
                </div>
                <Badge tone={finding.state === "通过" ? "green" : "amber"}>
                  {finding.state}
                </Badge>
              </article>
            ))}
          </Card>
          <Card className="fix-card">
            <header>
              <div>
                <p>修复建议</p>
                <h2>统一二级标题样式</h2>
              </div>
              <button className="primary-button">应用修复</button>
            </header>
            <p>
              将第 3.2 节、第 4.1 节等 3 处二级标题调整为“四号黑体、段前 12
              磅、段后 6 磅”。
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
const versions = [
  {
    name: "V3.0 修改稿",
    date: "2026-04-12 17:26",
    source: "导师意见#23",
    note: "完成变量定义与稳健性检验修改",
  },
  {
    name: "V2.2 修改稿",
    date: "2026-04-10 21:10",
    source: "AI智评#08",
    note: "补充机制分析的相关文献",
  },
  {
    name: "V2.1 指导后",
    date: "2026-04-10 16:45",
    source: "导师意见#23",
    note: "第 4 次指导后的自动保存版本",
  },
  {
    name: "V2.0 初稿",
    date: "2026-04-05 11:02",
    source: "手动保存",
    note: "完成实证分析初稿",
  },
];
export function VersionPage() {
  const [current, setCurrent] = useState(0);
  const version = versions[current];
  return (
    <section className="revision-page">
      <PageTitle title="版本历史">
        <button className="secondary-button">
          <FolderOpen size={15} />
          保存新版本
        </button>
      </PageTitle>
      <div className="version-layout">
        <Card className="version-list">
          <h2>全部版本</h2>
          {versions.map((item, index) => (
            <button
              key={item.name}
              className={index === current ? "selected" : ""}
              onClick={() => setCurrent(index)}
            >
              <b>{item.name}</b>
              <span>{item.date}</span>
              <small>{item.source}</small>
            </button>
          ))}
        </Card>
        <Card className="diff-card">
          <header>
            <div>
              <p>版本对比</p>
              <h2>
                {version.name} <span>对比 V2.2 修改稿</span>
              </h2>
            </div>
            <Badge tone="blue">共 6 处变更</Badge>
          </header>
          <div className="diff-file">
            <FileText size={15} />
            正文.docx <span>第 3 章 · 变量定义</span>
          </div>
          <pre>
            <code>
              <span className="line-number">121</span>{" "}
              本文以城市数字基础设施指数衡量数字化水平.{"\n"}
              <span className="diff-del">
                <span className="line-number">122</span>- 样本为 2012—2023
                年地级市面板数据.
              </span>
              {"\n"}
              <span className="diff-add">
                <span className="line-number">122</span>+ 样本为 2012—2023 年
                278 个地级市的非平衡面板数据.
              </span>
              {"\n"}
              <span className="diff-add">
                <span className="line-number">123</span>+ 对连续变量按 1% 和 99%
                分位进行缩尾处理.
              </span>
              {"\n"}
              <span className="line-number">124</span>{" "}
              控制变量包括经济发展水平、产业结构等.
            </code>
          </pre>
        </Card>
        <Card className="version-info">
          <h2>版本信息</h2>
          <dl>
            <div>
              <dt>版本来源</dt>
              <dd>{version.source}</dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd>{version.date}</dd>
            </div>
            <div>
              <dt>版本说明</dt>
              <dd>{version.note}</dd>
            </div>
            <div>
              <dt>文件大小</dt>
              <dd>1.8 MB</dd>
            </div>
          </dl>
          <button className="restore-button">
            <RotateCcw size={15} />
            恢复此版本
          </button>
          <p>恢复功能为占位，当前不会覆盖正在编辑的文稿。</p>
        </Card>
      </div>
    </section>
  );
}

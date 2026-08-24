import { useState } from "react";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Database,
  FileBarChart,
  FileSpreadsheet,
  GripVertical,
  LayoutList,
  LineChart,
  ListChecks,
  PanelRight,
  PieChart,
  Plus,
  SearchCheck,
  Table2,
  Upload,
  UsersRound,
} from "lucide-react";
import "./data-outline.css";

const dataFiles = [
  {
    name: "panel_data.dta",
    type: "Stata 数据文件",
    size: "8.6 MB",
    rows: "12,586 行",
  },
  {
    name: "firm_innovation.xlsx",
    type: "Excel 工作簿",
    size: "1.4 MB",
    rows: "2,143 行",
  },
  {
    name: "trade_barriers.csv",
    type: "CSV 数据文件",
    size: "632 KB",
    rows: "31,244 行",
  },
  {
    name: "patent_quality.xlsx",
    type: "Excel 工作簿",
    size: "928 KB",
    rows: "12,586 行",
  },
];
const variables = [
  ["innov", "企业创新绩效", "连续变量", "1.2%", "专利数量与质量综合指数"],
  ["dt", "数字化转型水平", "连续变量", "0.0%", "数字技术投入综合指标"],
  ["size", "企业规模", "连续变量", "0.3%", "总资产自然对数"],
  ["age", "企业年龄", "连续变量", "0.1%", "成立年限自然对数"],
  ["lev", "资产负债率", "连续变量", "0.7%", "总负债 / 总资产"],
];
const chapterData = [
  {
    title: "第一章 绪论",
    progress: 80,
    question: "为什么要研究数字化转型与企业创新的关系？",
    evidence: "政策背景、行业趋势、研究缺口",
    refs: 12,
    source: "国家统计局、工信部",
  },
  {
    title: "第二章 相关理论与方法",
    progress: 72,
    question: "哪些理论可以解释数字技术影响企业创新的机制？",
    evidence: "资源基础观、动态能力理论",
    refs: 28,
    source: "CNKI、Web of Science",
  },
  {
    title: "第三章 理论分析与研究假设",
    progress: 65,
    question: "数字化转型如何通过资源配置影响创新绩效？",
    evidence: "机制推导、可检验假设",
    refs: 16,
    source: "核心期刊文献",
  },
  {
    title: "第四章 实证分析",
    progress: 42,
    question: "数字化转型对企业创新是否存在显著影响？",
    evidence: "面板回归、稳健性与异质性检验",
    refs: 9,
    source: "CSMAR、CNRDS",
  },
  {
    title: "第五章 结论与展望",
    progress: 20,
    question: "研究结论如何回应问题并形成政策建议？",
    evidence: "实证结论、管理启示",
    refs: 6,
    source: "研究结果",
  },
];

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={`work-card ${className}`}>{children}</section>;
}
function Badge({
  children,
  tone = "gray",
}: {
  children: React.ReactNode;
  tone?: "gray" | "blue" | "green" | "amber";
}) {
  return <span className={`work-badge ${tone}`}>{children}</span>;
}
function DataInteractive() {
  const [importOpen, setImportOpen] = useState(false);
  const [files, setFiles] = useState(dataFiles);
  return (
    <section className="data-page">
      <header className="work-page-title">
        <div>
          <p>研究阶段 / 数据与调研</p>
          <h1>数据 / 调研</h1>
        </div>
        <button
          className="work-secondary"
          onClick={() => setImportOpen(!importOpen)}
        >
          <Upload size={15} />
          {importOpen ? "关闭导入" : "导入数据"}
        </button>
      </header>
      {importOpen && (
        <Card className="research-empty">
          <Upload size={24} />
          <b>导入数据工作区</b>
          <p>
            请选择本地 CSV、Excel、Stata 或 SPSS 文件；当前为本地 Mock
            预演，不会运行 Python。
          </p>
          <button
            className="work-primary"
            onClick={() => {
              setFiles((list) => [
                ...list,
                {
                  name: "new_dataset.csv",
                  type: "CSV 数据文件",
                  size: "待解析",
                  rows: "待确认",
                },
              ]);
              setImportOpen(false);
            }}
          >
            添加模拟数据文件
          </button>
        </Card>
      )}
      <div className="data-layout">
        <Card className="file-panel">
          <header>
            <div>
              <h2>数据文件</h2>
              <span>{files.length} 个文件</span>
            </div>
            <button
              aria-label="添加数据文件"
              onClick={() =>
                setFiles((list) => [
                  ...list,
                  {
                    name: `dataset_${list.length + 1}.xlsx`,
                    type: "Excel 工作簿",
                    size: "待解析",
                    rows: "待确认",
                  },
                ])
              }
            >
              <Plus size={16} />
            </button>
          </header>
          <div className="file-list">
            {files.map((file, index) => (
              <button className={index === 0 ? "selected" : ""} key={file.name}>
                <FileSpreadsheet size={17} />
                <span>
                  <b>{file.name}</b>
                  <small>
                    {file.type} · {file.size}
                  </small>
                </span>
                {index === 0 && <CheckCircle2 size={15} />}
              </button>
            ))}
          </div>
        </Card>
        <main className="data-main">
          <Card className="data-overview">
            <header>
              <div>
                <p>当前数据集</p>
                <h2>{files[0]?.name}</h2>
              </div>
              <Badge tone="green">已就绪</Badge>
            </header>
            <p>
              数据概览已加载。选择左侧文件可切换数据集；新增文件将显示为待解析。
            </p>
          </Card>
        </main>
      </div>
    </section>
  );
}
function OutlineInteractive() {
  const [view, setView] = useState<"结构" | "列表">("结构");
  const [chapters, setChapters] = useState(chapterData);
  return (
    <section className="outline-workspace">
      <header className="work-page-title">
        <div>
          <p>写作阶段 / 结构设计</p>
          <h1>论文大纲</h1>
        </div>
        <div>
          <button
            className="work-secondary"
            onClick={() => setView(view === "结构" ? "列表" : "结构")}
          >
            <LayoutList size={15} />
            {view === "结构" ? "列表视图" : "大纲视图"}
          </button>
          <button
            className="work-primary"
            onClick={() =>
              setChapters((list) => [
                ...list,
                {
                  title: `第${list.length + 1}章 新增章节`,
                  progress: 0,
                  question: "待补充研究问题",
                  evidence: "待添加证据",
                  refs: 0,
                  source: "待关联",
                },
              ])
            }
          >
            <Plus size={15} />
            新增章节
          </button>
        </div>
      </header>
      <Card className="outline-overview">
        <div>
          <p>当前视图：{view}</p>
          <b>{chapters.length} 章</b>
          <span>新增章节已进入结构工作区，可继续编辑。</span>
        </div>
      </Card>
      <div className="outline-list">
        {chapters.map((chapter, index) => (
          <Card className="outline-section" key={chapter.title}>
            <header>
              <div className="section-heading">
                <span>第 {index + 1} 章</span>
                <h2>{chapter.title}</h2>
              </div>
              <Badge tone={chapter.progress ? "blue" : "amber"}>
                {chapter.progress}%
              </Badge>
            </header>
            <div className="section-grid">
              <div>
                <small>研究问题</small>
                <p>{chapter.question}</p>
              </div>
              <div>
                <small>关键证据</small>
                <p>{chapter.evidence}</p>
              </div>
              <div>
                <small>文献数量</small>
                <p>{chapter.refs} 篇</p>
              </div>
              <div>
                <small>数据来源</small>
                <p>{chapter.source}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}

export function DataResearchPage() {
  const [tab, setTab] = useState("数据研究");
  const [selected, setSelected] = useState(dataFiles[0].name);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const analyses = [
    ["描述统计", Table2],
    ["相关分析", LineChart],
    ["回归分析", BarChart3],
    ["稳健性", CheckCircle2],
    ["异质性", UsersRound],
    ["图表", PieChart],
  ] as const;
  return (
    <section className="data-page">
      <header className="work-page-title">
        <div>
          <p>研究阶段 / 数据与调研</p>
          <h1>数据 / 调研</h1>
        </div>
        <button className="work-secondary">
          <Upload size={15} />
          导入数据
        </button>
      </header>
      <nav className="data-tabs">
        {["数据研究", "问卷研究", "访谈研究", "案例研究"].map((item) => (
          <button
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
            key={item}
          >
            {item}
          </button>
        ))}
      </nav>
      {tab !== "数据研究" ? (
        <Card className="research-empty">
          <Database size={24} />
          <b>{tab}</b>
          <p>研究工作区已准备就绪，当前阶段仅展示数据研究 mock。</p>
          <button className="work-secondary" onClick={() => setTab("数据研究")}>
            返回数据研究
          </button>
        </Card>
      ) : (
        <div className="data-layout">
          <Card className="file-panel">
            <header>
              <div>
                <h2>数据文件</h2>
                <span>4 个文件</span>
              </div>
              <button aria-label="添加数据文件">
                <Plus size={16} />
              </button>
            </header>
            <div className="file-list">
              {dataFiles.map((file) => (
                <button
                  className={selected === file.name ? "selected" : ""}
                  key={file.name}
                  onClick={() => setSelected(file.name)}
                >
                  <FileSpreadsheet size={17} />
                  <span>
                    <b>{file.name}</b>
                    <small>
                      {file.type} · {file.size}
                    </small>
                  </span>
                  {selected === file.name && <CheckCircle2 size={15} />}
                </button>
              ))}
            </div>
            <footer>
              <Database size={14} />
              <span>已连接 4 个数据源</span>
            </footer>
          </Card>
          <main className="data-main">
            <div className="data-metrics">
              {[
                ["样本量", "12,586", "观测值"],
                ["变量数", "28", "含 5 个核心变量"],
                ["时间跨度", "2010–2023", "14 年面板"],
                ["企业数", "2,143", "家上市公司"],
                ["缺失值", "2.4%", "可处理"],
                ["异常值", "18", "待核验"],
              ].map(([label, value, hint], index) => (
                <Card
                  className={index > 3 ? "metric warn" : "metric"}
                  key={label}
                >
                  <small>{label}</small>
                  <b>{value}</b>
                  <span>{hint}</span>
                </Card>
              ))}
            </div>
            <Card className="data-overview">
              <header>
                <div>
                  <p>当前数据集</p>
                  <h2>{selected}</h2>
                </div>
                <Badge tone="green">已就绪</Badge>
              </header>
              <div className="overview-bars">
                <div>
                  <span>完整率</span>
                  <i>
                    <em style={{ width: "97.6%" }} />
                  </i>
                  <b>97.6%</b>
                </div>
                <div>
                  <span>时间覆盖</span>
                  <i>
                    <em style={{ width: "100%" }} />
                  </i>
                  <b>2010—2023</b>
                </div>
                <div>
                  <span>变量说明</span>
                  <i>
                    <em style={{ width: "86%" }} />
                  </i>
                  <b>24 / 28</b>
                </div>
              </div>
            </Card>
            <Card className="variable-card">
              <header>
                <div>
                  <h2>变量表</h2>
                  <span>共 28 个变量，展示核心变量</span>
                </div>
                <button className="work-secondary">
                  查看全部变量 <ChevronRight size={14} />
                </button>
              </header>
              <table className="work-table">
                <thead>
                  <tr>
                    <th>变量名</th>
                    <th>变量标签</th>
                    <th>类型</th>
                    <th>缺失率</th>
                    <th>描述</th>
                  </tr>
                </thead>
                <tbody>
                  {variables.map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell, index) => (
                        <td key={index}>
                          {index === 3 ? (
                            <Badge tone={cell === "0.0%" ? "green" : "amber"}>
                              {cell}
                            </Badge>
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card className="recent-results">
              <header>
                <h2>最近结果摘要</h2>
                <button>查看全部</button>
              </header>
              <div>
                <FileBarChart size={18} />
                <p>
                  <b>基准回归结果</b>
                  <span>
                    数字化转型显著提升企业创新绩效（β = 0.126，p &lt; 0.01）
                  </span>
                </p>
                <Badge tone="green">已保存</Badge>
              </div>
              <div>
                <SearchCheck size={18} />
                <p>
                  <b>缺失值处理报告</b>
                  <span>已建议对 2.4% 的缺失值采用分组中位数填补</span>
                </p>
                <Badge tone="amber">待确认</Badge>
              </div>
            </Card>
          </main>
          <Card className="analysis-panel">
            <header>
              <div>
                <h2>快速分析</h2>
                <span>仅 UI / Mock</span>
              </div>
            </header>
            {analyses.map(([label, Icon]) => (
              <button
                className={analysis === label ? "selected" : ""}
                key={label}
                onClick={() => setAnalysis(label)}
              >
                <Icon size={16} />
                <span>{label}</span>
                <ChevronRight size={14} />
              </button>
            ))}
            <section className="analysis-status">
              <h3>分析队列</h3>
              {analysis ? (
                <p>
                  <CheckCircle2 size={14} />
                  已选择“{analysis}”
                  <small>点击仅为交互占位，不会运行 Python。</small>
                </p>
              ) : (
                <p>
                  <Database size={14} />
                  选择一个分析入口以开始
                </p>
              )}
            </section>
          </Card>
        </div>
      )}
    </section>
  );
}

export function OutlinePage() {
  const [selected, setSelected] = useState(2);
  const [expanded, setExpanded] = useState<number[]>([0, 1, 2, 3, 4]);
  const current = chapterData[selected];
  const toggle = (index: number) =>
    setExpanded((all) =>
      all.includes(index) ? all.filter((i) => i !== index) : [...all, index],
    );
  return (
    <section className="outline-workspace">
      <header className="work-page-title">
        <div>
          <p>写作阶段 / 结构设计</p>
          <h1>论文大纲</h1>
        </div>
        <div>
          <button className="work-secondary">
            <LayoutList size={15} />
            大纲视图
          </button>
          <button className="work-primary">
            <Plus size={15} />
            新增章节
          </button>
        </div>
      </header>
      <div className="outline-layout">
        <Card className="outline-tree">
          <header>
            <div>
              <h2>论文结构</h2>
              <span>5 章 · 18 节</span>
            </div>
            <button aria-label="折叠全部">
              <ChevronDown size={15} />
            </button>
          </header>
          <div className="tree-scroll">
            {chapterData.map((chapter, index) => (
              <section key={chapter.title}>
                <div
                  className={`tree-chapter ${selected === index ? "selected" : ""}`}
                >
                  <button
                    className="tree-toggle"
                    aria-label={`${expanded.includes(index) ? "收起" : "展开"}${chapter.title}`}
                    onClick={() => toggle(index)}
                  >
                    {expanded.includes(index) ? (
                      <ChevronDown size={14} />
                    ) : (
                      <ChevronRight size={14} />
                    )}
                  </button>
                  <GripVertical size={14} />
                  <button onClick={() => setSelected(index)}>
                    {chapter.title}
                  </button>
                  <span>{chapter.progress}%</span>
                </div>
                {expanded.includes(index) && (
                  <div className="tree-children">
                    {["研究问题", "核心证据", "文献与数据"].map(
                      (item, childIndex) => (
                        <button key={item} onClick={() => setSelected(index)}>
                          {index === selected && childIndex === 0 ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <span className="tree-dot" />
                          )}
                          {item}
                        </button>
                      ),
                    )}
                  </div>
                )}
              </section>
            ))}
          </div>
          <footer>
            <GripVertical size={14} />
            可拖拽调整章节顺序 <small>（占位）</small>
          </footer>
        </Card>
        <main className="outline-main">
          <Card className="outline-overview">
            <div>
              <p>当前大纲完成度</p>
              <b>58%</b>
              <span>已完成 11 / 18 个章节节点</span>
            </div>
            <i>
              <em />
            </i>
            <p>
              当前聚焦：<strong>{current.title}</strong>
            </p>
          </Card>
          <div className="outline-list">
            {chapterData.map((chapter, index) => (
              <Card
                className={`outline-section ${selected === index ? "selected" : ""}`}
                key={chapter.title}
              >
                <header>
                  <div className="section-heading">
                    <GripVertical size={16} />
                    <span>第 {index + 1} 章</span>
                    <h2>{chapter.title.replace(/^第[一二三四五]章\s*/, "")}</h2>
                  </div>
                  <div>
                    <Badge
                      tone={
                        chapter.progress > 70
                          ? "green"
                          : chapter.progress > 40
                            ? "blue"
                            : "amber"
                      }
                    >
                      {chapter.progress}%
                    </Badge>
                    <button
                      aria-label={`查看${chapter.title}`}
                      onClick={() => setSelected(index)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </header>
                <div className="section-grid">
                  <div>
                    <small>研究问题</small>
                    <p>{chapter.question}</p>
                  </div>
                  <div>
                    <small>关键证据</small>
                    <p>{chapter.evidence}</p>
                  </div>
                  <div>
                    <small>文献数量</small>
                    <p>
                      <BookOpen size={13} /> {chapter.refs} 篇
                    </p>
                  </div>
                  <div>
                    <small>数据来源</small>
                    <p>
                      <Database size={13} /> {chapter.source}
                    </p>
                  </div>
                </div>
                <footer>
                  <span>完成度</span>
                  <i>
                    <em style={{ width: `${chapter.progress}%` }} />
                  </i>
                  <button>
                    拖拽调整 <GripVertical size={13} />
                  </button>
                </footer>
              </Card>
            ))}
          </div>
        </main>
        <aside className="logic-panel">
          <header>
            <div>
              <PanelRight size={15} />
              <b>AI 逻辑检查</b>
            </div>
            <Badge tone="blue">第 {selected + 1} 章</Badge>
          </header>
          <p className="logic-intro">
            围绕 <b>{current.title}</b> 检查论证链的完整性。
          </p>
          <section>
            <span className="logic-number">01</span>
            <div>
              <h3>这一节解决什么问题</h3>
              <p>{current.question}</p>
            </div>
          </section>
          <section>
            <span className="logic-number">02</span>
            <div>
              <h3>与前后章关系</h3>
              <p>
                {selected === 0
                  ? "奠定研究背景与问题意识，为理论分析提供起点。"
                  : selected === 4
                    ? "收束实证发现，并回应研究问题和现实意义。"
                    : "承接上一章的论证基础，向下一章的实证或结论推进。"}
              </p>
            </div>
          </section>
          <section className="missing">
            <span className="logic-number">03</span>
            <div>
              <h3>缺失证据</h3>
              <p>
                {selected === 2
                  ? "机制路径还需补充数字基础设施与资源配置效率的实证文献。"
                  : "建议补充与本章论点直接对应的权威证据或数据来源。"}
              </p>
              <button>创建补充任务</button>
            </div>
          </section>
          <footer>
            <CheckCircle2 size={14} />
            逻辑链检查完成 <span>3 项建议</span>
          </footer>
        </aside>
      </div>
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CloudUpload,
  FilePlus2,
  FileSearch,
  FileText,
  FileUp,
  Filter,
  FolderOpen,
  Grid2X2,
  ListFilter,
  MessageCircleQuestion,
  MoreHorizontal,
  Search,
  Sparkles,
  Tags,
} from "lucide-react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WorkspaceRow } from "@/repositories/literatureWorkspaceRepository";
import { fileService } from "@/services/fileService";
import { literatureWorkspaceService } from "@/services/literatureWorkspaceService";
import { useProjectStore } from "@/stores/project-store";
import "./literature.css";
import "./literature-workspace.css";

type SmartView =
  | "全部文献"
  | "收件箱"
  | "未读"
  | "阅读中"
  | "已读"
  | "核心文献"
  | "有全文"
  | "无全文"
  | "有冲突"
  | "未验证"
  | "卡片待审核";

type AiTab = "智能总结" | "问答对话" | "写作辅助";
type SearchMode = "元数据" | "全文" | "混合";
type ImportMode = "PDF" | "批量" | "在线发现" | "手工录入" | null;

const smartViews: SmartView[] = [
  "全部文献",
  "收件箱",
  "未读",
  "阅读中",
  "已读",
  "核心文献",
  "有全文",
  "无全文",
  "有冲突",
  "未验证",
  "卡片待审核",
];

const statusLabel: Record<string, string> = {
  verified: "已核验",
  partially_verified: "部分核验",
  unverified: "待核验",
  conflict: "有冲突",
};

const readingLabel: Record<string, string> = {
  inbox: "收件箱",
  unread: "未读",
  reading: "阅读中",
  read: "已读",
  archived: "已归档",
};

const cardLabel: Record<string, string> = {
  draft: "待审核",
  reviewed: "已审核",
  confirmed: "已确认",
  stale: "已过期",
};

const previewRows: WorkspaceRow[] = [
  { id: "preview-lit-1", title: "Digital transformation and firm innovation", year: 2024, venue: "Research Policy", literatureType: "journalArticle", status: "reading", verificationStatus: "verified", updatedAt: "2026-08-25T08:00:00.000Z", authors: "Wang, H.; Li, Y.", doi: "10.1016/j.respol.2024.01.001", tags: "核心文献, 数字化转型", hasFulltext: true, primaryFileId: null, cardStatus: "confirmed" },
  { id: "preview-lit-2", title: "Resource allocation efficiency and enterprise innovation", year: 2023, venue: "Technovation", literatureType: "journalArticle", status: "read", verificationStatus: "verified", updatedAt: "2026-08-24T10:00:00.000Z", authors: "Chen, M.; Zhao, Q.", doi: "10.1016/j.technovation.2023.02.008", tags: "核心文献, 资源配置", hasFulltext: true, primaryFileId: null, cardStatus: "reviewed" },
  { id: "preview-lit-3", title: "数字经济发展与制造业企业创新", year: 2022, venue: "经济研究", literatureType: "journalArticle", status: "unread", verificationStatus: "partially_verified", updatedAt: "2026-08-23T09:00:00.000Z", authors: "张明; 刘洋", doi: null, tags: "数字经济, 企业创新", hasFulltext: false, primaryFileId: null, cardStatus: "draft" },
  { id: "preview-lit-4", title: "Digital capability, dynamic resources and innovation performance", year: 2021, venue: "J. Business Research", literatureType: "journalArticle", status: "inbox", verificationStatus: "unverified", updatedAt: "2026-08-22T09:00:00.000Z", authors: "Smith, J.; Kumar, R.", doi: "10.1016/j.jbusres.2021.06.012", tags: "动态能力, 创新绩效", hasFulltext: false, primaryFileId: null, cardStatus: "draft" },
];

function matchesView(row: WorkspaceRow, view: SmartView) {
  switch (view) {
    case "收件箱":
      return row.status === "inbox";
    case "未读":
      return row.status === "unread";
    case "阅读中":
      return row.status === "reading";
    case "已读":
      return row.status === "read";
    case "核心文献":
      return row.tags.split(",").some((tag) => tag.trim() === "核心文献");
    case "有全文":
      return row.hasFulltext;
    case "无全文":
      return !row.hasFulltext;
    case "有冲突":
      return row.verificationStatus === "conflict";
    case "未验证":
      return row.verificationStatus === "unverified";
    case "卡片待审核":
      return row.cardStatus === "draft";
    default:
      return true;
  }
}

function countForView(rows: WorkspaceRow[], view: SmartView) {
  return rows.filter((row) => matchesView(row, view)).length;
}

function verificationTone(status: string) {
  if (status === "verified") return "verified";
  if (status === "conflict") return "conflict";
  if (status === "partially_verified") return "partial";
  return "unverified";
}

function extractTags(rows: WorkspaceRow[]) {
  const counts = new Map<string, number>();
  rows.forEach((row) =>
    row.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)),
  );
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
}

export function LiteraturePage() {
  const { projects, activeProjectId, loadProjects } = useProjectStore();
  const [rows, setRows] = useState<WorkspaceRow[]>([]);
  const [activeView, setActiveView] = useState<SmartView>("全部文献");
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("元数据");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [sortDescending, setSortDescending] = useState(true);
  const [page, setPage] = useState(1);
  const [aiTab, setAiTab] = useState<AiTab>("智能总结");
  const [importMode, setImportMode] = useState<ImportMode>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const browserPreview = typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window);

  const project =
    projects.find((item) => item.id === activeProjectId) ?? projects[0];

  const reload = async () => {
    if (!project) return;
    if (browserPreview) {
      setRows(previewRows);
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setRows(await literatureWorkspaceService.list(project.id, "all"));
    } catch (cause) {
      setRows([]);
      setError(
        cause instanceof Error
          ? cause.message
          : "无法读取本地文献库。请在桌面端重试。",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);
  useEffect(() => {
    void reload();
  }, [project?.id]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return rows
      .filter((row) => matchesView(row, activeView))
      .filter(
        (row) =>
          !normalizedQuery ||
          [row.title, row.authors, row.venue, row.doi, row.tags]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase()
            .includes(normalizedQuery),
      )
      .sort((a, b) => {
        const left = a.year ?? 0;
        const right = b.year ?? 0;
        return sortDescending ? right - left : left - right;
      });
  }, [activeView, query, rows, sortDescending]);

  const pageSize = 8;
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const displayedRows = filteredRows.slice(
    (page - 1) * pageSize,
    page * pageSize,
  );
  const selectedRow = rows.find((row) => row.id === selectedRowId) ?? null;
  const tags = useMemo(() => extractTags(rows), [rows]);
  const trend = useMemo(() => {
    const totals = new Map<number, number>();
    rows.forEach((row) => {
      if (row.year) totals.set(row.year, (totals.get(row.year) ?? 0) + 1);
    });
    return [...totals.entries()]
      .sort((a, b) => a[0] - b[0])
      .slice(-6)
      .map(([year, count]) => ({ year: String(year), count }));
  }, [rows]);

  const setView = (view: SmartView) => {
    setActiveView(view);
    setPage(1);
  };

  const toggleRow = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const applyStatus = async (status: string) => {
    if (!project || selectedIds.length === 0) return;
    if (browserPreview) {
      setRows((current) => current.map((row) => selectedIds.includes(row.id) ? { ...row, status } : row));
      setSelectedIds([]);
      return;
    }
    await literatureWorkspaceService.batchStatus(
      project.id,
      selectedIds,
      status,
    );
    setSelectedIds([]);
    await reload();
  };

  const openSource = async (row: WorkspaceRow) => {
    setSelectedRowId(row.id);
    if (browserPreview) return;
    if (!row.primaryFileId) return;
    try {
      await fileService.openLocation(row.primaryFileId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "无法打开全文位置。");
    }
  };

  const allOnPageSelected =
    displayedRows.length > 0 &&
    displayedRows.every((row) => selectedIds.includes(row.id));
  const verifiedCount = rows.filter(
    (row) => row.verificationStatus === "verified",
  ).length;
  const fulltextCount = rows.filter((row) => row.hasFulltext).length;
  const reviewCount = rows.filter((row) => row.cardStatus === "draft").length;

  return (
    <section className="literature-workspace" aria-label="文献研究工作区">
      <aside className="literature-left">
        <header>
          <b>文献库</b>
          <span>{rows.length} 条</span>
        </header>
        <div className="import-actions">
          <button onClick={() => setImportMode("PDF")}>
            <FileUp size={15} />
            导入 PDF
          </button>
          <button onClick={() => setImportMode("批量")}>
            <CloudUpload size={15} />
            批量导入
          </button>
          <button onClick={() => setImportMode("在线发现")}>
            <FileSearch size={15} />
            在线发现文献
          </button>
        </div>
        <p className="sidebar-label">文献分组与智能视图</p>
        <nav aria-label="文献智能视图">
          {smartViews.map((view) => (
            <button
              className={activeView === view ? "active" : ""}
              key={view}
              onClick={() => setView(view)}
            >
              <BookOpen size={14} />
              <span>{view}</span>
              <b>{countForView(rows, view)}</b>
            </button>
          ))}
        </nav>
        <footer>
          <Tags size={14} />
          标签与集合管理 <ChevronRight size={14} />
        </footer>
      </aside>

      <main className="literature-main">
        <header className="literature-title">
          <div>
            <p>研究阶段 / 文献研究</p>
            <h1>文献研究 / 文献库</h1>
          </div>
          <button onClick={() => setImportMode("手工录入")}>
            <FilePlus2 size={15} />
            新建文献
          </button>
        </header>

        <nav className="literature-tabs" aria-label="文献研究功能">
          <button className="active">检索文献</button>
          <button onClick={() => setImportMode("在线发现")}>在线发现</button>
          <button>引文追踪</button>
        </nav>

        <div className="literature-search">
          <Search size={17} />
          <input
            aria-label="搜索文献"
            placeholder="搜索题目、作者、来源或 DOI"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
          <div className="search-mode-switch" aria-label="搜索模式">
            {(["元数据", "全文", "混合"] as SearchMode[]).map((mode) => (
              <button
                className={searchMode === mode ? "active" : ""}
                key={mode}
                onClick={() => setSearchMode(mode)}
                title={
                  mode === "元数据"
                    ? "本地元数据检索"
                    : "全文/混合检索将在索引可用时启用"
                }
              >
                {mode}
              </button>
            ))}
          </div>
          <button className="filter-button">
            <Filter size={14} />
            筛选
          </button>
        </div>

        <div className="database-filters">
          {(
            [
              "全部文献",
              "未读",
              "有全文",
              "有冲突",
              "卡片待审核",
            ] as SmartView[]
          ).map((view) => (
            <button
              className={activeView === view ? "active" : ""}
              key={view}
              onClick={() => setView(view)}
            >
              {view}
            </button>
          ))}
        </div>

        <div className="literature-stats" aria-label="文献库统计">
          <section className="blue">
            <b>{rows.length}</b>
            <span>全部文献</span>
          </section>
          <section className="green">
            <b>{verifiedCount}</b>
            <span>已核验</span>
          </section>
          <section className="purple">
            <b>{fulltextCount}</b>
            <span>有全文</span>
          </section>
          <section className="amber">
            <b>{reviewCount}</b>
            <span>卡片待审核</span>
          </section>
        </div>

        {error && (
          <div className="literature-alert" role="alert">
            {error}
            <button onClick={() => void reload()}>重试</button>
          </div>
        )}

        {selectedIds.length > 0 && (
          <div className="literature-batchbar">
            <span>已选择 {selectedIds.length} 篇</span>
            <button onClick={() => void applyStatus("reading")}>
              标记阅读中
            </button>
            <button onClick={() => void applyStatus("read")}>标记已读</button>
            <button onClick={() => void applyStatus("archived")}>归档</button>
            <button>批量加标签</button>
            <button className="primary">生成 AI 卡片</button>
          </div>
        )}

        <section className="literature-table-card">
          <header>
            <div>
              <h2>文献库</h2>
              <span>
                {loading ? "加载中…" : `共 ${filteredRows.length} 条记录`}
              </span>
            </div>
            <div>
              <button>
                <ListFilter size={14} />
                字段
              </button>
              <button aria-label="更多表格操作">
                <MoreHorizontal size={16} />
              </button>
            </div>
          </header>
          <div className="literature-table-scroll">
            <table>
              <thead>
                <tr>
                  <th>
                    <input
                      aria-label="选择当前页"
                      checked={allOnPageSelected}
                      type="checkbox"
                      onChange={() =>
                        setSelectedIds(
                          allOnPageSelected
                            ? selectedIds.filter(
                                (id) =>
                                  !displayedRows.some((row) => row.id === id),
                              )
                            : [
                                ...new Set([
                                  ...selectedIds,
                                  ...displayedRows.map((row) => row.id),
                                ]),
                              ],
                        )
                      }
                    />
                  </th>
                  <th>题目</th>
                  <th>作者</th>
                  <th>
                    <button
                      onClick={() => setSortDescending((value) => !value)}
                    >
                      年份 {sortDescending ? "↓" : "↑"}
                    </button>
                  </th>
                  <th>来源</th>
                  <th>核验状态</th>
                  <th>全文 / 卡片</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {displayedRows.map((row) => (
                  <tr
                    className={selectedRowId === row.id ? "selected" : ""}
                    key={row.id}
                    onClick={() => setSelectedRowId(row.id)}
                  >
                    <td onClick={(event) => event.stopPropagation()}>
                      <input
                        aria-label={`选择 ${row.title}`}
                        checked={selectedIds.includes(row.id)}
                        type="checkbox"
                        onChange={() => toggleRow(row.id)}
                      />
                    </td>
                    <td>
                      <b title={row.title}>{row.title}</b>
                      <small>{row.doi ?? row.literatureType}</small>
                    </td>
                    <td>{row.authors || "—"}</td>
                    <td>{row.year ?? "—"}</td>
                    <td>{row.venue ?? "—"}</td>
                    <td>
                      <span
                        className={`literature-status ${verificationTone(row.verificationStatus)}`}
                      >
                        {statusLabel[row.verificationStatus] ??
                          row.verificationStatus}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`asset-state ${row.hasFulltext ? "available" : ""}`}
                      >
                        {row.hasFulltext ? "有全文" : "无全文"}
                      </span>
                      <span
                        className={`asset-state ${row.cardStatus === "confirmed" ? "available" : ""}`}
                      >
                        {row.cardStatus
                          ? (cardLabel[row.cardStatus] ?? row.cardStatus)
                          : "无卡片"}
                      </span>
                    </td>
                    <td>
                      <button
                        aria-label={`打开 ${row.title}`}
                        disabled={!row.primaryFileId}
                        onClick={(event) => {
                          event.stopPropagation();
                          void openSource(row);
                        }}
                      >
                        <FolderOpen size={15} />
                      </button>
                      <button
                        aria-label={`更多 ${row.title}`}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <MoreHorizontal size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && displayedRows.length === 0 && (
                  <tr className="empty-row">
                    <td colSpan={8}>
                      <FileText size={25} />
                      <b>{query ? "没有匹配的文献" : "当前视图暂无文献"}</b>
                      <span>
                        {query
                          ? "尝试调整关键词或筛选条件。"
                          : "导入 PDF、题录或从在线发现开始建立文献库。"}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <footer>
            <span>已选择 {selectedIds.length} 条</span>
            <div>
              <button
                aria-label="上一页"
                disabled={page === 1}
                onClick={() => setPage((value) => value - 1)}
              >
                <ChevronLeft size={15} />
              </button>
              <b>{page}</b>
              <button
                aria-label="下一页"
                disabled={page === pageCount}
                onClick={() => setPage((value) => value + 1)}
              >
                <ChevronRight size={15} />
              </button>
            </div>
            <span>每页 {pageSize} 条</span>
          </footer>
        </section>

        <section className="literature-visuals">
          <div className="matrix-preview">
            <header>
              <h2>文献矩阵预览</h2>
              <button>
                展开 <ChevronRight size={13} />
              </button>
            </header>
            <div className="matrix-head">
              <span>文献</span>
              <span>全文</span>
              <span>卡片</span>
              <span>核验</span>
            </div>
            {rows.slice(0, 3).map((row) => (
              <div className="matrix-row" key={row.id}>
                <b title={row.title}>{row.title}</b>
                <i className={row.hasFulltext ? "strong" : ""} />
                <i className={row.cardStatus ? "medium" : ""} />
                <i
                  className={
                    row.verificationStatus === "verified" ? "strong" : ""
                  }
                />
              </div>
            ))}
            {rows.length === 0 && <p className="mini-empty">暂无可预览记录</p>}
          </div>
          <div className="keyword-cloud">
            <header>
              <h2>标签概览</h2>
              <button>
                <Grid2X2 size={13} />
                管理
              </button>
            </header>
            {tags.length ? (
              <p>
                {tags.map(([tag, count], index) => (
                  <span className={`tag-${index}`} key={tag}>
                    {tag}
                    <small>{count}</small>
                  </span>
                ))}
              </p>
            ) : (
              <p className="mini-empty">暂无标签</p>
            )}
          </div>
          <div className="trend-chart">
            <header>
              <h2>文献年份分布</h2>
              <span>
                <i />
                文献量
              </span>
            </header>
            {trend.length ? (
              <ResponsiveContainer width="100%" height={103}>
                <AreaChart
                  data={trend}
                  margin={{ top: 4, right: 0, left: -22, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="literatureTrend"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#315efb" stopOpacity=".26" />
                      <stop offset="100%" stopColor="#315efb" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 9, fill: "#98a2b3" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 9, fill: "#98a2b3" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#315efb"
                    strokeWidth={2}
                    fill="url(#literatureTrend)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="mini-empty">暂无年份数据</p>
            )}
          </div>
        </section>
      </main>

      <aside className="literature-ai">
        <header>
          <div>
            <Sparkles size={16} />
            <b>AI 文献助手</b>
          </div>
          <button>收起</button>
        </header>
        <nav>
          {(["智能总结", "问答对话", "写作辅助"] as AiTab[]).map((tab) => (
            <button
              className={aiTab === tab ? "active" : ""}
              key={tab}
              onClick={() => setAiTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>
        {aiTab === "智能总结" ? (
          <div className="ai-summary-content">
            <section>
              <b>当前文献</b>
              <p>
                {selectedRow
                  ? `${selectedRow.title}（${selectedRow.year ?? "年份待核验"}）`
                  : "从表格选择一篇文献，查看 Evidence-first 研究卡片。"}
              </p>
            </section>
            <section>
              <b>核验状态</b>
              <p>
                {selectedRow
                  ? `${statusLabel[selectedRow.verificationStatus] ?? selectedRow.verificationStatus} · ${readingLabel[selectedRow.status] ?? selectedRow.status}`
                  : "AI 不会静默覆盖用户确认的元数据。"}
              </p>
            </section>
            <section>
              <b>证据边界</b>
              <p>
                {selectedRow?.hasFulltext
                  ? "已绑定本地全文；生成卡片时仅可引用当前文献的有效 chunks。"
                  : "尚无可检索全文，无法从当前全文确认研究问题、方法与结论。"}
              </p>
            </section>
            <section>
              <b>可用动作</b>
              <p>
                <span>查看来源</span>
                <span>生成草稿卡片</span>
                <span>标记待复核</span>
              </p>
            </section>
            <div className="related-questions">
              <h3>相关问题推荐</h3>
              <button>
                <MessageCircleQuestion size={14} />
                这篇文献的研究问题是什么？
              </button>
              <button>
                <MessageCircleQuestion size={14} />
                哪些结论有原文证据支持？
              </button>
            </div>
          </div>
        ) : (
          <div className="ai-tab-placeholder">
            <CircleHelp size={23} />
            <b>{aiTab}</b>
            <p>
              {selectedRow
                ? "仅会发送当前文献的已检索证据与必要上下文。"
                : "请先选择一篇文献。"}
            </p>
          </div>
        )}
        <button className="generate-draft" disabled={!selectedRow?.hasFulltext}>
          <Sparkles size={16} />
          生成 Evidence-first 文献卡片
        </button>
      </aside>

      {importMode && (
        <div
          className="literature-modal-backdrop"
          role="presentation"
          onMouseDown={() => setImportMode(null)}
        >
          <section
            className="literature-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="literature-import-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <span>
                  <FilePlus2 size={17} />
                </span>
                <div>
                  <b id="literature-import-title">
                    {importMode === "PDF"
                      ? "导入 PDF 全文"
                      : importMode === "批量"
                        ? "批量导入文献"
                        : importMode === "在线发现"
                          ? "在线发现文献"
                          : "手工新建文献"}
                  </b>
                  <p>文献记录与文件相互独立，所有元数据均保留来源。</p>
                </div>
              </div>
              <button
                aria-label="关闭导入窗口"
                onClick={() => setImportMode(null)}
              >
                ×
              </button>
            </header>
            <div className="literature-modal-body">
              <p>
                {importMode === "在线发现"
                  ? "通过 Crossref / OpenAlex 检索公开元数据；只有明确的开放获取链接才可由用户主动导入全文。"
                  : importMode === "批量"
                    ? "每个文件独立处理，失败不会阻塞整批导入。"
                    : importMode === "PDF"
                      ? "本地 PDF 将进入现有文件与解析管线，AI 候选不会直接成为已核验字段。"
                      : "手工字段作为用户确认来源，优先级高于后台 enrichment。"}
              </p>
              <button className="modal-primary">进入{importMode}流程</button>
              <button onClick={() => setImportMode(null)}>取消</button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

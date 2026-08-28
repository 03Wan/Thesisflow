import { Command, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useNavigate } from "react-router-dom";

const commands = [
  ["项目总览", "/overview", "项目 首页 仪表盘"],
  ["项目", "/projects", "新建项目 项目管理"],
  ["论文要求", "/requirements", "规范 要求"],
  ["选题", "/topic-selection", "研究方向 题目"],
  ["任务书", "/task-book", "任务"],
  ["文献研究", "/literature", "文献 论文 PDF"],
  ["开题报告", "/proposal", "开题"],
  ["研究设计", "/research-design", "变量 假设 方法"],
  ["数据 / 调研", "/data", "数据 调研"],
  ["论文大纲", "/outline", "目录 章节"],
  ["正文写作", "/writing", "写作 编辑器"],
  ["外文翻译", "/translation", "翻译"],
  ["中期检查", "/midterm", "进度 阶段"],
  ["修改任务", "/revisions", "修改 任务"],
  ["指导记录", "/guidance", "指导 沟通记录 次数"],
  ["全文智评", "/compliance", "AI 评审"],
  ["引用核验", "/citation-check", "引用 文献 核验"],
  ["格式检查", "/reviewer-review", "格式 排版"],
  ["版本历史", "/version-history", "版本 历史"],
  ["论文定稿", "/finalization", "定稿"],
  ["查重记录", "/plagiarism", "查重"],
  ["答辩准备", "/defense-prep", "答辩"],
  ["文件中心", "/files", "文件 导入"],
  ["设置", "/settings", "偏好 AI 设置"],
] as const;

export function CommandPalette() {
  const isOpen = useWorkspaceStore((state) => state.isCommandPaletteOpen);
  const setOpen = useWorkspaceStore((state) => state.setCommandPaletteOpen);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const results = useMemo(() => commands.filter(([label, , keywords]) => `${label} ${keywords}`.toLocaleLowerCase().includes(normalizedQuery)), [normalizedQuery]);
  const run = (path: string) => { navigate(path); setOpen(false); setQuery(""); };
  useEffect(() => {
    if (!isOpen) setQuery("");
  }, [isOpen]);
  if (!isOpen) return null;
  return <div className="command-backdrop" role="dialog" aria-modal="true" aria-label="命令面板" onMouseDown={() => setOpen(false)}>
    <div className="command-palette" onMouseDown={(event) => event.stopPropagation()}><div className="command-input"><Search size={17} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && results[0]) run(results[0][1]); if (event.key === "Escape") setOpen(false); }} placeholder="搜索页面、任务或命令…" aria-label="搜索页面、任务或命令" /><button className="icon-button" onClick={() => setOpen(false)} aria-label="关闭命令面板"><X size={16} /></button></div>
      <p className="command-label">{normalizedQuery ? `搜索结果 · ${results.length}` : "快速跳转"}</p>
      <div className="command-results">{results.map(([label, path]) => <button className="command-item" key={path} onClick={() => run(path)}><Command size={14} /><span>{label}</span><kbd>Enter</kbd></button>)}
        {results.length === 0 && <div className="command-empty" role="status">没有匹配的页面，请换一个关键词。</div>}
      </div>
    </div>
  </div>;
}

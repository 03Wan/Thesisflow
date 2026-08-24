import type { LucideIcon } from "lucide-react";
import {
  Archive, BookOpen, CheckCircle2, ClipboardCheck, FileCheck2, FileText, FolderArchive,
  GraduationCap, LayoutDashboard, Library, ListChecks, MessageSquareMore, NotebookPen,
  PencilLine, Presentation, Scale, SearchCheck, Settings, ShieldCheck, Sparkles, UsersRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

type NavItem = { label: string; to: string; icon: LucideIcon; badge?: number };
type NavGroup = { label: string; items: NavItem[] };

const navigation: NavGroup[] = [
  { label: "准备", items: [{ label: "项目总览", to: "/overview", icon: LayoutDashboard }, { label: "项目", to: "/projects", icon: FolderArchive }, { label: "论文要求", to: "/requirements", icon: ShieldCheck }, { label: "选题", to: "/topic", icon: NotebookPen }, { label: "任务书", to: "/task-book", icon: ClipboardCheck }] },
  { label: "研究", items: [{ label: "文献研究", to: "/literature", icon: Library }, { label: "开题报告", to: "/proposal", icon: FileText }, { label: "研究设计", to: "/research-design", icon: Sparkles }, { label: "数据 / 调研", to: "/implementation", icon: SearchCheck }] },
  { label: "写作", items: [{ label: "论文大纲", to: "/outline", icon: ListChecks }, { label: "正文写作", to: "/writing", icon: PencilLine }, { label: "外文翻译", to: "/translation", icon: BookOpen }, { label: "中期检查", to: "/midterm", icon: CheckCircle2 }] },
  { label: "修改", items: [{ label: "导师指导", to: "/guidance", icon: MessageSquareMore }, { label: "修改任务", to: "/revisions", icon: ListChecks }, { label: "全文智评", to: "/compliance", icon: SearchCheck }, { label: "引用核验", to: "/advisor-review", icon: FileCheck2 }, { label: "格式检查", to: "/reviewer-review", icon: CheckCircle2 }, { label: "版本历史", to: "/version-history", icon: Archive }] },
  { label: "定稿", items: [{ label: "论文定稿", to: "/finalization", icon: FileCheck2 }, { label: "查重记录", to: "/plagiarism", icon: ShieldCheck }, { label: "教师评阅", to: "/teacher-review", icon: UsersRound }, { label: "论文抽检", to: "/sampling", icon: Scale }] },
  { label: "答辩", items: [{ label: "答辩准备", to: "/defense-prep", icon: Presentation }, { label: "模拟答辩", to: "/mock-defense", icon: GraduationCap }, { label: "答辩记录", to: "/defense", icon: ClipboardCheck }, { label: "答辩后修改", to: "/post-defense-revision", icon: PencilLine }] },
  { label: "完成", items: [{ label: "最终稿", to: "/final-manuscript", icon: FileText }, { label: "材料归档", to: "/archive", icon: FolderArchive }, { label: "文件中心", to: "/files", icon: Archive }] },
];

export function Sidebar() {
  return <aside className="sidebar">
    <div className="brand"><span className="brand-mark">T</span><strong>ThesisFlow</strong></div>
    <nav className="sidebar-scroll" aria-label="论文工作台">
      {navigation.map((group) => <section className="nav-group" key={group.label} aria-label={group.label}>
        <p className="nav-group-label">{group.label}</p>
        {group.items.map(({ label, to, icon: Icon, badge }) => <NavLink end={to === "/overview"} key={`${label}-${to}`} to={to} className={({ isActive }) => cn("nav-item", isActive && "nav-item-active")}>
          <Icon size={15} strokeWidth={1.9} /><span>{label}</span>{badge ? <span className="nav-badge">{badge}</span> : null}
        </NavLink>)}
      </section>)}
    </nav>
    <NavLink to="/settings" className={({ isActive }) => cn("nav-item settings-link", isActive && "nav-item-active")}><Settings size={15} /><span>设置</span></NavLink>
  </aside>;
}

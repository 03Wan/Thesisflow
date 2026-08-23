import { Bell, CheckCircle2, ChevronDown, Command, Search } from "lucide-react";
import { useState } from "react";
import { mockThesisProject } from "@/data/mock/thesis-project";
import { useWorkspaceStore } from "@/stores/workspace-store";
import "./topbar.css";

export function Topbar() {
  const openCommand = useWorkspaceStore((state) => state.setCommandPaletteOpen);
  const [panel, setPanel] = useState<"notifications" | "profile" | null>(null);
  return <header className="topbar">
    <div className="project-context"><strong>{mockThesisProject.title}</strong><span className="project-tag">本科毕业论文</span></div>
    <div className="topbar-actions">
      <button className="search-trigger" onClick={() => openCommand(true)} aria-label="打开命令面板"><Search size={15} /><span>搜索</span><kbd><Command size={11} />K</kbd></button>
      <div className="topbar-menu-wrap"><button className="icon-button" onClick={() => setPanel(panel === "notifications" ? null : "notifications")} aria-label="通知"><Bell size={17} /><i /></button>{panel === "notifications" && <div className="topbar-popover"><b>通知</b><p><CheckCircle2 size={13} />导师意见 #23 已关联修改任务</p><p><Bell size={13} />中期检查材料将在 3 天后截止</p></div>}</div>
      <div className="topbar-menu-wrap"><button className="profile-button" onClick={() => setPanel(panel === "profile" ? null : "profile")} aria-label="个人菜单"><span className="avatar">张</span><span>张同学</span><ChevronDown size={14} /></button>{panel === "profile" && <div className="topbar-popover profile-popover"><b>张同学</b><span>本科毕业论文工作台</span><button onClick={() => setPanel(null)}>关闭菜单</button></div>}</div>
    </div>
  </header>;
}

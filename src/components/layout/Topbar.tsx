import { Bell, ChevronDown, Command, Search } from "lucide-react";
import { mockThesisProject } from "@/data/mock/thesis-project";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function Topbar() {
  const openCommand = useWorkspaceStore((state) => state.setCommandPaletteOpen);
  return <header className="topbar">
    <div className="project-context"><strong>{mockThesisProject.title}</strong><span className="project-tag">本科毕业论文</span></div>
    <div className="topbar-actions">
      <button className="search-trigger" onClick={() => openCommand(true)} aria-label="打开命令面板"><Search size={15} /><span>搜索</span><kbd><Command size={11} />K</kbd></button>
      <button className="icon-button" aria-label="通知"><Bell size={17} /><i /></button>
      <button className="profile-button" aria-label="个人菜单"><span className="avatar">张</span><span>张同学</span><ChevronDown size={14} /></button>
    </div>
  </header>;
}

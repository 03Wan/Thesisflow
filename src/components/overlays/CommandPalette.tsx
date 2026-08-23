import { Command, Search, X } from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useNavigate } from "react-router-dom";

export function CommandPalette() {
  const isOpen = useWorkspaceStore((state) => state.isCommandPaletteOpen);
  const setOpen = useWorkspaceStore((state) => state.setCommandPaletteOpen);
  const navigate = useNavigate();
  const shortcuts: Record<string, string> = { "项目总览": "/overview", "正文写作": "/writing", "文献研究": "/literature", "答辩准备": "/defense-prep" };
  if (!isOpen) return null;
  return <div className="command-backdrop" role="dialog" aria-modal="true" aria-label="命令面板" onMouseDown={() => setOpen(false)}>
    <div className="command-palette" onMouseDown={(event) => event.stopPropagation()}><div className="command-input"><Search size={17} /><input autoFocus placeholder="搜索页面、任务或命令…" /><button className="icon-button" onClick={() => setOpen(false)} aria-label="关闭命令面板"><X size={16} /></button></div>
      <p className="command-label">快速跳转</p>{Object.keys(shortcuts).map((item) => <button className="command-item" key={item} onClick={() => { navigate(shortcuts[item]); setOpen(false); }}><Command size={14} />{item}</button>)}
    </div>
  </div>;
}

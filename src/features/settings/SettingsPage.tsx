import { useState } from "react";
import { Bell, CheckCircle2, ChevronRight, Database, FolderCog, Monitor, Moon, Palette, RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import "./settings.css";

type ToggleKey = "autoSave" | "dueReminder" | "compactMode" | "localAnalytics";

const sections = [
  { id: "workspace", label: "工作区偏好", icon: FolderCog },
  { id: "editor", label: "编辑器与写作", icon: Palette },
  { id: "notifications", label: "通知与提醒", icon: Bell },
  { id: "privacy", label: "数据与隐私", icon: ShieldCheck },
];

export function SettingsPage() {
  const [active, setActive] = useState("workspace");
  const [notice, setNotice] = useState("");
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({ autoSave: true, dueReminder: true, compactMode: false, localAnalytics: false });
  const toggle = (key: ToggleKey) => setToggles((current) => ({ ...current, [key]: !current[key] }));

  return <section className="settings-page">
    <header className="settings-header">
      <div><p>工作台 / 本地偏好</p><h1>设置</h1><span>偏好仅在当前界面会话中演示，不会同步至云端或学校系统。</span></div>
      <button className="settings-reset" onClick={() => { setToggles({ autoSave: true, dueReminder: true, compactMode: false, localAnalytics: false }); setNotice("已恢复本地 Mock 默认偏好"); }}><RotateCcw size={14} />恢复默认</button>
    </header>
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="设置分组">
        {sections.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? "active" : ""} onClick={() => setActive(id)}><Icon size={15} />{label}<ChevronRight size={14} /></button>)}
        <div className="settings-nav-note"><Sparkles size={14} /><span>ThesisFlow Desktop Alpha<br />v0.1.0 · 本地 Mock 模式</span></div>
      </nav>
      <main className="settings-content">
        {active === "workspace" && <SettingsGroup title="工作区偏好" description="管理当前项目的本地显示与保存行为。">
          <SettingRow icon={<FolderCog size={16} />} title="当前项目" description="数字贸易壁垒对中国制造业企业创新的影响"><span className="settings-value">项目 #TH-2025-062</span></SettingRow>
          <SettingRow icon={<Monitor size={16} />} title="默认工作区" description="每次打开 ThesisFlow 时进入的页面"><select defaultValue="overview"><option value="overview">项目总览</option><option value="writing">正文写作</option><option value="outline">论文大纲</option></select></SettingRow>
          <SettingRow icon={<CheckCircle2 size={16} />} title="自动保存" description="编辑过程中显示本地自动保存状态"><Toggle checked={toggles.autoSave} onClick={() => toggle("autoSave")} /></SettingRow>
          <SettingRow icon={<Monitor size={16} />} title="紧凑信息密度" description="减少表格与卡片的垂直间距"><Toggle checked={toggles.compactMode} onClick={() => toggle("compactMode")} /></SettingRow>
        </SettingsGroup>}
        {active === "editor" && <SettingsGroup title="编辑器与写作" description="这些选项仅用于界面预演，正文内容不会被真实导出。">
          <SettingRow icon={<Palette size={16} />} title="论文正文宽度" description="维持舒适的学术阅读行长"><select defaultValue="standard"><option value="standard">标准 · 760px</option><option value="wide">较宽 · 840px</option><option value="narrow">紧凑 · 680px</option></select></SettingRow>
          <SettingRow icon={<Moon size={16} />} title="界面主题" description="当前 Alpha 固定使用浅色生产力主题"><span className="settings-value">浅色 · 已固定</span></SettingRow>
          <SettingRow icon={<Palette size={16} />} title="引用标记样式" description="正文中的文献引用显示方式"><select defaultValue="numeric"><option value="numeric">数字编号 [1]</option><option value="author">作者—年份（占位）</option></select></SettingRow>
        </SettingsGroup>}
        {active === "notifications" && <SettingsGroup title="通知与提醒" description="提醒目前只作为前端 Mock 反馈，不会发送系统通知或邮件。">
          <SettingRow icon={<Bell size={16} />} title="截止日期提醒" description="在项目节点临近时显示提醒"><Toggle checked={toggles.dueReminder} onClick={() => toggle("dueReminder")} /></SettingRow>
          <SettingRow icon={<Bell size={16} />} title="导师意见提醒" description="收到新的 Mock 导师意见时提示待处理任务"><select defaultValue="inapp"><option value="inapp">仅应用内</option><option value="off">关闭</option></select></SettingRow>
          <SettingRow icon={<Bell size={16} />} title="提醒提前时间" description="用于校准节点日历的提示时间"><select defaultValue="3"><option value="3">提前 3 天</option><option value="7">提前 7 天</option><option value="1">提前 1 天</option></select></SettingRow>
        </SettingsGroup>}
        {active === "privacy" && <SettingsGroup title="数据与隐私" description="ThesisFlow Desktop Alpha 当前不接入账户、云端、学校系统或真实 AI 服务。">
          <SettingRow icon={<Database size={16} />} title="数据存储状态" description="当前展示内容由项目 Mock 数据源提供"><span className="settings-value success">仅本地 Mock</span></SettingRow>
          <SettingRow icon={<ShieldCheck size={16} />} title="使用情况统计" description="不收集诊断或行为统计数据"><Toggle checked={toggles.localAnalytics} onClick={() => toggle("localAnalytics")} /></SettingRow>
          <SettingRow icon={<Database size={16} />} title="清除本地演示状态" description="重置当前会话的按钮与开关演示"><button className="settings-text-button" onClick={() => setNotice("本地演示状态已清除（Mock）")}>清除状态</button></SettingRow>
        </SettingsGroup>}
      </main>
    </div>
    {notice && <div className="settings-toast"><CheckCircle2 size={14} />{notice}<button onClick={() => setNotice("")}>×</button></div>}
  </section>;
}

function SettingsGroup({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <section className="settings-group"><header><h2>{title}</h2><p>{description}</p></header><div>{children}</div></section>;
}

function SettingRow({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) {
  return <div className="settings-row"><span className="settings-row-icon">{icon}</span><div><strong>{title}</strong><p>{description}</p></div><aside>{children}</aside></div>;
}

function Toggle({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return <button type="button" aria-pressed={checked} className={`settings-toggle ${checked ? "on" : ""}`} onClick={onClick}><i /></button>;
}

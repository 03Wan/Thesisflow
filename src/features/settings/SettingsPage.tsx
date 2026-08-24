import { useEffect, useState } from "react";
import { Bell, CheckCircle2, ChevronRight, Database, FolderCog, Monitor, Moon, Palette, RotateCcw, ShieldCheck, Sparkles, KeyRound, Wifi, Trash2 } from "lucide-react";
import "./settings.css";
import { TauriSecretConfigurationStore } from "@/ai/secretStore";

type ToggleKey = "autoSave" | "dueReminder" | "compactMode" | "localAnalytics";

const sections = [
  { id: "workspace", label: "工作区偏好", icon: FolderCog },
  { id: "editor", label: "编辑器与写作", icon: Palette },
  { id: "notifications", label: "通知与提醒", icon: Bell },
  { id: "privacy", label: "数据与隐私", icon: ShieldCheck },
  { id: "ai", label: "AI 设置", icon: Sparkles },
];

export function SettingsPage() {
  const [active, setActive] = useState("workspace");
  const [notice, setNotice] = useState("");
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({ autoSave: true, dueReminder: true, compactMode: false, localAnalytics: false });
  const toggle = (key: ToggleKey) => setToggles((current) => ({ ...current, [key]: !current[key] }));
  const [providerStates, setProviderStates] = useState<Record<string, ProviderState>>({});

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
        {active === "ai" && <SettingsGroup title="AI Provider 与隐私" description="Key 只可保存到本机安全凭据存储；保存后不会回显，也不会自动复制到剪贴板。">
          <SettingRow icon={<ShieldCheck size={16} />} title="最小化 ContextPack" description="默认仅发送当前项目、已确认规则、真实逾期任务和用户显式选中的来源。"><span className="settings-value success">已启用</span></SettingRow>
          {["OpenAI", "Anthropic", "Gemini", "DeepSeek"].map((name) => <ProviderCard key={name} name={name} state={providerStates[name]} onChange={(next) => setProviderStates(current => ({ ...current, [name]: next }))} />)}
          <SettingRow icon={<ShieldCheck size={16} />} title="AI 隐私偏好" description="可在实际 AI 功能发送前查看 Context Preview；自定义 Endpoint 会单独显示隐私边界警告。"><span className="settings-value">仅必要上下文</span></SettingRow>
          <SettingRow icon={<Database size={16} />} title="AI Run 历史" description="仅显示时间、任务、Provider、模型、状态和原始 usage；不显示估算费用。"><span className="settings-value">暂无记录</span></SettingRow>
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

type ProviderState = { configured: boolean; enabled: boolean; status: string; tested: string; model: string; baseUrl: string };
const providerKey = (name: string) => `thesisflow/ai/${name.toLowerCase()}`;
const safeConnectionLabel: Record<string, string> = { success: "成功", auth_error: "认证失败", network_error: "网络错误", rate_limited: "限流", timed_out: "超时", unsupported: "不支持", unknown: "未知错误" };

function ProviderCard({ name, state, onChange }: { name: string; state?: ProviderState; onChange: (state: ProviderState) => void }) {
  const [key, setKey] = useState(""); const [advanced, setAdvanced] = useState(false); const [busy, setBusy] = useState(false);
  const current = state ?? { configured: false, enabled: false, status: "未配置", tested: "—", model: "", baseUrl: "" };
  const update = (change: Partial<ProviderState>) => onChange({ ...current, ...change });
  useEffect(() => { let alive = true; new TauriSecretConfigurationStore().hasSecret(providerKey(name)).then(configured => alive && !state && update({ configured, enabled: configured, status: configured ? "待测试" : "未配置" })).catch(() => alive && !state && update({ status: "安全存储不可用" })); return () => { alive = false; }; }, [name]);
  const save = async () => { if (!key) return; setBusy(true); try { await new TauriSecretConfigurationStore().saveSecret(providerKey(name), key); update({ configured: true, enabled: true, status: "待测试", tested: "—" }); setKey(""); } catch { update({ configured: false, enabled: false, status: "安全存储不可用" }); } finally { setBusy(false); } };
  const remove = async () => { if (!window.confirm(`删除 ${name} 凭据？此操作不会影响已有 AI Run 记录。`)) return; setBusy(true); try { await new TauriSecretConfigurationStore().deleteSecret(providerKey(name)); update({ configured: false, enabled: false, status: "未配置", tested: "—" }); } catch { update({ status: "删除失败：安全存储不可用" }); } finally { setBusy(false); } };
  const test = () => update({ tested: new Date().toLocaleString(), status: current.configured ? "待 Provider 连接测试" : "未配置" });
  return <div className="settings-row" style={{ alignItems: "flex-start" }}><span className="settings-row-icon"><KeyRound size={16}/></span><div><strong>{name} · {current.configured ? "已配置" : "未配置"}</strong><p>模型能力由 Provider/Model 动态声明，不在业务页面硬编码；可手动输入 model id。</p><p><label><input type="checkbox" checked={current.enabled} disabled={!current.configured} onChange={e => update({ enabled: e.target.checked })} /> 启用 Provider</label></p><input aria-label={`${name} API Key`} type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="输入 API Key（保存后不可回显）" /><input aria-label={`${name} Model ID`} value={current.model} onChange={e => update({ model: e.target.value })} placeholder="默认模型 / 手动输入 model id" /><p><button className="settings-text-button" disabled={!key || busy} onClick={save}>{busy ? "处理中…" : "保存密钥"}</button> <button className="settings-text-button" disabled={!current.configured || busy} onClick={test}><Wifi size={13}/>测试连接</button> <button className="settings-text-button" disabled={!current.configured || busy} onClick={remove}><Trash2 size={13}/>删除凭据</button></p><button className="settings-text-button" onClick={() => setAdvanced(v => !v)}>高级 Base URL {advanced ? "收起" : "展开"}</button>{advanced && <p style={{ color: "#b35e00" }}>自定义 Endpoint 可能改变数据接收方和隐私边界。<input value={current.baseUrl} onChange={e => update({ baseUrl: e.target.value })} placeholder="留空则使用官方 Endpoint" /></p>}<p>状态：{safeConnectionLabel[current.status] ?? current.status} · 最近测试：{current.tested}</p></div></div>;
}

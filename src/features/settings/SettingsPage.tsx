import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCircle2, ChevronRight, Database, FolderCog, Monitor, Moon, Palette, RotateCcw, ShieldCheck, Sparkles, KeyRound, Wifi, Trash2 } from "lucide-react";
import "./settings.css";
import "./settings-complete.css";
import { TauriSecretConfigurationStore } from "@/ai/secretStore";
import { readBrowserProviderConfigs, removeBrowserProviderConfig, saveBrowserProviderConfig } from "@/ai/browserProviderConfig";
import { useProjectStore } from "@/stores/project-store";

type ToggleKey = "autoSave" | "dueReminder" | "compactMode" | "localAnalytics";

const sections = [
  { id: "workspace", label: "工作区偏好", icon: FolderCog },
  { id: "editor", label: "编辑器与写作", icon: Palette },
  { id: "notifications", label: "通知与提醒", icon: Bell },
  { id: "privacy", label: "数据与隐私", icon: ShieldCheck },
  { id: "ai", label: "AI 设置", icon: Sparkles },
];

export function SettingsPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState("workspace");
  const [notice, setNotice] = useState("");
  const [defaultWorkspace, setDefaultWorkspace] = useState(() => window.localStorage.getItem("thesisflow/default-workspace") ?? "overview");
  const [theme, setTheme] = useState(() => window.localStorage.getItem("thesisflow/theme") ?? "light");
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>({ autoSave: true, dueReminder: true, compactMode: false, localAnalytics: false });
  const toggle = (key: ToggleKey) => setToggles((current) => ({ ...current, [key]: !current[key] }));
  const [providerStates, setProviderStates] = useState<Record<string, ProviderState>>({});
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];
  const browserPreview = typeof window !== "undefined" && !("__TAURI_INTERNALS__" in window);
  useEffect(() => { document.documentElement.dataset.theme = theme; window.localStorage.setItem("thesisflow/theme", theme); }, [theme]);
  const saveDefaultWorkspace = (value: string) => { setDefaultWorkspace(value); window.localStorage.setItem("thesisflow/default-workspace", value); setNotice(`默认工作区已设为“${{ overview: "项目总览", writing: "正文写作", outline: "论文大纲" }[value] ?? value}”。`); };

  return <section className="settings-page">
    <header className="settings-header">
      <div><p>工作台 / 本地偏好</p><h1>设置</h1><span>偏好保存在本地工作台，不会同步至云端或外部系统。</span></div>
      <button className="settings-reset" onClick={() => { setToggles({ autoSave: true, dueReminder: true, compactMode: false, localAnalytics: false }); setNotice("已恢复本地 Mock 默认偏好"); }}><RotateCcw size={14} />恢复默认</button>
    </header>
    <div className="settings-summary" aria-label="当前设置摘要">
      <article><Database size={16}/><div><span>存储模式</span><strong>{browserPreview ? "浏览器本地存储" : "桌面本地目录"}</strong></div></article>
      <article><CheckCircle2 size={16}/><div><span>自动保存</span><strong>{toggles.autoSave ? "已开启" : "已关闭"}</strong></div></article>
      <article><ShieldCheck size={16}/><div><span>隐私状态</span><strong>仅处理当前项目</strong></div></article>
    </div>
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="设置分组">
        {sections.map(({ id, label, icon: Icon }) => <button key={id} className={active === id ? "active" : ""} onClick={() => setActive(id)}><Icon size={15} />{label}<ChevronRight size={14} /></button>)}
        <div className="settings-nav-note"><Sparkles size={14} /><span>本地工作台<br />设置仅作用于当前设备</span></div>
      </nav>
      <main className="settings-content">
        {active === "workspace" && <SettingsGroup title="工作区偏好" description="管理当前项目的本地显示与保存行为。">
          <SettingRow icon={<FolderCog size={16} />} title="当前项目" description={activeProject?.title || "尚未选择项目"}><span className="settings-value">{activeProject ? `学生：${activeProject.studentName || "待完善"}` : "未打开"}</span></SettingRow>
          <SettingRow icon={<Monitor size={16} />} title="默认工作区" description="每次从项目入口进入工作台时默认打开的页面"><select aria-label="默认工作区" value={defaultWorkspace} onChange={(event) => saveDefaultWorkspace(event.target.value)}><option value="overview">项目总览</option><option value="writing">正文写作</option><option value="outline">论文大纲</option></select><button className="settings-text-button" onClick={() => navigate(`/${defaultWorkspace}`)}>立即前往</button></SettingRow>
          <SettingRow icon={<CheckCircle2 size={16} />} title="自动保存" description="编辑过程中显示本地自动保存状态"><Toggle label="自动保存" checked={toggles.autoSave} onClick={() => toggle("autoSave")} /></SettingRow>
          <SettingRow icon={<Monitor size={16} />} title="紧凑信息密度" description="减少表格与卡片的垂直间距"><Toggle label="紧凑信息密度" checked={toggles.compactMode} onClick={() => toggle("compactMode")} /></SettingRow>
          <SettingRow icon={<Database size={16} />} title="项目存储位置" description={browserPreview ? "当前浏览器的 localStorage；桌面版将使用项目目录" : activeProject?.projectFolder || "尚未创建本地目录"}><span className="settings-value">{browserPreview ? "浏览器预览" : "本机目录"}</span></SettingRow>
          <SettingRow icon={<ShieldCheck size={16} />} title="跨项目信息隔离" description="搜索、AI 上下文和文件操作默认限制在当前项目"><span className="settings-value success">已启用</span></SettingRow>
        </SettingsGroup>}
        {active === "editor" && <SettingsGroup title="编辑器与写作" description="管理阅读宽度、引用显示和工作台外观。">
          <SettingRow icon={<Palette size={16} />} title="论文正文宽度" description="维持舒适的学术阅读行长"><select defaultValue="standard"><option value="standard">标准 · 760px</option><option value="wide">较宽 · 840px</option><option value="narrow">紧凑 · 680px</option></select></SettingRow>
          <SettingRow icon={<Moon size={16} />} title="界面主题" description="切换后立即应用到整个工作台，并保存在当前设备"><select aria-label="界面主题" value={theme} onChange={(event) => { setTheme(event.target.value); setNotice(`已切换为${event.target.value === "dark" ? "深色" : "浅色"}模式。`); }}><option value="light">浅色模式</option><option value="dark">深色模式</option></select></SettingRow>
          <SettingRow icon={<Palette size={16} />} title="引用标记样式" description="正文中的文献引用显示方式"><select defaultValue="numeric"><option value="numeric">数字编号 [1]</option><option value="author">作者—年份（占位）</option></select></SettingRow>
        </SettingsGroup>}
        {active === "notifications" && <SettingsGroup title="通知与提醒" description="提醒目前只作为前端 Mock 反馈，不会发送系统通知或邮件。">
          <SettingRow icon={<Bell size={16} />} title="截止日期提醒" description="在项目节点临近时显示提醒"><Toggle label="截止日期提醒" checked={toggles.dueReminder} onClick={() => toggle("dueReminder")} /></SettingRow>
          <SettingRow icon={<Bell size={16} />} title="修改任务提醒" description="出现新的 AI 建议或待处理任务时在应用内提示"><select defaultValue="inapp"><option value="inapp">仅应用内</option><option value="off">关闭</option></select></SettingRow>
          <SettingRow icon={<Bell size={16} />} title="提醒提前时间" description="用于校准节点日历的提示时间"><select defaultValue="3"><option value="3">提前 3 天</option><option value="7">提前 7 天</option><option value="1">提前 1 天</option></select></SettingRow>
        </SettingsGroup>}
        {active === "privacy" && <SettingsGroup title="数据与隐私" description="ThesisFlow Desktop Alpha 当前不接入账户、云端或外部学校系统。">
          <SettingRow icon={<Database size={16} />} title="数据存储状态" description="当前展示内容由项目 Mock 数据源提供"><span className="settings-value success">仅本地 Mock</span></SettingRow>
          <SettingRow icon={<ShieldCheck size={16} />} title="使用情况统计" description="不收集诊断或行为统计数据"><Toggle label="使用情况统计" checked={toggles.localAnalytics} onClick={() => toggle("localAnalytics")} /></SettingRow>
          <SettingRow icon={<Database size={16} />} title="清除本地演示状态" description="重置当前会话的按钮与开关演示"><button className="settings-text-button" onClick={() => setNotice("本地演示状态已清除（Mock）")}>清除状态</button></SettingRow>
        </SettingsGroup>}
        {active === "ai" && <SettingsGroup title="AI Provider 与隐私" description="Key 只可保存到本机安全凭据存储；保存后不会回显，也不会自动复制到剪贴板。">
          <SettingRow icon={<ShieldCheck size={16} />} title="最小化 ContextPack" description="默认仅发送当前项目、已确认规则、真实逾期任务和用户显式选中的来源。"><span className="settings-value success">已启用</span></SettingRow>
          <div className="provider-grid">{providerDefinitions.map((provider) => <ProviderCard key={provider.id} provider={provider} state={providerStates[provider.id]} onChange={(next) => setProviderStates(current => ({ ...current, [provider.id]: next }))} />)}</div>
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

function Toggle({ checked, onClick, label, disabled = false }: { checked: boolean; onClick: () => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" aria-label={label} aria-checked={checked} disabled={disabled} className={`settings-toggle ${checked ? "on" : ""}`} onClick={onClick}><i /></button>;
}

type ProviderState = { configured: boolean; enabled: boolean; status: string; tested: string; model: string; baseUrl: string };
type ProviderDefinition = { id: string; name: string; baseUrl: string; protocol: "openai" | "anthropic" | "gemini" };
const providerDefinitions: ProviderDefinition[] = [
  { id: "openai", name: "OpenAI", baseUrl: "https://api.openai.com/v1", protocol: "openai" },
  { id: "anthropic", name: "Anthropic", baseUrl: "https://api.anthropic.com/v1", protocol: "anthropic" },
  { id: "gemini", name: "Google Gemini", baseUrl: "https://generativelanguage.googleapis.com/v1beta", protocol: "gemini" },
  { id: "deepseek", name: "DeepSeek", baseUrl: "https://api.deepseek.com", protocol: "openai" },
  { id: "qwen", name: "阿里云百炼 / 通义千问", baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1", protocol: "openai" },
  { id: "zhipu", name: "智谱 AI", baseUrl: "https://open.bigmodel.cn/api/paas/v4", protocol: "openai" },
  { id: "moonshot", name: "Moonshot AI", baseUrl: "https://api.moonshot.cn/v1", protocol: "openai" },
  { id: "minimax", name: "MiniMax", baseUrl: "https://api.minimax.chat/v1", protocol: "openai" },
  { id: "groq", name: "Groq", baseUrl: "https://api.groq.com/openai/v1", protocol: "openai" },
  { id: "openrouter", name: "OpenRouter", baseUrl: "https://openrouter.ai/api/v1", protocol: "openai" },
  { id: "siliconflow", name: "硅基流动", baseUrl: "https://api.siliconflow.cn/v1", protocol: "openai" },
  { id: "custom", name: "自定义 OpenAI 兼容服务", baseUrl: "", protocol: "openai" },
];
const providerKey = (id: string) => `thesisflow/ai/${id}`;
const safeConnectionLabel: Record<string, string> = { success: "成功", auth_error: "认证失败", network_error: "网络错误", rate_limited: "限流", timed_out: "超时", unsupported: "不支持", unknown: "未知错误" };

function ProviderCard({ provider, state, onChange }: { provider: ProviderDefinition; state?: ProviderState; onChange: (state: ProviderState) => void }) {
  const [key, setKey] = useState(""); const [advanced, setAdvanced] = useState(provider.id === "custom"); const [busy, setBusy] = useState(false);
  const [savedKey, setSavedKey] = useState("");
  const current = state ?? { configured: false, enabled: false, status: "未配置", tested: "—", model: "", baseUrl: "" };
  const update = (change: Partial<ProviderState>) => onChange({ ...current, ...change });
  const effectiveBaseUrl = current.baseUrl.trim() || provider.baseUrl;
  useEffect(() => { let alive = true; new TauriSecretConfigurationStore().hasSecret(providerKey(provider.id)).then(configured => alive && !state && update({ configured, enabled: configured, status: configured ? "待测试" : "未配置" })).catch(() => { const stored = readBrowserProviderConfigs().find((item) => item.id === provider.id); if (alive && !state && stored) { setSavedKey(stored.secret); update({ configured: true, enabled: stored.enabled, model: stored.model, baseUrl: stored.baseUrl === provider.baseUrl ? "" : stored.baseUrl, status: "浏览器本地已配置" }); } else if (alive && !state) update({ status: "浏览器预览：输入密钥后可测试" }); }); return () => { alive = false; }; }, [provider.id]);
  const save = async () => { if (!key) return; setBusy(true); try { await new TauriSecretConfigurationStore().saveSecret(providerKey(provider.id), key); setSavedKey(key); update({ configured: true, enabled: true, status: "待测试", tested: "—" }); setKey(""); } catch { saveBrowserProviderConfig({ id: provider.id, name: provider.name, protocol: provider.protocol, secret: key, model: current.model, baseUrl: effectiveBaseUrl, enabled: true }); setSavedKey(key); update({ configured: true, enabled: true, status: "浏览器本地已配置", tested: "—" }); setKey(""); } finally { setBusy(false); } };
  const remove = async () => { if (!window.confirm(`删除 ${provider.name} 凭据？此操作不会影响已有 AI Run 记录。`)) return; setBusy(true); try { await new TauriSecretConfigurationStore().deleteSecret(providerKey(provider.id)); update({ configured: false, enabled: false, status: "未配置", tested: "—" }); setSavedKey(""); } catch { removeBrowserProviderConfig(provider.id); update({ configured: false, enabled: false, status: "浏览器本地已移除", tested: "—" }); setSavedKey(""); } finally { setBusy(false); } };
  const test = async () => {
    const secret = key || savedKey;
    if (!secret || !effectiveBaseUrl) { update({ status: !secret ? "请输入 API Key 后测试" : "请填写 Base URL", tested: new Date().toLocaleString() }); return; }
    setBusy(true); update({ status: "测试中…", tested: new Date().toLocaleString() });
    try { update({ status: await testProviderConnection(provider.protocol, effectiveBaseUrl, secret) }); }
    catch { update({ status: "网络错误" }); }
    finally { setBusy(false); }
  };
  const statusLabel = safeConnectionLabel[current.status] ?? current.status;
  return <article className={`provider-card ${current.configured ? "is-configured" : ""}`}>
    <header>
      <span className="settings-row-icon"><KeyRound size={16}/></span>
      <div><strong>{provider.name}</strong><p>{current.configured ? "凭据已保存；可使用当前输入或本会话密钥测试" : "尚未配置凭据"}</p></div>
      <span className={`provider-status ${current.configured ? "ready" : "idle"}`}>{current.configured ? "已配置" : "未配置"}</span>
    </header>
    <div className="provider-enable">
      <div><b>启用 Provider</b><span>{current.configured ? "允许在 AI 功能中选择" : "保存密钥后可启用"}</span></div>
      <Toggle label={`启用 ${provider.name}`} checked={current.enabled} disabled={!current.configured} onClick={() => update({ enabled: !current.enabled })} />
    </div>
    <div className="provider-fields">
      <label><span>API Key</span><input aria-label={`${provider.name} API Key`} type="password" value={key} onChange={e => setKey(e.target.value)} placeholder="输入后可立即测试或安全保存" /></label>
      <label><span>模型 ID <i>选填</i></span><input aria-label={`${provider.name} Model ID`} value={current.model} onChange={e => update({ model: e.target.value })} placeholder="例如：模型名称" /></label>
    </div>
    {advanced && <div className="provider-advanced"><div><b>自定义 Base URL</b><span>自定义地址会改变数据接收方，请确认隐私边界。</span></div><input value={current.baseUrl} onChange={e => update({ baseUrl: e.target.value })} placeholder={provider.baseUrl || "例如：https://your-server.example/v1"} /></div>}
    <footer>
      <div className="provider-actions">
        <button className="provider-primary" disabled={!key || busy} onClick={save}>{busy ? "处理中…" : "保存密钥"}</button>
        <button className="settings-text-button" disabled={busy} onClick={test}><Wifi size={13}/>{busy ? "测试中…" : "测试连接"}</button>
        <button className="provider-icon-button danger" aria-label={`删除 ${provider.name} 凭据`} disabled={!current.configured || busy} onClick={remove}><Trash2 size={14}/></button>
      </div>
      <button className={`provider-advanced-toggle ${advanced ? "active" : ""}`} onClick={() => setAdvanced(v => !v)}>高级设置</button>
    </footer>
    <p className="provider-meta"><span className={`provider-dot ${current.configured ? "ready" : ""}`} />连接状态：{statusLabel}<em>最近测试：{current.tested}</em></p>
  </article>;
}

async function testProviderConnection(protocol: ProviderDefinition["protocol"], baseUrl: string, secret: string): Promise<string> {
  const base = baseUrl.replace(/\/$/, "");
  const request = protocol === "gemini"
    ? fetch(`${base}/models?key=${encodeURIComponent(secret)}`)
    : protocol === "anthropic"
      ? fetch(`${base}/models`, { headers: { "x-api-key": secret, "anthropic-version": "2023-06-01" } })
      : fetch(`${base}/models`, { headers: { Authorization: `Bearer ${secret}` } });
  const response = await request;
  if (response.ok) return "success";
  if (response.status === 401 || response.status === 403) return "auth_error";
  if (response.status === 429) return "rate_limited";
  if (response.status >= 500) return "network_error";
  return "unknown";
}

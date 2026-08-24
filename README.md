# ThesisFlow 桌面端

**中文** · [English](./README.en.md)

ThesisFlow 是面向本科毕业论文全过程的 Windows 优先、本地优先学生工作台。它将项目资料、论文要求、选题、任务书、文献研究、研究设计、正文写作、修改任务、答辩与归档集中到一个桌面应用中。

> 当前版本为 `v0.1.0 Alpha`。项目数据默认保存在本机；学校教务、论文提交、查重与云同步系统尚未接入。AI、教师指导与评阅界面用于本地配置、记录和流程辅助，不代表已经连接学校或真实教师系统。

## 主要功能

- **学生论文工作台**：项目总览、阶段进度、近期节点、日历、待办任务和文件动态。
- **准备阶段**：论文要求、选题与任务书管理。
- **研究阶段**：文献库、开题报告、研究设计、数据与调研材料。
- **写作阶段**：论文大纲、正文写作、外文翻译与中期检查。
- **修改与质量控制**：修改任务、指导记录、教师评阅、全文智评、引用核验、格式检查和版本历史。
- **答辩与归档**：答辩准备、模拟答辩、答辩记录、答辩后修改、最终稿、材料归档与文件中心。
- **本地 AI 配置**：支持按 Provider 配置模型与密钥；密钥通过桌面原生安全存储保存，不写入项目代码或浏览器存储。
- **响应式桌面界面**：针对高缩放、窄窗口、文字对比度、点击区域和信息密度进行了统一优化。

## 技术栈

- React 18、TypeScript、Vite
- Tauri 2、Rust
- SQLite、本地项目目录
- Zustand、React Router、Tiptap、Recharts
- Vitest、Testing Library

## Windows 环境要求

- Node.js 20+
- Rust stable 与 Cargo（推荐通过 `rustup` 安装）
- Visual Studio 2022 Build Tools，并安装 **Desktop development with C++** 工作负载和 Windows SDK
- Microsoft Edge WebView2 Runtime（安装包可在缺失时提供引导）

## 开发运行

```powershell
npm install
npm run tauri dev
```

仅调试前端时：

```powershell
npm run dev
```

然后访问 `http://127.0.0.1:5173`。如果 Vite 自动选择了其他端口，请以终端输出为准。

## 检查与构建

```powershell
npm run typecheck
npm run test
npm run build
npm run tauri build
```

Windows 桌面安装包通常生成在：

- `src-tauri\target\release\bundle\nsis\`
- `src-tauri\target\release\bundle\msi\`

实际生成的安装包类型取决于构建机器上的 Windows 工具链。正式发布前请替换 Alpha 占位图标，并完成干净环境安装验证。

## 本地数据与文档解析

- 项目数据保存在本机 SQLite 数据库及项目目录中。
- 本地解析支持 DOCX、文本型 PDF、XLSX、CSV、TXT 与 Markdown。
- 扫描型 PDF 会标记为 `needs_ocr`；当前版本不会伪造或猜测扫描内容。
- 旧版 `.doc` 文件会保留原件；存在本地转换器时可尝试转换，否则会提示另存为 DOCX 或 PDF。
- 解析结果仅保存在项目的 `.thesisflow/parsed/` 目录中。

## AI 与隐私边界

- 在 **设置 → AI 设置** 中启用 Provider、保存 API Key，并选择或手动填写模型 ID。
- 桌面端密钥通过原生命令写入 Windows Credential Manager；界面只能读取“已配置/未配置”状态。
- SQLite 只保存密钥引用和配置元数据，不保存明文 API Key。
- 不应使用 `localStorage`、`sessionStorage`、明文 JSON 或已提交的 `.env` 文件持久化用户密钥。
- AI 上下文仅包含任务声明需要的规则、阶段、用户选中片段和来源引用，不默认发送完整论文或完整文献库。
- 导入文档始终被视为不可信数据，不能作为系统指令执行。
- AI 输出默认只读，不能自动修改规则、阶段、文件、论文正文或研究事实。

## 当前实现状态

Alpha 已包含桌面外壳、核心路由、本地数据层、文件解析基础、AI Provider 配置界面、文献工作区和主要学生流程界面。以下能力仍属于待验收或受限功能：

- 真实学校账号、审批、提交和查重系统接入
- 云同步、OCR、在线文档分析与正式语音识别
- 真实教师端协同及学校级指导/评阅数据同步
- AI 实时生成、持久化流式会话、完整来源跳转和自动任务闭环
- 文献在线发现、冲突合并、全文定位、证据卡生命周期和语义向量检索的完整端到端流程

更详细的验收记录见：

- `docs/testing/phase4-final-acceptance-report.md`
- `docs/testing/phase5-final-acceptance-report.md`
- `design-qa.md`
- `design-audit/2026-08-24-all-routes/audit-report.md`

## Mock 数据说明

以下文件仍为 Alpha 界面演示数据，不应被解释为学校确认规则或真实论文记录：

- `src/data/mock/thesis-project.ts`
- `src/data/mock/literature.ts`
- `src/data/mock/workflow.ts`

## 安全提示

不要把 API Key、论文全文、未公开研究数据或个人敏感信息提交到 Git。正式分发前还应完成依赖审计、隐私检查、签名安装包验证和真实设备回归测试。

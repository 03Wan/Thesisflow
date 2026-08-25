# ThesisFlow 桌面端

**中文** · [English](./README.en.md)

ThesisFlow 是面向本科毕业论文全过程的 Windows 优先、本地优先学生工作台。它将项目资料、论文要求、选题、任务书、文献研究、研究设计、正文写作、修改任务、答辩与归档集中到一个桌面应用中。

> 当前版本为 `v0.1.0 Alpha`。项目数据默认保存在本机；学校教务、论文提交、查重与云同步系统尚未接入。AI、教师指导与评阅界面用于本地配置、记录和流程辅助，不代表已经连接学校或真实教师系统。

## 主要功能

- **19 阶段学生论文工作流**：从论文规则解析、选题、任务书、文献研究、开题报告到论文答辩、最终稿和材料归档；阶段状态与本地待办可持续保存。
- **准备阶段**：论文要求、选题与任务书管理。
- **研究阶段**：文献库、开题报告、研究设计、数据与调研材料。
- **写作阶段**：论文大纲、正文写作、外文翻译与中期检查。
- **修改与质量控制**：修改任务、指导记录、教师评阅、全文智评、引用核验、格式检查和版本历史。
- **答辩与归档**：可编辑 12 页答辩提纲并导出真实 PPTX、编辑和导出讲稿、保存答辩清单、进行真实计时与浏览器录音、生成最终稿和本地归档文件包。
- **可落地文件操作**：支持实际解析进度、解析结果展示、Word/PDF/文本导出及 ZIP 材料包下载；失败会显示真实错误，不以成功弹窗代替结果。
- **可用的 AI 配置**：支持 OpenAI 兼容接口、DeepSeek、Anthropic、Gemini 及自定义供应商；连接测试、页面助手、开题补全和全文重新评估均调用当前启用的模型。
- **统一浅色/深色主题**：全局页面、卡片、悬停状态、AI 助手和响应式弹窗均使用统一主题变量适配。

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
- Tauri 桌面端优先通过原生命令保存密钥；纯浏览器预览模式无法使用系统凭据服务，因此配置只保存在当前浏览器的本地存储中。
- API Key 不会写入项目源代码、Git、导出文件或论文材料。共享设备上使用浏览器预览模式后，应在 AI 设置中删除配置或清理站点数据。
- 桌面版采用便携式本地存储：`thesisflow.db`、`ThesisFlow/Projects` 及导入文件均保存在 EXE 所在目录中。请将程序放在普通用户可写目录；安装在 `C:\Program Files` 时可能因 Windows 权限限制而无法保存。
- AI 上下文仅包含任务声明需要的规则、阶段、用户选中片段和来源引用，不默认发送完整论文或完整文献库。
- 导入文档始终被视为不可信数据，不能作为系统指令执行。
- AI 输出默认只读，不能自动修改规则、阶段、文件、论文正文或研究事实。

## 当前实现状态

Alpha 已包含桌面外壳、19 阶段学生工作流、本地数据层、文件解析与进度反馈、AI Provider 配置和真实请求、文献工作区、答辩工作区及主要导出流程。工作流依据项目提供的学生填报表单、学院细则和学校通知适配，但本应用不会替代学校审批。以下能力仍属于待验收或受限功能：

- 真实学校账号、审批、提交和查重系统接入
- 云同步、OCR、在线文档分析与正式语音识别
- 真实教师端协同及学校级指导/评阅数据同步
- AI 持久化流式会话、完整来源跳转和自动任务闭环
- 文献在线发现、冲突合并、全文定位、证据卡生命周期和语义向量检索的完整端到端流程

更详细的验收记录见：

- `docs/testing/phase4-final-acceptance-report.md`
- `docs/testing/phase5-final-acceptance-report.md`
- `design-qa.md`
- `design-audit/2026-08-24-all-routes/audit-report.md`

## 演示数据说明

以下文件仍包含 Alpha 界面演示记录，不应被解释为学校确认结果、真实论文内容或真实教师意见。正式工作流名称与节点配置位于 `src/data/official-workflow.ts`：

- `src/data/mock/thesis-project.ts`
- `src/data/mock/literature.ts`
- `src/data/mock/workflow.ts`

## 安全提示

不要把 API Key、论文全文、未公开研究数据或个人敏感信息提交到 Git。正式分发前还应完成依赖审计、隐私检查、签名安装包验证和真实设备回归测试。

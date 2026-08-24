# ADR: Phase 3 文档解析架构（本地优先）

- 状态：已接受（Phase 3 STEP 01）
- 日期：2026-08-24
- 决策范围：解析架构、依赖准入与降级策略；**本 ADR 不实现 Parser**。

## 背景

ThesisFlow 是 Windows-first 的 Tauri 桌面应用。Phase 2 已将项目、工作流、项目文件、任务与导师指导记录持久化到本机 SQLite 和本地项目目录。Phase 3 需要从用户导入的文档中提取可追溯的结构化内容，同时保持该本地优先边界。

## 决策

### 1. Local-only 是默认和基线

文档默认只在用户设备上读取、解析和存储；解析器不得把文件内容、文件路径、哈希、文本片段或遥测发送至网络。任何未来的远程能力必须是独立、显式选择、逐文件确认的功能，不能成为本地解析的隐式回退路径。

### 2. 使用 Parser Adapter，而不是在页面中按扩展名分支

建立按能力选择的 adapter 注册表，覆盖：

| 格式族 | Adapter | Phase 3 行为 |
| --- | --- | --- |
| `.docx` | `DocxParser` | 提取段落、标题、表格与源位置 |
| `.pdf` | `PdfParser` | 提取文本层；无文本层时返回 `needs_ocr` |
| `.xlsx` / `.csv` | `SpreadsheetParser` | 提取工作表/行列结构与文本单元格 |
| `.txt` / `.md` | `TextParser` | 直接读取并保留 Markdown 结构 |
| `.doc` | `LegacyDocConverterAdapter` | 调用用户已配置的本机转换器，或优雅降级 |

解析入口只依赖 `DocumentParser`，调用端不得依赖某个特定解析库的返回对象。

```ts
export interface DocumentParser {
  readonly id: string;
  supports(source: DocumentSource): boolean;
  parse(source: DocumentSource, options?: DocumentParseOptions): Promise<DocumentParseResult>;
}

export interface DocumentParseResult {
  status: ParseStatus;
  document?: NormalizedDocument;
  error?: ParseError;
  warnings: ParseWarning[];
}

export interface NormalizedDocument {
  source: SourceLocator;
  blocks: DocumentBlock[];
  metadata: Record<string, string | number | boolean | null>;
}

export interface DocumentBlock {
  id: string;
  kind: "heading" | "paragraph" | "table" | "list" | "code" | "metadata";
  text: string;
  locator: SourceLocator;
  attributes?: Record<string, string | number | boolean | null>;
}

export interface SourceLocator {
  fileId: string;
  relativePath: string;
  page?: number;
  sheet?: string;
  row?: number;
  column?: number;
  blockIndex?: number;
  charStart?: number;
  charEnd?: number;
}

export type ParseStatus = "queued" | "parsing" | "completed" | "needs_ocr" | "unsupported" | "failed" | "cancelled";

export interface ParseError {
  code: "unsupported_format" | "invalid_document" | "encrypted_document" | "converter_unavailable" | "converter_failed" | "io_error" | "internal_error";
  message: string;
  recoverable: boolean;
  cause?: string;
}
```

`SourceLocator` 始终指向现有 `project_files` 记录及其相对路径；它不保存绝对路径，保证重启、迁移项目目录和 UI 引用可稳定重建。

### 3. Heavy Work 不得长期阻塞 React 主线程

React 主线程只负责选择文件、提交任务、显示 `ParseStatus` 与渲染结果。PDF/DOCX 的解压、遍历、文本提取和表格标准化必须在 Web Worker 或 Tauri/Rust 异步命令中执行；任务须支持进度、取消和结构化失败结果。大文件没有可用 worker/command 时应保持 `queued`/返回可恢复错误，不能退化为主线程长时间同步解析。

首选实现方向是：浏览器侧纯解析器运行在 Vite 打包的 Web Worker；必须访问文件系统、调用转换器或需要更强隔离时，通过短生命周期 Tauri command 执行。两条路径均只能读取本地文件，且共享上述契约。

### 4. `.doc` 与扫描 PDF 的明确降级

- **Legacy `.doc`**：不强依赖 Microsoft Word，不在 Phase 3 把 LibreOffice 整体打进安装包。`LegacyDocConverterAdapter` 仅探测用户已安装/显式配置的本机 converter，并以临时受控文件调用。转换器不可用、失败或输出无文本时返回 `unsupported`/`converter_unavailable`/`converter_failed`，并向用户提供“保留原文件、手动另存为 `.docx` 或 `.pdf` 后重试”的操作提示。
- **Scanned PDF**：若 PDF 无可提取文本层，返回 `needs_ocr` 与可定位的警告；本阶段不做 OCR、不下载 OCR 模型、不上传文档。

### 5. 依赖准入审查（尚未引入新依赖）

STEP 01 不新增 npm package 或 Rust crate。后续实现只能从下表的候选中选择，并在锁定版本、许可证文本、CVE/维护状态与 Windows 构建结果复核后再准入。`网络依赖`指运行时；构建期 registry 下载不等于产品网络调用。

| 候选 | 用途 | 许可证 | 运行时网络依赖 | Windows 兼容 / 打包影响 | 维护风险与准入结论 |
| --- | --- | --- | --- | --- | --- |
| `pdfjs-dist`（npm） | PDF 文本层提取，放入 Web Worker | Apache-2.0 | 无 | 纯 JS/worker 资源随 Vite 打包；需控制 worker chunk 大小 | 包体积较大、worker 配置容易出错；仅在 worker PoC、许可复核后准入 |
| `mammoth`（npm） | DOCX 至原始文本/HTML 的基础提取 | BSD-2-Clause | 无 | 纯 JS，随前端包；不需要 Office | 对复杂 OOXML（批注、文本框、修订）保真有限；需用真实样本验收后准入 |
| `xlsx`（SheetJS CE，npm） | XLSX/CSV 工作表与单元格读取 | Apache-2.0 | 无 | 纯 JS，随前端包；应仅加载所需模块 | 大表内存压力、开源 CE 功能边界；需在 Worker 中压测后准入 |
| Rust 标准库 `std::process::Command`（现有） | 启动用户明确配置的 legacy converter | Rust/Apache-2.0 双许可 | 无 | Windows 原生；不新增包体，但依赖用户本机程序 | 外部程序版本不可控；仅限受控临时文件、超时和明确错误码 |
| `tokio`（经 Tauri/SQLx 间接存在） | Tauri command 的异步调度基础 | MIT | 无 | 已随现有 Rust 依赖图构建；不单独增加运行时文件 | 不把 CPU 密集解析直接放在线程池；如选 Rust 解析库，另做 crate 级审查 |
| LibreOffice/Word 自动化 | `.doc` 转换备选 | 不适用（外部产品） | 无 | **不随应用打包**，Word 也不作为前提 | 安装、许可、自动化稳定性风险高；本阶段拒绝作为硬依赖 |

所有新增 package/crate 的 PR 必须补充：确切版本、许可证 SPDX、运行时网络验证、Windows release bundle 体积变化、离线运行验证、近期维护/CVE 检查和移除/降级方案。

## 后果

- 解析结果可被后续规则检查、引用、任务和 UI 安全消费，而不泄漏 parser-specific 类型。
- 本地优先与现有 SQLite/项目目录模型保持一致；数据库只保存可重建的元数据与规范化结果，原文件继续留在项目目录。
- 首次实现成本包含 worker 通信、状态管理和跨 adapter 测试，但避免大 PDF/DOCX 卡死界面，也避免未来引入云端耦合。
- Phase 3 后续工作从 adapter contract、任务队列和各格式测试开始；本 STEP 不创建 parser、worker 或任何新依赖。

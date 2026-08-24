import type { DocumentParse, DocumentParseInput, DocumentParseResult, DocumentParser, NormalizedDocument, ParseStatus } from "@/types/document";
import type { ProjectFile } from "@/types/domain";

export type ParseRuntimeState = { projectFileId: string; parseId: string | null; status: ParseStatus; progress: number; cached: boolean; durationMs?: number; warnings?: string[] };
export interface ParseStorage { loadFile(id: string): Promise<{ file: ProjectFile; bytes: Uint8Array }>; list(id: string): Promise<DocumentParse[]>; create(parse: DocumentParse): Promise<void>; update(id: string, changes: Partial<DocumentParse>): Promise<void>; persist(parse: DocumentParse, document: NormalizedDocument): Promise<DocumentParse>; isNormalizedUsable(parse: DocumentParse): Promise<boolean>; }
export interface ParserLookup { find(input: Pick<DocumentParseInput, "mimeType">): DocumentParser | undefined; }
const now = () => new Date().toISOString(); const uuid = () => crypto.randomUUID();
const hash = async (bytes: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((value) => value.toString(16).padStart(2, "0")).join("");

/** A display-safe, retryable failure from the local parsing pipeline. */
export class ParseOrchestrationError extends Error {
  readonly code: "io_error" | "internal_error";
  readonly recoverable = true;
  constructor(code: "io_error" | "internal_error", message: string, readonly cause?: unknown) { super(message); this.name = "ParseOrchestrationError"; this.code = code; }
}

export class ParseOrchestrator {
  private readonly states = new Map<string, ParseRuntimeState>(); private readonly controllers = new Map<string, AbortController>(); private active = 0; private readonly waiting: (() => void)[] = [];
  constructor(private readonly storage: ParseStorage, private readonly registry: ParserLookup, private readonly concurrency = 2, private readonly largeFileWarningBytes = 20 * 1024 * 1024) {}
  getParseStatus(projectFileId: string) { return this.states.get(projectFileId) ?? null; }
  cancelParse(projectFileId: string) { this.controllers.get(projectFileId)?.abort(); }
  async reparseProjectFile(projectFileId: string) { return this.run(projectFileId, true); }
  async parseProjectFile(projectFileId: string) { return this.run(projectFileId, false); }
  private async slot() { if (this.active >= this.concurrency) await new Promise<void>((resolve) => this.waiting.push(resolve)); this.active += 1; }
  private release() { this.active -= 1; this.waiting.shift()?.(); }
  private async run(projectFileId: string, force: boolean): Promise<DocumentParse> {
    await this.slot(); const started = performance.now(); const controller = new AbortController(); this.controllers.set(projectFileId, controller);
    let parse: DocumentParse | null = null;
    try { const { file, bytes } = await this.storage.loadFile(projectFileId); const contentHash = await hash(bytes); const parser = this.registry.find({ mimeType: file.mimeType }); if (!parser) return this.finishUnsupported(file, contentHash, started);
      const existing = await this.storage.list(projectFileId); const cached = existing.find((item) => item.status === "parsed" && item.contentHash === contentHash && item.parserType === parser.id && item.parserVersion === parser.version);
      if (!force && cached && await this.storage.isNormalizedUsable(cached)) { this.states.set(projectFileId, { projectFileId, parseId: cached.id, status: "parsed", progress: 1, cached: true }); return cached; }
      await Promise.all(existing.filter((item) => item.status === "parsed").map((item) => this.storage.update(item.id, { status: "stale", updatedAt: now() })));
      parse = { id: uuid(), projectId: file.projectId, projectFileId, parserType: parser.id, parserVersion: parser.version, status: "queued", contentHash, normalizedPath: null, mimeType: file.mimeType, language: null, pageCount: null, blockCount: 0, textLength: 0, durationMs: null, warningCount: 0, errorCode: null, errorMessage: null, createdAt: now(), updatedAt: now() };
      const warnings = bytes.byteLength >= this.largeFileWarningBytes ? ["文件较大，解析将在后台队列中完成。"] : [];
      await this.storage.create(parse); this.states.set(projectFileId, { projectFileId, parseId: parse.id, status: "parsing", progress: 0, cached: false, warnings }); await this.storage.update(parse.id, { status: "parsing", updatedAt: now() });
      const result = await parser.parse({ documentId: parse.id, projectId: file.projectId, projectFileId, title: file.originalName, mimeType: file.mimeType, text: "", bytes, signal: controller.signal, onProgress: (done, total) => this.states.set(projectFileId, { projectFileId, parseId: parse!.id, status: "parsing", progress: total ? done / total : 0, cached: false, warnings }) });
      if (controller.signal.aborted) throw new Error("Parse cancelled"); return this.finalize(parse, result, started, projectFileId);
    } catch (error) {
      const message = controller.signal.aborted ? "解析已取消；可随时重新解析。" : "无法读取或解析本地文件；请确认文件仍在项目目录中后重试。";
      const structured = error instanceof ParseOrchestrationError ? error : new ParseOrchestrationError(parse ? "internal_error" : "io_error", message, error);
      if (parse) await this.storage.update(parse.id, { status: "failed", errorCode: structured.code, errorMessage: structured.message, updatedAt: now() });
      this.states.set(projectFileId, { projectFileId, parseId: parse?.id ?? null, status: "failed", progress: 1, cached: false, durationMs: Math.round(performance.now() - started), warnings: [structured.message] });
      throw structured;
    } finally { this.controllers.delete(projectFileId); this.release(); }
  }
  private async finishUnsupported(file: ProjectFile, contentHash: string, started: number) { const parse: DocumentParse = { id: uuid(), projectId: file.projectId, projectFileId: file.id, parserType: "none", parserVersion: "0", status: "unsupported", contentHash, normalizedPath: null, mimeType: file.mimeType, language: null, pageCount: null, blockCount: 0, textLength: 0, durationMs: Math.round(performance.now() - started), warningCount: 1, errorCode: "unsupported_format", errorMessage: "No parser registered", createdAt: now(), updatedAt: now() }; await this.storage.create(parse); this.states.set(file.id, { projectFileId: file.id, parseId: parse.id, status: parse.status, progress: 1, cached: false, durationMs: parse.durationMs ?? undefined }); return parse; }
  private async finalize(parse: DocumentParse, result: DocumentParseResult, started: number, projectFileId: string) { const durationMs = Math.round(performance.now() - started); const document = result.document; const changes: Partial<DocumentParse> = { status: result.status, durationMs, warningCount: result.warnings.length, language: document?.language ?? null, pageCount: document?.pageCount ?? null, blockCount: document?.blocks.length ?? 0, textLength: document?.blocks.reduce((sum, block) => sum + block.text.length, 0) ?? 0, errorCode: result.error?.code ?? null, errorMessage: result.error?.message ?? null, updatedAt: now() }; const completed = { ...parse, ...changes } as DocumentParse; const saved = document && result.status === "parsed" ? await this.storage.persist(completed, document) : (await this.storage.update(parse.id, changes), completed); this.states.set(projectFileId, { projectFileId, parseId: parse.id, status: saved.status, progress: 1, cached: false, durationMs }); return saved; }
}

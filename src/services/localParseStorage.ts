import { invoke } from "@tauri-apps/api/core";
import { documentParseService } from "@/services/documentParseService";
import { DocumentParseRepository } from "@/repositories/documentParseRepository";
import { FileRepository } from "@/repositories/fileRepository";
import { RuleCandidateRepository } from "@/repositories/ruleCandidateRepository";
import { extractRuleCandidates } from "@/rules/extractors";
import type { DocumentParse, NormalizedDocument } from "@/types/document";
import type { ParseStorage } from "@/services/parseOrchestrator";

const timestamp = () => new Date().toISOString();

/** The only production bridge from local project files to the browser parsers. */
export class LocalParseStorage implements ParseStorage {
  constructor(private readonly files = new FileRepository(), private readonly parses = new DocumentParseRepository(), private readonly candidates = new RuleCandidateRepository()) {}
  async loadFile(id: string) { const file = await this.files.findById(id); if (!file) throw new Error("项目文件不存在。"); const payload = await invoke<{ bytes: number[] }>("read_project_file_bytes", { fileId: id }); return { file, bytes: new Uint8Array(payload.bytes) }; }
  list(id: string) { return this.parses.listByFile(id); }
  create(parse: DocumentParse) { return this.parses.create(parse); }
  update(id: string, changes: Partial<DocumentParse>) { return this.parses.update(id, changes); }
  async persist(parse: DocumentParse, document: NormalizedDocument): Promise<DocumentParse> {
    const saved = await documentParseService.persistParsedDocument({ id: parse.id, projectId: parse.projectId, projectFileId: parse.projectFileId, parserType: parse.parserType, parserVersion: parse.parserVersion, contentHash: parse.contentHash, document });
    const createdAt = timestamp();
    const extracted = extractRuleCandidates(document).map((candidate) => ({ ...candidate, projectId: parse.projectId, projectFileId: parse.projectFileId, documentParseId: parse.id, createdAt, updatedAt: createdAt }));
    await this.candidates.createMany(extracted);
    return { ...parse, ...saved, durationMs: parse.durationMs, warningCount: document.warnings.length };
  }
  async isNormalizedUsable(parse: DocumentParse) { return Boolean(parse.normalizedPath) && await invoke<boolean>("normalized_document_exists", { parseId: parse.id }); }
}

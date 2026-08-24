import { LiteratureRepository } from "@/repositories/literatureRepository";
import { chunkNormalizedDocument } from "@/services/literatureRetrieval";
import type { DocumentParse, NormalizedDocument } from "@/types/document";

export class FullTextIngestionService {
  constructor(private readonly repository = new LiteratureRepository()) {}
  async ingest(projectId: string, literatureId: string, parse: DocumentParse, document?: NormalizedDocument) { if (parse.status === "needs_ocr") return { status: "needs_ocr" as const, message: "全文不可检索，需要 OCR（后续能力）。", chunks: 0 }; if (parse.status !== "parsed" || !document) return { status: "unavailable" as const, message: "全文尚未完成本地解析。", chunks: 0 }; const chunks = await chunkNormalizedDocument(literatureId, document); await this.repository.replaceChunks(projectId, literatureId, parse.id, chunks); return { status: "indexed" as const, message: "全文已建立本地索引。", chunks: chunks.length }; }
}

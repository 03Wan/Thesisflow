import { invoke } from "@tauri-apps/api/core";
import type { DocumentParse, NormalizedDocument } from "@/types/document";

export type PersistParsedDocumentInput = Pick<DocumentParse, "id" | "projectId" | "projectFileId" | "parserType" | "parserVersion" | "contentHash"> & { document: NormalizedDocument };

export function summarizeDocument(document: NormalizedDocument) {
  return { mimeType: document.mimeType, language: document.language, pageCount: document.pageCount, blockCount: document.blocks.length, textLength: document.blocks.reduce((total, block) => total + block.text.length, 0) };
}

export class DocumentParseService {
  async persistParsedDocument(input: PersistParsedDocumentInput): Promise<DocumentParse> {
    return invoke<DocumentParse>("persist_normalized_document", { request: { ...input, ...summarizeDocument(input.document) } });
  }
}

export const documentParseService = new DocumentParseService();

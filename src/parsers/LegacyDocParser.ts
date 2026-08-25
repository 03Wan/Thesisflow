import type { DocumentParseInput, DocumentParseResult, DocumentParser, SourceLocator } from "@/types/document";
import { invoke } from "@tauri-apps/api/core";
export interface LegacyConversion { converter: string; version: string | null; convertedFile: string; mimeType: string; bytes: Uint8Array; }
export interface LegacyDocConverter { convert(input: DocumentParseInput): Promise<LegacyConversion>; }
export class TauriLegacyDocConverter implements LegacyDocConverter {
  async convert(input: DocumentParseInput): Promise<LegacyConversion> {
    const result = await invoke<{ converter: string; version: string | null; convertedFile: string; mimeType: string; bytes: number[] }>("convert_legacy_doc", { request: { projectId: input.projectId, projectFileId: input.projectFileId } });
    return { ...result, bytes: new Uint8Array(result.bytes) };
  }
}
export class LegacyDocParser implements DocumentParser {
  readonly id = "legacy-doc-converter"; readonly version = "1.0.0";
  constructor(private readonly converter: LegacyDocConverter | null, private readonly registry: { find(input: Pick<DocumentParseInput, "mimeType">): DocumentParser | undefined }) {}
  supports(input: Pick<DocumentParseInput, "mimeType">) { return input.mimeType === "application/msword"; }
  async parse(input: DocumentParseInput): Promise<DocumentParseResult> {
    if (!this.converter) return { status: "unsupported", warnings: ["Original .doc is preserved. Save as DOCX or PDF to parse it locally."], error: { code: "converter_unavailable", message: "No local legacy .doc converter is available.", recoverable: true } };
    try { const converted = await this.converter.convert(input); const parser = this.registry.find({ mimeType: converted.mimeType }); if (!parser) return { status: "unsupported", warnings: ["Original .doc is preserved."], error: { code: "converter_unavailable", message: `No parser is registered for converted ${converted.mimeType}.`, recoverable: true } }; const result = await parser.parse({ ...input, title: converted.convertedFile, mimeType: converted.mimeType, bytes: converted.bytes, text: "" }); if (!result.document) return result; result.document.blocks = result.document.blocks.map((block) => ({ ...block, locator: { format: "legacy_converted", converter: converted.converter, convertedFile: converted.convertedFile, locator: block.locator as SourceLocator }, metadata: { ...block.metadata, provenance: "legacy_conversion" } })); result.document.metadata = { ...result.document.metadata, legacyConversion: { converter: converted.converter, version: converted.version, convertedFile: converted.convertedFile, originalPreserved: true } }; return result; } catch (error) { return { status: "unsupported", warnings: ["Original .doc is preserved. Save it as DOCX or PDF and retry."], error: { code: "converter_failed", message: typeof error === "string" ? error : error instanceof Error ? error.message : "Legacy conversion failed.", recoverable: true } }; }
  }
}

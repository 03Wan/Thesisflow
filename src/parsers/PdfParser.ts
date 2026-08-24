import { getDocument, GlobalWorkerOptions } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { DocumentBlock, DocumentParseInput, DocumentParseResult, DocumentParser } from "@/types/document";

// Vite turns this URL into a local bundled worker asset; no document data leaves the device.
if (typeof Worker !== "undefined") GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.mjs", import.meta.url).toString();

export class PdfParser implements DocumentParser {
  readonly id = "pdfjs-text";
  readonly version = "1.0.0";
  supports(input: Pick<DocumentParseInput, "mimeType">): boolean { return input.mimeType === "application/pdf"; }

  async parse(input: DocumentParseInput): Promise<DocumentParseResult> {
    if (!input.bytes) return { status: "failed", warnings: [], error: { code: "io_error", message: "PDF parser requires local bytes.", recoverable: true } };
    try {
      const options: { data: Uint8Array; disableWorker?: boolean } = { data: input.bytes.slice() };
      if (typeof Worker === "undefined") options.disableWorker = true;
      const loadingTask = getDocument(options as Parameters<typeof getDocument>[0]);
      loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => input.onProgress?.(loaded, total);
      const pdf = await loadingTask.promise;
      const embedded = await pdf.getMetadata().catch(() => null);
      const metadata = embedded && typeof embedded.info === "object" && embedded.info ? embedded.info as Record<string, unknown> : {};
      const blocks: DocumentBlock[] = [];
      let order = 0; let textLength = 0;
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        const items = content.items.filter((item) => "str" in item && Boolean(item.str)) as Array<{ str: string; transform: number[]; width: number; height: number }>;
        items.forEach((item, blockIndex) => {
          const text = item.str.trim(); if (!text) return;
          textLength += text.length;
          const [x, y] = item.transform;
          blocks.push({ id: `${input.documentId}:page:${pageNumber}:block:${blockIndex}`, type: "paragraph", text, order: order++, locator: { format: "pdf", pageNumber, blockIndex, bbox: Number.isFinite(x) && Number.isFinite(y) ? [x, y, item.width ?? 0, item.height ?? 0] : undefined }, metadata: {} });
        });
        input.onProgress?.(pageNumber, pdf.numPages);
        await Promise.resolve();
      }
      if (textLength === 0) return { status: "needs_ocr", warnings: ["PDF contains no extractable text layer; OCR is not available in this phase."], error: { code: "invalid_document", message: "No text layer available.", recoverable: true } };
      return { status: "parsed", warnings: [], document: { documentId: input.documentId, projectFileId: input.projectFileId, title: input.title, mimeType: input.mimeType, language: null, pageCount: pdf.numPages, blocks, metadata, warnings: [] } };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to parse PDF.";
      return { status: "failed", warnings: [], error: { code: /password|encrypted/i.test(message) ? "encrypted_document" : "invalid_document", message, recoverable: false } };
    }
  }
}

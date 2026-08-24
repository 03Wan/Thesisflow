import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ParserRegistry } from "@/parsers/ParserRegistry";
import { PdfParser } from "@/parsers/PdfParser";
const input = async (name: string, progress: number[] = []) => ({ documentId: `parse-${name}`, projectId: "project-1", projectFileId: "file-1", title: name, mimeType: "application/pdf", text: "", bytes: new Uint8Array(await readFile(path.resolve("src/test/fixtures/pdf", name))), onProgress: (done: number) => progress.push(done) });
describe("PdfParser fixtures", () => {
  it("extracts page text, PDF locators and observable progress", async () => { const progress: number[] = []; const result = await new ParserRegistry().register(new PdfParser()).parse(await input("normal_text.pdf", progress)); expect(result.result.document).toMatchObject({ pageCount: 1 }); expect(result.result.document?.blocks[0]).toMatchObject({ text: "Normal text 80%", locator: { format: "pdf", pageNumber: 1, blockIndex: 0 } }); expect(progress.length).toBeGreaterThan(0); });
  it("preserves multiple PDF pages", async () => { const result = (await new PdfParser().parse(await input("multi_page.pdf"))).document!; expect(result.pageCount).toBe(2); expect(result.blocks.map((block) => block.locator.format === "pdf" && block.locator.pageNumber)).toEqual([1, 2]); });
  it("marks a blank text layer as needs_ocr", async () => { await expect(new PdfParser().parse(await input("empty_text_layer.pdf"))).resolves.toMatchObject({ status: "needs_ocr" }); });
  it("returns a structured error for corrupted PDFs", async () => { await expect(new PdfParser().parse(await input("corrupted.pdf"))).resolves.toMatchObject({ status: "failed", error: { code: "invalid_document" } }); });
});

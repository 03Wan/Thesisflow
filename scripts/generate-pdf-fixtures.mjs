import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";
const out = path.resolve("src/test/fixtures/pdf");
await mkdir(out, { recursive: true });
async function create(name, pages) { const pdf = await PDFDocument.create(); const font = await pdf.embedFont(StandardFonts.Helvetica); for (const text of pages) { const page = pdf.addPage([595, 842]); if (text) page.drawText(text, { x: 72, y: 760, size: 14, font }); } await writeFile(path.join(out, name), await pdf.save()); }
await create("normal_text.pdf", ["Normal text 80%"]);
await create("multi_page.pdf", ["Page one", "Page two"]);
await create("empty_text_layer.pdf", [""]);
await writeFile(path.join(out, "corrupted.pdf"), "not a PDF");

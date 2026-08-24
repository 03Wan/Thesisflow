import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import * as XLSX from "xlsx";
const out = path.resolve("src/test/fixtures/sheets"); await mkdir(out, { recursive: true });
const book = XLSX.utils.book_new(); const sheet = XLSX.utils.aoa_to_sheet([["指标", "值"], ["完成率", 0.8], ["公式", "=SUM(B2:B2)"]]); XLSX.utils.book_append_sheet(book, sheet, "规则"); XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([["附录", "内容"]]), "附录");
await writeFile(path.join(out, "rules.xlsx"), XLSX.write(book, { type: "buffer", bookType: "xlsx" }));
await writeFile(path.join(out, "rules.csv"), Buffer.from("\uFEFF指标,值\r\n完成率,80%\r\n日期,2026-08-24\r\n", "utf8"));

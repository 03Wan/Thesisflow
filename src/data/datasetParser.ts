import * as XLSX from "xlsx";
import type { DatasetColumn, DatasetColumnType, DatasetPreview } from "@/types/dataset";

const MAX_IMPORT_BYTES = 50 * 1024 * 1024;
const PREVIEW_ROWS = 50;
const csvMimeTypes = new Set(["text/csv", "application/csv"]);
const clean = (value: unknown) => String(value ?? "").replace(/^\uFEFF/, "").trim();

export class DatasetParseError extends Error {
  constructor(readonly code: "unsupported_format" | "too_large" | "invalid_dataset" | "empty_dataset", message: string) { super(message); this.name = "DatasetParseError"; }
}

export interface ParsedDataset {
  parserId: string;
  parserVersion: string;
  schema: DatasetColumn[];
  preview: DatasetPreview;
  rowCount: number;
  columnCount: number;
  sheetName: string | null;
  /** Full rectangular rows retained for reproducible transforms (bounded by import size). */
  rows: string[][];
}

const parseCsvRow = (line: string) => {
  const cells: string[] = []; let current = ""; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"' && line[index + 1] === '"') { current += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) { cells.push(current); current = ""; }
    else current += char;
  }
  if (quoted) throw new DatasetParseError("invalid_dataset", "CSV 引号未闭合。");
  cells.push(current); return cells;
};

const decodeCsv = (bytes: Uint8Array) => {
  for (const encoding of ["utf-8", "gb18030", "gbk"]) {
    try { return new TextDecoder(encoding, { fatal: true }).decode(bytes).replace(/^\uFEFF/, ""); } catch { /* next encoding */ }
  }
  throw new DatasetParseError("invalid_dataset", "无法识别 CSV 文件编码。");
};

const normalizedHeaders = (values: string[]) => {
  const seen = new Map<string, number>();
  return values.map((value, index) => {
    const sourceName = clean(value) || `column_${index + 1}`;
    const count = (seen.get(sourceName) ?? 0) + 1; seen.set(sourceName, count);
    return count === 1 ? sourceName : `${sourceName}_${count}`;
  });
};

const columnType = (values: string[]): DatasetColumnType => {
  const present = values.filter((value) => value !== "");
  if (!present.length) return "unknown";
  if (present.every((value) => /^(true|false)$/i.test(value))) return "boolean";
  if (present.every((value) => Number.isFinite(Number(value)))) return "number";
  if (present.every((value) => !Number.isNaN(Date.parse(value)))) return "date";
  return "string";
};

const shape = (sourceHeaders: string[], rows: string[][], parserId: string, sheetName: string | null): ParsedDataset => {
  const headers = normalizedHeaders(sourceHeaders);
  if (!headers.length) throw new DatasetParseError("empty_dataset", "数据集没有可用列。");
  const rectangularRows = rows.map((row) => headers.map((_, index) => clean(row[index])));
  const schema = headers.map((name, index) => {
    const values = rectangularRows.map((row) => row[index]);
    return { name, sourceName: clean(sourceHeaders[index]) || `column_${index + 1}`, type: columnType(values), nullable: values.some((value) => value === "") };
  });
  return { parserId, parserVersion: "1.0.0", schema, preview: { columns: headers, rows: rectangularRows.slice(0, PREVIEW_ROWS) }, rowCount: rectangularRows.length, columnCount: headers.length, sheetName, rows: rectangularRows };
};

export function parseDataset(bytes: Uint8Array, mediaType: string | null): ParsedDataset {
  if (bytes.byteLength > MAX_IMPORT_BYTES) throw new DatasetParseError("too_large", "数据文件超过 50 MiB 导入边界；请先拆分或使用后续的大文件执行器。");
  if (csvMimeTypes.has(mediaType ?? "")) {
    const rows = decodeCsv(bytes).split(/\r?\n/).filter((line) => line.trim() !== "").map(parseCsvRow);
    if (rows.length < 2) throw new DatasetParseError("empty_dataset", "CSV 至少需要包含表头和一行数据。");
    return shape(rows[0], rows.slice(1), "csv-dataset", null);
  }
  if (mediaType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    try {
      const workbook = XLSX.read(bytes, { type: "array", cellText: true, cellFormula: false });
      const sheetName = workbook.SheetNames[0];
      if (!sheetName) throw new DatasetParseError("empty_dataset", "XLSX 没有工作表。");
      const rows = XLSX.utils.sheet_to_json<unknown[]>(workbook.Sheets[sheetName], { header: 1, defval: "", raw: false }).map((row) => row.map(clean));
      if (rows.length < 2) throw new DatasetParseError("empty_dataset", "XLSX 至少需要包含表头和一行数据。");
      return shape(rows[0], rows.slice(1), "sheetjs-dataset", sheetName);
    } catch (error) { if (error instanceof DatasetParseError) throw error; throw new DatasetParseError("invalid_dataset", "XLSX 文件无法解析。"); }
  }
  throw new DatasetParseError("unsupported_format", "当前只支持 CSV 和 XLSX 数据集导入。");
}

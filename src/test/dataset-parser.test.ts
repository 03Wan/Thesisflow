import * as XLSX from "xlsx";
import { describe, expect, it } from "vitest";
import { DatasetParseError, parseDataset } from "@/data/datasetParser";

describe("dataset parser", () => {
  it("parses CSV into typed schema and a bounded preview without treating it as a full result", () => {
    const result = parseDataset(new TextEncoder().encode("name,score,score\nAda,92,93\nGrace,,95\n"), "text/csv");
    expect(result.rowCount).toBe(2);
    expect(result.columnCount).toBe(3);
    expect(result.schema.map((column) => column.name)).toEqual(["name", "score", "score_2"]);
    expect(result.schema[1]).toMatchObject({ type: "number", nullable: true });
    expect(result.preview.rows).toHaveLength(2);
  });

  it("parses the first XLSX sheet from real workbook bytes", () => {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["year", "active"], [2024, true]]), "Data");
    const result = parseDataset(new Uint8Array(XLSX.write(workbook, { type: "array", bookType: "xlsx" })), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    expect(result.sheetName).toBe("Data");
    expect(result.schema.map((column) => column.type)).toEqual(["number", "boolean"]);
  });

  it("rejects malformed and unsupported inputs rather than inventing a dataset", () => {
    expect(() => parseDataset(new TextEncoder().encode("name\n"), "text/csv")).toThrow(DatasetParseError);
    expect(() => parseDataset(new Uint8Array([1, 2]), "application/pdf")).toThrow("当前只支持 CSV 和 XLSX 数据集导入");
  });
});

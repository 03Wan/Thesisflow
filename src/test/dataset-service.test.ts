import { describe, expect, it } from "vitest";
import { DatasetService } from "@/services/datasetService";
import type { Dataset, DatasetVersion } from "@/types/dataset";
import type { ProjectFile } from "@/types/domain";

const file: ProjectFile = { id: "file-a", projectId: "project-a", workflowStageId: null, originalName: "survey.csv", storedName: "survey.csv", relativePath: "05_数据/survey.csv", mimeType: "text/csv", extension: "csv", sizeBytes: 22, checksum: "legacy", fileCategory: "data", versionLabel: null, source: "imported", createdAt: "now", updatedAt: "now" };

describe("dataset service", () => {
  it("registers only a real parsed project file and deduplicates the same immutable snapshot", async () => {
    const datasets: Dataset[] = []; const versions: DatasetVersion[] = [];
    const service = new DatasetService({
      files: { findByIdInProject: async (id, projectId) => id === file.id && projectId === file.projectId ? file : null },
      readFileBytes: async () => new TextEncoder().encode("id,score\n1,90\n"),
      datasets: {
        listByProject: async () => datasets,
        listCurrentVersionsByProject: async () => versions,
        findCurrentVersion: async (_projectId, datasetId) => versions.find((version) => version.datasetId === datasetId) ?? null,
        findVersionByHash: async (_projectId, hash, parserId, parserVersion) => versions.find((version) => version.sha256 === hash && version.parserId === parserId && version.parserVersion === parserVersion) ?? null,
        create: async (dataset, version) => { datasets.push({ ...dataset, currentVersionId: version.id }); versions.push(version); },
        appendVersion: async (version) => { versions.unshift(version); },
      },
    });
    const first = await service.importProjectFile("project-a", "file-a");
    const repeated = await service.importProjectFile("project-a", "file-a");
    expect(first.duplicate).toBe(false);
    expect(repeated.duplicate).toBe(true);
    expect(versions).toHaveLength(1);
    expect(first.version).toMatchObject({ kind: "raw", rowCount: 1, columnCount: 2, previewRowCount: 1, sourceMetadata: { sheetName: null } });
    expect(JSON.parse(first.version.materializedJson ?? "{}")).toMatchObject({ columns: ["id", "score"], rows: [["1", "90"]] });
  });

  it("does not create a dataset for a file from another project", async () => {
    const service = new DatasetService({ files: { findByIdInProject: async () => null }, readFileBytes: async () => new Uint8Array(), datasets: { listByProject: async () => [], listCurrentVersionsByProject: async () => [], findCurrentVersion: async () => null, findVersionByHash: async () => null, create: async () => undefined, appendVersion: async () => undefined } });
    await expect(service.importProjectFile("project-a", "file-b")).rejects.toThrow("未找到当前项目的数据文件");
  });

  it("records user-confirmed field types as a new derived version without touching raw bytes", async () => {
    const raw: DatasetVersion = { id: "v1", datasetId: "dataset-a", projectId: "project-a", versionNumber: 1, kind: "raw", parentVersionId: null, sourceFileId: "file-a", mediaType: "text/csv", sha256: "a".repeat(64), byteSize: 10, schema: [{ name: "score", sourceName: "score", type: "string", nullable: false }], preview: { columns: ["score"], rows: [["90"]] }, sourceMetadata: { sheetName: null }, previewRowCount: 1, rowCount: 1, columnCount: 1, parserId: "csv", parserVersion: "1", status: "ready", createdAt: "now" };
    const appended: DatasetVersion[] = [];
    const service = new DatasetService({ files: { findByIdInProject: async () => null }, readFileBytes: async () => new Uint8Array(), datasets: { listByProject: async () => [], listCurrentVersionsByProject: async () => [raw], findCurrentVersion: async () => raw, findVersionByHash: async () => null, create: async () => undefined, appendVersion: async (version) => { appended.push(version); } } });
    const confirmed = await service.confirmColumnTypes("project-a", "dataset-a", "v1", { score: "number" });
    expect(confirmed).toMatchObject({ kind: "derived", parentVersionId: "v1", versionNumber: 2, schema: [{ name: "score", type: "number" }] });
    expect(confirmed.sha256).not.toBe(raw.sha256);
    expect(appended).toEqual([confirmed]);
  });
});

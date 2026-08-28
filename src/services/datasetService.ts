import { invoke } from "@tauri-apps/api/core";
import { AppError, toAppError } from "@/lib/app-error";
import { parseDataset } from "@/data/datasetParser";
import { DatasetRepository } from "@/repositories/datasetRepository";
import { FileRepository } from "@/repositories/fileRepository";
import type { Dataset, DatasetColumnType, DatasetVersion } from "@/types/dataset";

type FileBytes = { bytes: number[] };
const now = () => new Date().toISOString();
const uuid = () => crypto.randomUUID();
const sha256 = async (bytes: Uint8Array) => Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))).map((value) => value.toString(16).padStart(2, "0")).join("");

export interface DatasetServiceDependencies {
  datasets: Pick<DatasetRepository, "appendVersion" | "create" | "findCurrentVersion" | "findVersionByHash" | "listByProject" | "listCurrentVersionsByProject">;
  files: Pick<FileRepository, "findByIdInProject">;
  readFileBytes(fileId: string): Promise<Uint8Array>;
}

const defaultDependencies = (): DatasetServiceDependencies => ({
  datasets: new DatasetRepository(),
  files: new FileRepository(),
  readFileBytes: async (fileId) => new Uint8Array((await invoke<FileBytes>("read_project_file_bytes", { fileId })).bytes),
});

export class DatasetService {
  constructor(private readonly dependencies: DatasetServiceDependencies = defaultDependencies()) {}

  async list(projectId: string) { return Promise.all([this.dependencies.datasets.listByProject(projectId), this.dependencies.datasets.listCurrentVersionsByProject(projectId)]).then(([datasets, versions]) => ({ datasets, versions })); }

  async importProjectFile(projectId: string, sourceFileId: string, name?: string): Promise<{ dataset: Dataset; version: DatasetVersion; duplicate: boolean }> {
    const sourceFile = await this.dependencies.files.findByIdInProject(sourceFileId, projectId);
    if (!sourceFile) throw new AppError("not_found", "未找到当前项目的数据文件。");
    if (sourceFile.fileCategory !== "data") throw new AppError("validation", "请先将文件导入到“数据”分类，再登记为数据集。");
    if (!sourceFile.mimeType) throw new AppError("validation", "数据文件缺少可识别的媒体类型。");
    try {
      const bytes = await this.dependencies.readFileBytes(sourceFileId);
      const parsed = parseDataset(bytes, sourceFile.mimeType);
      const contentHash = await sha256(bytes);
      const existing = await this.dependencies.datasets.findVersionByHash(projectId, contentHash, parsed.parserId, parsed.parserVersion);
      if (existing) {
        const datasets = await this.dependencies.datasets.listByProject(projectId);
        const dataset = datasets.find((item) => item.id === existing.datasetId);
        if (!dataset) throw new AppError("unexpected", "数据版本缺少对应数据集记录。");
        return { dataset, version: existing, duplicate: true };
      }
      const timestamp = now();
      const dataset: Dataset = { id: uuid(), projectId, name: name?.trim() || sourceFile.originalName.replace(/\.[^.]+$/, ""), sourceFileId, mediaType: sourceFile.mimeType, status: "ready", currentVersionId: null, createdAt: timestamp, updatedAt: timestamp };
      const version: DatasetVersion = { id: uuid(), datasetId: dataset.id, projectId, versionNumber: 1, kind: "raw", parentVersionId: null, sourceFileId, mediaType: sourceFile.mimeType, sha256: contentHash, byteSize: bytes.byteLength, schema: parsed.schema, preview: parsed.preview, sourceMetadata: { sheetName: parsed.sheetName }, materializedJson: JSON.stringify({ columns: parsed.preview.columns, rows: parsed.rows }), previewRowCount: parsed.preview.rows.length, rowCount: parsed.rowCount, columnCount: parsed.columnCount, parserId: parsed.parserId, parserVersion: parsed.parserVersion, status: "ready", createdAt: timestamp };
      await this.dependencies.datasets.create(dataset, version);
      return { dataset: { ...dataset, currentVersionId: version.id }, version, duplicate: false };
    } catch (error) { throw toAppError(error, "无法导入数据集；原始文件未被修改，也没有创建数据集记录。"); }
  }

  async confirmColumnTypes(projectId: string, datasetId: string, expectedCurrentVersionId: string, types: Record<string, DatasetColumnType>): Promise<DatasetVersion> {
    const current = await this.dependencies.datasets.findCurrentVersion(projectId, datasetId);
    if (!current) throw new AppError("not_found", "未找到当前项目的数据集版本。");
    if (current.id !== expectedCurrentVersionId) throw new AppError("validation", "数据集版本已更新；请刷新后重新确认字段类型。");
    const schema = current.schema.map((column) => ({ ...column, type: types[column.name] ?? column.type }));
    if (Object.keys(types).some((name) => !schema.some((column) => column.name === name))) throw new AppError("validation", "字段类型确认包含不存在的列。");
    const timestamp = now();
    const schemaHash = await sha256(new TextEncoder().encode(JSON.stringify({ parent: current.sha256, schema })));
    const version: DatasetVersion = { ...current, id: uuid(), versionNumber: current.versionNumber + 1, kind: "derived", parentVersionId: current.id, sha256: schemaHash, schema, parserId: `${current.parserId}:schema-confirmation`, parserVersion: "1.0.0", createdAt: timestamp };
    await this.dependencies.datasets.appendVersion(version);
    return version;
  }
}

export const datasetService = new DatasetService();

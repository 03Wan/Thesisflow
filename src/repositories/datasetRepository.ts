import { getDatabase } from "@/lib/database";
import type { Dataset, DatasetVersion } from "@/types/dataset";

const datasetFields = "id, project_id AS projectId, name, source_file_id AS sourceFileId, media_type AS mediaType, status, current_version_id AS currentVersionId, created_at AS createdAt, updated_at AS updatedAt";
const versionFields = "id, dataset_id AS datasetId, project_id AS projectId, version_number AS versionNumber, kind, parent_version_id AS parentVersionId, source_file_id AS sourceFileId, media_type AS mediaType, sha256, byte_size AS byteSize, schema_json AS schema, preview_json AS preview, source_metadata_json AS sourceMetadata, materialized_json AS materializedJson, preview_row_count AS previewRowCount, row_count AS rowCount, column_count AS columnCount, parser_id AS parserId, parser_version AS parserVersion, status, created_at AS createdAt";

export class DatasetRepository {
  async listByProject(projectId: string): Promise<Dataset[]> {
    const database = await getDatabase();
    return database.select<Dataset[]>(`SELECT ${datasetFields} FROM datasets WHERE project_id = ? ORDER BY updated_at DESC`, [projectId]);
  }

  async findVersionByHash(projectId: string, sha256: string, parserId: string, parserVersion: string): Promise<DatasetVersion | null> {
    const database = await getDatabase();
    const rows = await database.select<DatasetVersion[]>(`SELECT ${versionFields} FROM dataset_versions WHERE project_id = ? AND sha256 = ? AND parser_id = ? AND parser_version = ?`, [projectId, sha256, parserId, parserVersion]);
    return rows[0] ? hydrateVersion(rows[0]) : null;
  }

  async listCurrentVersionsByProject(projectId: string): Promise<DatasetVersion[]> {
    const database = await getDatabase();
    const rows = await database.select<DatasetVersion[]>(`SELECT ${versionFields} FROM dataset_versions WHERE project_id = ? AND id IN (SELECT current_version_id FROM datasets WHERE project_id = ?) ORDER BY created_at DESC`, [projectId, projectId]);
    return rows.map(hydrateVersion);
  }

  async findCurrentVersion(projectId: string, datasetId: string): Promise<DatasetVersion | null> {
    const database = await getDatabase();
    const rows = await database.select<DatasetVersion[]>(`SELECT ${versionFields} FROM dataset_versions WHERE project_id = ? AND dataset_id = ? AND id = (SELECT current_version_id FROM datasets WHERE id = ? AND project_id = ?)`, [projectId, datasetId, datasetId, projectId]);
    return rows[0] ? hydrateVersion(rows[0]) : null;
  }

  async appendVersion(version: DatasetVersion): Promise<void> {
    const database = await getDatabase();
    await database.execute("INSERT INTO dataset_versions (id,dataset_id,project_id,version_number,kind,parent_version_id,source_file_id,media_type,sha256,byte_size,schema_json,preview_json,source_metadata_json,materialized_json,preview_row_count,row_count,column_count,parser_id,parser_version,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [version.id, version.datasetId, version.projectId, version.versionNumber, version.kind, version.parentVersionId, version.sourceFileId, version.mediaType, version.sha256, version.byteSize, JSON.stringify(version.schema), JSON.stringify(version.preview), JSON.stringify(version.sourceMetadata), version.materializedJson ?? null, version.previewRowCount, version.rowCount, version.columnCount, version.parserId, version.parserVersion, version.status, version.createdAt]);
    await database.execute("UPDATE datasets SET current_version_id = ?, updated_at = ? WHERE id = ? AND project_id = ?", [version.id, version.createdAt, version.datasetId, version.projectId]);
  }

  async create(dataset: Dataset, version: DatasetVersion): Promise<void> {
    const database = await getDatabase();
    await database.execute("INSERT INTO datasets (id,project_id,name,source_file_id,media_type,status,current_version_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)", [dataset.id, dataset.projectId, dataset.name, dataset.sourceFileId, dataset.mediaType, dataset.status, null, dataset.createdAt, dataset.updatedAt]);
    try {
      await database.execute("INSERT INTO dataset_versions (id,dataset_id,project_id,version_number,kind,parent_version_id,source_file_id,media_type,sha256,byte_size,schema_json,preview_json,source_metadata_json,materialized_json,preview_row_count,row_count,column_count,parser_id,parser_version,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", [version.id, version.datasetId, version.projectId, version.versionNumber, version.kind, version.parentVersionId, version.sourceFileId, version.mediaType, version.sha256, version.byteSize, JSON.stringify(version.schema), JSON.stringify(version.preview), JSON.stringify(version.sourceMetadata), version.materializedJson ?? null, version.previewRowCount, version.rowCount, version.columnCount, version.parserId, version.parserVersion, version.status, version.createdAt]);
      await database.execute("UPDATE datasets SET current_version_id = ?, updated_at = ? WHERE id = ? AND project_id = ?", [version.id, dataset.updatedAt, dataset.id, dataset.projectId]);
    } catch (error) {
      await database.execute("DELETE FROM datasets WHERE id = ? AND project_id = ?", [dataset.id, dataset.projectId]);
      throw error;
    }
  }
}

function hydrateVersion(version: DatasetVersion): DatasetVersion {
  return { ...version, schema: typeof version.schema === "string" ? JSON.parse(version.schema) : version.schema, preview: typeof version.preview === "string" ? JSON.parse(version.preview) : version.preview, sourceMetadata: typeof version.sourceMetadata === "string" ? JSON.parse(version.sourceMetadata) : version.sourceMetadata };
}

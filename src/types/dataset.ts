import type { EntityId, IsoDateTime } from "./domain";

export type DatasetStatus = "ready" | "failed" | "archived";
export type DatasetVersionKind = "raw" | "derived";
export type DatasetVersionStatus = "ready" | "failed" | "stale" | "archived";
export type DatasetColumnType = "string" | "number" | "boolean" | "date" | "unknown";

export interface DatasetColumn {
  name: string;
  sourceName: string;
  type: DatasetColumnType;
  nullable: boolean;
}

export interface DatasetPreview {
  columns: string[];
  rows: string[][];
}

export interface Dataset {
  id: EntityId;
  projectId: EntityId;
  name: string;
  sourceFileId: EntityId;
  mediaType: string;
  status: DatasetStatus;
  currentVersionId: EntityId | null;
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
}

export interface DatasetVersion {
  id: EntityId;
  datasetId: EntityId;
  projectId: EntityId;
  versionNumber: number;
  kind: DatasetVersionKind;
  parentVersionId: EntityId | null;
  sourceFileId: EntityId | null;
  mediaType: string;
  sha256: string;
  byteSize: number;
  schema: DatasetColumn[];
  preview: DatasetPreview;
  sourceMetadata: { sheetName: string | null };
  materializedJson?: string | null;
  previewRowCount: number;
  rowCount: number;
  columnCount: number;
  parserId: string;
  parserVersion: string;
  status: DatasetVersionStatus;
  createdAt: IsoDateTime;
}

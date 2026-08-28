-- Phase 7 STEP 02: immutable dataset registry. A dataset version is metadata for a
-- concrete project file snapshot; it is deliberately separate from document parsing.
CREATE TABLE datasets (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  name TEXT NOT NULL,
  source_file_id TEXT NOT NULL,
  media_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('ready','failed','archived')),
  current_version_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY(source_file_id) REFERENCES project_files(id) ON DELETE RESTRICT,
  UNIQUE(project_id, name)
);

CREATE TABLE dataset_versions (
  id TEXT PRIMARY KEY NOT NULL,
  dataset_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  version_number INTEGER NOT NULL CHECK(version_number >= 1),
  kind TEXT NOT NULL CHECK(kind IN ('raw','derived')),
  parent_version_id TEXT,
  source_file_id TEXT,
  media_type TEXT NOT NULL,
  sha256 TEXT NOT NULL CHECK(length(sha256) = 64),
  byte_size INTEGER NOT NULL CHECK(byte_size >= 0),
  schema_json TEXT NOT NULL,
  preview_json TEXT NOT NULL,
  source_metadata_json TEXT NOT NULL DEFAULT '{}',
  materialized_json TEXT,
  preview_row_count INTEGER NOT NULL CHECK(preview_row_count >= 0),
  row_count INTEGER NOT NULL CHECK(row_count >= 0),
  column_count INTEGER NOT NULL CHECK(column_count >= 0),
  parser_id TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('ready','failed','stale','archived')),
  created_at TEXT NOT NULL,
  FOREIGN KEY(dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY(parent_version_id) REFERENCES dataset_versions(id) ON DELETE RESTRICT,
  FOREIGN KEY(source_file_id) REFERENCES project_files(id) ON DELETE RESTRICT,
  UNIQUE(dataset_id, version_number)
);

CREATE INDEX idx_datasets_project_updated ON datasets(project_id, updated_at DESC);
CREATE INDEX idx_dataset_versions_dataset_version ON dataset_versions(dataset_id, version_number DESC);
CREATE INDEX idx_dataset_versions_project_hash ON dataset_versions(project_id, sha256);
CREATE UNIQUE INDEX idx_dataset_versions_raw_snapshot_dedupe ON dataset_versions(project_id, sha256, parser_id, parser_version) WHERE kind = 'raw';

CREATE TRIGGER datasets_project_scope_before_insert BEFORE INSERT ON datasets BEGIN
  SELECT CASE WHEN (SELECT project_id FROM project_files WHERE id = NEW.source_file_id) != NEW.project_id
    THEN RAISE(ABORT, 'dataset source file must belong to the dataset project') END;
END;
CREATE TRIGGER dataset_versions_project_scope_before_insert BEFORE INSERT ON dataset_versions BEGIN
  SELECT CASE WHEN (SELECT project_id FROM datasets WHERE id = NEW.dataset_id) != NEW.project_id
    OR (NEW.source_file_id IS NOT NULL AND (SELECT project_id FROM project_files WHERE id = NEW.source_file_id) != NEW.project_id)
    OR (NEW.parent_version_id IS NOT NULL AND (SELECT project_id FROM dataset_versions WHERE id = NEW.parent_version_id) != NEW.project_id)
    THEN RAISE(ABORT, 'dataset version must remain in its project') END;
END;

PRAGMA foreign_keys = OFF;

CREATE TABLE project_files_v3 (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  workflow_stage_id TEXT,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL,
  relative_path TEXT NOT NULL,
  mime_type TEXT,
  extension TEXT NOT NULL DEFAULT '',
  size_bytes INTEGER NOT NULL DEFAULT 0 CHECK (size_bytes >= 0),
  checksum TEXT,
  file_category TEXT NOT NULL DEFAULT 'other' CHECK (file_category IN ('school_rule', 'template', 'literature', 'data', 'proposal', 'thesis', 'translation', 'review', 'defense', 'plagiarism', 'archive', 'other')),
  version_label TEXT,
  source TEXT NOT NULL DEFAULT 'local' CHECK (source IN ('local', 'imported', 'generated')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_stage_id) REFERENCES workflow_stages(id) ON DELETE SET NULL
);

INSERT INTO project_files_v3 SELECT id, project_id, workflow_stage_id, original_name, stored_name, relative_path, mime_type, extension, size_bytes, checksum,
  CASE file_category WHEN 'dataset' THEN 'data' WHEN 'report' THEN 'review' WHEN 'attachment' THEN 'other' ELSE file_category END,
  version_label, source, created_at, updated_at FROM project_files;
DROP TABLE project_files;
ALTER TABLE project_files_v3 RENAME TO project_files;
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
PRAGMA foreign_keys = ON;

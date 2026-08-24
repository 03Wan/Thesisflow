-- Per-source result makes batch imports resumable without blocking healthy files.
CREATE TABLE literature_import_job_items (
  id TEXT PRIMARY KEY NOT NULL,
  import_job_id TEXT NOT NULL,
  source_name TEXT NOT NULL,
  project_file_id TEXT,
  literature_id TEXT,
  status TEXT NOT NULL CHECK(status IN ('queued','processing','imported','duplicate','failed','retryable')),
  error_code TEXT,
  error_message_safe TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(import_job_id) REFERENCES literature_import_jobs(id) ON DELETE CASCADE,
  FOREIGN KEY(project_file_id) REFERENCES project_files(id) ON DELETE SET NULL,
  FOREIGN KEY(literature_id) REFERENCES literature_items(id) ON DELETE SET NULL
);
CREATE INDEX idx_literature_import_job_items_job ON literature_import_job_items(import_job_id, status);

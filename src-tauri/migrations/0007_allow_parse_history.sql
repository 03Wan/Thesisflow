-- v6 accidentally made parser identity unique per file, which prevents stale-history reparses.
PRAGMA foreign_keys = OFF;

CREATE TABLE document_parses_next (
  id TEXT PRIMARY KEY NOT NULL, project_id TEXT NOT NULL, project_file_id TEXT NOT NULL,
  parser_type TEXT NOT NULL, parser_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued','parsing','parsed','failed','unsupported','needs_ocr','stale')),
  content_hash TEXT, normalized_path TEXT, mime_type TEXT, language TEXT, page_count INTEGER,
  block_count INTEGER NOT NULL DEFAULT 0, text_length INTEGER NOT NULL DEFAULT 0,
  error_code TEXT, error_message TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (project_file_id) REFERENCES project_files(id) ON DELETE CASCADE
);
INSERT INTO document_parses_next SELECT id,project_id,project_file_id,parser_type,parser_version,status,content_hash,normalized_path,mime_type,language,page_count,block_count,text_length,error_code,error_message,created_at,updated_at FROM document_parses;
DROP TABLE document_parses;
ALTER TABLE document_parses_next RENAME TO document_parses;
CREATE INDEX idx_document_parses_project_id ON document_parses(project_id);
CREATE INDEX idx_document_parses_project_file_id ON document_parses(project_file_id);
CREATE INDEX idx_document_parses_status ON document_parses(status);
PRAGMA foreign_keys = ON;

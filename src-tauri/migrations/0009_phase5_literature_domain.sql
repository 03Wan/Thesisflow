-- Phase 5 literature domain (logical Migration v4). Additive only: preserves v1-v8 data.
CREATE TABLE literature_items (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  abstract TEXT,
  year INTEGER CHECK (year IS NULL OR year BETWEEN 1000 AND 9999),
  publication_date TEXT,
  venue TEXT,
  volume TEXT,
  issue TEXT,
  pages TEXT,
  publisher TEXT,
  language TEXT,
  literature_type TEXT NOT NULL DEFAULT 'article',
  status TEXT NOT NULL DEFAULT 'inbox' CHECK (status IN ('inbox','unread','reading','read','archived')),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('verified','partially_verified','unverified','conflict')),
  preferred_citation_key TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE
);

CREATE TABLE literature_authors (
  id TEXT PRIMARY KEY NOT NULL,
  given_name TEXT NOT NULL DEFAULT '',
  family_name TEXT NOT NULL DEFAULT '',
  literal_name TEXT,
  orcid TEXT
);
CREATE TABLE literature_item_authors (
  literature_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  author_order INTEGER NOT NULL CHECK (author_order >= 0),
  role TEXT NOT NULL DEFAULT 'author',
  PRIMARY KEY (literature_id, author_id, role),
  UNIQUE (literature_id, author_order, role),
  FOREIGN KEY (literature_id) REFERENCES literature_items(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES literature_authors(id) ON DELETE RESTRICT
);

CREATE TABLE literature_identifiers (
  id TEXT PRIMARY KEY NOT NULL,
  literature_id TEXT NOT NULL,
  scheme TEXT NOT NULL CHECK (scheme IN ('doi','isbn','pmid','arxiv','openalex','semantic_scholar','url','other')),
  value TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  source TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0 CHECK (verified IN (0,1)),
  FOREIGN KEY (literature_id) REFERENCES literature_items(id) ON DELETE CASCADE,
  UNIQUE (literature_id, scheme, normalized_value)
);

CREATE TABLE literature_files (
  id TEXT PRIMARY KEY NOT NULL,
  literature_id TEXT NOT NULL,
  project_file_id TEXT NOT NULL,
  relation_type TEXT NOT NULL DEFAULT 'fulltext' CHECK (relation_type IN ('fulltext','supplement','appendix','other')),
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0,1)),
  created_at TEXT NOT NULL,
  FOREIGN KEY (literature_id) REFERENCES literature_items(id) ON DELETE CASCADE,
  FOREIGN KEY (project_file_id) REFERENCES project_files(id) ON DELETE CASCADE,
  UNIQUE (literature_id, project_file_id)
);
CREATE UNIQUE INDEX idx_literature_files_one_primary ON literature_files(literature_id) WHERE is_primary = 1;
CREATE TRIGGER literature_files_project_scope BEFORE INSERT ON literature_files BEGIN
  SELECT CASE WHEN (SELECT project_id FROM literature_items WHERE id=NEW.literature_id) != (SELECT project_id FROM project_files WHERE id=NEW.project_file_id) THEN RAISE(ABORT, 'literature file must belong to the literature project') END;
END;

CREATE TABLE literature_metadata_sources (
  id TEXT PRIMARY KEY NOT NULL,
  literature_id TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_name TEXT NOT NULL,
  external_id TEXT,
  fetched_at TEXT,
  raw_metadata_path TEXT,
  raw_metadata_json TEXT,
  confidence REAL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  created_at TEXT NOT NULL,
  FOREIGN KEY (literature_id) REFERENCES literature_items(id) ON DELETE CASCADE
);
CREATE TABLE literature_field_provenance (
  id TEXT PRIMARY KEY NOT NULL,
  literature_id TEXT NOT NULL,
  field_name TEXT NOT NULL,
  value_json TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_ref TEXT,
  trust_level INTEGER NOT NULL CHECK (trust_level BETWEEN 1 AND 5),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL,
  FOREIGN KEY (literature_id) REFERENCES literature_items(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX idx_literature_provenance_active_field ON literature_field_provenance(literature_id, field_name) WHERE is_active = 1;

CREATE TABLE literature_tags (id TEXT PRIMARY KEY NOT NULL, project_id TEXT NOT NULL, name TEXT NOT NULL, color TEXT, created_at TEXT NOT NULL, FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE, UNIQUE(project_id, name));
CREATE TABLE literature_item_tags (literature_id TEXT NOT NULL, tag_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(literature_id, tag_id), FOREIGN KEY(literature_id) REFERENCES literature_items(id) ON DELETE CASCADE, FOREIGN KEY(tag_id) REFERENCES literature_tags(id) ON DELETE CASCADE);
CREATE TABLE literature_notes (id TEXT PRIMARY KEY NOT NULL, literature_id TEXT NOT NULL, content TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(literature_id) REFERENCES literature_items(id) ON DELETE CASCADE);
CREATE TABLE literature_collections (id TEXT PRIMARY KEY NOT NULL, project_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE, UNIQUE(project_id, name));
CREATE TABLE literature_collection_items (collection_id TEXT NOT NULL, literature_id TEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, PRIMARY KEY(collection_id, literature_id), FOREIGN KEY(collection_id) REFERENCES literature_collections(id) ON DELETE CASCADE, FOREIGN KEY(literature_id) REFERENCES literature_items(id) ON DELETE CASCADE);

CREATE TABLE literature_cards (id TEXT PRIMARY KEY NOT NULL, literature_id TEXT NOT NULL, schema_version TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','reviewed','confirmed','stale')), ai_run_id TEXT, summary TEXT, structured_json TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(literature_id) REFERENCES literature_items(id) ON DELETE CASCADE, FOREIGN KEY(ai_run_id) REFERENCES ai_runs(id) ON DELETE SET NULL);
CREATE TABLE literature_chunks (id TEXT PRIMARY KEY NOT NULL, literature_id TEXT NOT NULL, project_file_id TEXT NOT NULL, document_parse_id TEXT NOT NULL, chunk_order INTEGER NOT NULL CHECK(chunk_order >= 0), text TEXT NOT NULL, text_hash TEXT NOT NULL, token_estimate INTEGER, heading_path TEXT, locator_json TEXT NOT NULL, created_at TEXT NOT NULL, FOREIGN KEY(literature_id) REFERENCES literature_items(id) ON DELETE CASCADE, FOREIGN KEY(project_file_id) REFERENCES project_files(id) ON DELETE CASCADE, FOREIGN KEY(document_parse_id) REFERENCES document_parses(id) ON DELETE CASCADE, UNIQUE(document_parse_id, chunk_order));
CREATE TABLE literature_card_evidence (id TEXT PRIMARY KEY NOT NULL, card_id TEXT NOT NULL, field_path TEXT NOT NULL, chunk_id TEXT NOT NULL, source_locator_json TEXT NOT NULL, quote_hash TEXT, snippet_hash TEXT, confidence REAL CHECK(confidence IS NULL OR confidence BETWEEN 0 AND 1), FOREIGN KEY(card_id) REFERENCES literature_cards(id) ON DELETE CASCADE, FOREIGN KEY(chunk_id) REFERENCES literature_chunks(id) ON DELETE RESTRICT);
CREATE TRIGGER literature_chunks_project_scope BEFORE INSERT ON literature_chunks BEGIN
  SELECT CASE WHEN (SELECT project_id FROM literature_items WHERE id=NEW.literature_id) != (SELECT project_id FROM project_files WHERE id=NEW.project_file_id) OR (SELECT project_id FROM literature_items WHERE id=NEW.literature_id) != (SELECT project_id FROM document_parses WHERE id=NEW.document_parse_id) THEN RAISE(ABORT, 'literature chunk must belong to the literature project') END;
END;

-- Vectors stay in a VectorIndex adapter; SQLite stores only version/index bookkeeping.
CREATE TABLE literature_embeddings (id TEXT PRIMARY KEY NOT NULL, chunk_id TEXT NOT NULL, embedding_version TEXT NOT NULL, index_key TEXT NOT NULL, provider_key TEXT, status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','indexed','failed','stale')), created_at TEXT NOT NULL, updated_at TEXT NOT NULL, FOREIGN KEY(chunk_id) REFERENCES literature_chunks(id) ON DELETE CASCADE, UNIQUE(chunk_id, embedding_version));
CREATE TABLE literature_import_jobs (id TEXT PRIMARY KEY NOT NULL, project_id TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('queued','running','completed','failed','cancelled')), source_type TEXT NOT NULL, total_count INTEGER NOT NULL DEFAULT 0, completed_count INTEGER NOT NULL DEFAULT 0, failed_count INTEGER NOT NULL DEFAULT 0, error_code TEXT, error_message_safe TEXT, created_at TEXT NOT NULL, started_at TEXT, completed_at TEXT, FOREIGN KEY(project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE);

CREATE INDEX idx_literature_items_project_status ON literature_items(project_id, status, updated_at DESC);
CREATE INDEX idx_literature_identifiers_normalized ON literature_identifiers(scheme, normalized_value);
CREATE INDEX idx_literature_chunks_literature ON literature_chunks(literature_id, chunk_order);
CREATE INDEX idx_literature_import_jobs_project ON literature_import_jobs(project_id, created_at DESC);
CREATE VIRTUAL TABLE literature_chunks_fts USING fts5(text, content='literature_chunks', content_rowid='rowid');
CREATE TRIGGER literature_chunks_ai AFTER INSERT ON literature_chunks BEGIN INSERT INTO literature_chunks_fts(rowid,text) VALUES (new.rowid,new.text); END;
CREATE TRIGGER literature_chunks_ad AFTER DELETE ON literature_chunks BEGIN INSERT INTO literature_chunks_fts(literature_chunks_fts,rowid,text) VALUES ('delete',old.rowid,old.text); END;
CREATE TRIGGER literature_chunks_au AFTER UPDATE OF text ON literature_chunks BEGIN INSERT INTO literature_chunks_fts(literature_chunks_fts,rowid,text) VALUES ('delete',old.rowid,old.text); INSERT INTO literature_chunks_fts(rowid,text) VALUES(new.rowid,new.text); END;

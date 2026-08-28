-- Phase 8: the structured thesis document is the writing source of truth.
CREATE TABLE thesis_documents (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','active','archived')),
  active_version INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE
);
CREATE TABLE thesis_sections (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  parent_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  heading_level INTEGER NOT NULL DEFAULT 1 CHECK(heading_level BETWEEN 1 AND 6),
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  content_format TEXT NOT NULL DEFAULT 'html' CHECK(content_format IN ('html','plain_text')),
  word_count INTEGER NOT NULL DEFAULT 0 CHECK(word_count >= 0),
  purpose TEXT NOT NULL DEFAULT '',
  target_length INTEGER,
  source_plan_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(document_id) REFERENCES thesis_documents(id) ON DELETE CASCADE,
  FOREIGN KEY(project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY(parent_id) REFERENCES thesis_sections(id) ON DELETE RESTRICT
);
CREATE INDEX idx_thesis_sections_document_order ON thesis_sections(document_id, parent_id, sort_order);
CREATE TABLE thesis_revisions (
  id TEXT PRIMARY KEY NOT NULL,
  document_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  version_number INTEGER NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('student','ai','restore','import')),
  label TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY(document_id) REFERENCES thesis_documents(id) ON DELETE CASCADE,
  FOREIGN KEY(project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  UNIQUE(document_id, version_number)
);
CREATE TABLE thesis_citations (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  literature_id TEXT NOT NULL,
  anchor TEXT NOT NULL,
  locator TEXT,
  prefix TEXT NOT NULL DEFAULT '',
  suffix TEXT NOT NULL DEFAULT '',
  render_text TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY(document_id) REFERENCES thesis_documents(id) ON DELETE CASCADE,
  FOREIGN KEY(section_id) REFERENCES thesis_sections(id) ON DELETE CASCADE,
  FOREIGN KEY(literature_id) REFERENCES literature_items(id) ON DELETE RESTRICT,
  UNIQUE(project_id, anchor)
);
CREATE TABLE thesis_source_links (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK(source_type IN ('literature','note','card','requirement','evidence','artifact')),
  source_id TEXT NOT NULL,
  locator TEXT,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'linked' CHECK(status IN ('linked','stale','broken')),
  snapshot_text TEXT NOT NULL DEFAULT '',
  source_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY(document_id) REFERENCES thesis_documents(id) ON DELETE CASCADE,
  FOREIGN KEY(section_id) REFERENCES thesis_sections(id) ON DELETE CASCADE,
  UNIQUE(section_id, source_type, source_id)
);
CREATE TABLE thesis_ai_proposals (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  section_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  original_text TEXT NOT NULL,
  proposed_text TEXT NOT NULL,
  used_source_ids_json TEXT NOT NULL DEFAULT '[]',
  unsupported_json TEXT NOT NULL DEFAULT '[]',
  model TEXT NOT NULL,
  prompt_version TEXT NOT NULL,
  context_ids_json TEXT NOT NULL DEFAULT '[]',
  output_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','rejected','undone')),
  created_at TEXT NOT NULL,
  resolved_at TEXT,
  FOREIGN KEY(project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY(document_id) REFERENCES thesis_documents(id) ON DELETE CASCADE,
  FOREIGN KEY(section_id) REFERENCES thesis_sections(id) ON DELETE CASCADE
);
CREATE TABLE thesis_export_manifests (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  document_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  output_path TEXT NOT NULL,
  output_format TEXT NOT NULL CHECK(output_format IN ('docx','pdf')),
  file_hash TEXT NOT NULL,
  requirements_version TEXT,
  template_version TEXT,
  warnings_json TEXT NOT NULL DEFAULT '[]',
  manual_check_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL,
  FOREIGN KEY(project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY(document_id) REFERENCES thesis_documents(id) ON DELETE CASCADE,
  FOREIGN KEY(revision_id) REFERENCES thesis_revisions(id) ON DELETE RESTRICT
);
CREATE TRIGGER thesis_sections_project_scope BEFORE INSERT ON thesis_sections BEGIN
  SELECT CASE WHEN (SELECT project_id FROM thesis_documents WHERE id=NEW.document_id) != NEW.project_id THEN RAISE(ABORT, 'section must remain in its project') END;
END;
CREATE TRIGGER thesis_citations_project_scope BEFORE INSERT ON thesis_citations BEGIN
  SELECT CASE WHEN (SELECT project_id FROM literature_items WHERE id=NEW.literature_id) != NEW.project_id OR (SELECT project_id FROM thesis_sections WHERE id=NEW.section_id) != NEW.project_id THEN RAISE(ABORT, 'citation must remain in its project') END;
END;
CREATE TRIGGER thesis_evidence_link_stale AFTER UPDATE OF stale ON evidence_blocks WHEN NEW.stale=1 BEGIN
  UPDATE thesis_source_links SET status='stale',updated_at=NEW.updated_at WHERE source_type='evidence' AND source_id=NEW.id;
END;
CREATE TRIGGER thesis_literature_link_stale AFTER UPDATE ON literature_items BEGIN
  UPDATE thesis_citations SET updated_at=NEW.updated_at WHERE literature_id=NEW.id;
  UPDATE thesis_source_links SET status='stale',updated_at=NEW.updated_at WHERE source_type='literature' AND source_id=NEW.id;
END;

CREATE TABLE document_parses (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  project_file_id TEXT NOT NULL,
  parser_type TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued','parsing','parsed','failed','unsupported','needs_ocr','stale')),
  content_hash TEXT,
  normalized_path TEXT,
  mime_type TEXT,
  language TEXT,
  page_count INTEGER,
  block_count INTEGER NOT NULL DEFAULT 0,
  text_length INTEGER NOT NULL DEFAULT 0,
  error_code TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (project_file_id) REFERENCES project_files(id) ON DELETE CASCADE,
  UNIQUE (project_file_id, parser_type, parser_version)
);

CREATE TABLE rule_candidates (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  project_file_id TEXT NOT NULL,
  document_parse_id TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  category TEXT NOT NULL,
  value_json TEXT NOT NULL,
  unit TEXT,
  raw_text TEXT NOT NULL,
  locator_json TEXT NOT NULL,
  confidence REAL NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  extractor TEXT NOT NULL,
  condition_json TEXT,
  exception_json TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','edited','rejected','superseded','conflict')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (project_file_id) REFERENCES project_files(id) ON DELETE CASCADE,
  FOREIGN KEY (document_parse_id) REFERENCES document_parses(id) ON DELETE CASCADE
);

CREATE TABLE thesis_rules (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  category TEXT NOT NULL,
  value_json TEXT NOT NULL,
  unit TEXT,
  scope TEXT NOT NULL,
  condition_json TEXT,
  exception_json TEXT,
  source_candidate_id TEXT,
  source_file_id TEXT,
  source_locator_json TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','superseded','archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  effective_from TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (source_candidate_id) REFERENCES rule_candidates(id) ON DELETE SET NULL,
  FOREIGN KEY (source_file_id) REFERENCES project_files(id) ON DELETE SET NULL,
  UNIQUE (project_id, rule_key, version)
);

CREATE TABLE rule_conflicts (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  rule_key TEXT NOT NULL,
  left_candidate_id TEXT,
  right_candidate_id TEXT,
  left_rule_id TEXT,
  right_rule_id TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  resolution_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (left_candidate_id) REFERENCES rule_candidates(id) ON DELETE SET NULL,
  FOREIGN KEY (right_candidate_id) REFERENCES rule_candidates(id) ON DELETE SET NULL,
  FOREIGN KEY (left_rule_id) REFERENCES thesis_rules(id) ON DELETE SET NULL,
  FOREIGN KEY (right_rule_id) REFERENCES thesis_rules(id) ON DELETE SET NULL
);

CREATE TABLE rule_audit_log (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  rule_id TEXT,
  candidate_id TEXT,
  action TEXT NOT NULL,
  actor TEXT NOT NULL DEFAULT 'local_user',
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (rule_id) REFERENCES thesis_rules(id) ON DELETE SET NULL,
  FOREIGN KEY (candidate_id) REFERENCES rule_candidates(id) ON DELETE SET NULL
);

CREATE INDEX idx_document_parses_project_id ON document_parses(project_id);
CREATE INDEX idx_document_parses_project_file_id ON document_parses(project_file_id);
CREATE INDEX idx_document_parses_status ON document_parses(status);
CREATE INDEX idx_rule_candidates_project_id ON rule_candidates(project_id);
CREATE INDEX idx_rule_candidates_project_file_id ON rule_candidates(project_file_id);
CREATE INDEX idx_rule_candidates_rule_key ON rule_candidates(rule_key);
CREATE INDEX idx_rule_candidates_status ON rule_candidates(status);
CREATE INDEX idx_thesis_rules_project_id ON thesis_rules(project_id);
CREATE INDEX idx_thesis_rules_rule_key ON thesis_rules(rule_key);
CREATE INDEX idx_thesis_rules_status ON thesis_rules(status);
CREATE INDEX idx_rule_conflicts_project_id ON rule_conflicts(project_id);
CREATE INDEX idx_rule_conflicts_rule_key ON rule_conflicts(rule_key);
CREATE INDEX idx_rule_conflicts_status ON rule_conflicts(status);
CREATE INDEX idx_rule_audit_log_project_id ON rule_audit_log(project_id);
CREATE INDEX idx_rule_audit_log_rule_id ON rule_audit_log(rule_id);

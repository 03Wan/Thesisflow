PRAGMA foreign_keys = ON;

CREATE TABLE thesis_projects (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  school TEXT NOT NULL DEFAULT '',
  college TEXT NOT NULL DEFAULT '',
  major TEXT NOT NULL DEFAULT '',
  grade TEXT NOT NULL DEFAULT '',
  student_name TEXT NOT NULL DEFAULT '',
  student_number TEXT NOT NULL DEFAULT '',
  advisor_name TEXT NOT NULL DEFAULT '',
  research_type TEXT NOT NULL DEFAULT '',
  current_stage TEXT NOT NULL DEFAULT 'requirements',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  defense_batch TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_opened_at TEXT,
  project_folder TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived', 'completed'))
);

CREATE TABLE thesis_requirements (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  requirement_key TEXT NOT NULL,
  label TEXT NOT NULL,
  target_value REAL,
  current_value REAL NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'met', 'unmet', 'waived')),
  description TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  UNIQUE (project_id, requirement_key)
);

CREATE TABLE workflow_stages (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  stage_key TEXT NOT NULL,
  stage_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'blocked', 'overdue', 'skipped')),
  started_at TEXT,
  completed_at TEXT,
  deadline TEXT,
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  sort_order INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  UNIQUE (project_id, stage_key),
  UNIQUE (project_id, stage_number)
);

CREATE TABLE project_files (
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
  file_category TEXT NOT NULL DEFAULT 'other' CHECK (file_category IN ('thesis', 'proposal', 'translation', 'dataset', 'literature', 'report', 'attachment', 'other')),
  version_label TEXT,
  source TEXT NOT NULL DEFAULT 'local' CHECK (source IN ('local', 'imported', 'generated')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_stage_id) REFERENCES workflow_stages(id) ON DELETE SET NULL
);

CREATE TABLE tasks (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  workflow_stage_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual', 'advisor_session', 'review', 'workflow', 'system')),
  source_reference_id TEXT,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'completed', 'cancelled')),
  due_at TEXT,
  completed_at TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_stage_id) REFERENCES workflow_stages(id) ON DELETE SET NULL
);

CREATE TABLE advisor_sessions (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  workflow_stage_id TEXT,
  session_at TEXT NOT NULL,
  format TEXT NOT NULL DEFAULT 'in_person' CHECK (format IN ('in_person', 'online', 'phone', 'other')),
  advisor_name TEXT NOT NULL DEFAULT '',
  summary TEXT NOT NULL DEFAULT '',
  feedback TEXT NOT NULL DEFAULT '',
  next_steps TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'recorded' CHECK (status IN ('planned', 'recorded', 'confirmed')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_stage_id) REFERENCES workflow_stages(id) ON DELETE SET NULL
);

CREATE TABLE app_settings (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  value_type TEXT NOT NULL DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_thesis_requirements_project_id ON thesis_requirements(project_id);
CREATE INDEX idx_workflow_stages_project_sort_order ON workflow_stages(project_id, sort_order);
CREATE INDEX idx_project_files_project_id ON project_files(project_id);
CREATE INDEX idx_tasks_project_status_due_at ON tasks(project_id, status, due_at);
CREATE INDEX idx_advisor_sessions_project_session_at ON advisor_sessions(project_id, session_at DESC);

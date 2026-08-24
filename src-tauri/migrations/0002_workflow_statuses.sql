PRAGMA foreign_keys = OFF;

CREATE TABLE workflow_stages_v2 (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT NOT NULL,
  stage_key TEXT NOT NULL,
  stage_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'overdue', 'blocked')),
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

INSERT INTO workflow_stages_v2 (id, project_id, stage_key, stage_number, title, status, started_at, completed_at, deadline, progress, sort_order, created_at, updated_at)
SELECT id, project_id, stage_key, stage_number, title,
  CASE status WHEN 'active' THEN 'in_progress' WHEN 'completed' THEN 'completed' WHEN 'blocked' THEN 'blocked' WHEN 'overdue' THEN 'overdue' ELSE 'not_started' END,
  started_at, completed_at, deadline, CASE WHEN status = 'completed' THEN 100 ELSE 0 END, sort_order, created_at, updated_at
FROM workflow_stages;

DROP TABLE workflow_stages;
ALTER TABLE workflow_stages_v2 RENAME TO workflow_stages;
CREATE INDEX idx_workflow_stages_project_sort_order ON workflow_stages(project_id, sort_order);

PRAGMA foreign_keys = ON;

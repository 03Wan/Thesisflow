PRAGMA foreign_keys = OFF;
CREATE TABLE tasks_v4 (
  id TEXT PRIMARY KEY NOT NULL, project_id TEXT NOT NULL, workflow_stage_id TEXT, title TEXT NOT NULL, description TEXT,
  source_type TEXT NOT NULL DEFAULT 'manual' CHECK (source_type IN ('manual','advisor','ai','plagiarism','review','defense','format')),
  source_reference_id TEXT, priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo','in_progress','waiting','done')), due_at TEXT, completed_at TEXT, sort_order INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE, FOREIGN KEY (workflow_stage_id) REFERENCES workflow_stages(id) ON DELETE SET NULL
);
INSERT INTO tasks_v4 SELECT id,project_id,workflow_stage_id,title,description,
  CASE source_type WHEN 'advisor_session' THEN 'advisor' WHEN 'workflow' THEN 'manual' WHEN 'system' THEN 'manual' ELSE source_type END,source_reference_id,
  CASE priority WHEN 'urgent' THEN 'critical' WHEN 'normal' THEN 'medium' ELSE priority END,
  CASE status WHEN 'completed' THEN 'done' WHEN 'cancelled' THEN 'waiting' ELSE status END,due_at,completed_at,sort_order,created_at,updated_at FROM tasks;
DROP TABLE tasks;
ALTER TABLE tasks_v4 RENAME TO tasks;
CREATE INDEX idx_tasks_project_status_due_at ON tasks(project_id,status,due_at);
ALTER TABLE advisor_sessions ADD COLUMN session_number INTEGER NOT NULL DEFAULT 0;
UPDATE advisor_sessions SET session_number = (SELECT COUNT(*) FROM advisor_sessions b WHERE b.project_id=advisor_sessions.project_id AND (b.session_at < advisor_sessions.session_at OR (b.session_at=advisor_sessions.session_at AND b.id <= advisor_sessions.id)));
CREATE UNIQUE INDEX idx_advisor_sessions_project_number ON advisor_sessions(project_id,session_number);
PRAGMA foreign_keys = ON;

PRAGMA foreign_keys = OFF;
CREATE TABLE advisor_sessions_v5 (
  id TEXT PRIMARY KEY NOT NULL, project_id TEXT NOT NULL, workflow_stage_id TEXT, session_number INTEGER NOT NULL,
  session_at TEXT NOT NULL, format TEXT NOT NULL DEFAULT 'in_person' CHECK (format IN ('in_person','online','phone','email','other')),
  advisor_name TEXT NOT NULL DEFAULT '', summary TEXT NOT NULL DEFAULT '', feedback TEXT NOT NULL DEFAULT '', next_steps TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('planned','completed','cancelled')), created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE CASCADE, FOREIGN KEY (workflow_stage_id) REFERENCES workflow_stages(id) ON DELETE SET NULL,
  UNIQUE (project_id,session_number)
);
INSERT INTO advisor_sessions_v5 SELECT id,project_id,workflow_stage_id,session_number,session_at,format,advisor_name,summary,feedback,next_steps,
  CASE status WHEN 'recorded' THEN 'completed' WHEN 'confirmed' THEN 'completed' ELSE status END,created_at,updated_at FROM advisor_sessions;
DROP TABLE advisor_sessions;
ALTER TABLE advisor_sessions_v5 RENAME TO advisor_sessions;
CREATE INDEX idx_advisor_sessions_project_session_at ON advisor_sessions(project_id,session_at DESC);
PRAGMA foreign_keys = ON;

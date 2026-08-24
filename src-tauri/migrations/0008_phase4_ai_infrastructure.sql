-- Phase 4 AI infrastructure. Secret material remains in the OS credential store;
-- this database contains only an opaque secret_ref and configured metadata.
CREATE TABLE ai_provider_configs (
  id TEXT PRIMARY KEY NOT NULL,
  provider_key TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  secret_ref TEXT,
  base_url_override TEXT,
  organization_metadata_json TEXT,
  project_metadata_json TEXT,
  default_model TEXT,
  config_json TEXT NOT NULL DEFAULT '{}',
  last_tested_at TEXT,
  last_test_status TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE ai_runs (
  id TEXT PRIMARY KEY NOT NULL,
  project_id TEXT,
  task_key TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  model_id TEXT NOT NULL,
  prompt_template_key TEXT NOT NULL,
  prompt_template_version TEXT NOT NULL,
  context_manifest_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('queued', 'running', 'streaming', 'succeeded', 'failed', 'cancelled', 'timed_out')),
  started_at TEXT NOT NULL,
  completed_at TEXT,
  cancelled_at TEXT,
  error_code TEXT,
  error_message_safe TEXT,
  request_id TEXT,
  provider_request_id TEXT,
  input_units INTEGER,
  output_units INTEGER,
  cached_units INTEGER,
  usage_json TEXT,
  response_meta_json TEXT,
  FOREIGN KEY (project_id) REFERENCES thesis_projects(id) ON DELETE SET NULL
);

CREATE TABLE ai_run_outputs (
  id TEXT PRIMARY KEY NOT NULL,
  ai_run_id TEXT NOT NULL,
  output_type TEXT NOT NULL,
  text_content TEXT,
  structured_json TEXT,
  schema_key TEXT,
  schema_version TEXT,
  validation_status TEXT NOT NULL CHECK (validation_status IN ('pending', 'valid', 'invalid', 'not_applicable')),
  created_at TEXT NOT NULL,
  FOREIGN KEY (ai_run_id) REFERENCES ai_runs(id) ON DELETE CASCADE,
  CHECK (text_content IS NOT NULL OR structured_json IS NOT NULL)
);

-- Prompts are a versioned code registry in this phase. ai_runs records the
-- key/version used for replayability without persisting prompt bodies in SQLite.
CREATE TABLE ai_usage_daily (
  usage_date TEXT NOT NULL,
  provider_key TEXT NOT NULL,
  model_id TEXT NOT NULL,
  input_units INTEGER NOT NULL DEFAULT 0 CHECK (input_units >= 0),
  output_units INTEGER NOT NULL DEFAULT 0 CHECK (output_units >= 0),
  cached_units INTEGER NOT NULL DEFAULT 0 CHECK (cached_units >= 0),
  run_count INTEGER NOT NULL DEFAULT 0 CHECK (run_count >= 0),
  PRIMARY KEY (usage_date, provider_key, model_id)
);

CREATE INDEX idx_ai_runs_project_started ON ai_runs(project_id, started_at DESC);
CREATE INDEX idx_ai_runs_status_started ON ai_runs(status, started_at DESC);
CREATE INDEX idx_ai_run_outputs_run_id ON ai_run_outputs(ai_run_id);

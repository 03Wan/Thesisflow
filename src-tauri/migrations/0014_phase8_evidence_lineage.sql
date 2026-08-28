-- Phase 8: preserve the complete Phase 7 evidence lineage on every insertion.
ALTER TABLE thesis_source_links ADD COLUMN evidence_id TEXT;
ALTER TABLE thesis_source_links ADD COLUMN artifact_id TEXT;
ALTER TABLE thesis_source_links ADD COLUMN run_id TEXT;
CREATE INDEX idx_thesis_source_links_evidence ON thesis_source_links(project_id, evidence_id, artifact_id, run_id);

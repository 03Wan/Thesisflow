# ADR: Phase 8 Structured Writing Source of Truth

## Decision

The canonical paper is a `thesis_document` per project. Its ordered `thesis_sections` hold editable content and stable IDs. Every student edit, AI acceptance, import, or restore creates an immutable `thesis_revision`; restore creates a new revision and never deletes history.

Structured citations reference existing `literature_items` by ID. Evidence links reference Phase 7 evidence/artifacts by ID and may become stale; copied display text is only a snapshot. DOCX is a generated export artifact, never the canonical document.

## Boundaries

- Project IDs are required on every Phase 8 record and SQL constraints reject cross-project citation/section links.
- Confirmed requirements remain distinct from system recommendations and student-defined targets.
- AI output is a proposal with source IDs and output hash. It cannot mutate sections until the student accepts it.
- A failed save/export must surface an error and must not report success.
- No teacher review, approval, mentor comment, or collaboration state is introduced in the writing domain.

## Consequences

The editor can stay lightweight and stable while the data model supports later rich-text upgrades. Some advanced Word/PDF requirements remain manual checks until the renderer is proven; the product must not claim unsupported compliance.

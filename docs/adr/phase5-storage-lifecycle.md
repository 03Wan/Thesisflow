# Phase 5 Literature Storage Lifecycle

Status: accepted for the Phase 5 quality gate.

## Boundaries

- Canonical metadata and every field-provenance decision are audit data. They are not removed by automatic cleanup.
- Repeated provider responses are deduplicated per literature item, provider/source identity, external ID and raw response body. A refresh may advance `fetched_at`; it must not create unlimited identical rows.
- Chunk text exists only for a concrete `document_parse_id`. Reparse creates a new version and marks cards/embedding metadata that depend on the previous parse stale.
- SQLite stores embedding version/index metadata only. Vector payloads remain inside the configured `VectorIndex` adapter.
- Confirmed/reviewed cards and evidence referenced by human review are audit records and are retained.

## Cleanup policy

| Data | Active retention | Stale cleanup | Audit exception |
|---|---|---|---|
| Provider raw metadata | Latest distinct response per provider/external record | Identical responses are not inserted | All distinct conflicting candidates and active provenance remain |
| Chunks | Current parse | Unreferenced stale chunks may be removed after 30 days | Any chunk referenced by card evidence is retained |
| Embedding metadata/index entries | Current embedding version | Stale index entries are removed from `VectorIndex`, then SQLite metadata, after 7 days | Build/run summary remains; vectors are not audit data |
| Draft cards | Current draft | Unreviewed stale drafts may be removed after 30 days | Reviewed/confirmed cards and their evidence remain |
| Import jobs | Current and recent jobs | Per-file transient errors may be compacted after 90 days | Counts, safe error codes and final audit status remain |

Cleanup must be explicit, project-scoped, cancellable between batches and recorded as counts/IDs rather than full document text. It must never cascade through evidence protected by `ON DELETE RESTRICT`.

## Privacy and logging

Provider metadata calls and AI-provider calls are separate flows. AI requests receive only the task-selected chunks visible in Context Preview. Logs contain project/literature IDs, source refs, counts, sizes, status and safe error codes; they never contain an API secret or complete PDF/chunk text.

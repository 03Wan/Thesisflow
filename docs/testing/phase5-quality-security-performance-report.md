# Phase 5 Literature Quality, Security and Performance Report

Date: 2026-08-24

## Metadata and deduplication

The quality matrix covers exact DOI, DOI URL/raw normalization, same title with different year/author, conference/journal versions, preprint/published versions, minor spelling changes, Chinese/English titles and provider DOI conflicts.

- Auto-merge is allowed only for identical normalized DOI or the full exact tuple of title + year + first author when no publication-version conflict exists.
- Spelling variants are review-only (`possible`). Translation pairs remain separate unless a strong identifier establishes identity.
- Conference/journal and preprint/published pairs are `related_version`, never silent merges.
- Conflicting provider DOI values force separate/conflict handling.
- Merge plans retain notes, tags, files, cards and provenance plus a complete undo snapshot.

Result: 11 metadata quality tests passed; no weak-similarity auto-merge fixture was accepted.

## Security and privacy

- The adversarial full-text fixture contains “ignore system instructions”, an invented DOI and a request to read another project. It remains a `source` with `untrusted_document` trust level.
- Card refs are constrained to the ContextPack source whitelist and expected literature ID; optional repository ownership validation checks project/file scope before model execution.
- Invented DOI values are rejected unless present in the allowed current-library DOI set.
- Read-literature tasks resolve to current evidence; external discovery resolves to `ScholarlySearchProvider`, not model memory.
- Context Preview shows only selected chunk excerpts, locators and hashes.
- Safe task logs contain IDs, counts and character totals, never full chunk/PDF text.
- Metadata-provider requests remain separate from AI-provider requests.

Result: 4 dedicated Phase 5 security tests passed, in addition to the existing Phase 4 AI security regression suite.

## Storage lifecycle

The accepted policy is documented in `docs/adr/phase5-storage-lifecycle.md`. Identical provider responses are not reinserted. Unreferenced stale chunks/draft cards may be removed after 30 days and stale vector entries after 7 days; confirmed/reviewed cards, distinct conflicting metadata and evidence-referenced chunks remain audit data. SQLite contains embedding/index metadata, not large vector JSON.

## Performance

Two layers were tested:

1. TypeScript interaction fixture: 500 records / 4,000 chunks, list/filter/search/detail and 100-record tagging completed below the 2,000 ms guard.
2. Native SQLite FTS5 integration: migration + seed + operations completed in 420 ms on the final full Tauri test run; project-scoped FTS, detail open and batch tagging checks passed.

Embedding build progress/cancellation/incremental performance is N/A because embeddings are not enabled. This is an explicit degradation state; FTS remains complete and offline.

## Residual limitations

- The labelled grounding and retrieval corpora are intentionally small and deterministic.
- No live AI provider or production VectorIndex was invoked.
- The current native benchmark is an in-memory SQLite integration test, not a cold-disk benchmark on a packaged installer.
- Provider metadata conflicts are guarded but still require human resolution in product UI.

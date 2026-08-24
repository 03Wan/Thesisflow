# Phase 5 Literature Quality Plan

- Status: Planned; applies before and throughout implementation.
- Date: 2026-08-24
- Preconditions: Phase 4 release-gate remediation is complete before enabling production AI card generation.

## Test corpus and execution modes

Maintain a versioned, legally distributable fixture corpus: records with DOI/PMID/arXiv/ISBN variants, deliberately conflicting provider metadata, duplicate files, no-file records, corrupted/unparseable files, multilingual metadata, and two or more projects with overlapping works. Tests run offline by default. Provider-contract/live tests are opt-in, rate-limited, use documented test credentials where permitted, and never download non-open full text.

## Acceptance measures

| Quality area | Measure | Acceptance rule |
| --- | --- | --- |
| Metadata match precision | Correct canonical work selected among accepted automatic matches / all accepted automatic matches, with review labels checked manually on a gold corpus. | Report precision, recall, and false-merge count; no silent merge of user-confirmed conflicts. Threshold is set from the first labelled baseline before automation is enabled. |
| Duplicate detection | Correct duplicate pairs and non-duplicate pairs detected across identifiers, title/author/year, and file hashes. | Exact identifier/file-hash duplicates are deterministic; ambiguous matches are candidates requiring confirmation. Track precision, recall, false merge, and false split. |
| Retrieval grounding | Answer/card evidence references resolving to an accessible chunk / all emitted evidence references. | 100% of emitted refs resolve within the active project, have the required provenance fields, and quote/hash-match the cited chunk. |
| Card evidence coverage | Material card claims (question, method, conclusion, limitation) carrying at least one valid evidence ref / material claims. | 100% coverage, otherwise the field must be “无法从当前全文确认”; fabricated/foreign refs are zero-tolerance defects. |
| Cross-project isolation | Attempts to retrieve, open, export, or cite Project B data while scoped to Project A. | Zero cross-project results and zero cross-project source resolution; tests cover lexical and optional semantic paths. |
| Offline degradation | Behaviour with metadata network disabled and with no embedding provider/vector index. | Import, manual editing, CSL-JSON export, parsing, and lexical search work; provider/semantic failures are safe, explicit, and non-destructive. |
| Large-library performance | Measured import/index/search latency and storage growth on a documented fixture library. | Establish hardware, corpus size, p50/p95 timings, peak memory, and failure rate before setting release budgets. Correctness and isolation take precedence over throughput. |

## Required test layers

1. Unit tests for identifier normalization, field precedence, merge-candidate scoring, CSL-JSON conversion, provenance validation, and provider error mapping.
2. SQLite integration tests for migrations, FTS maintenance, transaction rollback, project filters, deletion/reparse history, and restart persistence.
3. Adapter contract tests with recorded legal metadata responses plus opt-in live conformance checks against official provider terms.
4. End-to-end tests for local import → parse → chunk → lexical retrieval → evidence card → source navigation, including unavailable embeddings and offline mode.
5. Security/privacy regressions covering prompt injection in imported text, source-ref allowlists, redaction, traversal prevention, and absence of keys/full text in logs.

## Reporting

Each test run records fixture version, app/database version, provider mode, offline state, corpus size, metrics, failures, and unresolved review items. No qualitative “AI looks correct” result substitutes for evidence-reference validation.

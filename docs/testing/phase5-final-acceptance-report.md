# Phase 5 Final Acceptance Report

Date: 2026-08-24
Decision: **FAIL — PHASE 5 NOT COMPLETED**

This report distinguishes unit/contract coverage from a runnable product flow. A passing parser, adapter or guard does not pass an end-to-end acceptance test when the Literature Workspace cannot perform and persist the requested operation.

## TEST 1–20

| Test | Result | Evidence and gap |
|---:|:---:|---|
| 1. New empty project | **FAIL** | The literature page correctly renders `0` and “当前视图暂无文献” without mock records in the front-end browser. A new native project → reopened empty library flow was not completed, so the full test is not passed. |
| 2. Import 3 PDFs | **FAIL** | Parser fixtures prove two text PDFs produce locators and an empty text layer returns `needs_ocr`; `FullTextIngestionService` refuses to fabricate OCR text. The PDF import dialog has no action handler, so three files were not imported/indexed through the product flow. |
| 3. BibTeX + RIS | **FAIL** | Fixture tests cover title, ordered authors, year, venue, pages, DOI and retained raw candidate input. The Workspace has no BibTeX/RIS import UI or end-to-end persisted raw metadata/provenance path. |
| 4. DOI lookup/import | **FAIL** | Real Crossref DOI lookup passed and DOI normalization is unit-tested. The DOI preview/confirm/persist workflow is absent, so lookup cannot be accepted as import. |
| 5. Duplicate preservation | **FAIL** | Conservative matching and merge plans preserve notes/tags/files/cards/provenance in tests. There is no transactional import coordinator enforcing cross-item DOI uniqueness, merge audit/undo and persistence; three entry paths can still create separate rows. |
| 6. Metadata conflict | **FAIL** | Provenance priority and user-confirmed protection are tested. The UI does not show field-level sources or let the user resolve an active conflicting value. |
| 7. FTS + locator | **FAIL** | Native SQLite FTS5 hits the correct chunk and labelled locators resolve. The Workspace “全文” mode still performs client-side metadata filtering and evidence/source clicks do not navigate to page/locator. |
| 8. Semantic/hybrid fallback | **FAIL** | No embedding provider/VectorIndex is configured; retriever tests correctly fall back to lexical. The UI presents a selectable “混合” control rather than a truthful disabled capability state and does not invoke FTS, so product acceptance fails. |
| 9. AI literature card | **FAIL** | Retriever → ContextPack → Task Engine → structured/evidence validation orchestration exists and is unit-tested. The UI generation button has no handler and no live full-text card was generated, persisted and opened at evidence. |
| 10. `not_found` | **FAIL** | Deterministic fixtures enforce `not_found` without evidence and reject unsupported claims. The missing-information case was not executed through a configured product AI/card flow. |
| 11. Source injection | **PASS** | Tests reject a missing source ref, foreign-literature chunk, foreign-project ownership, stale/invalid locator/hash and an invented DOI/source ID outside the ContextPack/library whitelist. |
| 12. Confirm + stale | **FAIL** | A `CardStore.markStale` contract exists, but there is no concrete persistent UI confirmation store or automatic parse/chunk replacement → stale linkage. |
| 13. Literature matrix | **FAIL** | The current preview shows at most three rows and only asset-state bars; it does not display five real card-field rows or distinguish draft/confirmed field content. |
| 14. Dashboard requirements | **FAIL** | `projectLiteratureRequirements` uses explicit language/type and returns unknown classifications separately in unit tests. The dashboard requirement widgets do not consume this projection. |
| 15. Online discovery/import | **FAIL** | Real OpenAlex keyword search passed; provider mocks cover pagination/cache/outage/OA preview. The Workspace online-discovery dialog is a placeholder: no duplicate preview, selection, provenance persistence or explicit OA file import exists. No full text was downloaded. |
| 16. Project isolation | **FAIL** | SQLite triggers, project-scoped FTS and ContextPack/source-whitelist tests prevent tested cross-project leakage. Complete cards, notes, online import/search and UI flows are not implemented end to end, so the broad acceptance test is not passed. |
| 17. Offline | **FAIL** | Local parsers and SQLite FTS are network-independent and provider outage degrades honestly in service tests. The requested detail/PDF/FTS/notes/matrix product workflow is incomplete, so full offline acceptance cannot pass. |
| 18. Large library | **PASS** | TypeScript and native SQLite fixtures exercised 500 literature records/4,000 chunks, list/filter/FTS/detail and tagging. Native migration+seed+operations took 420 ms on the final Windows run; packaged cold-disk performance remains unmeasured. |
| 19. App restart persistence | **FAIL** | SQLite tables exist for items/files/tags/notes/cards/provenance/chunks/index metadata/status. No native create → terminate/reopen → verify acceptance run was completed, and several UI writers are absent. |
| 20. Full regression | **PASS** | Final local commands passed: typecheck, lint, 134 Vitest tests (2 opt-in network tests skipped in the normal suite), targeted retrieval/grounding/security evaluation, production build, 8 Rust tests, `cargo check --all-targets`, and Tauri release `--no-bundle` build. Real provider smoke was run separately and passed 2/2. Warnings are listed below. |

## Baseline inventory

- **Database:** logical literature schema v4; Tauri migration sequence through `0010`. The changes are additive to v1–v3 data.
- **Import candidates:** PDF metadata/first page, BibTeX, RIS, DOI and manual. Product import persistence is incomplete as described above.
- **Metadata providers:** Crossref and OpenAlex. Real network smoke: Crossref DOI lookup PASS; OpenAlex keyword search PASS. No metadata import was persisted by that smoke.
- **Dedup strategy:** normalized DOI exact match is strongest; exact normalized title + year + first author may be strong; weaker similarity and publication-version pairs do not auto-merge. Persistence/audit integration remains incomplete.
- **Full-text formats:** Phase 3 `NormalizedDocument` sources, including text PDF and bound DOCX/other parsed text. Scanned/no-text PDF is `needs_ocr`.
- **Retrieval:** local SQLite FTS5 baseline; bounded lexical/hybrid orchestration. Production semantic/vector status is **disabled / not configured**.
- **Card schema:** `literature_card.v1`; card states `draft/reviewed/confirmed/stale`; evidence references include chunk and locator/hash provenance.

## Evaluation metrics

Controlled-fixture metrics are not claims of general AI accuracy.

- Grounding accepted fixture: `evidence_coverage=1.000 (6/6)`, `invalid_ref_rate=0.000 (0/6)`, `unsupported_claim_rate=0.000 (0/6)`, `not_found_correctness=1.000 (1/1)`.
- Grounding adversarial fixture: `evidence_coverage=0.333 (1/3)`, `invalid_ref_rate=0.500 (2/4)`, `unsupported_claim_rate=0.667 (2/3)`, `not_found_correctness=0.000 (0/1)`; invalid content is rejected.
- Retrieval labelled fixture: lexical precision@1 `1.000 (6/6)`, zero-result rate `0.000`, locator-resolution rate `1.000`. Production semantic metrics are **N/A** because embeddings are disabled.
- Large-library fixture: 500 records, 4,000 chunks, 20-result FTS cap, 100-record batch tagging, zero cross-project FTS hits; final native run 420 ms.

## Validation warnings

- PDF.js test fixtures request `standardFontDataUrl`; extraction assertions still pass.
- jsdom chart containers have zero size and one Overview test reports unwrapped React updates.
- Vite reports mixed static/dynamic Tauri imports and a 2.15 MB minified main JavaScript chunk.
- Rust reports the unused `SecretStore.get_secret` method and informational MSVC linker output.

## Security, storage and legal boundary

- Imported document text is untrusted data and cannot alter system permissions.
- Only selected chunks are placed in AI context; full PDFs/library contents are not logged or sent by default.
- Scholarly metadata traffic and AI-provider traffic are separate.
- Open-access links are provider metadata only; there is no paywall/login/CAPTCHA bypass or unauthorized bulk download.
- Raw metadata deduplication and stale-derived-data cleanup policy are documented in `docs/adr/phase5-storage-lifecycle.md`; confirmed cards and required provenance/audit records are retained.

## Known limitations and Phase 6 prerequisites

Phase 5 itself must close the failed import, provenance conflict, FTS locator, card persistence/stale, matrix, dashboard projection, online import, offline and restart tests before Phase 6 begins. OCR, a production embedding index and broader live-AI quality benchmarks remain optional/future capabilities unless explicitly made a gate.

The following Phase 6+ work was not started: deep thesis editor development, automatic literature-review writing, empirical analysis, final citation-format audit, or automatic insertion of card content into thesis text.

## Git decision

Because core acceptance tests fail, the requested commit message `feat: complete evidence-first literature research system` and tag `thesisflow-phase5` were **not created**. Creating either would falsely assert completion.

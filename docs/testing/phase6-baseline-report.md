# Phase 6 Baseline Report

- Date: 2026-08-24
- Decision: **PASS — Phase 5 core baseline verified after a bounded remediation; Phase 6 design baseline is ready.**
- Stop condition: ADR and quality plan only. STEP 02 and large-scale Phase 6 UI/database implementation have not started.

## Phase 5 core Gate

| Area | Result | Executable/design evidence |
| --- | --- | --- |
| `literature_items` | PASS | Migration `0009_phase5_literature_domain.sql`, typed repository create/find/list, migration preservation test, 500-record native fixture |
| `literature_files` | PASS | Separate work-to-file relation and cross-project trigger; native migration test rejects a project-B file attached to project-A literature |
| metadata provenance | PASS | Metadata-source and field-provenance tables, field-level trust precedence, user-confirmed replacement guard, metadata/import quality tests |
| `literature_chunks` | PASS | Parse/file/literature provenance, locator and text hash, structural chunker, scope trigger, retrieval and large-library fixtures |
| FTS | PASS | SQLite FTS5 external-content index and sync triggers; project-scoped repository query; native 4,000-chunk fixture returns bounded top-20 and zero foreign hits |
| optional semantic retrieval | PASS (optional/fallback) | Provider/vector interfaces and embedding version contract exist; semantic failure/no provider safely degrades to lexical; production embeddings remain disabled |
| `LiteratureRetriever` | PASS | Lexical/semantic merge, hybrid marking, top-K, per-document and total-context budgets covered by tests |
| `literature_cards` | PASS (domain/service) | Card table/statuses plus evidence-first generation contract; AI output remains draft and requires validated structured output |
| card evidence | PASS | Field-path/chunk/locator/hash evidence schema and grounding/security tests reject invalid, stale, foreign, and invented refs |
| literature matrix | PASS after remediation | `buildLiteratureMatrix` deterministically selects the latest card, exposes card state/value, and counts field evidence; unit-tested, without new UI work |
| CSL-JSON / citation asset | PASS after remediation | `toCslJson` and project-scoped `buildCitationAsset` normalize canonical metadata and reject cross-project composition; unit-tested |
| project isolation | PASS (core paths) | Database triggers, scoped repository queries, FTS fixture, ContextBuilder/source whitelist, card ownership and citation-asset guards |
| AI Task Engine | PASS | Capability checks, run/output persistence contracts, timeout/cancel and structured-output tests |
| Prompt Registry | PASS | Versioned prompt lookup and literature-card prompt exercised by AI/card tests |
| Context Builder | PASS | Bounded source selection, untrusted-document marking, project scope, manifest/source-locator and injection regression tests |

The remediation is intentionally limited to pure Phase 5 domain projections and tests. It adds no database migration and no Phase 6 UI.

## Verification commands

| Command | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npm test -- --run` | PASS — final post-remediation run: 34 files/137 tests passed; 2 opt-in network tests skipped |
| `npm run build` | PASS |
| `cargo test --manifest-path src-tauri/Cargo.toml` | PASS — 8 tests |
| `cargo check --all-targets --manifest-path src-tauri/Cargo.toml` | PASS |
| `npm run tauri -- build --no-bundle` | PASS — release executable produced at `src-tauri/target/release/thesisflow.exe` |
| `cargo fmt --manifest-path src-tauri/Cargo.toml -- --check` | NON-GATE FAIL — pre-existing Rust formatting differences; no functional failure and no broad reformat was performed |

## Warnings and limitations

- Vitest reports PDF.js standard-font fixture warnings, zero-size chart warnings, and React `act(...)` warnings; assertions pass.
- Vite reports mixed static/dynamic Tauri imports and a roughly 2.15 MB minified main chunk.
- Rust reports unused `SecretStore.get_secret` and informational MSVC linker output.
- Production semantic retrieval is not configured; lexical retrieval is the required baseline and remains usable.
- The earlier `phase5-final-acceptance-report.md` correctly records incomplete broad product/UI workflows. This report does not rewrite that history or claim the 20 product-level acceptance scenarios are complete; it verifies the explicitly requested Phase 5 core Gate and repairs its missing matrix/citation-asset contracts.

## Phase 6 design artifacts

- `docs/adr/phase6-research-design.md` separates literature facts/evidence from user research decisions, defines lifecycle authority, versioning, deterministic-first validation, evidence bindings, project isolation, and AI-advisor limits.
- `docs/testing/phase6-research-quality-plan.md` defines the nine required measures, deterministic/AI/isolation/version fixtures, command gates, and exit criteria.

## Final boundary

No Phase 6 schema, repository, UI, prompt, research-design engine, or正文-writing path was implemented. Work stops at the Phase 6 baseline and does not enter STEP 02.

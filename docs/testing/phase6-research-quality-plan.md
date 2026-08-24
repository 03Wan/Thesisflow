# Phase 6 Research Design Quality Plan

- Status: Accepted test design; implementation has not started
- Date: 2026-08-24
- Applies to: research-design entities, versions, evidence bindings, validation, AI suggestions, and project scope

## Quality strategy

Tests use deterministic fixtures first, repository/service integration tests second, and bounded AI contract/evaluation tests last. AI output never substitutes for rule assertions. Every failure must identify the project, entity version, rule or validator, and safe remediation without exposing source text outside the authorized context.

The release gate requires zero cross-project leakage, zero unauthorized AI confirmations, full recovery of version history, and passing typecheck, lint, unit/integration tests, production build, and Tauri validation.

## Required quality measures

| Measure | Definition and calculation | Minimum gate |
| --- | --- | --- |
| `research_design_consistency` | Proportion of applicable deterministic consistency assertions that pass across title, questions, hypotheses, variables, model, sample, data sources, and mechanisms. Findings include stable rule IDs. | 100% for blocker rules; no unexplained error-severity finding in a confirmed design |
| `hypothesis_evidence_coverage` | Hypotheses with at least one resolving rationale evidence binding divided by hypotheses that require evidence. Contradicting/qualifying evidence remains visible and does not count as support. | 100% for confirmed hypotheses; uncovered candidates are explicitly flagged |
| `variable_definition_completeness` | Required populated fields divided by applicable fields for each variable: name/symbol, construct, operational definition, role, type/unit, transformation, data source, and missing-value handling where applicable. | 100% for variables used by a confirmed model |
| `data_source_traceability` | Data-source uses resolving to a same-project source record, version/access date, coverage metadata, and variable mapping divided by all declared uses. | 100% for confirmed design inputs |
| `model_variable_integrity` | Valid model-variable references and roles divided by all model references; also checks dependent variable cardinality, estimator requirements, instruments, fixed effects, controls, and transformations. | 100%; any dangling/undefined reference blocks confirmation |
| `outline_evidence_coverage` | Evidence-required outline nodes with at least one resolving evidence binding divided by all evidence-required outline nodes. | 100% before a node is marked evidence-ready; gaps remain explicit |
| `cross-project isolation` | Attempts to read, bind, retrieve, validate, or mutate a foreign-project entity that are rejected divided by all adversarial attempts. | 100% rejected; zero leaked rows/chunks/metadata |
| `AI suggestion validation` | AI suggestions passing schema, status/transition, project ownership, entity-reference, source whitelist, and evidence checks before persistence divided by persisted AI suggestions. | 100%; AI-created state is only `draft` or `candidate`; zero AI confirmations |
| `version recovery` | Recovery scenarios that reproduce the selected prior payload and evidence set as a new version while preserving the complete intervening log divided by all recovery scenarios. | 100%; no destructive rollback or version-number reuse |

## Deterministic fixture matrix

At minimum, fixtures cover:

1. A coherent design with one research question, supported hypotheses, complete variables, a compatible model, and a traceable data source.
2. A hypothesis referring to a missing variable.
3. A model containing an undefined variable and a defined variable with no role.
4. Duplicate variable symbols, incompatible units, and invalid transformations.
5. A sample period/geography outside the declared data-source coverage.
6. A data source with missing version, access date, granularity, or variable mapping.
7. Supporting, contradicting, qualifying, stale, missing, and foreign-project evidence bindings.
8. A major title/question/hypothesis/variable/model/sample change that creates a new version and dependency-stale findings.
9. Recovery from a prior confirmed version after multiple edits and a rejection.
10. An outline with supported nodes, uncovered nodes, and invalid source locators.

## AI suggestion tests

Contract tests use a fake provider for success, malformed JSON, wrong schema, invented entity IDs, invented source IDs/DOIs, foreign-project references, disallowed status `confirmed`, attempts to overwrite confirmed content, cancellation, timeout, and provider failure.

For every AI suggestion:

- validate structured output before domain mapping;
- enforce the ContextPack source whitelist and project ownership;
- reject references not present in the current design/evidence snapshot;
- allow persistence only through the candidate command boundary;
- preserve run ID, provider/model, prompt/template version, context manifest, validation result, and actor;
- prove that the advisor cannot write to proposal/thesis正文 tables or services.

Advisory quality evaluation uses labelled cases for logical gaps, alternative explanations, endogeneity, measurement risk, and data unavailability. Results are reported as precision/recall on the labelled fixture set, not as a general claim of model accuracy. False or unsupported suggestions must be rejectable without changing confirmed state.

## Isolation and security tests

Use two projects with deliberately similar IDs, titles, variable names, and chunk text. Exercise list/find/search, evidence bind, matrix/outline projection, validation, AI context assembly, version recovery, and mutation commands. Assert both zero returned foreign records and zero foreign identifiers in serialized ContextPacks, logs, outputs, and errors.

Treat imported literature text and all AI output as untrusted data. Prompt-like source text cannot alter permissions, transition status, expand context, or call a writer. Logs must retain identifiers and validation metadata while redacting secrets and avoiding unnecessary full source text.

## Versioning and recovery tests

Each major edit must create the next monotonically increasing version and an immutable decision-log row. Tests compare payload, evidence bindings, actor, parent/supersedes links, validation summary, and timestamps. Recovery creates a new head linked to the historical version; all original and intervening versions remain queryable.

Dependency tests confirm that changing a variable, model, evidence source, data coverage, or sample scope marks the correct dependants `stale` without overwriting them. Revalidation can create/review a successor but cannot silently reconfirm it.

## Required command gate

Before Phase 6 acceptance, run and record:

- `npm run typecheck`
- `npm run lint`
- `npm test -- --run`
- `npm run build`
- `cargo test --manifest-path src-tauri/Cargo.toml`
- `cargo check --all-targets --manifest-path src-tauri/Cargo.toml`
- `npm run tauri -- build --no-bundle`

Warnings are recorded separately from failures. A failed core command or required measure blocks acceptance. Live-provider tests are opt-in and require user-authorized credentials; deterministic fake-provider coverage remains mandatory.

## Exit criteria and non-goals

Phase 6 may be declared complete only when all required measures meet their gates, lifecycle/authority tests prove only the user can confirm, version recovery and cross-project isolation pass, and the actual product paths are exercised in a packaged Tauri build.

This plan does not authorize automatic confirmation, automatic正文 writing, automatic citation invention, broad web acquisition, or Phase 6 implementation during the current baseline step.

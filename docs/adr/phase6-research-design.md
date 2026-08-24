# ADR: Phase 6 Research Design Architecture

- Status: Accepted as the Phase 6 design baseline
- Date: 2026-08-24
- Scope: Research-design domain boundaries, evidence binding, lifecycle, versioning, validation, and AI-advisor permissions
- Implementation status: Design only; STEP 02 has not started

## Context

Phase 5 established evidence-bearing literature records, provenance-preserving chunks, retrieval, literature cards, and citation assets. Phase 6 must use those assets to help a user construct a research design without confusing published claims with the user's own methodological choices.

The system therefore needs an explicit boundary between evidence and decisions, user-controlled confirmation, recoverable versions, deterministic validation, and a read-only AI-advisor role.

## Decisions

### 1. Research Decision is not Literature Fact

A literature fact is a claim attributed to a source and belongs to the evidence layer. A statement such as “the paper uses TWFE” may be stored in a literature card with chunk-level evidence.

A research decision is a choice about the user's own study. “My thesis adopts TWFE” is not made true by finding a paper that uses TWFE. It must be represented as a project-owned research-design decision with its own rationale, status, author, version, and decision-log entry.

AI may propose a `candidate` or produce `advice`; it may not convert evidence into a confirmed user decision. Only an explicit user action may set a decision to `confirmed`.

### 2. Evidence-first Research Design

The following design elements may bind zero or more evidence references:

- rationale for the research question;
- theoretical foundation;
- hypothesis rationale;
- variable definition and operationalization;
- method and model rationale;
- data-source suitability and coverage;
- mechanism rationale;
- alternative explanations, risks, and limitations.

An evidence reference must resolve within the same project and identify a durable source asset, preferably a Phase 5 literature chunk or card-evidence link. It records the source identifier, locator, content hash or version, relationship type (`supports`, `contradicts`, `motivates`, `defines`, or `qualifies`), and the time it was bound.

Evidence supports or challenges a decision; it does not own the decision and cannot silently mutate it. Missing evidence is represented explicitly rather than filled with model-generated citations.

### 3. Lifecycle and authority

Research-design entities support at least these states:

| State | Meaning | Allowed creator/transition |
| --- | --- | --- |
| `draft` | Incomplete working material | User or AI may create; AI output remains visibly advisory |
| `candidate` | A concrete option awaiting evaluation | User or AI may create |
| `reviewed` | Examined by the user but not adopted | User action only |
| `confirmed` | Adopted as the current user research decision | Explicit user action only |
| `stale` | Its dependencies changed and re-review is required | Deterministic dependency rules or user action |
| `rejected` | Considered and not adopted | User action only |

AI-created content is stamped with `actor_type=ai`, its run ID, prompt/template version, and input context manifest. It starts as `draft` or `candidate`. No AI pathway may write `confirmed`, directly or through a bulk operation.

A `confirmed` record is not overwritten in place. Reconsideration creates a new version or candidate, leaving the prior confirmed version recoverable. Dependency changes may mark a confirmed version `stale`, but may not replace or delete it.

### 4. Versioning and decision log

Research title, research questions, hypotheses, variables, models, and sample scope are versioned aggregates. A major change creates a new immutable version and a decision-log entry. Major changes include:

- changing the subject, population, geography, or time range of the title/question;
- adding, removing, reversing, or materially changing a hypothesis;
- changing a variable's role, construct, measurement, unit, transformation, or source;
- changing model family, estimator, identification strategy, fixed effects, controls, or inference method;
- changing sample inclusion/exclusion rules or data-coverage boundaries.

Each version records `version_id`, logical entity ID, project ID, sequential version, status, payload, actor, creation time, parent version, and optional superseding version. The decision log records before/after version IDs, reason, actor, timestamp, affected dependencies, validation summary, and evidence-binding changes.

Recovery restores a prior version by creating a new current version linked to the recovered version; it does not erase intervening history.

### 5. Deterministic Validation First

Validation runs before AI advice. Rules handle facts that can be decided from structured state, including:

- a hypothesis, outline node, or model references a variable that does not exist;
- a model variable exists but lacks a definition or role;
- duplicate/conflicting variable symbols or incompatible units;
- dependent, treatment, control, mediator, moderator, or instrument roles are missing or invalid for the selected model;
- sample geography/time/population conflicts with data-source coverage;
- a referenced data source or evidence item does not exist or belongs to another project;
- a confirmed dependency changed, making downstream design elements stale;
- a citation/evidence locator or version no longer resolves.

Deterministic findings have stable rule IDs, severity, entity/version references, machine-readable details, and reproducible results. AI may explain these findings but may not suppress, downgrade, or rewrite them.

### 6. AI Advisor boundary

AI Advisor may:

- identify logical gaps, omissions, circular reasoning, and inconsistent scope;
- suggest alternative explanations and competing hypotheses;
- flag endogeneity, selection, measurement, reverse-causality, identification, and robustness risks;
- flag unavailable or insufficiently granular data;
- propose alternative variables, data sources, models, mechanisms, or tests as candidates;
- explain deterministic validation findings and ask the user for missing information.

AI Advisor may not:

- confirm a design or change any entity to `confirmed`;
- overwrite or delete a confirmed item;
- fabricate theories, citations, evidence, variables, datasets, coverage, or availability;
- claim that a candidate data source is available without a traceable source record;
- bypass deterministic validation or project isolation;
- write research-design output into thesis/proposal正文;
- silently mutate design state while presenting advice.

AI suggestions must pass schema validation, project/source whitelisting, entity-reference checks, allowed-transition checks, and evidence validation before being displayed or saved as a candidate. Rejected suggestions and validation failures remain auditable without becoming active design state.

### 7. Project isolation and write boundary

All design entities, versions, evidence bindings, validation findings, advisor runs, and decision-log records are project-scoped. Cross-project reads and references are rejected at both repository/query and service-validation boundaries.

AI execution receives a bounded ContextPack. Its output is untrusted structured data until validated. The advisor has no direct repository writer; a separate command/service boundary performs validated candidate creation. Confirm and reject commands require a local-user actor.

## Consequences

- Research design remains auditable: evidence, advice, and user decisions are distinguishable.
- Users can recover prior versions and understand why a confirmed design became stale.
- Rule validation stays fast, reproducible, and testable; AI is reserved for judgment-heavy critique.
- Later proposal/thesis writing must consume confirmed design versions explicitly and is outside this step.
- This ADR authorizes no Phase 6 schema, repository, AI prompt, UI, or正文-writing implementation. Those require STEP 02 or later approval after the quality gates below are adopted.

# Phase 5 Retrieval Evaluation

Date: 2026-08-24

## Labelled fixture evaluation

The local labelled corpus contains three literature items and six chunks. Queries cover exact terminology, method name, variables, conclusion phrase, author/title, Chinese keywords and a phrase occurring across multiple documents.

Configuration: `topK=3`, `perDocumentCap=2`, `totalContextChars=1200`.

| Query class | Query | Expected | Top-1 result | Result |
|---|---|---|---|---|
| Exact term | `difference-in-differences` | `lit-b` | `lit-b` | hit |
| Method | `fixed-effects panel model` | `lit-a` | `lit-a` | hit |
| Variables | `融资约束 研发投入` | `lit-c` | `lit-c` | hit |
| Conclusion | `positively associated product innovation` | `lit-a` | `lit-a` | hit |
| Author/title | `Chen Li Digital capability` | `lit-a` | `lit-a` | hit |
| Chinese phrase | `数字化转型 专利质量` | `lit-b` | `lit-b` | hit |

- Lexical precision@1: **1.000 (6/6)** on this small controlled fixture.
- Labelled zero-result rate: **0.000 (0/6)**.
- Locator-resolution rate: **1.000** for returned labelled hits.
- Cross-document query `数字化转型` returned both labelled documents (`lit-b`, `lit-c`) while respecting per-document caps.
- Semantic unavailable: lexical fallback remained operational and returned the labelled FTS result.
- Hybrid: a synthetic same-version semantic hit fused with lexical evidence and was labelled `hybrid`.

These values describe this fixture only; they are not a claim of general retrieval accuracy.

## SQLite FTS5 large-library integration

The native Tauri/sqlx test applied migrations through v10 to an in-memory SQLite database, then seeded **500 literature records and 4,000 chunks**. It exercised project-scoped list/filter, FTS5 `MATCH`, detail chunks, batch tagging and a foreign-project zero-hit check.

- End-to-end seed plus checked operations: **420 ms** on the final full Tauri test run on the current Windows development machine.
- FTS top-K cap: **20/20 returned**.
- Detail open: **8 chunks** for the selected literature item.
- Batch tagging: **100 records** updated.
- Cross-project FTS leakage: **0 hits**.

## Semantic status

No production embedding provider or VectorIndex is configured, so production semantic quality/latency is **N/A**, not passed. Dimension/version separation remains enforced by `embeddingVersion`; semantic failure degrades to lexical retrieval. A real semantic benchmark is required only when an embedding provider and stable Windows-compatible index are enabled.

## Gate decision

PASS for local lexical retrieval, bounded hybrid orchestration, project isolation and the 500/4,000 scale fixture. Continue to track representative real-library latency and precision as corpus size and languages broaden.

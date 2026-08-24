# Phase 5 Card Grounding Report

Date: 2026-08-24
Fixture: `src/test/fixtures/literature/grounding-methods.txt`
Evaluation: deterministic local validation; no claim is made about general model accuracy.

## Corpus and method

One controlled full-text fixture is split into four locator-bearing chunks: research question, data/method, findings and limitations. The accepted card fixture contains six supported claims and one `not_found` field. Each evidence reference is resolved against the current literature ID, chunk hash and PDF page locator.

An adversarial card separately injects a missing source, a chunk from another literature item and a `not_found` field carrying evidence. These cases measure guard behaviour, not model accuracy.

## Results

| Metric | Accepted fixture | Adversarial fixture | Meaning |
|---|---:|---:|---|
| `evidence_coverage` | 1.000 (6/6) | 0.333 (1/3) | Supported/partially-supported fields whose complete refs resolve |
| `invalid_ref_rate` | 0.000 (0/6) | 0.500 (2/4) | Missing or foreign refs among all submitted refs |
| `unsupported_claim_rate` | 0.000 (0/6) | 0.667 (2/3) | Supported claims lacking wholly valid evidence |
| `not_found_correctness` | 1.000 (1/1) | 0.000 (0/1) | `not_found` fields correctly returning no evidence refs |

Additional guard fixtures reject a DOI absent from the current library and a source ID absent from the ContextPack whitelist. Source locators in the accepted fixture resolve to positive PDF page numbers. Context Preview exposes the four transmitted excerpts, locators and text hashes, clipping each preview excerpt to 240 characters.

## Gate decision

PASS for deterministic grounding enforcement. Invalid/foreign/stale evidence is not eligible for a supported display state, and validated output is persisted only as a draft card with field-level evidence rows.

Limitations: this report does not run a live AI provider and therefore does not estimate extraction recall, linguistic correctness or generalization to arbitrary papers. A future user-authorized live-provider smoke set must be reported separately and must not replace these deterministic guards.

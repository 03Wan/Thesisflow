# ThesisFlow Phase 1 Design

## Goal

Create the desktop UI foundation for ThesisFlow: a local-only thesis workflow workbench with mock data, a persistent application shell, and reusable visual primitives. No real AI, database, file parsing, literature search, or plagiarism services are included.

## Product Shape

The default experience is a light, high-density desktop productivity application. A fixed left navigation describes the thesis stages; the top bar keeps project context and utility actions visible; the central workspace scrolls independently; the optional right context panel scrolls independently and can collapse.

## Architecture

React Router owns all 28 route definitions. Zustand owns the default project and UI panel state. Feature pages are placeholders except for the Phase 1 visual masters: overview, literature, proposal, writing, task book, guidance, defense preparation, and archive. Shared UI remains in `src/components` and receives typed mock props rather than importing page-specific state.

## Visual Contract

- Background `#F7F8FA`, surface `#FFFFFF`, secondary `#F5F7FB`.
- Primary `#315EFB`, hover `#244DE0`, soft primary `#EEF3FF`.
- Card radius `12px`, border `#E8EBF0`, near-invisible shadow.
- Chinese system font stack; title 20–24px, section 16–18px, body 13–14px, helper 12px.
- No dominant gradients, glass effects, neon, gamified decoration, marketing hero sections, or oversized text.

## Responsive Behaviour

The main desktop target is 1920×1080, with stable layouts at 1680×1050 and 1440×900. At 1280px, the sidebar stays fixed, central content remains the only main scroll region, and the AI panel defaults to collapsed but can be expanded over the workspace. No mobile layout is in scope.

## Data Contract

The default project is 《数字经济对企业创新的影响研究》 for 三江学院 / 法商学院 / 经济学 / 2026届. Its current stage is 正文写作, completion is 58%, and all rule-driven metrics use mock values from the confirmed brief.

## Verification

Type checking, component tests for store and key primitive behaviour, and a production build must pass. Browser-level visual QA and all non-Phase-1 detailed workflows are deferred.

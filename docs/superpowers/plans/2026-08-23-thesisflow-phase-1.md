# ThesisFlow Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Tauri 2, React, TypeScript, Vite desktop UI foundation for ThesisFlow with the confirmed design system, mock store, shell, shared component catalogue, and all route placeholders.

**Architecture:** A Vite React frontend is hosted by Tauri 2. The app provides a typed mock project through Zustand, reusable presentational primitives, and route-level visual masters. Layout state remains local to the workspace store; no service calls or persistence are introduced.

**Tech Stack:** Tauri 2, React, TypeScript, Vite, Tailwind CSS, shadcn/ui foundation, Lucide React, React Router, Zustand, Recharts, TipTap, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-23-thesisflow-phase-1-design.md`. The local visual-reference files used during implementation are intentionally excluded from the repository.

## Global Constraints

- Preserve `product-reference/` unchanged; visual references remain local-only artifacts.
- Implement only local UI, mock data, and interactions.
- Support desktop widths from 1280px upward.
- Use the approved restrained light productivity visual system.

---

### Task 1: Scaffold and configuration

**Files:** create Vite/Tauri source and configuration files; modify package manifest.

- [ ] Create the Tauri 2 React TypeScript/Vite foundation without overwriting reference folders.
- [ ] Add Tailwind, shadcn-compatible aliases, Lucide, Router, Zustand, Recharts, TipTap, and Vitest.
- [ ] Verify a clean typecheck and production build before feature work.

### Task 2: Typed project store

**Files:** create `src/types`, `src/data/mock`, `src/stores`, and tests.

- [ ] Write a failing test for the default project’s completion and hard-rule metric values.
- [ ] Implement the typed mock project and UI state until the test passes.

### Task 3: Design system and shell

**Files:** create global CSS, layout components, and tests.

- [ ] Write a failing test for AI panel collapse state.
- [ ] Implement application tokens, AppShell, Sidebar, Topbar, and collapsible independent-scroll AI panel until the test passes.

### Task 4: Shared component catalogue

**Files:** create the specified component skeletons grouped by layout, feedback, data display, writing, and quality functions.

- [ ] Implement typed, reusable shells for every requested public component.
- [ ] Build visual-master sections from those primitives rather than page-local duplicates.

### Task 5: Routing and visual masters

**Files:** create all 28 route definitions and Phase 1 pages.

- [ ] Implement route placeholders for every confirmed route.
- [ ] Implement the eight visual-master routes with mock interactions and desktop layouts.

### Task 6: Verification

- [ ] Run unit tests, typecheck, and production build.
- [ ] Resolve all introduced errors and report deferred work.

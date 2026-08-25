# ThesisFlow 项目总览 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将“项目总览”从占位内容升级为由统一 mock 数据驱动的本科论文工作台 Dashboard。

**Architecture:** 在 `ThesisProject` 中集中维护规则达成、19 个阶段、近期节点、指导记录、待办、评分与文件数据。概览页面拆分为若干纯展示组件，由 `OverviewPage` 组合并接入既有 `AppShell`；其余路由继续使用占位页面。

**Tech Stack:** React 18、TypeScript、React Router、Zustand、Lucide React、Recharts、Vitest、Testing Library、Tailwind CSS 4。

**Spec:** 本次用户确认的“项目总览”视觉母版需求；实现时使用的本地设计参考图不纳入仓库。

## Global Constraints

- 所有页面状态数据必须来自 `mockThesisProject`，组件内不得散落业务 hard-code。
- 保持既有 Sidebar、Topbar、AI Context Panel 和其他路由行为不变。
- Dashboard 采用白色信息卡、细进度条与克制留白；不得使用 Emoji、彩色大背景或营销式布局。
- 1440×900 不得出现页面横向溢出；1920 宽度下工作流尽量在一屏内完整显示。

---

### Task 1: 扩展统一项目 Mock 数据

**Files:**
- Modify: `src/types/thesis.ts`
- Modify: `src/data/mock/thesis-project.ts`
- Test: `src/test/project-store.test.ts`

**Interfaces:**
- Produces: `ThesisProject` 的 `requirements`、`workflow`、`milestones`、`guidanceRecords`、`todos`、`evaluation`、`recentFiles` 字段。

- [ ] **Step 1: Write the failing test**

```ts
expect(mockThesisProject.workflow).toHaveLength(19);
expect(mockThesisProject.requirements).toEqual(
  expect.arrayContaining([expect.objectContaining({ label: "正文", target: 10000 })]),
);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/project-store.test.ts`
Expected: FAIL because overview fields do not exist.

- [ ] **Step 3: Write minimal implementation**

```ts
export type RequirementMetric = { id: string; label: string; current: number; target: number; unit: string };
export type WorkflowStage = { id: number; title: string; date: string; status: "completed" | "active" | "pending" | "overdue" };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/project-store.test.ts`
Expected: PASS.

### Task 2: 构建概览页面模块并接入路由

**Files:**
- Create: `src/features/overview/OverviewPage.tsx`
- Create: `src/features/overview/OverviewCards.tsx`
- Modify: `src/App.tsx`
- Test: `src/test/overview-page.test.tsx`

**Interfaces:**
- Consumes: `mockThesisProject: ThesisProject`。
- Produces: `/overview` 的标题信息、9 项规范、19 阶段工作流、节点、月历、指导、待办、智评和文件展示。

- [ ] **Step 1: Write the failing test**

```tsx
render(<MemoryRouter initialEntries={["/overview"]}><App /></MemoryRouter>);
expect(screen.getByRole("heading", { name: "项目总览" })).toBeInTheDocument();
expect(screen.getAllByText("正文")[0]).toBeInTheDocument();
expect(screen.getByText("材料归档")).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/overview-page.test.tsx`
Expected: FAIL because `/overview` still renders the placeholder.

- [ ] **Step 3: Write minimal implementation**

```tsx
export function OverviewPage() {
  return <div className="overview-page">{/* composed overview sections */}</div>;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/overview-page.test.tsx`
Expected: PASS.

### Task 3: 适配总览栅格、工作流与视觉密度

**Files:**
- Modify: `src/styles/index.css`
- Test: `src/test/overview-page.test.tsx`

**Interfaces:**
- Consumes: `overview-page` 及其模块的 class names。
- Produces: 1920 宽度多列布局和 1440 宽度不溢出的自适应排布。

- [ ] **Step 1: Write the failing test**

```tsx
expect(screen.getByLabelText("19 阶段工作流")).toBeInTheDocument();
expect(screen.getByRole("region", { name: "近期节点" })).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/test/overview-page.test.tsx`
Expected: FAIL until the semantic containers are included.

- [ ] **Step 3: Write minimal implementation**

```css
.overview-grid { display: grid; grid-template-columns: minmax(0, 1fr) 300px; gap: 12px; }
.workflow-grid { display: grid; grid-template-columns: repeat(9, minmax(0, 1fr)); }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/test/overview-page.test.tsx`
Expected: PASS.

### Task 4: 全量验证与视觉检查

**Files:**
- Create: `design-qa.md`

- [ ] **Step 1: Run automated verification**

Run: `npm run test; npm run typecheck; npm run build`
Expected: all commands exit 0.

- [ ] **Step 2: Compare at 1440×900**

Open the existing in-app browser on `/overview`, check for no horizontal overflow, stable alignment, visible workflow connectors, and independent right-rail height.

- [ ] **Step 3: Record design QA**

Write `design-qa.md` with the reference/prototype comparison and `final result: passed` only after resolving all P0–P2 issues.

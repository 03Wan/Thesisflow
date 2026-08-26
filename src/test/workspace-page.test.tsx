import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { WorkspaceContent, workspaceTemplates } from "@/features/workspace/WorkspacePage";

const renderState = (phase: "loading" | "empty" | "ready" | "error", onNavigate = vi.fn(), onRetry = vi.fn()) => render(
  <MemoryRouter><WorkspaceContent template={workspaceTemplates.writing} phase={phase} metrics={[{ label: "关联文件", value: 2, detail: "来自文件中心" }]} error="读取失败" onNavigate={onNavigate} onRetry={onRetry} /></MemoryRouter>,
);

describe("WorkspaceContent", () => {
  it("renders a loading skeleton without invented content", () => {
    renderState("loading");
    expect(screen.getByRole("status", { name: "正在加载真实项目数据…" })).toBeInTheDocument();
    expect(screen.queryByText("示例论文")).not.toBeInTheDocument();
  });

  it("renders a complete empty information architecture with a real CTA", () => {
    const navigate = vi.fn(); renderState("empty", navigate);
    fireEvent.click(screen.getAllByRole("button", { name: "导入文稿" })[0]);
    expect(navigate).toHaveBeenCalledWith("/files");
    expect(screen.getByRole("navigation", { name: "页面内容标签" })).toBeInTheDocument();
  });

  it("renders query-derived ready metrics and navigation actions", () => {
    const navigate = vi.fn(); renderState("ready", navigate);
    expect(screen.getByText("2")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "管理修改任务" })[0]);
    expect(navigate).toHaveBeenCalledWith("/revisions");
  });

  it("renders an error state with retry", () => {
    const retry = vi.fn(); renderState("error", vi.fn(), retry);
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(screen.getByRole("alert")).toHaveTextContent("读取失败");
  });
});

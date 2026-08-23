import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App, { appRoutes } from "@/App";
import { AppShell } from "@/components/layout/AppShell";

describe("AppShell", () => {
  it("keeps a fixed navigation and allows the AI context panel to collapse", async () => {
    render(
      <MemoryRouter initialEntries={["/overview"]}>
        <AppShell><div>工作区</div></AppShell>
      </MemoryRouter>,
    );

    expect(screen.getByRole("navigation", { name: "论文工作台" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "AI 上下文" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "收起 AI 上下文" }));
    expect(screen.queryByRole("complementary", { name: "AI 上下文" })).not.toBeInTheDocument();
  });

  it("renders every registered route inside the same AppShell", () => {
    for (const [path, title] of appRoutes) {
      render(
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>,
      );

      expect(screen.getByRole("navigation", { name: "论文工作台" })).toBeInTheDocument();
      expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
      cleanup();
    }
  });
});

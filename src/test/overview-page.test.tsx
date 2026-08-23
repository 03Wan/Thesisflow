import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it } from "vitest";
import App from "@/App";

it("shows the overview dashboard sections instead of the generic route placeholder", () => {
  render(
    <MemoryRouter initialEntries={["/overview"]}>
      <App />
    </MemoryRouter>,
  );

  expect(screen.getByRole("heading", { name: "论文规范达成情况" })).toBeInTheDocument();
  expect(screen.getByLabelText("19 阶段工作流")).toBeInTheDocument();
  expect(screen.getByRole("region", { name: "近期节点" })).toBeInTheDocument();
});

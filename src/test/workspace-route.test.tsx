import { render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";
import App from "@/App";
import { useProjectStore } from "@/stores/project-store";
import { useFileStore } from "@/stores/file-store";
import { useTaskStore } from "@/stores/task-store";
import { useWorkflowStore } from "@/stores/workflow-store";
import { useRequirementStore } from "@/stores/requirement-store";
import { AppError } from "@/lib/app-error";

const emptyStore = { projects: [], activeProjectId: null, isLoading: false, error: null };
const baseProject = { id: "p", title: "真实项目", school: "", college: "", major: "", grade: "", studentName: "", studentNumber: "", advisorName: "", researchType: "", currentStage: "writing", progress: 0, defenseBatch: null, createdAt: "x", updatedAt: "x", lastOpenedAt: null, projectFolder: "", status: "active" } as const;
const noOp = async () => undefined;

afterEach(() => { useProjectStore.setState(emptyStore); useFileStore.setState({ files: [], error: null, isLoading: false, loadFiles: noOp }); useTaskStore.setState({ tasks: [], error: null, isLoading: false, load: noOp }); useWorkflowStore.setState({ stages: [], error: null, isLoading: false, loadStages: noOp }); useRequirementStore.setState({ requirements: [], load: noOp }); });

it("restores the writing route shell instead of the global mock-empty overlay", () => {
  useProjectStore.setState({ projects: [baseProject], activeProjectId: "p", isLoading: false, error: null, loadProjects: noOp });
  render(<MemoryRouter initialEntries={["/writing"]}><App /></MemoryRouter>);
  expect(screen.getByRole("status", { name: "正在加载真实项目数据…" })).toBeInTheDocument();
  expect(screen.queryByText("暂无真实项目数据")).not.toBeInTheDocument();
});

it("renders empty, ready and error outcomes through the writing route", async () => {
  useProjectStore.setState({ projects: [baseProject], activeProjectId: "p", isLoading: false, error: null, loadProjects: noOp });
  useFileStore.setState({ files: [], error: null, isLoading: false, loadFiles: noOp }); useTaskStore.setState({ tasks: [], error: null, isLoading: false, load: noOp }); useWorkflowStore.setState({ stages: [], error: null, isLoading: false, loadStages: noOp }); useRequirementStore.setState({ requirements: [], load: noOp });
  const { unmount } = render(<MemoryRouter initialEntries={["/writing"]}><App /></MemoryRouter>);
  expect(await screen.findByText("尚无正文写作相关真实记录")).toBeInTheDocument();
  unmount();
  useFileStore.setState({ files: [{ id: "f", projectId: "p", workflowStageId: null, originalName: "论文.docx", storedName: "论文.docx", relativePath: "论文.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: "docx", sizeBytes: 1, checksum: null, fileCategory: "thesis", versionLabel: null, source: "imported", createdAt: "x", updatedAt: "x" }], error: null, isLoading: false, loadFiles: noOp });
  render(<MemoryRouter initialEntries={["/writing"]}><App /></MemoryRouter>);
  expect(await screen.findByText("关联文件")).toBeInTheDocument();
  unmount();
  useProjectStore.setState({ error: new AppError("unexpected", "项目读取失败") });
  render(<MemoryRouter initialEntries={["/writing"]}><App /></MemoryRouter>);
  expect(screen.getAllByRole("alert")[0]).toHaveTextContent("项目读取失败");
});

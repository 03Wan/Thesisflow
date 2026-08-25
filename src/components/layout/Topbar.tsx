import {
  Bell,
  CheckCircle2,
  ChevronDown,
  Command,
  GraduationCap,
  IdCard,
  Search,
  Settings,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useProjectStore } from "@/stores/project-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useTaskStore } from "@/stores/task-store";
import { ProjectFormDialog } from "@/features/projects/ProjectFormDialog";
import type { CreateProjectInput } from "@/services/projectService";
import { stageLabel } from "@/lib/stage-label";
import "./topbar.css";

export function Topbar() {
  const openCommand = useWorkspaceStore((state) => state.setCommandPaletteOpen);
  const createProject = useProjectStore((state) => state.createProject);
  const isProjectLoading = useProjectStore((state) => state.isLoading);
  const projects = useProjectStore((state) => state.projects);
  const activeProjectId = useProjectStore((state) => state.activeProjectId);
  const loadProjects = useProjectStore((state) => state.loadProjects);
  const tasks = useTaskStore((state) => state.tasks);
  const loadTasks = useTaskStore((state) => state.load);
  const navigate = useNavigate();
  const location = useLocation();
  const [panel, setPanel] = useState<"notifications" | "profile" | null>(null);
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const activeProject =
    projects.find((project) => project.id === activeProjectId) ?? projects[0];
  const studentName = activeProject?.studentName || "张同学";
  const projectTitle =
    activeProject?.title ??
    (location.pathname === "/files"
      ? "数字经济对企业创新的影响研究"
      : "未打开项目");
  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);
  useEffect(() => { if (activeProject?.id) void loadTasks(activeProject.id); }, [activeProject?.id, loadTasks]);
  const notifications = tasks.filter((task) => task.status !== "done").sort((left, right) => String(left.dueAt ?? "9999").localeCompare(String(right.dueAt ?? "9999"))).slice(0, 3);
  const handleCreateProject = () => {
    setPanel(null);
    setProjectError(null);
    setProjectFormOpen(true);
  };
  const submitProject = async (input: CreateProjectInput) => {
    setProjectError(null);
    try {
      await createProject(input);
      setProjectFormOpen(false);
      navigate("/overview");
    } catch (error) {
      setProjectError(
        error instanceof Error ? error.message : "创建项目失败，请重试。",
      );
    }
  };
  return (
    <header className="topbar">
      <div className="project-context">
        <strong>{projectTitle}</strong>
        <span className="project-tag">本科毕业论文</span>
      </div>
      <div className="topbar-actions">
        <button className="search-trigger" onClick={handleCreateProject}>
          新建项目
        </button>
        <button
          className="search-trigger"
          onClick={() => openCommand(true)}
          aria-label="打开命令面板"
        >
          <Search size={15} />
          <span>搜索</span>
          <kbd>
            <Command size={11} />K
          </kbd>
        </button>
        <div className="topbar-menu-wrap">
          <button
            className="icon-button"
            onClick={() =>
              setPanel(panel === "notifications" ? null : "notifications")
            }
            aria-label="通知"
          >
            <Bell size={17} />
            {notifications.length > 0 && <i />}
          </button>
          {panel === "notifications" && (
            <div className="topbar-popover">
              <b>通知</b>
              {notifications.length ? notifications.map((task) => <p key={task.id}><Bell size={13} />{task.title}{task.dueAt ? ` · 截止 ${new Date(task.dueAt).toLocaleDateString()}` : " · 暂无截止日期"}</p>) : <p><CheckCircle2 size={13} />当前没有待办提醒</p>}
            </div>
          )}
        </div>
        <div className="topbar-menu-wrap">
          <button
            className="profile-button"
            onClick={() => setPanel(panel === "profile" ? null : "profile")}
            aria-label="个人菜单"
          >
            <span className="avatar">{studentName.slice(0, 1)}</span>
            <span>{studentName}</span>
            <ChevronDown size={14} />
          </button>
          {panel === "profile" && (
            <div className="topbar-popover profile-popover">
              <div className="profile-summary">
                <span className="profile-avatar">
                  <UserRound size={18} />
                </span>
                <div>
                  <b>{studentName}</b>
                  <span>{activeProject?.studentNumber || "学号待填写"}</span>
                </div>
              </div>
              <div className="profile-info-grid">
                <div>
                  <span>学校 / 学院</span>
                  <strong>
                    {[activeProject?.school, activeProject?.college]
                      .filter(Boolean)
                      .join(" · ") || "待完善"}
                  </strong>
                </div>
                <div>
                  <span>专业 / 年级</span>
                  <strong>
                    {[activeProject?.major, activeProject?.grade]
                      .filter(Boolean)
                      .join(" · ") || "待完善"}
                  </strong>
                </div>
                <div>
                  <span>学号</span>
                  <strong>{activeProject?.studentNumber || "待完善"}</strong>
                </div>
                <div>
                  <span>当前阶段</span>
                  <strong>{stageLabel(activeProject?.currentStage)}</strong>
                </div>
              </div>
              <div className="profile-actions">
                <button
                  onClick={() => {
                    setPanel(null);
                    navigate("/projects");
                  }}
                >
                  <GraduationCap size={13} />
                  项目资料
                </button>
                <button
                  onClick={() => {
                    setPanel(null);
                    navigate("/settings");
                  }}
                >
                  <Settings size={13} />
                  设置
                </button>
              </div>
              <p className="profile-identity-note">
                <IdCard size={12} />
                信息来自当前论文项目
              </p>
            </div>
          )}
        </div>
      </div>
      <ProjectFormDialog
        open={projectFormOpen}
        busy={isProjectLoading}
        error={projectError}
        onClose={() => {
          setProjectFormOpen(false);
          setProjectError(null);
        }}
        onSubmit={submitProject}
      />
    </header>
  );
}
